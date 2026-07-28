#!/usr/bin/env node
/**
 * post_reference.js — generate an OWN-BRAND visual reference for a new post.
 * Outputs, per post: a vector mockup (SVG, on-brand frame with a marked PHOTO ZONE)
 * and a visual brief (Markdown art-direction sheet). No competitor images needed.
 *
 * Usage:
 *   node post_reference.js --brand config/brand.json --post examples/post.example.json --out output/
 *   node post_reference.js --brand config/brand.json --posts examples/posts.example.json --out output/   (batch)
 *
 * Post spec fields (all optional except title):
 *   pillar, collection, title, hero, headline, sub, concept,
 *   shotFlow[], caption, cta, hashtags, artDirection,
 *   look: "dark" | "red" | "white"  (default "dark")
 */
const fs = require("fs");
const path = require("path");

function arg(flag, def) { const i = process.argv.indexOf(flag); return i > -1 ? process.argv[i + 1] : def; }
function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
function slug(s) { return String(s || "post").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40); }

// simple width-aware word wrap (approx chars-per-line for the display font at a given size)
function wrap(text, maxChars) {
  const words = String(text || "").split(/\s+/);
  const lines = []; let line = "";
  for (const w of words) {
    if ((line + " " + w).trim().length > maxChars) { if (line) lines.push(line); line = w; }
    else line = (line + " " + w).trim();
  }
  if (line) lines.push(line);
  return lines;
}

function palette(brand, look) {
  const c = brand.colors;
  if (look === "red")   return { bg: c.red,     head: c.cream, accent: c.white, sub: c.cream, zone: c.white, zoneText: c.white, chipBg: c.white, chipInk: c.red };
  if (look === "white") return { bg: c.white,   head: c.ink,   accent: c.red,   sub: c.muted, zone: c.ink,   zoneText: c.muted, chipBg: c.red,   chipInk: c.white };
  return                       { bg: c.bg_dark, head: c.cream, accent: c.red,   sub: c.muted, zone: c.cream, zoneText: c.cream, chipBg: c.red,   chipInk: c.white };
}

