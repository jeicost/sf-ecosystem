/**
 * Genera la colección de ciudades con Mystic (Magnific/Freepik).
 *
 * DIRECCIÓN DE ARTE. Lo que hace que 18 imágenes se lean como una colección y
 * no como 18 imágenes sueltas es que compartan tratamiento: misma óptica, mismo
 * revelado y ninguna con texto encima. Lo que las hace variadas es la hora, el
 * punto de vista y el tiempo atmosférico — eso cambia en cada una.
 *
 * Se pide sin gente reconocible y sin marcas: son fondos, no fotos de stock.
 */
const BASE = "https://api.magnific.com/v1/ai/mystic";
const KEY = process.env.MAGNIFIC_API_KEY;

/*
 * USO
 *   node scripts/generar-ciudades.mjs        (la clave sale del entorno)
 *
 * La API es asíncrona: esto lanza las tareas e imprime los task_id. Para
 * recogerlas, consultar GET /v1/ai/mystic/{task_id} hasta COMPLETED y bajar
 * `generated[0]` EN EL MOMENTO — la URL del CDN va firmada y caduca.
 *
 * Las 18 de la tanda del 19-ago-2026 tardaron ~3 min en paralelo, 0 fallidas.
 */

/** El revelado común. Va al final de cada prompt. */
const LOOK =
  "editorial travel photography, cinematic wide shot, shot on 35mm full frame, " +
  "natural filmic color grade, deep shadows, soft highlight roll-off, fine grain, " +
  "high dynamic range, immaculate detail, no text, no watermark, no logos, no recognisable faces";

const CIUDADES = [
  // Las nuestras
  ["madrid",     "Aerial view over Madrid at golden hour, Gran Via avenue cutting through the city, the Metropolis building dome catching low sun, terracotta rooftops, distant Sierra mountains in haze"],
  ["barcelona",  "Barcelona from above at blue hour, the Sagrada Familia towers lit against a deep indigo sky, the Eixample grid of rooftops glowing with street light, Mediterranean on the horizon"],
  ["malaga",     "Malaga late afternoon from the Gibralfaro hill, the Alcazaba fortress and the cathedral, palm-lined port and turquoise Mediterranean, warm amber light raking across the old town"],
  ["valencia",   "City of Arts and Sciences in Valencia at dawn, white organic architecture mirrored in still turquoise water, pale pink sky, long clean reflections, almost no people"],
  ["ibiza",      "Dalt Vila of Ibiza seen from the water at sunset, honey-coloured fortress walls above the harbour, sailing boats in silhouette, warm haze over the Mediterranean"],
  ["bangkok",    "Wat Arun temple on the Chao Phraya river in Bangkok at night, illuminated spires reflected in dark water, long-tail boat light trails, humid neon glow of the city behind"],
  ["dubai",      "Dubai skyline at blue hour photographed from above the low clouds, Burj Khalifa piercing a sea of mist, warm window lights against cool violet sky"],
  // Grandes ciudades del mundo
  ["paris",      "Paris rooftops at misty dawn, zinc roofs and chimney pots in soft grey light, the Eiffel Tower emerging from low fog in the distance, cool pearlescent palette"],
  ["nuevayork",  "Manhattan skyline at dusk seen from Brooklyn across the East River, warm office lights switching on, purple-blue gradient sky, bridge cables in the foreground"],
  ["tokio",      "Shibuya Tokyo at night in the rain, neon signage reflected in wet asphalt, umbrellas as soft silhouettes, dense vertical city, cyan and magenta light"],
  ["roma",       "Rome at warm evening light from a Trastevere rooftop, ochre and sienna facades, terracotta tiles, the dome of St Peter's in the golden distance, swallows in the sky"],
  ["londres",    "London on a moody overcast afternoon, the Thames in steel grey, St Paul's dome against low cloud, silver light breaking through, muted desaturated palette"],
  ["lisboa",     "Lisbon afternoon in Alfama, tiled facades in pastel yellow and blue, a yellow tram climbing a narrow street, laundry lines, the Tagus river glinting below"],
  ["estambul",   "Istanbul at foggy dawn over the Bosphorus, mosque domes and minarets in layered silhouette, ferries leaving soft wakes, pale gold light through mist"],
  ["mexico",     "Mexico City at sunset along Paseo de la Reforma, the Angel of Independence monument, avenue of jacaranda trees, volcanoes faint on the horizon, warm dusty light"],
  ["rio",        "Rio de Janeiro in late golden light from a high vantage, Sugarloaf mountain and Guanabara bay, tropical green granite peaks, ocean haze"],
  ["marrakech",  "Marrakech at dusk from the medina rooftops, ochre walls and palm crowns, Koutoubia minaret, the snow-capped Atlas mountains beyond, dust-warm pink sky"],
  ["singapur",   "Singapore Marina Bay at blue hour, the waterfront skyline mirrored in still water, Supertree grove glowing, humid tropical air, teal and amber contrast"],
];

async function crear(slug, prompt) {
  const r = await fetch(BASE, {
    method: "POST",
    headers: { "x-magnific-api-key": KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: `${prompt}. ${LOOK}`,
      model: "super_real",
      engine: "magnific_sparkle",
      resolution: "2k",
      aspect_ratio: "widescreen_16_9",
      // Bajo a propósito: por encima de ~40 empieza a inventar textura y las
      // fachadas dejan de parecer fotografía.
      creative_detailing: 28,
    }),
  });
  const j = await r.json();
  if (!j?.data?.task_id) throw new Error(`${slug}: ${JSON.stringify(j).slice(0, 160)}`);
  return { slug, id: j.data.task_id };
}

const tareas = [];
for (const [slug, prompt] of CIUDADES) {
  try {
    const t = await crear(slug, prompt);
    tareas.push(t);
    console.log(`→ ${slug.padEnd(11)} ${t.id}`);
  } catch (e) {
    console.log(`✗ ${slug}: ${e.message}`);
  }
  await new Promise((r) => setTimeout(r, 400)); // no atropellar la API
}
console.log(JSON.stringify(tareas));
