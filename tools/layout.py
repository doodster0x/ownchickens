"""Shared header, footer, head, and signup markup for Own Chickens pages.

The site is plain static HTML. These helpers exist so the shared chrome
(navigation, footer, signup box) stays identical on every page.

  python3 tools/sync_layout.py      # rewrite header/footer on every page
  python3 tools/build_city_pages.py # regenerate laws/<city>.html from data
  python3 tools/build_sitemap.py    # regenerate sitemap.xml
  python3 tools/check_site.py       # link, JSON, and JSON-LD checks

Links whose target file does not exist yet are skipped automatically, so
navigation never points at a missing page.
"""

from __future__ import annotations

import html
import json
import os

SITE = "https://ownchickens.com"
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OG_IMAGE = f"{SITE}/assets/backyard-coop-hero-1200.jpg"

# (href relative to site root, label)
MAIN_NAV = [
    ("supplies.html", "See Starter Supplies"),
    ("guides.html", "Guides"),
    ("breeds.html", "Breeds"),
    ("cost-calculator.html", "Cost Calculator"),
    ("reviews/", "Reviews"),
    ("blog/", "Blog"),
    ("laws.html", "Local Laws"),
]
NAV_CTA = ("flock.html", "Get Your Flock")

GUIDE_NAV = [
    ("guides.html", "All guides"),
    ("breeds.html", "Breeds"),
    ("housing.html", "Housing"),
    ("predators.html", "Predators"),
    ("feeding.html", "Feeding"),
    ("care.html", "Daily Care"),
    ("health.html", "Health"),
    ("biosecurity.html", "Biosecurity"),
    ("flock.html", "Get Your Flock"),
]

FOOTER_COLUMNS = [
    (
        "Learn",
        [
            ("guides.html", "All guides"),
            ("breeds.html", "Breeds"),
            ("breed-quiz.html", "Breed quiz"),
            ("housing.html", "Housing"),
            ("predators.html", "Predators"),
            ("feeding.html", "Feeding"),
            ("care.html", "Daily Care"),
            ("health.html", "Health"),
            ("biosecurity.html", "Biosecurity"),
        ],
    ),
    (
        "Plan and buy",
        [
            ("supplies.html", "See Starter Supplies"),
            ("supplies.html#budget-list", "The Budget List"),
            ("cost-calculator.html", "Cost Calculator"),
            ("checklist.html", "Starter Checklist"),
            ("reviews/", "Buying Guides"),
            ("flock.html", "Get Your Flock"),
        ],
    ),
    (
        "More",
        [
            ("laws.html", "Local Laws"),
            ("blog/", "Seasonal Blog"),
            ("privacy.html", "Privacy and Disclosures"),
        ],
    ),
]

FOOTER_NOTE = (
    "Own Chickens is an educational starting point. Always verify current rules with your "
    "city or county before buying birds or building a coop."
)


def esc(value: str) -> str:
    return html.escape(value, quote=True)


def target_exists(href: str) -> bool:
    path = href.split("#", 1)[0]
    if not path:
        return True
    full = os.path.join(ROOT_DIR, path)
    if path.endswith("/"):
        full = os.path.join(full, "index.html")
    return os.path.exists(full)


def _link(prefix: str, href: str, label: str, current: str, extra: str = "") -> str:
    attrs = f' href="{prefix}{href}"'
    if extra:
        attrs += f" {extra}"
    if href == current:
        attrs += ' aria-current="page"'
    return f"<a{attrs}>{esc(label)}</a>"


def header(current: str, prefix: str = "") -> str:
    links = [
        _link(prefix, href, label, current)
        for href, label in MAIN_NAV
        if target_exists(href)
    ]
    links.append(_link(prefix, NAV_CTA[0], NAV_CTA[1], current, 'class="nav-cta"'))
    nav = "\n        ".join(links)
    return f"""<header class="site-header" aria-label="Primary">
      <a class="brand" href="{prefix}index.html" aria-label="Own Chickens home">
        <span class="brand-mark" aria-hidden="true">OC</span>
        <span>Own Chickens</span>
      </a>
      <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="mainNav">
        <span></span><span></span><span></span><span class="sr-only">Menu</span>
      </button>
      <nav class="nav-links" id="mainNav" aria-label="Main navigation">
        {nav}
      </nav>
    </header>"""


def footer(current: str, prefix: str = "") -> str:
    cols = []
    for title, items in FOOTER_COLUMNS:
        links = "".join(
            f"\n            {_link(prefix, href, label, current)}"
            for href, label in items
            if target_exists(href)
        )
        cols.append(
            f"""<nav aria-label="{esc(title)}">
            <h2>{esc(title)}</h2>{links}
          </nav>"""
        )
    columns = "\n          ".join(cols)
    return f"""<footer class="site-footer">
      <div>
        <p>{esc(FOOTER_NOTE)}</p>
        <div class="footer-columns">
          {columns}
        </div>
      </div>
    </footer>"""


REVIEW_NAV = [
    ("reviews/index.html", "All buying guides"),
    ("reviews/coops.html", "Coops"),
    ("reviews/feeders.html", "Feeders"),
    ("reviews/waterers.html", "Waterers"),
    ("reviews/automatic-coop-doors.html", "Automatic doors"),
    ("reviews/heaters.html", "Winter heat"),
    ("supplies.html", "Starter supplies"),
]


def guide_nav(current: str, prefix: str = "", label: str = "Guide pages", items=None) -> str:
    links = "".join(
        f"\n          {_link(prefix, href, text, current)}"
        for href, text in (items or GUIDE_NAV)
        if target_exists(href)
    )
    return f"""<nav class="guide-nav" aria-label="{esc(label)}">{links}
        </nav>"""


