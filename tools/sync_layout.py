"""Rewrite the shared header and footer on every HTML page from tools/layout.py.

Run after adding a page or changing navigation:  python3 tools/sync_layout.py
It also makes sure site-config.js loads before script.js.
"""

from __future__ import annotations

import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import layout  # noqa: E402

HEADER_RE = re.compile(r'<header class="site-header".*?</header>', re.S)
FOOTER_RE = re.compile(r'<footer class="site-footer">.*?</footer>', re.S)
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


def sync(rel: str) -> bool:
    full = os.path.join(layout.ROOT_DIR, rel)
    with open(full, encoding="utf-8") as fh:
        text = fh.read()
    original = text
    prefix = "/" if rel == "404.html" else "../" * rel.count("/")
    key = current_key(rel)
    text = HEADER_RE.sub(lambda _m: layout.header(key, prefix), text, count=1)
    text = FOOTER_RE.sub(lambda _m: layout.footer(key, prefix), text, count=1)
    config_tag = f'<script src="{prefix}site-config.js"></script>'
    script_tag = f'<script src="{prefix}script.js"></script>'
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
