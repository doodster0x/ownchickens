"""Generate one page per city in data/local-laws.json at laws/<id>.html.

Only add cities whose rules you verified on official sources, with links and
a sourceLastChecked date. This script also refreshes the city cards on
laws.html (between the city-cards markers). Then run:

  python3 tools/build_city_pages.py && python3 tools/sync_layout.py \
    && python3 tools/build_sitemap.py && python3 tools/check_site.py
"""

from __future__ import annotations

import json
import os
import sys
from urllib.parse import quote

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import layout  # noqa: E402
from layout import SITE, breadcrumb, esc, signup  # noqa: E402

ISSUES = "https://github.com/doodster0x/ownchickens/issues/new"


def correction_url(rec: dict) -> str:
    title = f"Law correction: {rec['city']}, {rec['state']}"
    body = f"Page: {SITE}/{rec['page']}\n\nWhat is out of date or wrong?\n\nOfficial source link:\n\nDate you checked:\n"
    return f"{ISSUES}?title={quote(title)}&body={quote(body)}"


def city_page(rec: dict, all_recs: list[dict]) -> str:
    path = rec["page"]
    place = f"{rec['city']}, {rec['state']}"
    title = f"{place} Backyard Chicken Laws: Limits, Roosters, Permits | Own Chickens"
    desc = f"{rec['summary']} Official sources linked; last checked {rec['sourceLastChecked']}."
    lis = lambda items: "".join(f"\n                <li>{esc(i)}</li>" for i in items)
    links = "".join(
        f'\n                <li><a href="{esc(l["href"])}" target="_blank" rel="noopener">{esc(l["label"])}</a><br /><small>{esc(l["detail"])}</small></li>'
        for l in rec["links"]
    )
    others = "".join(
        f'\n          <a class="link-card" href="{esc(o["id"])}.html"><span>{esc(o["state"])}</span><strong>{esc(o["city"])}</strong><small>{esc(o["chickenLimit"])}. {esc(o["roosterRule"])}.</small></a>'
        for o in all_recs
        if o["id"] != rec["id"]
    )
    main = f"""      <section class="page-hero">
        <div class="section-heading">
          <p class="eyebrow">Local laws &middot; {esc(rec.get('stateName', rec['state']))}</p>
          <h1>{esc(rec['city'])} chicken laws</h1>
          <p>{esc(rec['summary'])}</p>
          <p class="page-meta">Last checked {esc(rec['sourceLastChecked'])} against official city sources. Rules change, so confirm with the city before buying birds.</p>
        </div>
      </section>

      <section class="section guide-layout">
        <nav class="guide-nav" aria-label="On this page">
          <a href="#facts">Quick facts</a>
          <a href="#before">Before you apply</a>
          <a href="#rules">Key rules</a>
          <a href="#sources">Official sources</a>
          <a href="#correction">Report a correction</a>
          <a href="../laws.html">All cities</a>
        </nav>
        <div class="guide-content">
          <article class="guide-card" id="facts">
            <h2>Quick facts</h2>
            <dl class="law-facts">
              <div><dt>Chicken limit</dt><dd>{esc(rec['chickenLimit'])}</dd></div>
              <div><dt>Roosters</dt><dd>{esc(rec['roosterRule'])}</dd></div>
              <div><dt>Permit or license</dt><dd>{esc(rec['permitRequired'])}</dd></div>
              <div><dt>Last checked</dt><dd>{esc(rec['sourceLastChecked'])}</dd></div>
            </dl>
            <p class="callout">This applies inside {esc(rec['city'])} city limits. ZIP codes and mailing addresses can cross city lines, and nearby towns, villages, and counties have their own rules. HOA rules and leases can be stricter.</p>
          </article>

          <article class="guide-card" id="before">
            <h2>Before you apply</h2>
            <ul>{lis(rec['prerequisites'])}
            </ul>
          </article>

          <article class="guide-card" id="rules">
            <h2>Key rules</h2>
            <ul>{lis(rec['rules'])}
            </ul>
          </article>

          <article class="guide-card" id="sources">
            <h2>Official sources</h2>
            <p>We summarize these documents in plain language. The official text always wins.</p>
            <ul>{links}
            </ul>
          </article>

          <article class="guide-card" id="correction">
            <h2>Spot something out of date?</h2>
            <p>Cities update fees and rules. If you find a change, send us the official source link and we will re-check this page.</p>
            <p><a class="button secondary-dark" href="{esc(correction_url(rec))}" data-correction="{esc(place)}" target="_blank" rel="noopener">Report a correction</a></p>
          </article>

          <article class="guide-card">
            <h2>Next steps</h2>
            <ul>
              <li>Size your coop and run: <a href="../housing.html">housing guide</a>.</li>
              <li>Pick breeds that handle {esc(rec.get('stateName', rec['state']))} weather: <a href="../breeds.html">breed guide</a>.</li>
              <li>Estimate your setup cost, including the permit fee: <a href="../cost-calculator.html">cost calculator</a>.</li>
              <li>Print the <a href="../checklist.html">First-Year Starter Checklist</a>.</li>
            </ul>
          </article>

          {signup("law-" + rec['id'], "../", "Get help checking your local rules", "Join the list for the free starter checklist and a heads-up when we add or update verified city rules. No spam, unsubscribe anytime.")}
        </div>
      </section>

      <section class="section section-tight" aria-labelledby="other-cities">
        <div class="section-heading"><h2 id="other-cities">Other cities we have checked</h2></div>
        <div class="card-grid" style="margin-top:20px">{others}
        </div>
      </section>"""
    url = f"{SITE}/{path}"
    article = layout.article_jsonld(f"{place} backyard chicken laws", desc, url)
    article["dateModified"] = rec["sourceLastChecked"]
    article["about"] = {"@type": "City", "name": rec["city"], "containedInPlace": {"@type": "State", "name": rec.get("stateName", rec["state"])}}
    return layout.page(
        path=path,
        title=title,
        description=desc,
        main=main,
        jsonlds=[
            breadcrumb([("Home", f"{SITE}/"), ("Local Laws", f"{SITE}/laws.html"), (f"{place}", url)]),
            article,
        ],
    )


