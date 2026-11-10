"""Rewrite the shared header, footer, and All Guides sidebar from tools/layout.py.

Run after adding a page or changing navigation:  python3 tools/sync_layout.py
It also makes sure site-config.js loads before script.js.

The All Guides sidebar is any nav.guide-nav that links to "All guides".
On-this-page, buying-guide, blog, and short related-link navs are left alone.
GUIDE_NAV in tools/layout.py is the required order: change it and run this
script so every page that has the sidebar updates in the same change.
"""

from __future__ import annotations

import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import layout  # noqa: E402

HEADER_RE = re.compile(r'<header class="site-header".*?</header>', re.S)
# Match site-footer and site-footer site-footer-slim (the live markup).
FOOTER_RE = re.compile(r'<footer class="site-footer(?:\s[^"]*)?">.*?</footer>', re.S)
GOATCOUNTER_TAG = (
    '<script data-goatcounter="https://ownchickens.goatcounter.com/count" '
    'async src="//gc.zgo.at/count.js"></script>'
)
SKIP_DIRS = {".git", "tools", "assets", "data", "node_modules"}


def html_files():
    for dirpath, dirnames, filenames in os.walk(layout.ROOT_DIR):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        for name in filenames:
            if name.endswith(".html"):
                full = os.path.join(dirpath, name)
                yield os.path.relpath(full, layout.ROOT_DIR).replace(os.sep, "/")


def current_key(rel: str) -> str:
    return rel[: -len("index.html")] if rel.endswith("index.html") else rel


def replace_all_guides_nav(text: str, rel: str, prefix: str) -> str:
    """Rewrite All Guides sidebars to GUIDE_NAV, keeping each page's current marker."""
    key = current_key(rel)

    def repl(match: re.Match) -> str:
        indent, attrs, inner = match.group(1), match.group(2), match.group(3)
        if layout.all_guides_sidebar_links(inner, rel) is None:
            return match.group(0)
        label_m = re.search(r'\baria-label="([^"]*)"', attrs)
        label = label_m.group(1) if label_m else "Guide pages"
        return f"{indent}{layout.guide_nav(key, prefix, label)}"

    return layout.GUIDE_NAV_BLOCK.sub(repl, text)


def sync(rel: str) -> bool:
    full = os.path.join(layout.ROOT_DIR, rel)
    with open(full, encoding="utf-8") as fh:
        text = fh.read()
    original = text
    prefix = "/" if rel == "404.html" else "../" * rel.count("/")
    key = current_key(rel)
    text = HEADER_RE.sub(lambda _m: layout.header(key, prefix), text, count=1)
    text = FOOTER_RE.sub(lambda _m: layout.footer(key, prefix), text, count=1)
    text = replace_all_guides_nav(text, rel, prefix)
    config_tag = f'<script src="{prefix}site-config.js"></script>'
    script_tag = f'<script src="{prefix}script.js"></script>'
    if "data-goatcounter" not in text:
        text = text.replace("</head>", f"    {GOATCOUNTER_TAG}\n  </head>", 1)
    if script_tag not in text:
        text = text.replace("  </body>", f"    {config_tag}\n    {script_tag}\n  </body>", 1)
    elif config_tag not in text:
        text = text.replace(script_tag, f"{config_tag}\n    {script_tag}", 1)
    if text != original:
        with open(full, "w", encoding="utf-8") as fh:
            fh.write(text)
        return True
    return False


if __name__ == "__main__":
    changed = [rel for rel in sorted(html_files()) if sync(rel)]
    print(f"Updated {len(changed)} page(s)")
    for rel in changed:
        print(" -", rel)
