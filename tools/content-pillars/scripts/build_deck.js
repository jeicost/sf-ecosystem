#!/usr/bin/env node
/**
 * build_deck — assemble the content-system PPTX from a strategy.
 * Library:  const { buildDeck } = require('content-pillar-system');
 *           await buildDeck({ brand, pillars, posts, refsDir: 'output', outFile: 'output/deck.pptx' });
 * CLI:      node scripts/build_deck.js --brand config/brand.json --pillars config/pillars.json \
 *                  --posts posts.json --refs output/ --out output/deck.pptx
 * Uses each post's OWN generated mockup (refsDir/<slug>.mockup.png) as its reference — no competitor images.
 */
const fs = require("fs"), path = require("path");
const pptxgen = require("pptxgenjs");
const slug = s => String(s || "post").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);

function buildDeck({ brand, pillars, posts, refsDir = "output", outFile = "output/deck.pptx" }) {
  const C = brand.colors;
  const BG = "FFFFFF", INK = C.ink, RED = C.red, CARD = "F5F5F5", BORDER = "E4E4E4", MUTED = "666666", MUTED2 = C.muted;
  const F = (brand.fonts && brand.fonts.safe_body) || "Arial";
  const p = new pptxgen(); p.layout = "LAYOUT_WIDE"; p.title = `${brand.name} — Content System`;
  const sh = () => ({ type: "outer", color: "000000", blur: 6, offset: 2, angle: 90, opacity: 0.16 });
  const footer = (s, right) => {
    s.addShape(p.shapes.LINE, { x: 0.55, y: 7.08, w: 12.2, h: 0, line: { color: BORDER, width: 1 } });
    s.addText([{ text: brand.name.toUpperCase(), options: { bold: true, color: RED } }, { text: `   \u00b7   ${brand.tagline}   \u00b7   ${brand.location || ""}`, options: { color: MUTED2 } }],
      { x: 0.55, y: 7.14, w: 9, h: 0.26, fontFace: F, fontSize: 8, valign: "middle", margin: 0, charSpacing: 1 });
    s.addText(right, { x: 9.6, y: 7.14, w: 3.15, h: 0.26, align: "right", valign: "middle", margin: 0, fontFace: F, fontSize: 8, bold: true, color: MUTED2, charSpacing: 1 });
  };
  const chip = (s, x, y, w, txt, filled) => {
    s.addShape(p.shapes.ROUNDED_RECTANGLE, { x, y, w, h: 0.32, fill: { color: filled ? RED : CARD }, line: { color: filled ? RED : BORDER, width: 1 }, rectRadius: 0.16 });
    s.addText(txt, { x, y, w, h: 0.32, align: "center", valign: "middle", margin: 0, fontFace: F, fontSize: 8.5, bold: true, color: filled ? "FFFFFF" : INK, charSpacing: 0.5 });
  };

  // cover
  (() => {
    const s = p.addSlide(); s.background = { color: BG };
    s.addText("CONTENT SYSTEM", { x: 0.7, y: 1.2, w: 9, h: 0.4, fontFace: F, fontSize: 12, bold: true, color: RED, charSpacing: 3, margin: 0 });
    s.addText(brand.name.toUpperCase(), { x: 0.66, y: 1.7, w: 12, h: 1.1, fontFace: F, fontSize: 52, bold: true, color: INK, margin: 0 });
    s.addText(`${pillars.length} content pillars \u00b7 their collections \u00b7 one worked post per collection \u00b7 own-brand references.`,
      { x: 0.7, y: 3.0, w: 11, h: 0.6, fontFace: F, fontSize: 15, color: MUTED, margin: 0 });
    s.addText(brand.tagline, { x: 0.7, y: 5.6, w: 11, h: 0.5, fontFace: F, fontSize: 18, bold: true, italic: true, color: RED, margin: 0 });
    footer(s, "START HERE");
  })();

  // pillars
  pillars.forEach(d => {
    const s = p.addSlide(); s.background = { color: BG };
    s.addText(`CONTENT PILLAR ${String(d.id).padStart(2, "0")}`, { x: 0.55, y: 0.4, w: 9, h: 0.28, fontFace: F, fontSize: 12, bold: true, color: RED, charSpacing: 3, margin: 0 });
    s.addText(d.name.toUpperCase(), { x: 0.52, y: 0.7, w: 11.8, h: 0.75, fontFace: F, fontSize: d.name.length > 20 ? 32 : 40, bold: true, color: INK, margin: 0 });
    chip(s, 0.55, 1.55, 3.0, (d.format || "").toUpperCase()); chip(s, 3.65, 1.55, 2.6, (d.objective || "").toUpperCase(), true);
    s.addText("WHAT IT IS", { x: 0.55, y: 2.15, w: 5.9, h: 0.24, fontFace: F, fontSize: 11, bold: true, color: RED, charSpacing: 2, margin: 0 });
    s.addText(d.definition, { x: 0.55, y: 2.42, w: 5.95, h: 2.0, fontFace: F, fontSize: 12, color: INK, lineSpacingMultiple: 1.18, margin: 0, valign: "top" });
    s.addText("COLLECTIONS", { x: 6.85, y: 2.15, w: 6, h: 0.24, fontFace: F, fontSize: 11, bold: true, color: RED, charSpacing: 2, margin: 0 });
    const runs = []; (d.collections || []).forEach(c => { runs.push({ text: c.name + "  ", options: { bold: true, color: INK } }); runs.push({ text: "\u00b7 " + c.desc, options: { color: MUTED, breakLine: true } }); });
    s.addText(runs, { x: 6.85, y: 2.42, w: 5.9, h: 2.2, fontFace: F, fontSize: 11, paraSpaceAfter: 10, margin: 0, valign: "top" });
    footer(s, `CONTENT PILLARS \u00b7 ${String(d.id).padStart(2, "0")} / ${String(pillars.length).padStart(2, "0")}`);
  });

  // posts
  posts.forEach(d => {
    const s = p.addSlide(); s.background = { color: BG };
    s.addText(`POST \u00b7 ${(d.pillar || "").toUpperCase()}${d.collection ? "  \u00b7  " + d.collection.toUpperCase() : ""}`, { x: 0.55, y: 0.4, w: 12.1, h: 0.26, fontFace: F, fontSize: 10.5, bold: true, color: RED, charSpacing: 1.2, margin: 0 });
    s.addText((d.title || "").toUpperCase(), { x: 0.52, y: 0.68, w: 12, h: 0.7, fontFace: F, fontSize: (d.title || "").length > 26 ? 30 : 36, bold: true, color: INK, margin: 0 });
    if (d.hero) s.addText(d.hero, { x: 0.55, y: 1.42, w: 12, h: 0.28, fontFace: F, fontSize: 12, bold: true, color: INK, margin: 0 });
    chip(s, 0.55, 1.85, 2.2, (d.look || "dark").toUpperCase() + " LOOK"); if (d.cta) chip(s, 2.9, 1.85, 2.6, "CTA \u00b7 " + d.cta.toUpperCase(), true);
    const LX = 0.55, LW = 6.9; let y = 2.45;
    const block = (label, body, h, fsz) => { s.addText(label, { x: LX, y, w: LW, h: 0.2, fontFace: F, fontSize: 9.5, bold: true, color: RED, charSpacing: 1.2, margin: 0 }); y += 0.2; s.addText(body, { x: LX, y, w: LW, h, fontFace: F, fontSize: fsz || 10, color: INK, lineSpacingMultiple: 1.05, margin: 0, valign: "top", paraSpaceAfter: 2 }); y += h + 0.08; };
    block("HEADLINE / SUB", [{ text: (d.headline || d.title || "").toUpperCase(), options: { bold: true, breakLine: true } }, { text: d.sub || "", options: { italic: true, color: MUTED } }], 0.5, 11);
    if (d.concept) block("CONCEPT", d.concept, 0.9, 9.8);
    if (d.shotFlow && d.shotFlow.length) block("SHOT FLOW", d.shotFlow.map((f, i) => ({ text: f, options: { breakLine: i < d.shotFlow.length - 1, color: "3A3A3A" } })), 1.1, 9);
    if (d.caption) block("CAPTION", d.caption, 0.55, 9.8);
    block("CTA \u00b7 HASHTAGS", [{ text: (d.cta || "Order now"), options: { breakLine: true } }, { text: d.hashtags || "", options: { color: MUTED } }], 0.45, 9);
    s.addText("OWN REFERENCE (mockup)", { x: 7.75, y: 2.45, w: 5, h: 0.22, fontFace: F, fontSize: 11, bold: true, color: RED, charSpacing: 1.2, margin: 0 });
    const png = path.join(refsDir, slug(d.title || d.collection) + ".mockup.png");
    const rx = 8.7, ry = 2.8, rw = 3.1, rh = 3.87;
    s.addShape(p.shapes.RECTANGLE, { x: rx - 0.03, y: ry - 0.03, w: rw + 0.06, h: rh + 0.06, fill: { color: "111111" }, line: { color: BORDER, width: 1 }, shadow: sh() });
    if (fs.existsSync(png)) s.addImage({ path: png, x: rx, y: ry, w: rw, h: rh, sizing: { type: "contain", w: rw, h: rh } });
    else s.addText("Run post_reference.js + render_svg.py\nto generate this mockup", { x: rx, y: ry + rh / 2 - 0.3, w: rw, h: 0.6, align: "center", fontFace: F, fontSize: 10, color: MUTED2, margin: 0 });
    if (d.artDirection) s.addText([{ text: "ART DIRECTION  ", options: { bold: true, color: RED } }, { text: d.artDirection, options: { color: MUTED } }], { x: 7.75, y: 6.75, w: 5.0, h: 0.4, fontFace: F, fontSize: 8.5, margin: 0, valign: "top" });
    footer(s, `POST \u00b7 ${(d.collection || "").toUpperCase().slice(0, 20)}`);
  });

  // weekly template
  (() => {
    const s = p.addSlide(); s.background = { color: BG };
    s.addText("WEEKLY CONTENT MENU \u00b7 TEMPLATE", { x: 0.55, y: 0.38, w: 11, h: 0.28, fontFace: F, fontSize: 12, bold: true, color: RED, charSpacing: 2.5, margin: 0 });
    s.addText("ONE PROPOSAL PER COLLECTION", { x: 0.52, y: 0.68, w: 11.5, h: 0.7, fontFace: F, fontSize: 32, bold: true, color: INK, margin: 0 });
    s.addText([{ text: "MK Lead: mark each ", options: { color: MUTED } }, { text: "Approve / Tweak / Pass", options: { bold: true, color: RED } }, { text: " and drop a note. We build the greens.", options: { color: MUTED } }], { x: 0.55, y: 1.42, w: 12, h: 0.3, fontFace: F, fontSize: 11, margin: 0 });
    const rows = ((pillars[0] && pillars[0].collections) || []).slice(0, 4);
    let y = 1.95; const rh = 1.15;
    rows.forEach(c => {
      s.addShape(p.shapes.RECTANGLE, { x: 0.55, y, w: 12.2, h: rh, fill: { color: CARD }, line: { color: BORDER, width: 1 }, shadow: sh() });
      s.addText(c.name.toUpperCase(), { x: 0.72, y: y + 0.12, w: 2.4, h: rh - 0.24, fontFace: F, fontSize: 11, bold: true, color: RED, valign: "middle", margin: 0 });
      s.addText([{ text: "[ Post proposal title ]", options: { bold: true, color: INK, breakLine: true } }, { text: c.desc, options: { color: MUTED } }], { x: 3.3, y: y + 0.14, w: 5.0, h: rh - 0.28, fontFace: F, fontSize: 10, valign: "middle", margin: 0 });
      chip(s, 8.4, y + (rh - 0.32) / 2, 1.35, "FORMAT");
      const fx = 10.0, opts = [["Approve", RED], ["Tweak", "3A3A3A"], ["Pass", MUTED2]];
      opts.forEach((o, i) => { const cy = y + 0.16 + i * 0.28; s.addShape(p.shapes.RECTANGLE, { x: fx, y: cy, w: 0.17, h: 0.17, fill: { color: "FFFFFF" }, line: { color: o[1], width: 1.25 } }); s.addText(o[0], { x: fx + 0.24, y: cy - 0.03, w: 1.1, h: 0.24, fontFace: F, fontSize: 9, bold: true, color: o[1], valign: "middle", margin: 0 }); });
      s.addText("Notes:", { x: 11.35, y: y + 0.14, w: 0.6, h: 0.2, fontFace: F, fontSize: 8, bold: true, color: MUTED, margin: 0 });
      s.addShape(p.shapes.LINE, { x: 11.35, y: y + 0.5, w: 1.35, h: 0, line: { color: BORDER, width: 1 } });
      y += rh + 0.1;
    });
    footer(s, "WEEKLY MENU");
  })();

  return p.writeFile({ fileName: outFile }).then(() => outFile);
}

module.exports = { buildDeck };

if (require.main === module) {
  const arg = (f, d) => { const i = process.argv.indexOf(f); return i > -1 ? process.argv[i + 1] : d; };
  const j = f => JSON.parse(fs.readFileSync(f, "utf8"));
  buildDeck({
    brand: j(arg("--brand", "config/brand.json")),
    pillars: j(arg("--pillars", "config/pillars.json")),
    posts: j(arg("--posts", "examples/posts.example.json")),
    refsDir: arg("--refs", "output"),
    outFile: arg("--out", "output/deck.pptx"),
  }).then(f => console.log("Deck written to " + f));
}
