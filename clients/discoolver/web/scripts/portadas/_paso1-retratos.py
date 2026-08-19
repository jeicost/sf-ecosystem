import json, os, time, urllib.request, pathlib, concurrent.futures as cf
KEY = [l.split("=",1)[1].strip().strip('"') for l in open(os.path.expanduser("~/Developer/Claude/.env.local")) if l.startswith("FREEPIK_API_KEY=")][0]
API = "https://api.freepik.com/v1/ai/mystic"
OUT = pathlib.Path(__file__).parent

RETRATO = ("editorial magazine cover portrait, waist-up, standing, looking straight into "
  "the camera, confident calm expression, plain seamless light grey studio backdrop, "
  "large softbox key light, photorealistic, 85mm f1.8, sharp focus on the eyes, "
  "natural skin texture, fictional person, not a celebrity, not a public figure")
# El vestuario se elige por contraste con el fondo de su ciudad (Ibiza va sobre
# crema, así que su modelo viste oscuro; el resto al revés).
MODELOS = [
 ("valencia", "a 29-year-old Spanish woman with dark hair in a low bun, wearing a mustard "
              "linen blazer over a white top, arms relaxed, " + RETRATO),
 ("ibiza",    "a 34-year-old Spanish man with sun-bleached long hair tied back and light "
              "stubble, wearing a dark navy open linen shirt, hands in pockets, " + RETRATO),
 ("bangkok",  "a 28-year-old Thai woman with straight black shoulder-length hair, wearing a "
              "crisp white shirt, arms crossed loosely, " + RETRATO),
 ("dubai",    "a 31-year-old Middle Eastern woman with dark hair and an elegant cream silk "
              "headscarf draped loosely, wearing a sand-coloured tailored blazer, " + RETRATO),
]
CIUDAD = ("architectural photograph, strong graphic silhouette, high contrast, clear sky, "
          "wide shot, no people in the foreground, no text, no logos, editorial travel photography")
CIUDADES = [
 ("madrid",    "the Metrópolis building and Gran Vía rooftops in Madrid at golden hour, " + CIUDAD),
 ("barcelona", "the Sagrada Familia towers rising above Barcelona rooftops, " + CIUDAD),
 ("malaga",    "the Alcazaba fortress above Malaga port with tall palm trees, " + CIUDAD),
 ("valencia",  "the Ciutat de les Arts i les Ciencies in Valencia, white curved shells reflected in water, " + CIUDAD),
 ("ibiza",     "Dalt Vila old town walls of Ibiza above the sea at dusk, " + CIUDAD),
 ("bangkok",   "Bangkok skyline with golden temple spires and the elevated skytrain track, " + CIUDAD),
 ("dubai",     "the Dubai skyline with Burj Khalifa rising over the city in desert haze, " + CIUDAD),
]

def lanzar(prompt, ar):
    b = json.dumps({"prompt": prompt, "model": "realism", "aspect_ratio": ar,
                    "creative_detailing": 33, "engine": "automatic"}).encode()
    r = urllib.request.Request(API, b, {"x-freepik-api-key": KEY, "Content-Type": "application/json"})
    return json.load(urllib.request.urlopen(r, timeout=90))["data"]["task_id"]

def esperar(tid):
    for _ in range(100):
        time.sleep(6)
        r = urllib.request.Request(f"{API}/{tid}", headers={"x-freepik-api-key": KEY})
        d = json.load(urllib.request.urlopen(r, timeout=60))["data"]
        if d["status"] == "COMPLETED": return d["generated"][0]
        if d["status"] == "FAILED": return None
    return None

trabajos = ([(f"raw-{s}.jpg", p, "traditional_3_4") for s, p in MODELOS] +
            [(f"ciudad-{s}.jpg", p, "widescreen_16_9") for s, p in CIUDADES])
ids = [(n, lanzar(p, ar)) for n, p, ar in trabajos]
print(f"lanzadas {len(ids)} tareas")
def bajar(par):
    n, tid = par
    u = esperar(tid)
    if not u: return f"  ✗ {n}"
    urllib.request.urlretrieve(u, OUT/n)
    return f"  ✓ {n}  {(OUT/n).stat().st_size//1024} KB"
with cf.ThreadPoolExecutor(11) as ex:
    for r in ex.map(bajar, ids): print(r)
