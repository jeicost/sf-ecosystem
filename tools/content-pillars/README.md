# Content Pillar System

**Open-source (MIT), embeddable software** for running a brand's social-content operation end-to-end:
content **pillars → collections → fully-worked post proposals → own-brand visual references
(mockup + brief) → strategy deck → weekly approval menu**.

> **Purpose: this is a building block meant to be integrated into other systems.**
> Use it as a **Node library**, a **CLI**, or an **AI-agent skill**. It is brand-agnostic and stateless —
> feed it plain JSON (from an LLM agent, a form, a CMS, your backend) and it returns references and a deck.
> No lock-in, no external services required (PPTX + SVG are generated locally).

## Install
```bash
npm install content-pillar-system        # or: npm install  (inside this folder)
pip install cairosvg --break-system-packages   # optional: only to rasterize mockups into the deck
```

## Integrate — three ways

### 1) As a Node library (embed in your app/backend)
```js
const cps = require("content-pillar-system");

// 1. validate a strategy produced upstream (LLM, form, CMS...)
const { ok, errors } = cps.validate(brand, pillars, posts);

// 2. own-brand reference for a single post, in-memory (no files)
const { svg, brief } = cps.generateReference(post, brand);

// 3. batch to disk, then assemble the deck
cps.writeReferences(posts, brand, "output");           // → <slug>.mockup.svg + .brief.md
await cps.buildDeck({ brand, pillars, posts, refsDir: "output", outFile: "deck.pptx" });
```

### 2) As a CLI (shell / CI / cron)
```bash
cps-validate  config/brand.json config/pillars.json posts.json
cps-reference --brand config/brand.json --posts posts.json --out output/
cps-deck      --brand config/brand.json --pillars config/pillars.json --posts posts.json --refs output/ --out output/deck.pptx
# or one-shot:
bash scripts/run_all.sh config/brand.json config/pillars.json posts.json output
```

### 3) As an AI-agent skill (autonomous, 0 → deck)
Point your agent at `SKILL.md` (operating manual) and `prompts/strategist.md` (brief → strategy).
The agent generates `brand.json` + `pillars.json` + `posts.json`, then this software turns them into
references and the deck. Human only approves via the weekly menu.

## The integration contract (JSON)
Any upstream system just has to emit three JSON objects matching the schemas in
`prompts/strategist.md`: **brand** (tokens), **pillars** (pillars + 4 collections each), **posts**
(one per collection). That's the entire interface. `cps.validate()` checks them before use.

## Public API
| Function | Signature | Returns |
|---|---|---|
| `validate` | `(brand, pillars, posts)` | `{ ok, errors[] }` |
| `generateReference` | `(post, brand)` | `{ svg, brief }` (strings, no files) |
| `writeReferences` | `(posts, brand, outDir)` | `[slug]` (writes `.mockup.svg` + `.brief.md`) |
| `buildDeck` | `({ brand, pillars, posts, refsDir, outFile })` | `Promise<outFile>` |
| `svgMockup`, `brief` | low-level building blocks | string |

## Make it yours
Edit `config/brand.json` (colors/fonts/tagline/menu) and `config/pillars.json` (pillars + collections),
or generate them from a brief with `prompts/strategist.md`. See `SKILL.md` for the full manual.

## License
MIT — see `LICENSE`. Free to use, modify, embed and redistribute. Update the copyright holder to yours.

## Install into an existing project

**From the tarball (drop-in, no registry needed):**
```bash
npm install ./content-pillar-system-1.0.0.tgz     # ships in this delivery
```
**From a git repo / monorepo path:**
```bash
npm install github:<your-org>/content-pillar-system
# or, in a monorepo:  npm install ./packages/content-pillar-system
```
Then `const cps = require("content-pillar-system")` and use the API above.
Ready-to-copy integration snippets live in `examples/integration/` (`programmatic.js`, `server.js`).

**Dependency footprint (for integration planning):**
- `validate()` and `generateReference()` → **zero runtime deps** (pure JS, returns strings).
- `buildDeck()` → needs `pptxgenjs` (declared dependency, installed automatically).
- Embedding mockups as images in the deck → optional `cairosvg` (Python) to rasterize SVG→PNG.
