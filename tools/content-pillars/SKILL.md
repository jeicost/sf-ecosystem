---
name: content-pillar-system
description: >
  Reusable system to run a brand's social content operation end-to-end. Use whenever you need to
  define content pillars and collections for a brand, write fully-worked post proposals (headline,
  concept, shot flow, caption, CTA, hashtags), generate an OWN-BRAND visual reference for each post
  (a vector mockup + an art-direction brief — no competitor images required), assemble a polished
  strategy deck (PPTX), and run a recurring weekly content menu that a marketing lead approves.
  Brand-agnostic: swap config/brand.json + config/pillars.json to retarget any project.
---

# Content Pillar System

**Open-source (MIT), embeddable software — built to be integrated into other systems.**
Use it as a Node **library** (`require`), a **CLI**, or an **AI-agent skill**. It is brand-agnostic and
stateless: feed it plain JSON (from an agent, a form, a CMS, your backend) and it returns own-brand
references and a deck. See `README.md` for the integration API; this file is the agent operating manual.

A repeatable pipeline that turns a brand into a running content operation. It was built from a real
launch (Salsa Burgers, Bangkok) and is filled in as the default example — replace the two config
files to run it for any brand.

## What it produces
0. **Strategy from a brief** — the agent turns a short brand brief into the pillars, collections and post proposals (`prompts/strategist.md`).
1. **Pillars & collections** — 8 content pillars, each with 4 recurring collections (from `config/pillars.json`).
2. **Post proposals** — one fully-worked post per collection: headline, sub, concept, shot flow, caption, CTA, hashtags.
3. **Own-brand references** — per post, a **vector mockup** (SVG, your colors/fonts/logo/tagline, with a marked PHOTO ZONE) **and** an **art-direction brief** (Markdown). No competitor images needed.
4. **Strategy deck** — a polished PPTX (cover → pillars → posts with their own reference → weekly menu).
5. **Weekly menu** — a pick-list template (one proposal per collection, with Approve / Tweak / Pass + notes) for a marketing lead to choose from each week.

## When to use
- Standing up a new brand's content system, or running the weekly cadence for an existing one.
- Any time you propose new posts and need an own-brand reference (mockup + brief) instead of borrowing competitor creative.

## Files
```
prompts/strategist.md      # STEP 0 — brief → brand.json + pillars.json + posts.json (the generator brain)
config/brand.json          # brand tokens: name, tagline, handle, colors, fonts, menu, rules  ← generated/edited per project
config/pillars.json        # pillars + collections + definitions                              ← generated/edited per project
scripts/validate.js        # checks the strategist's JSON (schema + one-post-per-collection coverage)
scripts/post_reference.js  # → per post: <slug>.mockup.svg (own-brand frame) + <slug>.brief.md
scripts/render_svg.py      # → renders every *.mockup.svg to *.mockup.png (for the deck)
scripts/build_deck.js      # → builds the full PPTX using each post's own mockup as its reference
scripts/run_all.sh         # one-shot: validate → references → render → deck
examples/                  # brief.example.md (input) · post/posts.example.json · sample_output/
output/                    # generated references, PNGs and deck.pptx land here
```

## Setup (once)
```bash
npm install pptxgenjs
pip install cairosvg --break-system-packages     # only needed to render mockups into the deck
```

## Full workflow (brief → deck)

**Step 0 — Strategy (the agent generates everything).** Give the agent the brand brief
(`examples/brief.example.md`) plus `prompts/strategist.md`. It returns three JSON blocks —
`brand.json`, `pillars.json`, and `posts.json` — designing the **pillars**, the **collections**,
and **one complete post proposal per collection** (headline, concept, shot flow, caption, CTA,
hashtags, art direction), all on-voice and grounded in the real menu. Save them to `config/` and `./posts.json`.

**Steps 1–3 — Production (deterministic scripts).** Validate, then generate each post's own reference
and build the deck. One command does all of it:
```bash
bash scripts/run_all.sh config/brand.json config/pillars.json posts.json output
```
Or run the stages explicitly:
```bash
node scripts/validate.js config/brand.json config/pillars.json posts.json            # 1) check the strategy
node scripts/post_reference.js --brand config/brand.json --posts posts.json --out output/   # 2) own mockup + brief per post
python3 scripts/render_svg.py output/ 800                                            #    rasterize mockups
node scripts/build_deck.js --brand config/brand.json --pillars config/pillars.json \  # 3) build the deck
     --posts posts.json --refs output/ --out output/deck.pptx
```
A single post reference (no deck) is just step 2 with `--post examples/post.example.json`.

**So the agent does the whole thing:** brief → pillars → collections → full post proposals →
own-brand references (mockup + brief) → deck → weekly menu. Human only approves.

## Retargeting to a new brand
1. Edit `config/brand.json`: `name`, `tagline`, `handle`, `location`, `colors` (hex, no `#`), `fonts`, `menu`, `voice`, `rules`.
2. Edit `config/pillars.json`: pillar names, formats, objectives, definitions, and 4 collections each.
3. Run the 3 steps. Everything (references, deck, weekly menu) inherits the new brand automatically.

## The pillar model (default)
Drive Craving · Ritual & Packaging · Brand Cult · Trust & Authenticity · Salsa Phrases ·
Salsa People · News/Updates/Promotions · Salsa Iconic Moments. Each has 4 collections; each
collection is a recurring content series you can fill week after week.

## Weekly cadence (the recurring operation)
Each week, propose **one post per collection** for a pillar (or across pillars), drop them into the
weekly-menu template, and let the marketing lead mark **Approve / Tweak / Pass** with notes. Build
only the approved ("green") ones. `build_deck.js` emits a blank weekly-menu template slide to copy.

## Guardrails (baked into the briefs)
- **Ownable, inspired-by-not-exact:** never use real public figures' likenesses or reproduce
  copyrighted works/marks. Capture the *energy* of a reference, build the icon yourself. Every brief
  ends with an ownable check.
- **Brand voice & look** come from `brand.json` (colors, fonts, tagline, rules). The mockup enforces them.
- **Hook is the sauce/product**, not a generic shot; the reference's PHOTO ZONE states the exact shot.

## Extending
- **AI image references (future):** `post_reference.js` is structured so a text-to-image step can be
  added to fill the PHOTO ZONE with a generated frame. Until then it outputs a vector mockup + brief,
  which is reproducible, cheap, and 100% on-brand.
- **Moodboards:** if you *do* want competitor references on pillar slides, drop images into a folder
  and extend `build_deck.js`'s pillar section to render them (kept out by default so the system is self-sufficient).
