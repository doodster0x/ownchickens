"""Regenerate sitemap.xml from the HTML pages in the repo.

Pages with <meta name="robots" content="noindex"> are left out.
Run:  python3 tools/build_sitemap.py
"""

from __future__ import annotations

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import layout  # noqa: E402
from sync_layout import html_files  # noqa: E402

PRIORITY_ORDER = ["index.html", "supplies.html", "guides.html", "breeds.html", "laws.html"]


def url_for(rel: str) -> str:
    if rel == "index.html":
        return f"{layout.SITE}/"
    if rel.endswith("/index.html"):
        return f"{layout.SITE}/{rel[: -len('index.html')]}"
    return f"{layout.SITE}/{rel}"


def main() -> None:
    pages = []
    for rel in html_files():
        with open(os.path.join(layout.ROOT_DIR, rel), encoding="utf-8") as fh:
            if 'name="robots" content="noindex"' in fh.read():
                continue
        pages.append(rel)
    pages.sort(key=lambda r: (PRIORITY_ORDER.index(r) if r in PRIORITY_ORDER else len(PRIORITY_ORDER), r.count("/"), r))
    lines = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    lines += [f"  <url><loc>{url_for(rel)}</loc></url>" for rel in pages]
    lines.append("</urlset>")
    with open(os.path.join(layout.ROOT_DIR, "sitemap.xml"), "w", encoding="utf-8") as fh:
        fh.write("\n".join(lines) + "\n")
    print(f"sitemap.xml: {len(pages)} URLs")


if __name__ == "__main__":
    main()
