const CONFIG = window.OWN_CHICKENS_CONFIG || {};
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
const normalizePlace = (value) =>
  clean(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/^st\s+/, "saint ")
    .replace(/^city of\s+/, "");
const normalizeZip = (value) => clean(value).replace(/\D/g, "").slice(0, 5);
const query = (...parts) => encodeURIComponent(parts.filter(Boolean).join(" "));
const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]);

/* ---------- Local law finder ---------- */

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
  const byName = localLawRecords.filter((record) => {
    const names = [record.city, ...(record.aliases || [])].map(normalizePlace);
    return names.includes(normalizedCity);
  });
  // Exact ZIP match first, then ZIP prefix (first 3 digits) to tell apart
  // same-named cities in different states.
  return (
    byName.find((record) => (record.zipCodes || []).includes(normalizedZip)) ||
    byName.find((record) => (record.zipPrefixes || []).some((prefix) => normalizedZip.startsWith(prefix)))
  );
}

function addLink(link) {
  const anchor = document.createElement("a");
  anchor.href = link.href;
  if (!link.internal) {
    anchor.target = "_blank";
    anchor.rel = "noopener";
  }
  anchor.innerHTML = `<strong>${escapeHtml(link.label)}</strong><span>${escapeHtml(link.detail)}</span>`;
  resultLinks.append(anchor);
}

