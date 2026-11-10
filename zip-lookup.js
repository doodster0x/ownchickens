/* ZIP code chicken-law lookup for the home page.
 *
 * 1. Resolve the ZIP to city + state with the free Zippopotam.us API, and
 *    the county with the FCC Census Area API (both free, no key, CORS-enabled).
 * 2. Show verified city records from data/local-laws.json first.
 * 3. Otherwise say clearly that we have not verified the place, and list
 *    official places to check. Never invent rules.
 * 4. When at least one verified city matches, add starter-flock ideas
 *    (breeds from data/breeds.js, coop size from the housing guide).
 *    No ideas when the ZIP is not in the verified database.
 */
(function () {
  // Direct product URL. Do not add an Associates tag or data-amazon-search;
  // tagging is a separate task and setupAmazonLinks() would rewrite the latter.
  const MEDEHOO_URL = "https://www.amazon.com/MEDEHOO-Chicken-Coop-Outdoor-Pull/dp/B0DPQK9Z6Y";
  const COOP_SQFT = 4;
  const RUN_SQFT = 10;
  const STARTER_IDS = ["rhode-island-red", "barred-rock", "buff-orpington", "australorp"];

  const hasDocument = typeof document !== "undefined";
  const form = hasDocument ? document.querySelector("#zipForm") : null;
  if (hasDocument && !form) return;
  const input = hasDocument ? document.querySelector("#zipLookupInput") : null;
  const errorEl = hasDocument ? document.querySelector("#zipError") : null;
  const results = hasDocument ? document.querySelector("#zipResults") : null;
  const CONFIG = (typeof window !== "undefined" && window.OWN_CHICKENS_CONFIG) || {};

  // State programs verified on official sites (all 50 US states, checked 2026-10-25).
  const STATES = {
    AL: {
      ag: { label: "Alabama Department of Agriculture & Industries: Animal Industries", href: "https://agi.alabama.gov/animalindustries/", detail: "State animal health, poultry testing and avian influenza programs." },
      ext: { label: "Alabama Cooperative Extension System (Auburn University)", href: "https://www.aces.edu/counties/" },
    },
    AK: {
      ag: { label: "Alaska Office of the State Veterinarian: Poultry", href: "https://dec.alaska.gov/eh/vet/livestock/poultry/", detail: "State poultry health, import rules and disease reporting." },
      ext: { label: "UAF Cooperative Extension Service", href: "https://www.uaf.edu/ces/" },
    },
    AZ: {
      ag: { label: "Arizona Department of Agriculture: Animal Services Division", href: "https://agriculture.az.gov/animals", detail: "State animal health, poultry programs and disease reporting." },
      ext: { label: "University of Arizona Cooperative Extension county offices", href: "https://extension.arizona.edu/local-offices" },
    },
    AR: {
      ag: { label: "Arkansas Department of Agriculture: Livestock & Poultry", href: "https://www.agriculture.arkansas.gov/livestock-poultry/", detail: "State poultry health programs, NPIP and avian disease reporting." },
      ext: { label: "University of Arkansas System Division of Agriculture Cooperative Extension", href: "https://www.uaex.uada.edu/counties/" },
    },
    CA: {
      ag: { label: "California Department of Food and Agriculture: Avian Health Program", href: "https://www.cdfa.ca.gov/ahfss/Animal_Health/Avian_Health_Program.html", detail: "State backyard poultry health, biosecurity and sick-bird hotline." },
      ext: { label: "UC Cooperative Extension county offices", href: "https://www.ucanr.edu/counties" },
    },
    CO: {
      ag: { label: "Colorado Department of Agriculture: Animal Health", href: "https://ag.colorado.gov/animals", detail: "State livestock and poultry health programs and avian flu updates." },
      ext: { label: "Colorado State University Extension county offices", href: "https://extension.colostate.edu/extension-county-offices/" },
    },
    CT: {
      ag: { label: "Connecticut Department of Agriculture: Office of the State Veterinarian", href: "https://portal.ct.gov/doag/regulatory/regulatory/state-veterinarian", detail: "State poultry health, flock testing and avian disease reporting." },
      ext: { label: "UConn Extension county offices", href: "https://extension.uconn.edu/locations/" },
    },
    DE: {
      ag: { label: "Delaware Department of Agriculture: Poultry and Animal Health", href: "https://agriculture.delaware.gov/poultry-animal-health/", detail: "State poultry registration, health and avian influenza resources." },
      ext: { label: "University of Delaware Cooperative Extension", href: "https://www.udel.edu/academics/colleges/canr/cooperative-extension/" },
    },
    FL: {
      ag: { label: "Florida Department of Agriculture (FDACS): Division of Animal Industry", href: "https://www.fdacs.gov/Agriculture-Industry/Livestock/Poultry", detail: "State poultry programs, movement rules and disease reporting." },
      ext: { label: "UF/IFAS Extension county offices", href: "https://sfyl.ifas.ufl.edu/find-your-local-office/" },
    },
    GA: {
      ag: { label: "Georgia Department of Agriculture: Animal Health & Diseases", href: "https://agr.georgia.gov/animal-health-diseases", detail: "State animal and poultry health programs and avian flu info." },
      ext: { label: "UGA Cooperative Extension county offices", href: "https://extension.uga.edu/county-offices.html" },
    },
    HI: {
      ag: { label: "Hawaii Department of Agriculture: Animal Industry Division", href: "https://dab.hawaii.gov/ai/", detail: "State animal and poultry health, import permits and disease reporting." },
      ext: { label: "UH CTAHR Cooperative Extension Service", href: "https://cms.ctahr.hawaii.edu/ce/Find-Us" },
    },
    ID: {
      ag: { label: "Idaho State Department of Agriculture: Animal Industries", href: "https://agri.idaho.gov/animals/", detail: "State poultry and livestock health programs." },
      ext: { label: "University of Idaho Extension county offices", href: "https://www.uidaho.edu/extension/county" },
    },
    IL: {
      ag: { label: "Illinois Department of Agriculture: Animal Health and Welfare", href: "https://agr.illinois.gov/animals/animalhealth.html", detail: "State animal and poultry health programs." },
      ext: { label: "University of Illinois Extension: where we serve", href: "https://extension.illinois.edu/global/where-we-serve" },
    },
    IN: {
      ag: { label: "Indiana State Board of Animal Health: Poultry", href: "https://www.in.gov/boah/species-information/avianbirds/", detail: "State poultry health, premises registration and avian flu updates." },
      ext: { label: "Purdue Extension county offices", href: "https://extension.purdue.edu/about/county-office.html" },
    },
    IA: {
      ag: { label: "Iowa Department of Agriculture: Animal Industry Bureau", href: "https://iowaagriculture.gov/animal-industry-division", detail: "State animal and poultry health programs." },
      ag2: { label: "Iowa Department of Agriculture: avian influenza", href: "https://iowaagriculture.gov/animal-industry-division/avian-influenza", detail: "Current bird flu status and reporting." },
      ext: { label: "Iowa State University Extension county services", href: "https://www.extension.iastate.edu/countyservices/" },
    },
    KS: {
      ag: { label: "Kansas Department of Agriculture: Division of Animal Health", href: "https://agriculture.ks.gov/divisions-programs/division-of-animal-health", detail: "State poultry disease control, NPIP and avian influenza guidance." },
      ext: { label: "K-State Research and Extension local offices", href: "https://extension.k-state.edu/about/statewide-locations/" },
    },
    KY: {
      ag: { label: "Kentucky Department of Agriculture: Office of State Veterinarian", href: "https://www.kyagr.com/statevet/", detail: "State poultry health, biosecurity and disease reporting." },
      ext: { label: "University of Kentucky Cooperative Extension county offices", href: "https://extension.mgcafe.uky.edu/county-offices" },
    },
    LA: {
      ag: { label: "Louisiana Department of Agriculture & Forestry: Animal Health", href: "https://www.ldaf.la.gov/animals/health", detail: "State poultry diagnostic lab, NPIP and animal health programs." },
      ext: { label: "LSU AgCenter parish extension offices", href: "https://www.lsuagcenter.com/portals/our_offices/parishes" },
    },
    ME: {
      ag: { label: "Maine Department of Agriculture: Animal Health", href: "https://www.maine.gov/dacf/ahw/animal_health/", detail: "State domestic poultry health, biosecurity and avian flu reporting." },
      ext: { label: "University of Maine Cooperative Extension county offices", href: "https://extension.umaine.edu/county-offices/" },
    },
    MD: {
      ag: { label: "Maryland Department of Agriculture: Animal Health (Poultry Registration)", href: "https://mda.maryland.gov/animals/animal-health-livestock-poultry/backyard-chickens-small-flocks", detail: "Maryland requires poultry premises registration for backyard and commercial flocks." },
      ext: { label: "University of Maryland Extension local offices", href: "https://extension.umd.edu/locations" },
    },
    MA: {
      ag: { label: "Massachusetts Department of Agricultural Resources: Poultry Program", href: "https://www.mass.gov/poultry-program", detail: "State poultry health, flock testing and biosecurity resources." },
      ext: { label: "UMass Extension agriculture and livestock programs", href: "https://www.umass.edu/agriculture-food-environment/extension-outreach-overview" },
    },
    MI: {
      ag: { label: "Michigan MDARD: Avian diseases", href: "https://www.michigan.gov/mdard/animals/diseases/avian", detail: "State poultry disease programs and reporting." },
      ag2: { label: "Michigan MDARD: avian influenza (bird flu)", href: "https://www.michigan.gov/mdard/animals/diseases/avian/avian-influenza", detail: "Current bird flu status and backyard flock guidance." },
      ext: { label: "MSU Extension: find your county office", href: "https://www.canr.msu.edu/outreach/county" },
    },
    MN: {
      ag: { label: "Minnesota Board of Animal Health: Poultry", href: "https://bah.state.mn.us/poultry", detail: "State poultry health programs, testing and contacts." },
      ag2: { label: "Minnesota Board of Animal Health: avian influenza", href: "https://bah.state.mn.us/hpai", detail: "Current bird flu response and backyard biosecurity." },
      ext: { label: "University of Minnesota Extension local offices", href: "https://extension.umn.edu/about/our-work/local" },
    },
    MS: {
      ag: { label: "Mississippi Board of Animal Health: Poultry Division", href: "https://www.mbah.ms.gov/animals/poultry/", detail: "State backyard poultry health, registration and disease reporting." },
      ext: { label: "Mississippi State University Extension county offices", href: "https://extension.msstate.edu/county-offices" },
    },
    MO: {
      ag: { label: "Missouri Department of Agriculture: Animal Health (Poultry)", href: "https://agriculture.mo.gov/animals/health/poultry/", detail: "State poultry health programs, NPIP and avian influenza updates." },
      ext: { label: "University of Missouri Extension county offices", href: "https://extension.missouri.edu/locations" },
    },
    MT: {
      ag: { label: "Montana Department of Livestock: Animal Health Bureau", href: "https://liv.mt.gov/animal-health/", detail: "State livestock and poultry health, import rules and disease reporting." },
      ext: { label: "Montana State University Extension local offices", href: "https://www.montana.edu/extension/localoffices.html" },
    },
    NE: {
      ag: { label: "Nebraska Department of Agriculture: Animal and Plant Health Protection", href: "https://nda.nebraska.gov/animal/", detail: "State poultry health, NPIP and avian influenza reporting." },
      ext: { label: "Nebraska Extension (UNL) county offices", href: "https://epd.unl.edu/" },
    },
    NV: {
      ag: { label: "Nevada Department of Agriculture: Division of Animal Industry", href: "https://agri.nv.gov/animals/animal_home/", detail: "State animal and poultry disease programs." },
      ext: { label: "University of Nevada, Reno Extension county offices", href: "https://extension.unr.edu/county-offices.aspx" },
    },
    NH: {
      ag: { label: "New Hampshire Department of Agriculture: Division of Animal Industry", href: "https://www.agriculture.nh.gov/divisions/animal-industry/index.htm", detail: "State poultry health, flock testing and disease reporting." },
      ext: { label: "UNH Cooperative Extension county offices", href: "https://extension.unh.edu/about/locations" },
    },
    NJ: {
      ag: { label: "New Jersey Department of Agriculture: Division of Animal Health", href: "https://www.nj.gov/agriculture/divisions/ah/", detail: "State poultry health, biosecurity and avian disease reporting." },
      ext: { label: "Rutgers Cooperative Extension county offices", href: "https://extension.rutgers.edu/county" },
    },
    NM: {
      ag: { label: "New Mexico Livestock Board", href: "https://www.nmlbonline.com/", detail: "State livestock and poultry health and disease reporting." },
      ext: { label: "New Mexico State University Cooperative Extension county offices", href: "https://extension.nmsu.edu/about/location.html" },
    },
    NY: {
      ag: { label: "New York State Department of Agriculture and Markets: Animal Industry", href: "https://agriculture.ny.gov/animals", detail: "State poultry health, NPIP and avian influenza guidance." },
      ext: { label: "Cornell Cooperative Extension local offices", href: "https://cals.cornell.edu/cornell-cooperative-extension/local-offices" },
    },
    NC: {
      ag: { label: "North Carolina Department of Agriculture: Veterinary Division (Poultry)", href: "https://www.ncagr.gov/divisions/veterinary/poultry-health-programs", detail: "State poultry health, NPIP and NCFarmID premises registration." },
      ext: { label: "NC State Extension county centers", href: "https://www.ces.ncsu.edu/local-county-center/" },
    },
    ND: {
      ag: { label: "North Dakota Department of Agriculture: Animal Health Division", href: "https://www.ndda.nd.gov/divisions/animal-health", detail: "State poultry health, biosecurity and avian influenza updates." },
      ext: { label: "NDSU Extension county offices", href: "https://www.ndsu.edu/agriculture/extension/extension-county-offices" },
    },
    OH: {
      ag: { label: "Ohio Department of Agriculture: Division of Animal Health", href: "https://agri.ohio.gov/divisions/animal-health", detail: "State poultry health programs and avian disease reporting." },
      ext: { label: "Ohio State University Extension county offices", href: "https://extension.osu.edu/lao" },
    },
    OK: {
      ag: { label: "Oklahoma Department of Agriculture: Animal Industry / State Veterinarian", href: "https://ag.ok.gov/divisions/animal-industry-state-veterinarian/", detail: "State poultry health, NPIP and avian influenza guidance." },
      ext: { label: "Oklahoma State University Extension county offices", href: "https://extension.okstate.edu/county/" },
    },
    OR: {
      ag: { label: "Oregon Department of Agriculture: Animal Health, Feeds, and Livestock ID", href: "https://www.oregon.gov/oda/animal-health-feeds-livestock-id/pages/default.aspx", detail: "State backyard poultry health and avian influenza resources." },
      ext: { label: "Oregon State University Extension county offices", href: "https://extension.oregonstate.edu/find-us" },
    },
    PA: {
      ag: { label: "Pennsylvania Department of Agriculture: Bureau of Animal Health", href: "https://www.pa.gov/agencies/pda/animals", detail: "State poultry health, premises registration and avian flu reporting." },
      ext: { label: "Penn State Extension county offices", href: "https://extension.psu.edu/county-offices" },
    },
    RI: {
      ag: { label: "Rhode Island DEM Division of Agriculture: Animal Health", href: "https://dem.ri.gov/natural-resources-bureau/agriculture-and-forest-environment/agriculture/animal-health", detail: "State domestic poultry health, biosecurity and registration." },
      ext: { label: "University of Rhode Island Cooperative Extension", href: "https://web.uri.edu/coopext/" },
    },
    SC: {
      ag: { label: "Clemson University Livestock Poultry Health (SC State Veterinarian)", href: "https://www.clemson.edu/public/lph/", detail: "South Carolina official state poultry health agency and NPIP office." },
      ext: { label: "Clemson Cooperative Extension county offices", href: "https://www.clemson.edu/extension/co/" },
    },
    SD: {
      ag: { label: "South Dakota Animal Industry Board", href: "https://aib.sd.gov/", detail: "State poultry health, NPIP and disease reporting." },
      ext: { label: "SDSU Extension regional centers and locations", href: "https://extension.sdstate.edu/about" },
    },
    TN: {
      ag: { label: "Tennessee Department of Agriculture: Animals and Animal Health", href: "https://www.tn.gov/agriculture/animals.html", detail: "State poultry health programs and avian flu updates." },
      ext: { label: "UT Extension county offices", href: "https://utextension.tennessee.edu/office-locations-departments-centers/" },
    },
    TX: {
      ag: { label: "Texas Animal Health Commission: Poultry", href: "https://www.tahc.texas.gov/animal_health/poultry/", detail: "State poultry health, registration and disease reporting." },
      ext: { label: "Texas A&M AgriLife Extension county offices", href: "https://counties.agrilife.org/" },
    },
    UT: {
      ag: { label: "Utah Department of Agriculture and Food: Animal Industry", href: "https://ag.utah.gov/animal-industry/", detail: "State poultry health, biosecurity and avian disease reporting." },
      ext: { label: "Utah State University Extension county offices", href: "https://extension.usu.edu/locations" },
    },
    VT: {
      ag: { label: "Vermont Agency of Agriculture, Food and Markets: Animal Health", href: "https://agriculture.vermont.gov/animal-health-0", detail: "State poultry health, flock registration and avian influenza updates." },
      ext: { label: "UVM Extension local offices", href: "https://www.uvm.edu/extension" },
    },
    VA: {
      ag: { label: "Virginia Department of Agriculture (VDACS): Poultry Health", href: "https://www.vdacs.virginia.gov/animals-poultry.shtml", detail: "State poultry health, testing and avian disease reporting." },
      ext: { label: "Virginia Cooperative Extension local offices", href: "https://ext.vt.edu/offices.html" },
    },
    WA: {
      ag: { label: "Washington State Department of Agriculture: Avian Health Program", href: "https://agr.wa.gov/departments/animals-livestock-and-pets/avian-health", detail: "State backyard flock biosecurity and sick-bird reporting." },
      ext: { label: "WSU Extension county offices", href: "https://cahnrs.wsu.edu/about/locations/" },
    },
    WV: {
      ag: { label: "West Virginia Department of Agriculture: Animal Health Division", href: "https://agriculture.wv.gov/divisions/animal-health/", detail: "State poultry health, NPIP and disease reporting." },
      ext: { label: "WVU Extension county offices", href: "https://extension.wvu.edu/offices" },
    },
    WI: {
      ag: { label: "Wisconsin DATCP Livestock Premises Registration", href: "https://datcp.wi.gov/Pages/Programs_Services/PremisesRegistration.aspx", detail: "Wisconsin requires premises registration for anyone keeping livestock, including poultry. It is free." },
      ag2: { label: "Wisconsin DATCP avian influenza information", href: "https://datcp.wi.gov/Pages/Programs_Services/AvianInfluenza.aspx", detail: "Current bird flu status and how to report sick birds." },
      ext: { label: "UW-Madison Extension county offices", href: "https://counties.extension.wisc.edu/" },
    },
    WY: {
      ag: { label: "Wyoming Livestock Board: Animal Health", href: "https://wlsb.state.wy.us/animal-health/", detail: "State livestock and poultry health programs and disease reporting." },
      ext: { label: "University of Wyoming Extension county offices", href: "https://www.uwyo.edu/uwe/county/" },
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
        <h4>Official sources</h4>
        <ul class="zip-links">${links.map(linkItem).join("")}</ul>
        <h4>Key rules</h4>
        ${list(rec.rules)}
        ${rec.prerequisites && rec.prerequisites.length ? `<h4>Before you apply</h4>${list(rec.prerequisites)}` : ""}
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

  // Latitude splits the continental pattern: cold winters north of ~40°N,
  // hot summers south of ~35°N, both in between. Low-desert longitudes stay
  // hot a little farther north. Missing coordinates stay "unknown".
  function climateBand(lat, lon) {
    const la = Number(lat);
    const lo = Number(lon);
    if (!Number.isFinite(la)) return "unknown";
    const desert = Number.isFinite(lo) && lo <= -109 && lo >= -120 && la < 38 && la >= 35;
    if (la < 35 || desert) return "hot";
    if (la >= 40) return "cold";
    return "mixed";
  }

  function breedList() {
    const root = typeof window !== "undefined" ? window : globalThis;
    return (root && root.OWN_CHICKENS_BREEDS) || [];
  }

  // Usual four beginners, filtered by the breed file's cold/heat scores
  // (1 = needs extra care, 3 = handles it well). Hot and mixed areas drop
  // heat = 1 (Buff Orpington). Cold areas keep every cold-hardy starter in
  // the pool, then keep the three with the best cold score and, on a tie,
  // the better heat score — so Orpington, which is heat-sensitive, is the
  // one left off the card.
  function pickStarters(breeds, band) {
    const mode = band === "hot" ? "hot" : band === "cold" ? "cold" : "mixed";
    const byId = new Map((breeds || []).map((b) => [b.id, b]));
    const starters = STARTER_IDS.map((id) => byId.get(id)).filter(Boolean);
    const pool = starters.filter((b) => {
      const cold = Number(b.cold) || 0;
      const heat = Number(b.heat) || 0;
      if (mode === "hot" || mode === "mixed") return heat >= 2;
      return cold >= 2;
    });
    const score = (b) => {
      const cold = Number(b.cold) || 0;
      const heat = Number(b.heat) || 0;
      if (mode === "hot") return heat * 10 + cold;
      if (mode === "cold") return cold * 10 + heat;
      return cold + heat;
    };
    return pool
      .map((b, i) => ({ b, i, s: score(b) }))
      .sort((a, c) => c.s - a.s || a.i - c.i)
      .slice(0, 3)
      .map((row) => row.b);
  }

  function roostersProhibited(rule) {
    const s = String(rule || "");
    if (/not explicitly banned|confirm rooster|rooster allowed|allowed per lot|require written consent|permit fee/i.test(s)) return false;
    return /prohibit|not allowed|\bbanned\b|hens only/i.test(s);
  }

  // First numeric flock ceiling in the opening clause. "2 to 6" uses the
  // maximum. "Up to 4 (6 on larger parcels)" and school exceptions stay on
  // the leading number. Per-acre rates, fee tiers, and space formulas are
  // not a bird count. Square-foot and decimal figures are ignored.
  function flockCap(limit) {
    const text = String(limit || "");
    if (/no numeric limit|no city cap|determined by|per acre|permit fee tiers/i.test(text)) return null;
    if (/not allowed|\b0 chickens\b/i.test(text)) return 0;
    const clause = text.split(/[;(]/)[0];
    const range = clause.match(/^\s*(\d+)\s+to\s+(\d+)\b/i);
    if (range) return Math.max(Number(range[1]), Number(range[2]));
    const upTo = clause.match(/\bup to\s+(\d+)(?!\d|\.)/i);
    if (!upTo) return null;
    return Number(upTo[1]);
  }

  function climateSentence(band) {
    if (band === "hot") return "These beginner breeds handle hot summers well.";
    if (band === "cold") return "These beginner breeds handle cold winters well.";
    if (band === "mixed") return "These beginner breeds handle seasonal cold and summer heat.";
    return "These are hardy beginner breeds from the usual starter list.";
  }

  function layerPhrase(breed) {
    const brown = /brown/i.test(breed.egg || "");
    if (brown && breed.laying === "Excellent") return "an excellent brown-egg layer";
    if (breed.laying === "Excellent") return "an excellent layer";
    if (breed.laying === "Very good") return "a very good layer";
    if (breed.laying === "Good") return "a good layer";
    if (breed.laying === "Fair") return "a fair layer";
    return "a steady layer";
  }

  function fitLine(breed, band) {
    const mode = band === "hot" ? "hot" : band === "cold" ? "cold" : "mixed";
    const layer = layerPhrase(breed);
    const gentle = /gentle|calm|friendly/i.test(breed.temper || "");
    const needsShade = Number(breed.heat) <= 1 || /shade/i.test(breed.notes || "");
    if (mode === "hot") {
      if (Number(breed.heat) >= 3) return `Handles heat well and is ${layer} — a reliable first hen.`;
      if (needsShade && breed.laying === "Excellent") {
        return `An excellent layer that needs shade in the heat${gentle ? " and is easy to handle" : ""}.`;
      }
      return `Handles heat with good housing${gentle ? ", stays calm," : ""} and is ${layer}.`;
    }
    if (mode === "mixed") {
      if (Number(breed.cold) >= 3 && Number(breed.heat) >= 3) {
        return `Handles cold and heat well and is ${layer} — a reliable first hen.`;
      }
      if (needsShade && /dark feathers/i.test(breed.notes || "")) {
        return "An excellent layer that handles cold; dark feathers need shade in the heat.";
      }
      if (gentle) return `Cold-hardy and calm, and ${layer}. Plan on shade and airflow in summer.`;
      return `Handles seasonal cold and summer heat with good housing and is ${layer}.`;
    }
    if (Number(breed.cold) >= 3 && Number(breed.heat) >= 3) {
      return `Handles cold well and is ${layer} — a reliable first hen.`;
    }
    if (Number(breed.cold) >= 3 && breed.laying === "Very good" && gentle) {
      return "Cold-hardy, gentle, and a very good layer; a solid bird for a family flock.";
    }
    if (Number(breed.cold) >= 3 && breed.laying === "Excellent" && gentle) {
      return "An excellent layer that does well in cold weather and is easy to handle.";
    }
    if (Number(breed.cold) >= 3 && Number(breed.heat) <= 1) {
      return "Cold-hardy and very gentle. Needs shade if summers turn hot.";
    }
    return breed.notes;
  }

  function introText(rec, band) {
    const city = rec.city;
    const limit = String(rec.chickenLimit || "").trim();
    const roost = String(rec.roosterRule || "").trim();
    const banned = roostersProhibited(roost);
    const short = limit.length <= 64 && /^(up to\s+\d+|\d+\s+to\s+\d+)/i.test(limit);
    let lead;
    if (banned && short) {
      lead = `${city} allows ${limit.charAt(0).toLowerCase()}${limit.slice(1)} and does not allow roosters.`;
    } else if (banned) {
      lead = `${city}: ${limit}. Roosters are not allowed.`;
    } else {
      const roostSentence = roost ? (/[.!?]$/.test(roost) ? roost : `${roost}.`) : "";
      lead = `${city}: ${limit}. ${roostSentence}`.trim();
    }
    const hens = banned ? " Start with sexed hens or point-of-lay pullets so you stay within the rooster ban." : "";
    return `${lead} ${climateSentence(band)}${hens}`;
  }

  function medehooLink() {
    return `<a href="${MEDEHOO_URL}" target="_blank" rel="noopener">MEDEHOO outdoor chicken coop</a>`;
  }

  function housingGuideSentence() {
    return ' See the <a href="housing.html">housing guide</a> for placement and setup.';
  }

  function coopHtml(rec, cap) {
    const guide = housingGuideSentence();
    if (cap == null) {
      return {
        amazon: true,
        title: "A coop sized for 4 to 6 hens",
        body: `There isn't a single numeric flock cap in the verified rule. Plan about ${COOP_SQFT} square feet of coop floor and about ${RUN_SQFT} square feet of outdoor run per standard-size hen. One prefab option is this ${medehooLink()}, a 4 to 6 hen starter.${guide}`,
      };
    }
    const coop = cap * COOP_SQFT;
    const run = cap * RUN_SQFT;
    const hens = cap === 1 ? "hen" : "hens";
    const dims = `For ${cap} standard-size ${hens}, plan about ${coop} square feet of coop floor and about ${run} square feet of outdoor run (about ${COOP_SQFT} square feet inside and ${RUN_SQFT} square feet of run per hen).`;
    const title = cap > 6 ? `A coop sized for up to ${cap} hens` : `A coop sized for ${cap} ${hens}`;
    if (cap < 4) {
      return { amazon: false, title, body: `${dims}${guide}` };
    }
    const link = medehooLink();
    const extra = cap <= 6
      ? `This ${link} is sold for 4 to 6 hens, so keep only ${cap} ${cap === 1 ? "bird" : "birds"} to stay within the city's cap.`
      : `One prefab option is this ${link}, sized for 4 to 6 hens, which stays under ${esc(rec.city)}'s limit of ${cap}. Do not keep more birds than the city allows.`;
    return { amazon: true, title, body: `${dims} ${extra}${guide}` };
  }

  // Same wording as housing.html. "This page" is the homepage when the card is shown here.
  const DISCLOSURE_HTML = `<p class="disclosure"><strong>Disclosure:</strong> Some links on this page may be affiliate links, including Amazon links. If you buy through them, Own Chickens may earn a small commission at no extra cost to you. As an Amazon Associate we would earn from qualifying purchases. <a href="privacy.html#affiliate-disclosure">Full disclosure</a>.</p>`;

  function placeFor(places, rec) {
    const list = places || [];
    const named = list.find((p) => p && rec && p.state === rec.state && norm(p.city) === norm(rec.city));
    return named || list[0] || {};
  }

  function primaryRecord(recs, place) {
    if (!recs || !recs.length) return null;
    if (place && place.city) {
      const wanted = norm(place.city);
      const named = recs.find((rec) => rec.state === place.state && [rec.city, ...(rec.aliases || [])].map(norm).includes(wanted));
      if (named) return named;
    }
    return recs[0];
  }

  function starterHtml(rec, place, matchCount) {
    const band = climateBand(place && place.lat, place && place.lon);
    const cap = flockCap(rec.chickenLimit);
    const city = rec.city;
    if (cap === 0) {
      const roost = roostersProhibited(rec.roosterRule)
        ? "Roosters are prohibited too."
        : `${rec.roosterRule}.`;
      return `
      <article class="zip-card zip-starter" aria-labelledby="zipStarterTitle">
        <p class="zip-badge">Starter ideas for this ZIP</p>
        <h3 id="zipStarterTitle">No starter flock inside ${esc(city)}</h3>
        <p>${esc(city)} does not allow backyard chickens inside city limits, so there isn't a starter flock to plan. ${esc(roost)} If your address is outside the city, county rules may be different.</p>
      </article>`;
    }
    const breeds = pickStarters(breedList(), band);
    const breedItems = breeds
      .map((b) => `<li><strong>${esc(b.name)}</strong><span>${esc(fitLine(b, band))}</span></li>`)
      .join("");
    const coop = coopHtml(rec, cap);
    const multi = matchCount > 1
      ? `<p class="zip-starter-which">This ZIP matches more than one verified city. These ideas follow ${esc(city)}.</p>`
      : "";
    return `
      <article class="zip-card zip-starter" aria-labelledby="zipStarterTitle">
        <p class="zip-badge">Starter ideas for this ZIP</p>
        <h3 id="zipStarterTitle">Good first birds and a coop for ${esc(city)}</h3>
        <p>${esc(introText(rec, band))}</p>
        ${breedItems ? `<ul class="zip-starter-breeds">${breedItems}</ul>` : ""}
        <div class="zip-starter-coop">
          <strong>${esc(coop.title)}</strong>
          <p>${coop.body}</p>
        </div>
        <p class="zip-starter-links"><a href="breeds.html">See all breeds</a><a href="housing.html">Housing guide</a></p>
        ${multi}
        ${coop.amazon ? DISCLOSURE_HTML : ""}
      </article>`;
  }

  function render(zip, places, county, recs) {
    const p = places[0];
    const place = `${p.city}${county ? `, ${county}` : ""}, ${p.state}`;
    let html = `<h2 class="zip-results-title" id="zipResultsTitle">Chicken rules for ${esc(zip)} <span>${esc(place)}</span></h2>`;
    if (recs.length) {
      const primary = primaryRecord(recs, p);
      recs.forEach((rec) => {
        html += recordHtml(rec);
        if (rec === primary) html += starterHtml(rec, placeFor(places, rec), recs.length);
      });
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
    html += `<section class="zip-next" aria-label="Next steps"><h3>Next steps for new chicken keepers</h3><ul>
      <li><a href="guides.html">Beginner guides</a></li><li><a href="breeds.html">Pick a breed</a></li>
      <li><a href="cost-calculator.html">Estimate costs</a></li><li><a href="checklist.html">Starter checklist</a></li></ul></section>`;
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
      showError("Please enter a 5-digit US ZIP code, like 53703.");
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

  if (typeof module !== "undefined" && module.exports) {
    module.exports = {
      MEDEHOO_URL,
      flockCap,
      climateBand,
      pickStarters,
      roostersProhibited,
      fitLine,
      coopHtml,
      starterHtml,
      primaryRecord,
      introText,
    };
  }
  if (!form) return;

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
