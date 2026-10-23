/* ZIP code chicken-law lookup for the home page.
 *
 * 1. Resolve the ZIP to city + state with the free Zippopotam.us API, and
 *    the county with the FCC Census Area API (both free, no key, CORS-enabled).
 * 2. Show verified city records from data/local-laws.json first.
 * 3. Otherwise say clearly that we have not verified the place, and list
 *    official places to check. Never invent rules.
 */
(function () {
  const form = document.querySelector("#zipForm");
  if (!form) return;
  const input = document.querySelector("#zipLookupInput");
  const errorEl = document.querySelector("#zipError");
  const results = document.querySelector("#zipResults");
  const CONFIG = window.OWN_CHICKENS_CONFIG || {};

  // State programs verified on official sites (checked 2026-10-22).
  const STATES = {
    WI: {
      ag: { label: "Wisconsin DATCP Livestock Premises Registration", href: "https://datcp.wi.gov/Pages/Programs_Services/PremisesRegistration.aspx", detail: "Wisconsin requires premises registration for anyone keeping livestock, including poultry. It is free." },
      ag2: { label: "Wisconsin DATCP avian influenza information", href: "https://datcp.wi.gov/Pages/Programs_Services/AvianInfluenza.aspx", detail: "Current bird flu status and how to report sick birds." },
      ext: { label: "UW-Madison Extension county offices", href: "https://counties.extension.wisc.edu/" },
    },
    MN: {
      ag: { label: "Minnesota Board of Animal Health: Poultry", href: "https://bah.state.mn.us/poultry", detail: "State poultry health programs, testing and contacts." },
      ag2: { label: "Minnesota Board of Animal Health: avian influenza", href: "https://bah.state.mn.us/hpai", detail: "Current bird flu response and backyard biosecurity." },
      ext: { label: "University of Minnesota Extension local offices", href: "https://extension.umn.edu/find-extension-office" },
    },
    IL: {
      ag: { label: "Illinois Department of Agriculture: Animal Health and Welfare", href: "https://agr.illinois.gov/animals/animalhealth.html", detail: "State animal and poultry health programs." },
      ext: { label: "University of Illinois Extension: where we serve", href: "https://extension.illinois.edu/global/where-we-serve" },
    },
    IA: {
      ag: { label: "Iowa Department of Agriculture: Animal Industry Bureau", href: "https://iowaagriculture.gov/animal-industry-bureau", detail: "State animal and poultry health programs." },
      ag2: { label: "Iowa Department of Agriculture: avian influenza", href: "https://iowaagriculture.gov/animal-industry-bureau/avian-influenza", detail: "Current bird flu status and reporting." },
      ext: { label: "Iowa State University Extension county services", href: "https://www.extension.iastate.edu/countyservices/" },
    },
    MI: {
      ag: { label: "Michigan MDARD: Avian diseases", href: "https://www.michigan.gov/mdard/animals/diseases/avian", detail: "State poultry disease programs and reporting." },
      ag2: { label: "Michigan MDARD: avian influenza (bird flu)", href: "https://www.michigan.gov/birdflu", detail: "Current bird flu status and backyard flock guidance." },
      ext: { label: "MSU Extension: find your county office", href: "https://www.canr.msu.edu/outreach/county" },
    },
  };

  const esc = (v) => String(v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const q = (...parts) => encodeURIComponent(parts.filter(Boolean).join(" "));
  const norm = (v) => String(v || "").toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim().replace(/^st /, "saint ").replace(/^city of /, "");

  let lawsPromise = null;
  function loadLaws() {
    if (!lawsPromise) {
      lawsPromise = fetch("data/local-laws.json")
        .then((r) => (r.ok ? r.json() : []))
        .catch(() => []);
    }
    return lawsPromise;
  }

  async function lookupZip(zip) {
    const r = await fetch(`https://api.zippopotam.us/us/${zip}`);
    if (r.status === 404) return null;
    if (!r.ok) throw new Error("lookup failed");
    const data = await r.json();
    return (data.places || []).map((p) => ({
      city: p["place name"],
      state: p["state abbreviation"],
      stateName: p.state,
      lat: p.latitude,
      lon: p.longitude,
    }));
  }

  async function lookupCounty(place) {
    try {
      const r = await fetch(`https://geo.fcc.gov/api/census/area?lat=${encodeURIComponent(place.lat)}&lon=${encodeURIComponent(place.lon)}&format=json`);
      if (!r.ok) return "";
      const data = await r.json();
      return (data.results && data.results[0] && data.results[0].county_name) || "";
    } catch (e) {
      return "";
    }
  }

  function matchRecords(laws, zip, places) {
    const found = [];
    const add = (rec) => { if (rec && !found.includes(rec)) found.push(rec); };
    laws.filter((rec) => (rec.zipCodes || []).includes(zip)).forEach(add);
    (places || []).forEach((p) => {
      laws
        .filter((rec) => rec.state === p.state && [rec.city, ...(rec.aliases || [])].map(norm).includes(norm(p.city)))
        .forEach(add);
    });
    return found;
  }

  function suggestHref(label) {
    const c = CONFIG.corrections || {};
    const title = `Suggest a city: ${label}`;
    if (c.email) return `mailto:${c.email}?subject=${encodeURIComponent(title)}`;
    const base = c.issuesUrl || "https://github.com/doodster0x/ownchickens/issues/new";
    const body = "City / town / county:\n\nOfficial ordinance or city page link (if you know it):\n\nAnything else:\n";
    return `${base}?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
  }

  const linkItem = (l) =>
    `<li><a href="${esc(l.href)}"${l.internal ? "" : ' target="_blank" rel="noopener"'}><strong>${esc(l.label)}</strong>${l.detail ? `<span>${esc(l.detail)}</span>` : ""}</a></li>`;

  function recordHtml(rec) {
    const list = (items) => `<ul>${(items || []).map((i) => `<li>${esc(i)}</li>`).join("")}</ul>`;
    const links = [];
    if (rec.page) links.push({ label: `Full ${rec.city} rules page`, href: rec.page, internal: true, detail: "Everything on one shareable page." });
    (rec.links || []).forEach((l) => links.push(l));
    return `
      <article class="zip-card zip-verified">
        <p class="zip-badge">Verified from official sources &middot; last checked ${esc(rec.sourceLastChecked)}</p>
        <h3>${esc(rec.city)}, ${esc(rec.state)}</h3>
        <p class="zip-summary">${esc(rec.summary)}</p>
        <dl class="law-facts">
          <div><dt>Chicken limit</dt><dd>${esc(rec.chickenLimit)}</dd></div>
          <div><dt>Roosters</dt><dd>${esc(rec.roosterRule)}</dd></div>
          <div><dt>Permit or license</dt><dd>${esc(rec.permitRequired)}</dd></div>
        </dl>
        <h4>Key rules</h4>
        ${list(rec.rules)}
        ${rec.prerequisites && rec.prerequisites.length ? `<h4>Before you apply</h4>${list(rec.prerequisites)}` : ""}
        <h4>Official sources</h4>
        <ul class="zip-links">${links.map(linkItem).join("")}</ul>
      </article>`;
  }

  function fallbackLinks(place, county) {
    const st = STATES[place.state];
    const where = `${place.city}, ${place.state}`;
    const links = [
      { label: `Search Municode for ${place.city} ordinances`, href: `https://library.municode.com/search?query=${q(place.city, place.stateName, "chickens")}`, detail: "Many cities publish their municipal code here. Look for animals, fowl or zoning chapters." },
      { label: "Search American Legal Publishing codes", href: `https://codelibrary.amlegal.com/search?query=${q(place.city, place.stateName, "chickens")}`, detail: "Another common host for city and county codes." },
      { label: `Find the official ${place.city} city or village website`, href: `https://www.google.com/search?q=${q("official website", "city of", where)}`, detail: "Look for zoning, animal control or licensing pages." },
    ];
    if (county) {
      links.push(
        { label: `Find the official ${county} website`, href: `https://www.google.com/search?q=${q("official website", county, place.stateName)}`, detail: "County zoning applies in many unincorporated areas." },
        { label: `Search ${county} ordinances on Municode`, href: `https://library.municode.com/search?query=${q(county, place.stateName, "chickens")}` }
      );
    }
    if (st) {
      links.push(st.ag);
      if (st.ag2) links.push(st.ag2);
      links.push({ ...st.ext, detail: county ? `Choose ${county} for local, research-based poultry help.` : "Local, research-based poultry help." });
    } else {
      links.push(
        { label: `${place.stateName} department of agriculture: poultry programs`, href: `https://www.google.com/search?q=${q(place.stateName, "department of agriculture backyard poultry site:.gov")}`, detail: "State programs for poultry health, registration and bird flu reporting." },
        { label: `${county || place.stateName} cooperative extension office`, href: `https://www.google.com/search?q=${q(county, place.stateName, "extension office")}`, detail: "Local, research-based poultry help from your land-grant university." }
      );
    }
    return links;
  }

  function render(zip, places, county, recs) {
    const p = places[0];
    const place = `${p.city}${county ? `, ${county}` : ""}, ${p.state}`;
    let html = `<h2 class="zip-results-title" id="zipResultsTitle">Chicken rules for ${esc(zip)} <span>${esc(place)}</span></h2>`;
    if (recs.length) {
      html += recs.map(recordHtml).join("");
      html += `<p class="zip-note">ZIP codes can cross city limits. Confirm your address is inside the city before relying on this.</p>`;
    } else {
      html += `<article class="zip-card zip-unverified">
        <h3>We haven't verified rules for ${esc(p.city)}, ${esc(p.state)} yet</h3>
        <p>We only show rules we've checked against official sources, so we won't guess. These are the official places to check:</p>
        <ul class="zip-links">${fallbackLinks(p, county).map(linkItem).join("")}</ul>
        <p><a class="button secondary-dark" href="${esc(suggestHref(`${p.city}, ${p.state} (${zip})`))}" target="_blank" rel="noopener">Suggest ${esc(p.city)} for verification</a></p>
      </article>`;
    }
    html += `<p class="zip-note"><strong>Outside city or village limits?</strong> Unincorporated areas follow county or township rules (often zoning), not the nearby city's ordinance.</p>`;
    if (recs.length) html += `<p class="zip-note">Something out of date? <a href="${esc(suggestHref(`${p.city}, ${p.state} correction`))}" target="_blank" rel="noopener">Report a correction</a>.</p>`;
    results.innerHTML = html;
  }

  function setUrl(zip) {
    const url = new URL(window.location.href);
    if (zip) url.searchParams.set("zip", zip); else url.searchParams.delete("zip");
    history.replaceState(null, "", url.toString());
  }

  function showError(msg) {
    errorEl.textContent = msg;
    input.setAttribute("aria-invalid", msg ? "true" : "false");
  }

  async function run(raw, { focus = true } = {}) {
    const zip = String(raw || "").trim().replace(/-\d{4}$/, "");
    showError("");
    if (!/^\d{5}$/.test(zip)) {
      results.innerHTML = "";
      showError("Please enter a 5-digit US ZIP code, like 53925.");
      input.focus();
      return;
    }
    setUrl(zip);
    results.setAttribute("aria-busy", "true");
    results.innerHTML = `<p class="zip-loading">Looking up ${esc(zip)}&hellip;</p>`;
    let places;
    const lawsP = loadLaws();
    try {
      places = await lookupZip(zip);
    } catch (e) {
      const laws = await lawsP;
      const recs = matchRecords(laws, zip, []);
      results.removeAttribute("aria-busy");
      if (recs.length) {
        render(zip, [{ city: recs[0].city, state: recs[0].state, stateName: recs[0].stateName }], "", recs);
      } else {
        results.innerHTML = `<p class="zip-error-box">We couldn't reach the ZIP lookup service just now. Please try again, or browse <a href="laws.html">verified city rules</a>.</p>`;
      }
      return;
    }
    if (!places || !places.length) {
      results.removeAttribute("aria-busy");
      results.innerHTML = "";
      showError(`We couldn't find ZIP code ${zip}. Check the number and try again.`);
      input.focus();
      return;
    }
    const [laws, county] = await Promise.all([lawsP, lookupCounty(places[0])]);
    render(zip, places, county, matchRecords(laws, zip, places));
    results.removeAttribute("aria-busy");
    if (focus) results.focus();
    if (window.goatcounter && window.goatcounter.count) {
      window.goatcounter.count({ path: "zip-lookup", title: "ZIP lookup", event: true });
    }
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    run(input.value);
  });

  const initial = new URLSearchParams(window.location.search).get("zip");
  if (initial) {
    input.value = initial;
    run(initial, { focus: false });
  }
})();