function correctionHref(record) {
  const corrections = CONFIG.corrections || {};
  const title = `Law correction: ${record ? `${record.city}, ${record.state}` : "local rules"}`;
  if (corrections.email) {
    return `mailto:${corrections.email}?subject=${encodeURIComponent(title)}`;
  }
  const base = corrections.issuesUrl || "https://github.com/doodster0x/ownchickens/issues/new";
  const body = "What is out of date or wrong?\n\nOfficial source link:\n\nDate you checked:\n";
  return `${base}?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
}

function renderRecord(record, city, zip) {
  resultsTitle.textContent = `${record.city}, ${record.state} chicken rules`;
  resultsHint.textContent = `Database match for ${city} ${zip}. Source checked ${record.sourceLastChecked}. ZIP codes can cross city limits, so confirm your address is inside ${record.city} before relying on this.`;
  resultLinks.innerHTML = "";

  const recordCard = document.createElement("article");
  recordCard.className = "law-record";
  recordCard.innerHTML = `
    <p class="source-date">Source checked ${escapeHtml(record.sourceLastChecked)}</p>
    <h4>${escapeHtml(record.summary)}</h4>
    <dl class="law-facts">
      <div><dt>Chicken limit</dt><dd>${escapeHtml(record.chickenLimit)}</dd></div>
      <div><dt>Roosters</dt><dd>${escapeHtml(record.roosterRule)}</dd></div>
      <div><dt>Permit or license</dt><dd>${escapeHtml(record.permitRequired)}</dd></div>
    </dl>
    <div class="law-detail-grid">
      <div>
        <strong>Before applying</strong>
        <ul>${record.prerequisites.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
      </div>
      <div>
        <strong>Key rules</strong>
        <ul>${record.rules.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
      </div>
    </div>
  `;
  resultLinks.append(recordCard);

  if (record.page) {
    const base = lawForm.dataset.root || "";
    addLink({
      label: `Full ${record.city} chicken rules page`,
      detail: "Summary, official sources, and checked date on one shareable page.",
      href: `${base}${record.page}`,
      internal: true,
    });
  }
  record.links.forEach(addLink);
  addLink({
    label: "Run a fresh official-source search too",
    detail: "Use this to catch newly updated PDFs, council changes, FAQs, and address-specific pages.",
    href: `https://www.google.com/search?q=${query(record.city, record.state, zip, "backyard chickens rooster coop setback permit site:.gov OR site:.us")}`,
  });
  addLink({
    label: "Spot something out of date? Report a correction",
    detail: "Send the official source link and we will re-check the listing.",
    href: correctionHref(record),
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
  const base = lawForm.dataset.root || "";
  try {
    const response = await fetch(`${base}data/local-laws.json`);
    if (!response.ok) {
      throw new Error("Local laws database unavailable");
    }
    localLawRecords = await response.json();
    resultsHint.textContent = `${localLawRecords.length} cities are in the database so far (try Madison 53703 or Green Bay 54301). Always verify your exact address before buying birds.`;
  } catch {
    localLawRecords = [];
    resultsHint.textContent = "The database could not load, but the form can still build official-source searches.";
  }
}

/* ---------- Mobile navigation ---------- */

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

/* ---------- Email signup ----------
 * Configure the provider in site-config.js (signup.actionUrl). Until then the
 * form never sends data anywhere and shows a "coming soon" message instead.
 */

function setupSignupForms() {
  const signup = CONFIG.signup || {};
  const live = Boolean(signup.actionUrl);

  document.querySelectorAll("form[data-signup]").forEach((form) => {
    const email = form.querySelector("[data-signup-email]");
    const status = form.querySelector("[data-signup-status]");
    const checklistHref = form.getAttribute("action") || "checklist.html";

    if (live) {
      form.action = signup.actionUrl;
      form.method = "post";
      if (signup.openInNewTab) {
        form.target = "_blank";
      }
      email.name = signup.emailFieldName || "email";
      if (signup.sourceFieldName && form.dataset.source) {
        const hidden = document.createElement("input");
        hidden.type = "hidden";
        hidden.name = signup.sourceFieldName;
        hidden.value = form.dataset.source;
        form.append(hidden);
      }
    }

    form.addEventListener("submit", (event) => {
      const value = email.value.trim();
      if (!value || !email.checkValidity()) {
        event.preventDefault();
        status.textContent = "Please enter a valid email address.";
        status.dataset.state = "error";
        email.focus();
        return;
      }
      if (!live) {
        event.preventDefault();
        status.dataset.state = "info";
        status.innerHTML = `Thanks! Our email list is coming soon, so nothing was sent and your address was not saved. In the meantime, <a href="${checklistHref}">open the printable starter checklist</a>.`;
        return;
      }
      status.dataset.state = "success";
      status.textContent = "Thanks! Check your inbox to confirm your subscription.";
    });
  });
}

/* ---------- Affiliate-ready Amazon links ----------
 * Links marked data-amazon-search="chicken feeder" are plain Amazon searches.
 * When affiliates.amazonTag is set in site-config.js the tag is appended and
 * the link is marked rel="sponsored".
 */

function setupAmazonLinks() {
  const tag = ((CONFIG.affiliates || {}).amazonTag || "").trim();
  document.querySelectorAll("a[data-amazon-search]").forEach((link) => {
    const url = new URL("https://www.amazon.com/s");
    url.searchParams.set("k", link.dataset.amazonSearch);
    if (tag) {
      url.searchParams.set("tag", tag);
      link.rel = "sponsored noopener";
    }
    link.href = url.toString();
  });
}

/* ---------- Privacy-friendly analytics (off until configured) ---------- */

function setupAnalytics() {
  const analytics = CONFIG.analytics || {};
  if (!analytics.provider || !analytics.scriptSrc) {
    return;
  }
  const script = document.createElement("script");
  script.src = analytics.scriptSrc;
  script.defer = true;
  if (analytics.provider === "plausible") {
    script.dataset.domain = analytics.domain;
  } else if (analytics.provider === "goatcounter") {
    script.async = true;
    script.dataset.goatcounter = analytics.goatcounterEndpoint;
  } else if (analytics.provider === "cloudflare") {
    script.dataset.cfBeacon = JSON.stringify({ token: analytics.cloudflareToken });
  }
  document.head.append(script);
}

/* ---------- Print buttons ---------- */

document.querySelectorAll("[data-print]").forEach((button) => {
  button.addEventListener("click", () => window.print());
});

function setupCorrectionLinks() {
  const email = ((CONFIG.corrections || {}).email || "").trim();
  if (!email) return;
  document.querySelectorAll("a[data-correction]").forEach((link) => {
    link.href = `mailto:${email}?subject=${encodeURIComponent(`Law correction: ${link.dataset.correction}`)}`;
    link.removeAttribute("target");
  });
}

setupSignupForms();
setupCorrectionLinks();
setupAmazonLinks();
setupAnalytics();
