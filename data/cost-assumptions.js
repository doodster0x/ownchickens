/*
 * Cost calculator assumptions for cost-calculator.html.
 *
 * EVERY NUMBER HERE IS AN ESTIMATE: a typical range, check local prices.
 * Ranges are deliberately wide and conservative. They are not quotes and
 * are not tied to any store or product. Edit freely; the calculator reads
 * this file on load, and visitors can also edit values in the page table.
 *
 * Each item has [low, high] US dollar ranges for two tiers:
 *   budget  = used, salvaged, DIY, and basic gear
 *   premium = heavier-duty or higher-convenience gear
 * Most people land somewhere in between by getting creative (used gear,
 * DIY builds, mixing budget and premium pieces). That is not a third tier.
 *
 * per:   "flock" = once per flock, "bird" = multiplied by number of hens
 * when:  optional condition: "chicks", "pullets", or "freezing"
 * group: "setup" (one-time) or "yearly"
 */
window.COST_ASSUMPTIONS = {
  lastReviewed: "2026-10-18",
  label: "Estimates only: typical range, check local prices.",
  feedLbsPerBirdPerYear: 90,
  feedBagLbs: 50,
  items: [
    { id: "coopBase", group: "setup", per: "flock", label: "Coop and run, base cost", help: "Used or DIY for Budget; a heavier-duty build for Premium, before sizing up for more hens.", budget: [50, 150], premium: [400, 900] },
    { id: "coopPerBird", group: "setup", per: "bird", label: "Coop and run, added per hen", help: "Extra space and materials for each hen (about 4 sq ft coop and 10 sq ft run).", budget: [20, 50], premium: [60, 150] },
    { id: "predatorProofing", group: "setup", per: "flock", label: "Hardware cloth, apron, and better latches", help: "1/2-inch hardware cloth, screws with washers, two-step latches.", budget: [30, 80], premium: [80, 200] },
    { id: "feeder", group: "setup", per: "flock", label: "Feeder", help: "DIY bucket feeder up to a treadle feeder.", budget: [10, 25], premium: [40, 120] },
    { id: "waterer", group: "setup", per: "flock", label: "Waterer", help: "DIY bucket with nipples or cups up to a large-capacity waterer.", budget: [10, 25], premium: [40, 100] },
    { id: "heatedWater", group: "setup", per: "flock", when: "freezing", label: "Heated waterer or heated base", help: "Only if your area freezes. Buy a listed product made for poultry.", budget: [30, 50], premium: [60, 110] },
    { id: "autoDoor", group: "setup", per: "flock", label: "Automatic coop door", help: "Budget tier assumes you open and close the door by hand.", budget: [0, 0], premium: [150, 300] },
    { id: "feedBin", group: "setup", per: "flock", label: "Sealed feed storage bin", help: "Metal trash can or heavy bin with a tight lid.", budget: [10, 25], premium: [40, 80] },
    { id: "firstAid", group: "setup", per: "flock", label: "First aid and small tools", help: "Gloves, wound spray for poultry, crate for isolation, headlamp.", budget: [15, 30], premium: [40, 80] },
    { id: "brooder", group: "setup", per: "flock", when: "chicks", label: "Brooder setup (chicks only)", help: "Tote or stock tank, heat plate or secured lamp, chick feeder and waterer.", budget: [30, 60], premium: [100, 200] },
    { id: "chicks", group: "setup", per: "bird", when: "chicks", label: "Day-old chicks, each", help: "Feed store or hatchery. Mail order may add shipping or minimum orders.", budget: [3, 8], premium: [4, 10] },
    { id: "pullets", group: "setup", per: "bird", when: "pullets", label: "Started pullets, each", help: "Local breeder or farm; varies a lot by age and breed.", budget: [15, 35], premium: [20, 50] },
    { id: "feedBag", group: "yearly", per: "bag", label: "Layer feed, per 50 lb bag", help: "Conventional feed for Budget; organic or specialty for Premium.", budget: [15, 25], premium: [35, 55] },
    { id: "bedding", group: "yearly", per: "bird", label: "Bedding, per hen per year", help: "Pine shavings or straw. Free leaves can lower the budget tier.", budget: [5, 15], premium: [15, 30] },
    { id: "gritShell", group: "yearly", per: "flock", label: "Grit and oyster shell, per year", help: "Small bags last a small flock a long time.", budget: [10, 25], premium: [20, 40] },
    { id: "winterPower", group: "yearly", per: "flock", when: "freezing", label: "Electricity for heated water, per year", help: "Depends on your rates, the device, and how long it runs.", budget: [10, 50], premium: [10, 50] },
    { id: "healthMisc", group: "yearly", per: "flock", label: "Health and replacement supplies, per year", help: "Mite treatment, nest pads, replacement parts. Vet visits are extra.", budget: [10, 30], premium: [40, 100] },
  ],
};
