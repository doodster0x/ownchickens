/* "Best breed for your climate" quiz. Breed data: data/breeds.js */
(function () {
  const breeds = window.OWN_CHICKENS_BREEDS;
  const form = document.querySelector("#breedQuiz");
  const out = document.querySelector("#quizResults");
  const hint = document.querySelector("#quizHint");
  if (!breeds || !form || !out) return;

  const LAYING = { Excellent: 4, "Very good": 3, Good: 2, Fair: 1 };
  const BROODY_PENALTY = { Rarely: 0, Sometimes: 1, Often: 3, "Very often": 5 };

  function score(b, a) {
    let s = 0;
    const why = [];
    const coldW = { cold: 3, some: 1.5, mild: 0.3 }[a.winter];
    const heatW = { hot: 3, warm: 1.2, mild: 0.3 }[a.summer];
    s += b.cold * coldW + b.heat * heatW;
    if (a.winter === "cold" && b.cold === 3) why.push("handles cold winters well");
    if (a.winter === "cold" && b.cold === 1) s -= 6;
    if (a.summer === "hot" && b.heat === 3) why.push("handles heat well");
    if (a.summer === "hot" && b.heat === 1) s -= 6;

    const kidsW = { very: 3, some: 1.2, no: 0 }[a.kids];
    s += b.kids * kidsW;
    if (a.kids === "very" && b.kids === 3) why.push("gentle and easy to handle");
    if (a.kids === "very" && b.kids === 1) s -= 4;

    const layW = { eggs: 3, balance: 1.5, pet: 0.5 }[a.priority];
    s += LAYING[b.laying] * layW;
    if (a.priority === "eggs" && LAYING[b.laying] >= 3) why.push(`${b.laying.toLowerCase()} layer`);
    if (a.priority === "pet") {
      s += b.kids * 2;
      if (b.kids === 3 && !why.includes("gentle and easy to handle")) why.push("friendly, pet-like temperament");
    }

    const egg = b.egg.toLowerCase();
    const colorful = /blue|green|dark/.test(egg);
    if (a.color === "color" && colorful) {
      s += 4;
      why.push(`${b.egg.toLowerCase()} eggs`);
    }
    if (a.color === "brown" && egg.includes("brown") && !egg.includes("dark")) s += 2;
    if (a.color === "white" && egg.includes("white")) {
      s += 4;
      why.push("white eggs");
    }

    if (a.broody === "avoid") {
      s -= BROODY_PENALTY[b.broody] || 0;
      if (b.broody === "Rarely") why.push("rarely goes broody");
    }
    return { b, s, why };
  }

  function caution(b, a) {
    const notes = [];
    if (b.cold === 1 && a.winter !== "mild") notes.push("Watch for comb frostbite in hard cold.");
    if (b.heat === 1 && a.summer !== "mild") notes.push("Needs good shade and airflow in heat.");
    if (b.size === "Large") notes.push("Larger bird: give extra coop space.");
    if (b.size === "Bantam") notes.push("Small bantam: may get bullied by big hens.");
    return notes.join(" ");
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const a = Object.fromEntries(data.entries());
    const ranked = breeds.map((b) => score(b, a)).sort((x, y) => y.s - x.s).slice(0, 5);
    hint.textContent = "Top matches for your answers. A mixed flock of two or three of these works well.";
    out.innerHTML = ranked
      .map(({ b, why }, i) => {
        const reasons = why.length ? `Why it fits: ${why.join(", ")}.` : "A solid, well-rounded fit for your answers.";
        const note = caution(b, a);
        return `<article class="quiz-result">
          <h3>${i + 1}. ${b.name}</h3>
          <p>${reasons}</p>
          <p><small>${b.egg} eggs &middot; ${b.laying} layer &middot; ${b.temper}${note ? ` &middot; ${note}` : ""}</small></p>
        </article>`;
      })
      .join("");
    out.querySelector("h3")?.setAttribute("tabindex", "-1");
    out.querySelector("h3")?.focus();
  });
})();
