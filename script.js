const lawForm = document.querySelector("#lawForm");
const cityInput = document.querySelector("#cityInput");
const stateInput = document.querySelector("#stateInput");
const countyInput = document.querySelector("#countyInput");
const resultsTitle = document.querySelector("#resultsTitle");
const resultsHint = document.querySelector("#resultsHint");
const resultLinks = document.querySelector("#resultLinks");

const clean = (value) => value.trim().replace(/\s+/g, " ");
const query = (...parts) => encodeURIComponent(parts.filter(Boolean).join(" "));

function buildLinks(city, state, county) {
  const place = `${city}, ${state}`;
  const countyPlace = county ? `${county} County, ${state}` : "";

  return [
    {
      label: "Official city website search",
      detail: "Best first stop for permits, animal control pages, and backyard hen ordinances.",
      href: `https://www.google.com/search?q=${query("site:.gov", place, "backyard chickens permit ordinance hens")}`,
    },
    {
      label: "Municipal code search",
      detail: "Searches Municode, a common host for city ordinances and animal codes.",
      href: `https://library.municode.com/search?query=${query(place, "chickens hens fowl livestock")}`,
    },
    {
      label: "American Legal code search",
      detail: "Another common code-library source for local ordinances.",
      href: `https://codelibrary.amlegal.com/search?query=${query(place, "chickens hens fowl")}`,
    },
    {
      label: "County permit and animal rules",
      detail: county ? "Useful when county zoning or animal control applies outside city limits." : "Add your county for a more targeted county search.",
      href: `https://www.google.com/search?q=${query("site:.gov", countyPlace || state, "county backyard chickens permit animal ordinance")}`,
    },
    {
      label: "State agriculture and extension sources",
      detail: "Helpful for disease reporting, poultry health, and state-level ownership guidance.",
      href: `https://www.google.com/search?q=${query("site:.edu OR site:.gov", state, "extension backyard poultry chickens")}`,
    },
    {
      label: "Broad official-source check",
      detail: "Use this to catch city PDFs, council minutes, FAQs, and animal-services pages.",
      href: `https://www.google.com/search?q=${query(place, "backyard chickens rooster coop setback permit site:.gov OR site:.us")}`,
    },
  ];
}

function renderLinks(city, state, county) {
  const links = buildLinks(city, state, county);
  resultsTitle.textContent = `Law links for ${city}, ${state}`;
  resultsHint.textContent = "Open official city or county results first, then confirm flock limits, rooster rules, coop setbacks, permits, and nuisance rules.";
  resultLinks.innerHTML = "";

  links.forEach((link) => {
    const anchor = document.createElement("a");
    anchor.href = link.href;
    anchor.target = "_blank";
    anchor.rel = "noopener";
    anchor.innerHTML = `<strong>${link.label}</strong><span>${link.detail}</span>`;
    resultLinks.append(anchor);
  });
}

lawForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const city = clean(cityInput.value);
  const state = clean(stateInput.value).toUpperCase();
  const county = clean(countyInput.value);

  if (!city || !state) {
    return;
  }

  renderLinks(city, state, county);
});

renderLinks("Austin", "TX", "Travis");
