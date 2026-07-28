/**
 * content-pillar-system — public API (MIT).
 * Open, embeddable engine for a brand content operation. Use it as a library:
 *
 *   const cps = require("content-pillar-system");
 *   const { ok, errors } = cps.validate(brand, pillars, posts);
 *   const { svg, brief } = cps.generateReference(post, brand);   // in-memory, no files
 *   await cps.writeReferences(posts, brand, "output");           // writes .mockup.svg + .brief.md
 *   await cps.buildDeck({ brand, pillars, posts, refsDir: "output", outFile: "output/deck.pptx" });
 *
 * Or as a CLI (see package.json "bin"): cps-validate, cps-reference, cps-deck.
 * Or as an AI-agent skill (see SKILL.md + prompts/strategist.md).
 *
 * Inputs are plain objects matching the schemas in prompts/strategist.md, so any upstream
 * system (LLM agent, form, CMS) can feed it. No global state; safe to embed.
 */
const { svgMockup, brief, generate } = require("./scripts/post_reference");
const { buildDeck } = require("./scripts/build_deck");
const { validate } = require("./scripts/validate");

/** Pure, file-free: returns { svg, brief } strings for one post. */
function generateReference(post, brand) {
  return { svg: svgMockup(post, brand), brief: brief(post, brand) };
}

/** Writes <slug>.mockup.svg + <slug>.brief.md for each post; returns the slugs. */
function writeReferences(posts, brand, outDir = "output") {
  const fs = require("fs"); fs.mkdirSync(outDir, { recursive: true });
  return posts.map(pt => generate(pt, brand, outDir));
}

module.exports = {
  validate,          // (brand, pillars, posts) -> { ok, errors }
  generateReference, // (post, brand) -> { svg, brief }
  writeReferences,   // (posts, brand, outDir) -> [slug]
  buildDeck,         // ({ brand, pillars, posts, refsDir, outFile }) -> Promise<outFile>
  svgMockup, brief,  // low-level building blocks
};
