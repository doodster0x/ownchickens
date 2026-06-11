const lawForm = document.querySelector("#lawForm");
const cityInput = document.querySelector("#cityInput");
const zipInput = document.querySelector("#zipInput");
const resultsTitle = document.querySelector("#resultsTitle");
const resultsHint = document.querySelector("#resultsHint");
const resultLinks = document.querySelector("#resultLinks");
const navToggle = document.querySelector(".nav-toggle");
const mainNav = document.querySelector("#mainNav");
let localLawRecords = [];

const clean = (value) => value.trim().replace(/\s+/g, " ");
const normalizePlace = (value) => clean(value).toLowerCase().replace(/[^a-z0-9\s]/g, "");
const normalizeZip = (value) => clean(value).replace(/\D/g, "").slice(0, 5);
const query = (...parts) => encodeURIComponent(parts.filter(Boolean).join(" "));

function buildFallbackLinks(city, zip) {
  return [
    {
      label: "Official city or town website search",
      detail: "Best first stop for permits, animal control pages, and backyard hen ordinances.",
      href: `https://www.google.com/search?q=${query("site:.gov", city, zip, "backyard chickens permit ordinance hens")}`,
    },
    {
      label: "Municipal code search",
      detail: "Searches Municode, a common host for city ordinances and animal codes.",
      href: `https://library.municode.com/search?query=${query(city, zip, "chickens hens fowl livestock")}`,
    },
    {
      label: "American Legal code search",
      detail: "Another common code-library source for local ordinances.",
      href: `https://codelibrary.amlegal.com/search?query=${query(city, zip, "chickens hens fowl")}`,
    },
    {
      label: "County permit and animal rules search",
      detail: "Useful when county zoning or animal control applies outside city limits.",
      href: `https://www.google.com/search?q=${query("site:.gov", city, zip, "county backyard chickens permit animal ordinance")}`,
    },
    {
      label: "State agriculture and extension sources",
      detail: "Helpful for disease reporting, poultry health, and state-level ownership guidance.",
      href: `https://www.google.com/search?q=${query("site:.edu OR site:.gov", city, zip, "extension backyard poultry chickens")}`,
    },
    {
      label: "Broad official-source check",
      detail: "Use this to catch city PDFs, council minutes, FAQs, and animal-services pages.",
      href: `https://www.google.com/search?q=${query(city, zip, "backyard chickens rooster coop setback permit site:.gov OR site:.us")}`,
    },
  ];
}

function findLawRecord(city, zip) {
  const normalizedCity = normalizePlace(city);
  const normalizedZip = normalizeZip(zip);

  return localLawRecords.find((record) => {
    const names = [record.city, ...(record.aliases || [])].map(normalizePlace);
    return names.includes(normalizedCity) && record.zipCodes.includes(normalizedZip);
  });
}

function addLink(link) {
  const anchor = document.createElement("a");
  anchor.href = link.href;
  anchor.target = "_blank";
  anchor.rel = "noopener";
  anchor.innerHTML = `<strong>${link.label}</strong><span>${link.detail}</span>`;
  resultLinks.append(anchor);
}

function renderRecord(record, city, zip) {
  resultsTitle.textContent = `${record.city}, ${record.state} chicken rules`;
  resultsHint.textContent = `Database match for ${city} ${zip}. Source checked ${record.sourceLastChecked}. Always verify your exact address before buying birds.`;
  resultLinks.innerHTML = "";

  const recordCard = document.createElement("article");
  recordCard.className = "law-record";
  recordCard.innerHTML = `
    <p class="source-date">Source checked ${record.sourceLastChecked}</p>
    <h4>${record.summary}</h4>
    <dl class="law-facts">
      <div><dt>Chicken limit</dt><dd>${record.chickenLimit}</dd></div>
      <div><dt>Roosters</dt><dd>${record.roosterRule}</dd></div>
      <div><dt>Permit or license</dt><dd>${record.permitRequired}</dd></div>
    </dl>
    <div class="law-detail-grid">
      <div>
        <strong>Before applying</strong>
        <ul>${record.prerequisites.map((item) => `<li>${item}</li>`).join("")}</ul>
      </div>
      <div>
        <strong>Key rules</strong>
        <ul>${record.rules.map((item) => `<li>${item}</li>`).join("")}</ul>
      </div>
    </div>
  `;
  resultLinks.append(recordCard);

  record.links.forEach(addLink);
  addLink({
    label: "Run a fresh official-source search too",
    detail: "Use this to catch newly updated PDFs, council changes, FAQs, and address-specific pages.",
    href: `https://www.google.com/search?q=${query(record.city, record.state, zip, "backyard chickens rooster coop setback permit site:.gov OR site:.us")}`,
  });
}

function renderFallback(city, zip) {
  resultsTitle.textContent = `No database match yet for ${city} ${zip}`;
  resultsHint.textContent = "Use these official-source searches, then confirm the rules with your city, town, county, or zoning office.";
  resultLinks.innerHTML = "";
  buildFallbackLinks(city, zip).forEach(addLink);
}

function renderLawResults(city, zip) {
  const record = findLawRecord(city, zip);

  if (record) {
    renderRecord(record, city, zip);
    return;
  }

  renderFallback(city, zip);
}

async function loadLocalLawRecords() {
  if (!lawForm) {
    return;
  }

  try {
    const response = await fetch("data/local-laws.json");
    if (!response.ok) {
      throw new Error("Local laws database unavailable");
    }
    localLawRecords = await response.json();
    resultsHint.textContent = "Try Madison 53703 or Milwaukee 53202 for seeded database examples. Always verify your exact address before buying birds.";
  } catch {
    localLawRecords = [];
    resultsHint.textContent = "The database could not load, but the form can still build official-source searches.";
  }
}

if (navToggle && mainNav) {
  navToggle.addEventListener("click", () => {
    const isOpen = mainNav.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  mainNav.addEventListener("click", (event) => {
    if (event.target instanceof HTMLAnchorElement) {
      mainNav.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
    }
  });
}

if (lawForm) {
  lawForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const city = clean(cityInput.value);
    const zip = normalizeZip(zipInput.value);

    if (!city || zip.length !== 5) {
      return;
    }

    renderLawResults(city, zip);
  });

  loadLocalLawRecords();
}
