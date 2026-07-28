/**
 * Optional REST wrapper — exposes the engine as an HTTP service for tools you already have.
 * Requires express in the host project:  npm install express
 *   POST /validate   { brand, pillars, posts }        -> { ok, errors }
 *   POST /reference  { post, brand }                  -> { svg, brief }
 *   POST /deck       { brand, pillars, posts }        -> deck.pptx (download)
 */
const cps = require("content-pillar-system");
let express; try { express = require("express"); } catch { console.error("Install express: npm i express"); process.exit(1); }
const app = express(); app.use(express.json({ limit: "4mb" }));

app.post("/validate", (req, res) => res.json(cps.validate(req.body.brand, req.body.pillars, req.body.posts)));

app.post("/reference", (req, res) => {
  try { res.json(cps.generateReference(req.body.post, req.body.brand)); }
  catch (e) { res.status(400).json({ error: String(e.message || e) }); }
});

app.post("/deck", async (req, res) => {
  const { brand, pillars, posts } = req.body;
  const v = cps.validate(brand, pillars, posts);
  if (!v.ok) return res.status(422).json(v);
  const dir = require("os").tmpdir() + "/cps-" + Date.now();
  cps.writeReferences(posts, brand, dir);
  // NOTE: run render_svg.py on `dir` here if you want mockups embedded, then:
  const out = dir + "/deck.pptx";
  await cps.buildDeck({ brand, pillars, posts, refsDir: dir, outFile: out });
  res.download(out, "content-system.pptx");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("content-pillar-system API on :" + PORT));
