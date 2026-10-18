"""Site sanity checks: HTML structure, internal links and anchors, images,
JSON files, JSON-LD blocks, per-page meta, and sitemap coverage.

Run:  python3 tools/check_site.py      (exit code 1 on any error)
"""

from __future__ import annotations

import json
import os
import re
import sys
from html.parser import HTMLParser
from urllib.parse import urlparse

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import layout  # noqa: E402
from sync_layout import html_files  # noqa: E402

ROOT = layout.ROOT_DIR
VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"}
errors: list[str] = []
warnings: list[str] = []


class PageParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack: list[tuple[str, int]] = []
        self.ids: set[str] = set()
        self.links: list[tuple[str, str, int]] = []
        self.meta: dict[str, str] = {}
        self.canonical = None
        self.title = ""
        self._in_title = False
        self._ld = None
        self.jsonld: list[str] = []
        self.imgs_missing_alt: list[int] = []
        self.structure_errors: list[str] = []
        self.has_skip = False
        self.has_main = False

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        line = self.getpos()[0]
        if tag not in VOID:
            self.stack.append((tag, line))
        if "id" in a:
            if a["id"] in self.ids:
                self.structure_errors.append(f"duplicate id '{a['id']}' line {line}")
            self.ids.add(a["id"])
        if tag == "a" and "href" in a:
            self.links.append(("href", a["href"], line))
            if "skip-link" in (a.get("class") or ""):
                self.has_skip = True
        if tag in ("img", "script", "source") and a.get("src"):
            self.links.append(("src", a["src"], line))
        if tag == "link" and a.get("href") and a.get("rel") in ("stylesheet", "icon", "preload"):
            self.links.append(("href", a["href"], line))
        if tag == "form" and a.get("action"):
            self.links.append(("href", a["action"], line))
        if tag == "img" and "alt" not in a:
            self.imgs_missing_alt.append(line)
        if tag == "meta":
            key = a.get("name") or a.get("property")
            if key:
                self.meta[key] = a.get("content", "")
        if tag == "link" and a.get("rel") == "canonical":
            self.canonical = a.get("href")
        if tag == "title":
            self._in_title = True
        if tag == "main" and a.get("id") == "main":
            self.has_main = True
        if tag == "script" and a.get("type") == "application/ld+json":
            self._ld = []

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag not in VOID and self.stack and self.stack[-1][0] == tag:
            self.stack.pop()

    def handle_endtag(self, tag):
        line = self.getpos()[0]
        if tag in VOID:
            return
        if tag == "title":
            self._in_title = False
        if tag == "script" and self._ld is not None:
            self.jsonld.append("".join(self._ld))
            self._ld = None
        if not self.stack:
            self.structure_errors.append(f"stray </{tag}> line {line}")
            return
        if self.stack[-1][0] == tag:
            self.stack.pop()
            return
        # implicit closes for p/li/etc are not used in this codebase; flag mismatch
        names = [t for t, _ in self.stack]
        if tag in names:
            while self.stack and self.stack[-1][0] != tag:
                t, l = self.stack.pop()
                self.structure_errors.append(f"unclosed <{t}> from line {l} (closed by </{tag}> line {line})")
            self.stack.pop()
        else:
            self.structure_errors.append(f"stray </{tag}> line {line}")

    def handle_data(self, data):
        if self._in_title:
            self.title += data
        if self._ld is not None:
            self._ld.append(data)


def resolve(page_rel: str, ref: str) -> str | None:
    parsed = urlparse(ref)
    if parsed.scheme or ref.startswith("//") or ref.startswith("mailto:") or ref.startswith("tel:"):
        return None
    path = parsed.path
    if not path:
        return page_rel
    if path.startswith("/"):
        target = path.lstrip("/")
    else:
        target = os.path.normpath(os.path.join(os.path.dirname(page_rel), path)).replace(os.sep, "/")
    if target in ("", "."):
        target = "index.html"
    if target.endswith("/") or os.path.isdir(os.path.join(ROOT, target)):
        target = target.rstrip("/") + "/index.html"
    return target


def expected_canonical(rel: str) -> str:
    if rel == "index.html":
        return f"{layout.SITE}/"
    if rel.endswith("/index.html"):
        return f"{layout.SITE}/{rel[: -len('index.html')]}"
    return f"{layout.SITE}/{rel}"


