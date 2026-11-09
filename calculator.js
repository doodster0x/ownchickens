/* Cheap-setup cost calculator. Assumptions live in data/cost-assumptions.js. */
(function () {
  const data = window.COST_ASSUMPTIONS;
  const form = document.querySelector("#costForm");
  const results = document.querySelector("#costResults");
  const tableBody = document.querySelector("#assumptionRows");
  const resetButton = document.querySelector("#resetAssumptions");
  if (!data || !form || !results || !tableBody) {
    return;
  }

  const TIERS = [
    { key: "budget", name: "Budget", blurb: "Used, salvaged, and DIY. More of your time, less cash." },
    { key: "premium", name: "Premium", blurb: "Heavier-duty gear and more automation." },
  ];
  const defaults = JSON.parse(JSON.stringify(data.items));
  let items = JSON.parse(JSON.stringify(data.items));

  const money = (n) => `$${(Math.round(n / 10) * 10).toLocaleString("en-US")}`;
  const moneyWhole = (n) => `$${Math.round(n).toLocaleString("en-US")}`;
  const range = (pair) => (pair[0] === pair[1] ? money(pair[0]) : `${money(pair[0])} to ${money(pair[1])}`);
  const about = (pair) => money((pair[0] + pair[1]) / 2);
  // Monthly is the recurring midpoint ("each year after") / 12, rounded to whole dollars.
  const perMonth = (pair) => moneyWhole((pair[0] + pair[1]) / 2 / 12);

  function settings() {
    const birds = Math.max(1, Math.min(30, parseInt(form.birds.value, 10) || 1));
    return {
      birds,
      start: form.start.value,
      freezing: form.freezing.value === "yes",
      permit: Math.max(0, parseFloat(form.permit.value) || 0),
    };
  }

  function applies(item, s) {
    if (!item.when) return true;
    if (item.when === "freezing") return s.freezing;
    return item.when === s.start;
  }

  function multiplier(item, s) {
    if (item.per === "bird") return s.birds;
    if (item.per === "bag") return (s.birds * data.feedLbsPerBirdPerYear) / data.feedBagLbs;
    return 1;
  }

  function totals(tier, s) {
    const out = { setup: [0, 0], yearly: [0, 0] };
    items.forEach((item) => {
      if (!applies(item, s)) return;
      const m = multiplier(item, s);
      out[item.group][0] += item[tier][0] * m;
      out[item.group][1] += item[tier][1] * m;
    });
    out.setup[0] += s.permit;
    out.setup[1] += s.permit;
    out.yearly[0] += s.permit;
    out.yearly[1] += s.permit;
    out.firstYear = [out.setup[0] + out.yearly[0] - s.permit, out.setup[1] + out.yearly[1] - s.permit];
    return out;
  }

  function render() {
    const s = settings();
    const bags = ((s.birds * data.feedLbsPerBirdPerYear) / data.feedBagLbs).toFixed(1);
    const byTier = {};
    results.innerHTML = TIERS.map((tier) => {
      const t = totals(tier.key, s);
      byTier[tier.key] = t;
      return `<article class="tier-result tier-${tier.key}">
        <h3>${tier.name}</h3>
        <p>${tier.blurb}</p>
        <span class="big">${range(t.firstYear)}</span>
        <p><strong>First year</strong>, including setup and about a year of feed and supplies.</p>
        <p style="margin-top:10px">Setup: ${range(t.setup)}<br />Each year after: ${range(t.yearly)} (about ${perMonth(t.yearly)}/mo)</p>
      </article>`;
    }).join("");
    const liveBudget = document.querySelector("#liveBudget");
    const livePremium = document.querySelector("#livePremium");
    const liveBudgetYear = document.querySelector("#liveBudgetYear");
    const livePremiumYear = document.querySelector("#livePremiumYear");
    const liveBudgetMonth = document.querySelector("#liveBudgetMonth");
    const livePremiumMonth = document.querySelector("#livePremiumMonth");
    if (liveBudget && byTier.budget) liveBudget.textContent = about(byTier.budget.firstYear);
    if (livePremium && byTier.premium) livePremium.textContent = about(byTier.premium.firstYear);
    if (liveBudgetYear && byTier.budget) liveBudgetYear.textContent = about(byTier.budget.yearly);
    if (livePremiumYear && byTier.premium) livePremiumYear.textContent = about(byTier.premium.yearly);
    if (liveBudgetMonth && byTier.budget) liveBudgetMonth.textContent = perMonth(byTier.budget.yearly);
    if (livePremiumMonth && byTier.premium) livePremiumMonth.textContent = perMonth(byTier.premium.yearly);
    const note = document.querySelector("#costNote");
    if (note) {
      note.textContent = `${s.birds} hen${s.birds === 1 ? "" : "s"}, starting with ${s.start}, ${s.freezing ? "freezing winters" : "no hard freezes"}. Feed assumes about ${data.feedLbsPerBirdPerYear} lb per hen per year (about ${bags} bags of ${data.feedBagLbs} lb). ${data.label}`;
    }
  }

  function buildTable() {
    tableBody.innerHTML = "";
    items.forEach((item, index) => {
      const row = document.createElement("tr");
      const cells = TIERS.map((tier) =>
        [0, 1]
          .map(
            (i) =>
              `<input type="number" min="0" step="1" inputmode="decimal" value="${item[tier.key][i]}" data-index="${index}" data-tier="${tier.key}" data-i="${i}" aria-label="${item.label}, ${tier.name} ${i === 0 ? "low" : "high"}" />`,
          )
          .join(" to "),
      );
      const when = item.when ? ` <em>(${item.when === "freezing" ? "freezing winters only" : `${item.when} only`})</em>` : "";
      row.innerHTML = `<th scope="row">${item.label}${when}<br /><small>${item.help}</small></th>${cells.map((c) => `<td>${c}</td>`).join("")}`;
      tableBody.append(row);
    });
  }

  tableBody.addEventListener("input", (event) => {
    const input = event.target;
    if (!(input instanceof HTMLInputElement)) return;
    const value = Math.max(0, parseFloat(input.value) || 0);
    items[input.dataset.index][input.dataset.tier][input.dataset.i] = value;
    render();
  });

  if (resetButton) {
    resetButton.addEventListener("click", () => {
      items = JSON.parse(JSON.stringify(defaults));
      buildTable();
      render();
    });
  }

  form.addEventListener("input", render);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    render();
  });

  buildTable();
  render();
})();