def signup(source: str, prefix: str = "", heading: str | None = None, body: str | None = None) -> str:
    """Email capture box. Wiring lives in site-config.js and script.js.

    The email input has no name attribute until script.js finds a configured
    provider, so nothing is sent anywhere while the list is not live.
    """
    heading = heading or "Get the free First-Year Chicken Starter Checklist"
    body = body or (
        "One printable page covering rules, setup, supplies, and the first month of care. "
        "Join the list for the checklist plus occasional seasonal reminders. No spam, unsubscribe anytime."
    )
    return f"""<section class="signup" aria-labelledby="signup-{esc(source)}-title">
        <div class="signup-copy">
          <p class="eyebrow">Free starter checklist</p>
          <h2 id="signup-{esc(source)}-title">{esc(heading)}</h2>
          <p>{esc(body)}</p>
        </div>
        <form class="signup-form" data-signup data-source="{esc(source)}" action="{prefix}checklist.html" method="get" novalidate>
          <label for="signup-{esc(source)}-email">Email address</label>
          <div class="signup-row">
            <input id="signup-{esc(source)}-email" type="email" autocomplete="email" inputmode="email" placeholder="you@example.com" required data-signup-email />
            <button class="button primary" type="submit">Send me the checklist</button>
          </div>
          <p class="signup-status" role="status" aria-live="polite" data-signup-status></p>
          <p class="signup-fine">Prefer not to sign up? <a href="{prefix}checklist.html">Open the printable checklist</a> anytime. See our <a href="{prefix}privacy.html">privacy notes</a>.</p>
        </form>
      </section>"""


def jsonld(obj: dict) -> str:
    body = json.dumps(obj, indent=2, ensure_ascii=False)
    body = body.replace("</", "<\\/")
    return f'<script type="application/ld+json">\n{body}\n    </script>'


def breadcrumb(items: list[tuple[str, str]]) -> dict:
    return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {"@type": "ListItem", "position": i + 1, "name": name, "item": url}
            for i, (name, url) in enumerate(items)
        ],
    }


def faq_jsonld(faqs: list[tuple[str, str]]) -> dict:
    import re

    def strip(text: str) -> str:
        return html.unescape(re.sub(r"<[^>]+>", "", text)).strip()

    return {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {
                "@type": "Question",
                "name": strip(q),
                "acceptedAnswer": {"@type": "Answer", "text": strip(a)},
            }
            for q, a in faqs
        ],
    }


def faq_section(faqs: list[tuple[str, str]], heading: str = "Frequently asked questions") -> str:
    items = "".join(
        f"""
            <details>
              <summary>{q}</summary>
              <p>{a}</p>
            </details>"""
        for q, a in faqs
    )
    return f"""<article class="guide-card faq" id="faq">
            <h2>{esc(heading)}</h2>{items}
          </article>"""


def article_jsonld(headline: str, description: str, url: str, kind: str = "Article", date: str | None = None) -> dict:
    data = {
        "@context": "https://schema.org",
        "@type": kind,
        "headline": headline,
        "description": description,
        "url": url,
        "image": OG_IMAGE,
        "mainEntityOfPage": url,
        "author": {"@type": "Organization", "name": "Own Chickens"},
        "publisher": {"@type": "Organization", "name": "Own Chickens", "url": f"{SITE}/"},
    }
    if date:
        data["datePublished"] = date
        data["dateModified"] = date
    return data


def page(
    *,
    path: str,
    title: str,
    description: str,
    main: str,
    jsonlds: list[dict] | None = None,
    og_type: str = "article",
    og_title: str | None = None,
    extra_head: str = "",
    extra_scripts: str = "",
    body_class: str = "",
) -> str:
    """Render a full page. `path` is relative to the site root, e.g. "laws/madison-wi.html"."""
    depth = path.count("/")
    prefix = "../" * depth
    if path.endswith("index.html"):
        url_path = path[: -len("index.html")]
    else:
        url_path = path
    url = f"{SITE}/{url_path}"
    og_title = og_title or title
    ld = "\n    ".join(jsonld(obj) for obj in (jsonlds or []))
    body_attr = f' class="{esc(body_class)}"' if body_class else ""
    current = path[: -len("index.html")] if path.endswith("index.html") else path
    return f"""<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content="{esc(description)}" />
    <title>{esc(title)}</title>
    <link rel="canonical" href="{url}" />
    <meta property="og:site_name" content="Own Chickens" />
    <meta property="og:title" content="{esc(og_title)}" />
    <meta property="og:description" content="{esc(description)}" />
    <meta property="og:type" content="{og_type}" />
    <meta property="og:url" content="{url}" />
    <meta property="og:image" content="{OG_IMAGE}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="600" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="{esc(og_title)}" />
    <meta name="twitter:description" content="{esc(description)}" />
    <meta name="twitter:image" content="{OG_IMAGE}" />
    <link rel="icon" href="{prefix}favicon.svg" type="image/svg+xml" />
    <link rel="stylesheet" href="{prefix}styles.css" />{extra_head}
    {ld}
  </head>
  <body{body_attr}>
    <a class="skip-link" href="#main">Skip to main content</a>
    {header(current, prefix)}

    <main id="main">
{main}
    </main>

    {footer(current, prefix)}
    <script src="{prefix}site-config.js"></script>
    <script src="{prefix}script.js"></script>{extra_scripts}
  </body>
</html>
"""