def main() -> int:
    pages = sorted(html_files())
    parsed: dict[str, PageParser] = {}
    for rel in pages:
        p = PageParser()
        with open(os.path.join(ROOT, rel), encoding="utf-8") as fh:
            p.feed(fh.read())
        p.close()
        parsed[rel] = p

    for rel, p in parsed.items():
        where = rel
        for e in p.structure_errors:
            errors.append(f"{where}: {e}")
        for t, l in p.stack:
            errors.append(f"{where}: unclosed <{t}> from line {l}")
        if not p.title.strip():
            errors.append(f"{where}: missing <title>")
        if not p.meta.get("description"):
            errors.append(f"{where}: missing meta description")
        if not p.has_skip:
            errors.append(f"{where}: missing skip link")
        if not p.has_main:
            errors.append(f"{where}: missing <main id=\"main\">")
        for line in p.imgs_missing_alt:
            errors.append(f"{where}: <img> without alt on line {line}")
        noindex = p.meta.get("robots") == "noindex"
        if not noindex:
            for key in ("og:title", "og:description", "og:url", "og:image", "twitter:card", "twitter:title"):
                if not p.meta.get(key):
                    errors.append(f"{where}: missing {key}")
            if p.canonical != expected_canonical(rel):
                errors.append(f"{where}: canonical {p.canonical} != {expected_canonical(rel)}")
            if p.meta.get("og:url") != p.canonical:
                errors.append(f"{where}: og:url does not match canonical")
        for block in p.jsonld:
            try:
                data = json.loads(block)
            except json.JSONDecodeError as exc:
                errors.append(f"{where}: JSON-LD does not parse ({exc})")
                continue
            if data.get("@context") != "https://schema.org" or "@type" not in data:
                errors.append(f"{where}: JSON-LD missing @context/@type")
            if data.get("@type") == "FAQPage":
                ents = data.get("mainEntity") or []
                if not ents or any(not e.get("name") or not e.get("acceptedAnswer", {}).get("text") for e in ents):
                    errors.append(f"{where}: FAQPage has empty questions or answers")
            if data.get("@type") == "BreadcrumbList":
                for item in data.get("itemListElement", []):
                    url = item.get("item", "")
                    if url.startswith(layout.SITE):
                        target = resolve("index.html", url[len(layout.SITE):] or "/")
                        if target and not os.path.exists(os.path.join(ROOT, target)):
                            errors.append(f"{where}: breadcrumb points at missing {url}")
        for kind, ref, line in p.links:
            target = resolve(rel, ref)
            if target is None:
                continue
            if not os.path.exists(os.path.join(ROOT, target)):
                errors.append(f"{where}:{line}: broken {kind} -> {ref}")
                continue
            frag = urlparse(ref).fragment
            if frag and target in parsed and frag not in parsed[target].ids:
                errors.append(f"{where}:{line}: missing anchor #{frag} in {target}")

    for dirpath, _dirs, files in os.walk(os.path.join(ROOT, "data")):
        for name in files:
            if name.endswith(".json"):
                full = os.path.join(dirpath, name)
                try:
                    with open(full, encoding="utf-8") as fh:
                        json.load(fh)
                except json.JSONDecodeError as exc:
                    errors.append(f"{os.path.relpath(full, ROOT)}: invalid JSON ({exc})")

    laws_path = os.path.join(ROOT, "data", "local-laws.json")
    if os.path.exists(laws_path):
        with open(laws_path, encoding="utf-8") as fh:
            laws = json.load(fh)
        required = ["id", "city", "state", "sourceLastChecked", "summary", "chickenLimit", "roosterRule", "permitRequired", "prerequisites", "rules", "links"]
        for rec in laws:
            for key in required:
                if not rec.get(key):
                    errors.append(f"local-laws.json: {rec.get('id')} missing {key}")
            if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", rec.get("sourceLastChecked", "")):
                errors.append(f"local-laws.json: {rec.get('id')} bad sourceLastChecked")
            if not (rec.get("zipCodes") or rec.get("zipPrefixes")):
                errors.append(f"local-laws.json: {rec.get('id')} needs zipCodes or zipPrefixes")
            if rec.get("page") and not os.path.exists(os.path.join(ROOT, rec["page"])):
                errors.append(f"local-laws.json: {rec.get('id')} page {rec['page']} missing")

    sitemap = os.path.join(ROOT, "sitemap.xml")
    with open(sitemap, encoding="utf-8") as fh:
        locs = re.findall(r"<loc>(.*?)</loc>", fh.read())
    for loc in locs:
        target = resolve("index.html", loc[len(layout.SITE):] or "/")
        if not target or not os.path.exists(os.path.join(ROOT, target)):
            errors.append(f"sitemap.xml: {loc} does not exist")
    for rel, p in parsed.items():
        if p.meta.get("robots") != "noindex" and expected_canonical(rel) not in locs:
            errors.append(f"sitemap.xml: missing {expected_canonical(rel)}")

    for w in warnings:
        print("WARN ", w)
    for e in errors:
        print("ERROR", e)
    print(f"Checked {len(pages)} pages: {len(errors)} error(s), {len(warnings)} warning(s)")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