def main() -> None:
    with open(os.path.join(layout.ROOT_DIR, "data", "local-laws.json"), encoding="utf-8") as fh:
        recs = json.load(fh)
    os.makedirs(os.path.join(layout.ROOT_DIR, "laws"), exist_ok=True)
    for rec in recs:
        rec.setdefault("page", f"laws/{rec['id']}.html")
        with open(os.path.join(layout.ROOT_DIR, rec["page"]), "w", encoding="utf-8") as fh:
            fh.write(city_page(rec, recs))
    print(f"Built {len(recs)} city pages")
    refresh_laws_cards(recs)


def refresh_laws_cards(records) -> None:
    """Rebuild the city cards block on laws.html from the same data."""
    path = os.path.join(layout.ROOT_DIR, "laws.html")
    start, end = "<!-- city-cards:start -->", "\n          <!-- city-cards:end -->"
    with open(path, encoding="utf-8") as fh:
        html = fh.read()
    if start not in html or end not in html:
        print("laws.html: city-cards markers not found, skipped")
        return
    cards = "".join(
        f'\n          <a class="link-card" href="{r["page"]}"><span>{r["state"]} &middot; checked {r["sourceLastChecked"]}</span>'
        f'<strong>{esc(r["city"])}</strong><small>{esc(r["chickenLimit"])}. {esc(r["roosterRule"])}. '
        f'{esc(r["permitRequired"].split(";")[0].split("(")[0].strip())}.</small></a>'
        for r in records
    )
    a, b = html.index(start) + len(start), html.index(end)
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(html[:a] + cards + html[b:])
    print(f"laws.html: {len(records)} city cards")


if __name__ == "__main__":
    main()
