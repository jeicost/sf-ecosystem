/**
 * Saca las URL de las fotos de perfil de los 47 creadores. SE PEGA EN LA
 * CONSOLA DEL NAVEGADOR, en una pestaña de instagram.com con la sesión abierta.
 *
 * POR QUÉ ASÍ Y NO DESDE EL SERVIDOR. Probado el 19-ago-2026, sin sesión no hay
 * forma: el perfil sirve muro de login y ya no lleva `og:image`;
 * `/api/v1/users/web_profile_info` responde `status: fail`; y unavatar.io pide
 * plan de pago para el proveedor de Instagram. Con la sesión de un humano
 * delante, la misma API contesta a la primera.
 *
 * CÓMO USARLO
 *   1. Abre instagram.com con tu cuenta.
 *   2. Consola del navegador (⌥⌘I) y pega este fichero entero.
 *   3. Al terminar deja el JSON en el portapapeles y lo imprime.
 *   4. Guárdalo como `fotos.json` y ejecuta:
 *        node scripts/fotos-creadores.mjs fotos.json
 *
 * Va de uno en uno con una pausa: cuarenta y siete peticiones seguidas desde
 * una sesión real es la mejor forma de que Instagram la limite.
 */
const HANDLES = [
  "cenandoconpablo",
  "nachopla12",
  "planmadrid",
  "planeaenmadrid",
  "cocituber",
  "peldanyos",
  "nicanorgarcia",
  "kikearnaiz",
  "arianehoyos",
  "rachelbernabeu",
  "dannaponce",
  "miriaminiesta",
  "buscandoacere",
  "sergiocastillo.180",
  "impaullee",
  "travisleon1",
  "pholfoodmafia",
  "chefpam",
  "bangkokfoodies",
  "chinchinawut",
  "i_roamalone",
  "domepakornlam",
  "iamneung",
  "maiphedmaiaroi",
  "armypalakorn",
  "starvingtime",
  "migrationology",
  "peach_eat_laek",
  "bangkok.foodie",
  "chopsticktravel",
  "foodiegirl.kinkakoi",
  "foodie.munchies",
  "gincarb.bkk",
  "goeatgodrink",
  "emilysrichala.blog",
  "samzacktyler",
  "mr.taster",
  "moayadalsawaf",
  "ahmedrashid",
  "latifashamsi",
  "wheremyfoodat",
  "fryingpanadventures",
  "foodivadubai",
  "myfashdiary",
  "lavinaisrani",
  "ascia",
  "lovindubai"
];

(async () => {
  const urls = {};
  const fallos = [];
  for (const [i, handle] of HANDLES.entries()) {
    try {
      const r = await fetch(
        `https://www.instagram.com/api/v1/users/web_profile_info/?username=${handle}`,
        { headers: { "x-ig-app-id": "936619743392459" }, credentials: "include" },
      );
      const j = await r.json();
      const u = j?.data?.user?.profile_pic_url_hd || j?.data?.user?.profile_pic_url;
      if (u) {
        urls[handle] = u;
        console.log(`%c✅ ${i + 1}/${HANDLES.length} ${handle}`, "color:#3f7d1f");
      } else {
        fallos.push(handle);
        console.log(`%c⚠️ ${i + 1}/${HANDLES.length} ${handle} — sin foto`, "color:#a8700f");
      }
    } catch (e) {
      fallos.push(handle);
      console.log(`%c✗ ${handle} — ${e.message}`, "color:#c0392b");
    }
    await new Promise((r) => setTimeout(r, 900));
  }
  const json = JSON.stringify(urls, null, 2);
  console.log(`\n${Object.keys(urls).length} de ${HANDLES.length} resueltas.`);
  if (fallos.length) console.log("Sin resolver:", fallos.join(", "));
  try {
    await navigator.clipboard.writeText(json);
    console.log("📋 JSON copiado al portapapeles. Guárdalo como fotos.json");
  } catch {
    console.log("Copia esto a mano en fotos.json:\n", json);
  }
})();
