# OwnChickens.com

The beginner's guide to backyard laying hens, written for everyday US families. It's plain-language, practical and Midwest-friendly.

Static HTML, CSS and vanilla JavaScript, hosted on GitHub Pages. There is no build step to deploy: the HTML files in the repo are the site.

## Structure

| Path | What it is |
| --- | --- |
| `index.html` | Homepage: intro, free tools, supplies, law finder, signup |
| `guides.html` | Guide hub |
| `housing.html`, `predators.html`, `feeding.html`, `care.html`, `health.html`, `biosecurity.html`, `flock.html` | Core guides (each with FAQ + FAQPage JSON-LD and signup) |
| `breeds.html` | 15-breed comparison table and breed profiles |
| `breed-quiz.html`, `breed-quiz.js`, `data/breeds.js` | "Best breed for your climate" quiz and its breed data |
| `cost-calculator.html`, `calculator.js`, `data/cost-assumptions.js` | First-year cost calculator (low / middle / premium, editable table) |
| `supplies.html` | Convenience List (Amazon search links) and The Budget List (`#budget-list`) |
| `reviews/` | Buying guides: coops, feeders, waterers, automatic doors, heated waterers / coop heat |
| `blog/` | Seasonal blog index and posts |
| `laws.html`, `laws/*.html`, `data/local-laws.json` | Law finder, verified city pages, and the city data |
| `checklist.html` | Printable First-Year Starter Checklist (the email lead magnet) |
| `privacy.html` | Privacy, affiliate disclosure (`#affiliate-disclosure`), accuracy and corrections |
| `site-config.js` | **The one place to configure email, affiliate, analytics and corrections** |
| `script.js` | Mobile nav, law finder, signup handling, Amazon links, analytics loader, print buttons |
| `styles.css` | Shared styles (including print styles) |
| `tools/` | Python helpers for shared layout, city pages, sitemap and checks (see below) |
| `sitemap.xml`, `robots.txt`, `404.html`, `CNAME`, `favicon.svg`, `assets/` | Site plumbing and images |

## Configuration (`site-config.js`)

Everything is blank by default, and the site works normally while it is blank.

### Email signup (TODO: choose a provider)

All signup boxes share one config. While `signup.actionUrl` is empty, the forms show a friendly "coming soon" message, link to the printable checklist, and send nothing. The email input has no `name` attribute until a provider is configured.

To go live, create a form with your provider and copy its action URL and email field name from the provider's embed code:

| Provider | `actionUrl` (from embed code) | `emailFieldName` | Notes |
| --- | --- | --- | --- |
| Buttondown | `https://buttondown.com/api/emails/embed-subscribe/YOUR_USERNAME` | `email` | Simple, privacy-friendly, free tier for small lists. Optional `sourceFieldName: "tag"` |
| MailerLite | action URL from the embedded form HTML | `fields[email]` | Generous free tier, automations |
| Kit (ConvertKit) | `https://app.kit.com/forms/YOUR_FORM_ID/subscriptions` | `email_address` | Creator-focused, landing pages and automations |

Then set up the provider's welcome email to deliver `https://ownchickens.com/checklist.html` (or a PDF of it), and update `privacy.html` to name the provider.

### Amazon Associates (TODO: add your tag once approved)

Every Amazon link uses `data-amazon-search="..."`. When `affiliates.amazonTag` is set (for example `"ownchickens-20"`), `script.js` adds `tag=` to every Amazon link site-wide and marks it `rel="sponsored noopener"`. While it is empty, the links are plain Amazon searches. Disclosures are already on `supplies.html`, every `reviews/` page and `privacy.html#affiliate-disclosure`. Specific product picks should only be added after hands-on use. Look for the `AFFILIATE-PLACEHOLDER` comments in `reviews/*.html`.

### Analytics (TODO: choose a provider, or none)

Nothing loads while `analytics.provider` is empty. There are ready-made examples in the file for Plausible, GoatCounter and Cloudflare Web Analytics. If you turn analytics on, update `privacy.html`.

### Corrections

The "Report a correction" links on the law pages open a prefilled GitHub issue. Optionally set `corrections.email` to a monitored inbox to offer email as well.

## Local law data

`data/local-laws.json` holds one record per city. **Only add rules verified on official sources** (the city's site, ordinance, application or fact sheet). Each record needs source links and a `sourceLastChecked` date. Cities that could not be verified were left out on purpose; Waukesha and Chicago are still pending. Current coverage: 10 Wisconsin cities plus Minneapolis and Saint Paul, all checked 2026-10-18.

After editing the JSON:

```sh
python3 tools/build_city_pages.py   # laws/<id>.html + the city cards on laws.html
python3 tools/sync_layout.py && python3 tools/build_sitemap.py && python3 tools/check_site.py
```

Re-check sources and update the dates at least yearly. Fees often change each January.

## Editing workflow

1. Edit page content directly in the HTML.
2. To change the nav, footer or guide sub-nav, edit `tools/layout.py` and run `python3 tools/sync_layout.py`. This rewrites the header and footer on every page and makes sure `site-config.js` loads first.
3. After adding or removing pages, run `python3 tools/build_sitemap.py`. Pages marked `noindex` are skipped.
4. Before pushing, run `python3 tools/check_site.py`. It checks tag balance, duplicate ids, internal links and anchors, image alt text, meta/OG/canonical tags, JSON-LD, FAQPage content, data files, law records and sitemap coverage.

New pages should copy an existing page's head: a unique title and description, canonical, OG/Twitter tags, a breadcrumb plus Article/BlogPosting JSON-LD, and a FAQPage only when the FAQ is visible on the page.

Content rules: don't invent statistics, prices or product test results. Any cost must be a conservative range labeled "typical range, check local prices". Health advice should point to a vet who treats poultry.

## Deploying

Hosted on GitHub Pages from `main`. Work happens on branches and is merged by the owner.

## Status

- Done: email capture (inactive until a provider is chosen), printable checklist, expanded guides with FAQs, predators/health/biosecurity guides, cost calculator, Budget List, 12 verified city law pages, breed table and quiz, buying guides, seasonal blog, analytics placeholder.

## TODO / open decisions

- [ ] **Email provider:** pick Buttondown, MailerLite or Kit; set `signup.actionUrl` and `emailFieldName`; set up the checklist welcome email; update `privacy.html`.
- [ ] **Amazon Associates:** apply, then set `affiliates.amazonTag`. Add specific product picks only after hands-on use.
- [ ] **Analytics:** choose a privacy-friendly provider (or none) and update `privacy.html`.
- [ ] **Ads:** hold off until traffic justifies it; ads would need a privacy/consent review.
- [ ] Optional corrections inbox (`corrections.email`).
- [ ] More verified cities (Waukesha, Chicago, other Midwest metros) and a yearly re-check of all city sources.
- [ ] A larger-flock (12–20 birds) supply list.
- [ ] A PDF version of the checklist for the welcome email.
