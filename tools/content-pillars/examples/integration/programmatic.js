/**
 * Drop-in usage from any Node project after `npm install content-pillar-system`.
 * Core (validate + generateReference) has ZERO runtime deps. buildDeck needs pptxgenjs.
 */
const cps = require("content-pillar-system");

// You provide these objects however you like (LLM output, DB, form, files...).
const brand   = require("content-pillar-system/config/brand.json");
const pillars = require("content-pillar-system/config/pillars.json");
const posts   = [{
  pillar: "Drive Craving", collection: "Burger Recipes", title: "Anatomy of the Mala",
  hero: "Mala Burger ฿520", headline: "Built to make you sweat.", sub: "Szechuan glaze. Wagyu.",
  cta: "Order on Grab", hashtags: "#SalsaBurgers #TheMala", look: "dark",
  artDirection: "Exploded build on black, sauce as hero"
}];

// 1) validate whatever a strategy step produced
console.log(cps.validate(brand, pillars, posts));            // { ok, errors }

// 2) get an own-brand reference in memory (no files)
const { svg, brief } = cps.generateReference(posts[0], brand);
console.log("SVG bytes:", svg.length, "| brief bytes:", brief.length);

// 3) (optional) write references + build a deck
// cps.writeReferences(posts, brand, "output");
// cps.buildDeck({ brand, pillars, posts, refsDir: "output", outFile: "output/deck.pptx" });
