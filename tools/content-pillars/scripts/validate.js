#!/usr/bin/env node
/**
 * validate — check a generated strategy (brand + pillars + posts).
 * Library:  const { validate } = require('content-pillar-system'); validate(brand, pillars, posts) -> { ok, errors }
 * CLI:      node scripts/validate.js <brand.json> <pillars.json> <posts.json>
 */
const fs = require("fs");
const hex = (s) => typeof s === "string" && /^[0-9A-Fa-f]{6}$/.test(s);

function validate(brand, pillars, posts) {
  const errs = [];
  const need = (obj, keys, where) => keys.forEach(k => { if (obj == null || obj[k] === undefined || obj[k] === "") errs.push(`${where}: missing "${k}"`); });

  if (!brand) errs.push("brand: not provided / invalid JSON");
  else {
    need(brand, ["name", "tagline", "handle", "colors", "fonts", "post_size"], "brand");
    if (brand.colors) ["ink", "bg_dark", "cream", "red", "muted"].forEach(k => { if (!hex(brand.colors[k])) errs.push(`brand.colors.${k}: must be 6-char hex without #`); });
    if (brand.fonts) need(brand.fonts, ["display", "body", "safe_display", "safe_body"], "brand.fonts");
  }

  if (!Array.isArray(pillars) || pillars.length < 1) errs.push("pillars: expected a non-empty array");
  else pillars.forEach((p, i) => {
    need(p, ["id", "name", "format", "objective", "definition", "collections"], `pillars[${i}]`);
    if (!Array.isArray(p.collections) || p.collections.length !== 4) errs.push(`pillars[${i}] (${p.name || "?"}): needs exactly 4 collections`);
    else p.collections.forEach((c, j) => need(c, ["name", "desc"], `pillars[${i}].collections[${j}]`));
  });

  if (!Array.isArray(posts) || posts.length < 1) errs.push("posts: expected a non-empty array");
  else posts.forEach((pt, i) => {
    need(pt, ["pillar", "collection", "title", "headline"], `posts[${i}]`);
    if (pt.look && !["dark", "red", "white"].includes(pt.look)) errs.push(`posts[${i}] (${pt.title || "?"}): look must be dark|red|white`);
  });

  if (Array.isArray(pillars) && Array.isArray(posts)) {
    const covered = new Set(posts.map(pt => ((pt.pillar || "") + "|" + (pt.collection || "")).toLowerCase()));
    pillars.forEach(p => (p.collections || []).forEach(c => {
      const k = (p.name + "|" + c.name).toLowerCase();
      if (!covered.has(k)) errs.push(`coverage: no post for collection "${p.name} \u00b7 ${c.name}"`);
    }));
  }
  return { ok: errs.length === 0, errors: errs };
}

module.exports = { validate };

if (require.main === module) {
  const [bF, plF, poF] = process.argv.slice(2);
  if (!bF || !plF || !poF) { console.error("Usage: validate.js <brand.json> <pillars.json> <posts.json>"); process.exit(2); }
  const load = f => { try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch (e) { console.error(`${f}: invalid JSON \u2014 ${e.message}`); return null; } };
  const { ok, errors } = validate(load(bF), load(plF), load(poF));
  if (!ok) { console.error("\u2717 " + errors.length + " issue(s):\n - " + errors.join("\n - ")); process.exit(1); }
  console.log("\u2713 Valid. All required fields present and every collection has a post.");
}