function svgMockup(post, brand) {
  const W = brand.post_size.w, H = brand.post_size.h;
  const look = post.look || "dark";
  const p = palette(brand, look);
  const disp = brand.fonts.display + ", " + brand.fonts.safe_display + ", sans-serif";
  const body = brand.fonts.body + ", " + brand.fonts.safe_body + ", sans-serif";
  const M = 70;
  const headLines = wrap((post.headline || post.title || "").toUpperCase(), 15);
  const headSize = headLines.length > 2 ? 96 : 116;
  const headBlockTop = 190;
  const headY = headBlockTop;
  const zoneTop = headBlockTop + headLines.length * (headSize * 0.92) + 40;
  const zoneH = H - zoneTop - 300;
  const shot = post.hero ? (post.hero + (post.artDirection ? " · " + post.artDirection : "")) : (post.artDirection || "Hero shot");
  const shotLines = wrap("PHOTO: " + shot, 34).slice(0, 4);

  let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="${body}">
  <rect width="${W}" height="${H}" fill="#${p.bg}"/>
  <!-- top row: logo + pillar/collection tag -->
  <text x="${M}" y="120" font-family="${disp}" font-size="46" fill="#${p.accent}" font-weight="700">${esc(brand.name.toUpperCase())}</text>
  <text x="${W - M}" y="118" text-anchor="end" font-size="24" letter-spacing="2" fill="#${p.sub}" font-weight="700">${esc(((post.pillar || "") + (post.collection ? "  ·  " + post.collection : "")).toUpperCase())}</text>
`;
  // headline
  headLines.forEach((ln, i) => {
    s += `  <text x="${M}" y="${headY + i * headSize * 0.92}" font-family="${disp}" font-size="${headSize}" fill="#${p.head}" font-weight="700">${esc(ln)}</text>\n`;
  });
  // sub
  if (post.sub) s += `  <text x="${M}" y="${zoneTop - 24}" font-size="34" fill="#${p.sub}" font-style="italic">${esc(post.sub)}</text>\n`;
  // PHOTO ZONE (the reference frame)
  s += `  <rect x="${M}" y="${zoneTop}" width="${W - 2 * M}" height="${zoneH}" rx="18" fill="none" stroke="#${p.zone}" stroke-width="3" stroke-dasharray="14 10" opacity="0.8"/>
  <text x="${W / 2}" y="${zoneTop + zoneH / 2 - (shotLines.length * 20)}" text-anchor="middle" font-family="${disp}" font-size="40" fill="#${p.accent}" font-weight="700" opacity="0.9">PHOTO ZONE</text>
`;
  shotLines.forEach((ln, i) => {
    s += `  <text x="${W / 2}" y="${zoneTop + zoneH / 2 + 20 + i * 34}" text-anchor="middle" font-size="26" fill="#${p.zoneText}" opacity="0.85">${esc(ln)}</text>\n`;
  });
  // CTA chip + caption/handle
  const cta = (post.cta || "ORDER NOW").toUpperCase();
  const chipW = Math.min(W - 2 * M, 90 + cta.length * 20);
  s += `  <rect x="${M}" y="${H - 230}" width="${chipW}" height="70" rx="35" fill="#${p.chipBg}"/>
  <text x="${M + chipW / 2}" y="${H - 185}" text-anchor="middle" font-family="${disp}" font-size="34" fill="#${p.chipInk}" font-weight="700">${esc(cta)}</text>
  <text x="${M}" y="${H - 110}" font-size="26" fill="#${p.sub}">${esc((post.hashtags || "").slice(0, 60))}</text>
  <text x="${M}" y="${H - 60}" font-family="${disp}" font-size="30" fill="#${p.accent}" font-weight="700">${esc(brand.tagline)}</text>
  <text x="${W - M}" y="${H - 60}" text-anchor="end" font-size="24" fill="#${p.sub}">${esc(brand.handle)}</text>
</svg>`;
  return s;
}

function brief(post, brand) {
  const L = [];
  L.push(`# ${post.title || "Untitled post"}`);
  L.push(`**Pillar:** ${post.pillar || "—"}  ·  **Collection:** ${post.collection || "—"}  ·  **Look:** ${post.look || "dark"}`);
  if (post.hero) L.push(`**Hero:** ${post.hero}`);
  L.push("");
  L.push(`## Headline / Sub`);
  L.push(`**${(post.headline || post.title || "").toUpperCase()}**`);
  if (post.sub) L.push(`*${post.sub}*`);
  L.push("");
  if (post.concept) { L.push(`## Concept`); L.push(post.concept); L.push(""); }
  if (post.shotFlow && post.shotFlow.length) {
    L.push(`## Shot flow`);
    post.shotFlow.forEach((f, i) => L.push(`${i + 1}. ${f}`));
    L.push("");
  }
  if (post.caption) { L.push(`## Caption`); L.push(post.caption); L.push(""); }
  L.push(`## CTA · Hashtags`);
  L.push(`${post.cta || "Order now"}${brand.menu && brand.menu.promo ? ` · ${brand.menu.promo.first_order} first order (${brand.menu.promo.code})` : ""}`);
  if (post.hashtags) L.push(post.hashtags);
  L.push("");
  L.push(`## Art direction`);
  L.push(post.artDirection || `On-brand ${post.look || "dark"} look. Sauce is the brightest object. Brand red #${brand.colors.red}. Display font ${brand.fonts.display}. Logo + tagline lockup as in the mockup.`);
  L.push("");
  L.push(`> Ownable check: no real public figures' likenesses, no copyrighted works/marks. Inspired-by, not exact.`);
  return L.join("\n");
}

function generate(post, brand, outDir) {
  const base = slug(post.title || post.collection);
  const svg = svgMockup(post, brand);
  const md = brief(post, brand);
  fs.writeFileSync(path.join(outDir, base + ".mockup.svg"), svg);
  fs.writeFileSync(path.join(outDir, base + ".brief.md"), md);
  return base;
}

function main() {
  const brand = JSON.parse(fs.readFileSync(arg("--brand", "config/brand.json"), "utf8"));
  const outDir = arg("--out", "output"); fs.mkdirSync(outDir, { recursive: true });
  const single = arg("--post", null), batch = arg("--posts", null);
  const posts = batch ? JSON.parse(fs.readFileSync(batch, "utf8"))
              : single ? [JSON.parse(fs.readFileSync(single, "utf8"))]
              : null;
  if (!posts) { console.error("Provide --post <file.json> or --posts <array.json>"); process.exit(1); }
  const made = posts.map(pt => generate(pt, brand, outDir));
  console.log(`Generated ${made.length} reference(s): ${made.map(b => b + ".{mockup.svg,brief.md}").join(", ")}`);
}
if (require.main === module) main();
module.exports = { svgMockup, brief, generate };
