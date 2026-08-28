#!/usr/bin/env node
/**
 * Vigila la propagación del DNS de lagrimasdesanchez.com/.es y, en cuanto
 * los cuatro hosts apuntan a Vercel, hace el último paso solo:
 *   1. cambia NEXT_PUBLIC_SITE_URL al dominio de verdad
 *   2. vuelve a desplegar
 *   3. comprueba que el canonical ya sale bien
 *
 * Uso:
 *   node vigilar.mjs              espera y hace el cambio
 *   node vigilar.mjs --solo-mirar solo informa, no toca nada
 */
import { execFileSync, execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

const SOLO_MIRAR = process.argv.includes("--solo-mirar");

const PROYECTO = "prj_sBGzG5owgbhBQQkrelgcjrJhM8c2";
const EQUIPO   = "team_7QGpRqqi1FjrJugGLL0sDehf";
const ENV_ID   = "bOiPMjo6eLjQslDq";           // NEXT_PUBLIC_SITE_URL
const DESTINO  = "https://lagrimasdesanchez.com";
const WEB      = join(import.meta.dirname, "..", "web");

// IPs que Vercel considera suyas (rango recomendado + el clásico)
const IPS_VERCEL = new Set(["216.150.1.1", "216.150.16.1", "76.76.21.21"]);
const HOSTS = [
  "lagrimasdesanchez.com",
  "www.lagrimasdesanchez.com",
  "lagrimasdesanchez.es",
  "www.lagrimasdesanchez.es",
];

const token = () =>
  JSON.parse(readFileSync(join(homedir(), "Library/Application Support/com.vercel.cli/auth.json"), "utf8")).token;

const dig = (host, tipo) => {
  try {
    return execFileSync("dig", ["+short", "+time=3", "+tries=1", host, tipo], { encoding: "utf8" })
      .trim().split("\n").filter(Boolean);
  } catch { return []; }
};

/** ¿Este host ya llega a Vercel? Vale por A directa o por CNAME que resuelva a IP de Vercel. */
const apuntaAVercel = (host) => {
  const ips = dig(host, "A");
  if (!ips.length) return { ok: false, via: "sin resolver" };
  if (ips.some((ip) => IPS_VERCEL.has(ip))) return { ok: true, via: ips.join(" ") };
  // un CNAME a vercel-dns resuelto por el resolver también sirve
  const cn = dig(host, "CNAME");
  if (cn.some((c) => c.includes("vercel-dns"))) return { ok: true, via: cn[0] };
  return { ok: false, via: ips.join(" ") };
};

/** El correo tiene que seguir vivo — si se cayeron los MX, algo se tocó de más. */
const correoVivo = (dominio) => dig(dominio, "MX").some((r) => r.includes("ionos"));

async function vercel(ruta, opciones = {}) {
  const sep = ruta.includes("?") ? "&" : "?";
  const r = await fetch(`https://api.vercel.com${ruta}${sep}teamId=${EQUIPO}`, {
    ...opciones,
    headers: { Authorization: `Bearer ${token()}`, "Content-Type": "application/json", ...opciones.headers },
  });
  if (!r.ok) throw new Error(`${ruta} → ${r.status} ${await r.text()}`);
  return r.json();
}

const ahora = () => new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });

function informe() {
  const filas = HOSTS.map((h) => ({ host: h, ...apuntaAVercel(h) }));
  for (const f of filas) {
    console.log(`   ${f.ok ? "✓" : "·"} ${f.host.padEnd(28)} ${f.via}`);
  }
  const correo = ["lagrimasdesanchez.com", "lagrimasdesanchez.es"].filter((d) => !correoVivo(d));
  if (correo.length) {
    console.log(`\n   ⚠️  SIN MX: ${correo.join(", ")} — se han tocado los nameservers o se han borrado los MX.`);
    console.log(`      El correo de esos dominios está caído. Revísalo en IONOS antes de seguir.`);
  }
  return filas.every((f) => f.ok);
}

async function darElCambiazo() {
  console.log(`\n── Propagado. Haciendo el último paso.\n`);

  console.log(`   1/3  NEXT_PUBLIC_SITE_URL → ${DESTINO}`);
  await vercel(`/v9/projects/${PROYECTO}/env/${ENV_ID}`, {
    method: "PATCH",
    body: JSON.stringify({ value: DESTINO, target: ["production"], type: "plain" }),
  });

  console.log(`   2/3  desplegando…`);
  execSync("vercel --prod --yes", { cwd: WEB, stdio: "inherit" });

  console.log(`\n   3/3  comprobando el canonical…`);
  await new Promise((r) => setTimeout(r, 8000));
  const html = await fetch(DESTINO, { redirect: "follow" }).then((r) => r.text()).catch(() => "");
  const bien = html.includes(`canonical" href="${DESTINO}"`);
  console.log(bien
    ? `   ✓ canonical y OG ya apuntan a ${DESTINO}\n`
    : `   ⚠️  el canonical todavía no salió bien — puede ser caché de CDN, vuelve a mirar en unos minutos\n`);
}

// ── principal ────────────────────────────────────────────────────────────
console.log(`\n  DNS · lagrimasdesanchez  ${ahora()}\n`);

if (SOLO_MIRAR) {
  const listo = informe();
  console.log(listo
    ? `\n  Todo apuntando a Vercel. Lanza el script sin --solo-mirar para el paso final.\n`
    : `\n  Todavía no. Los registros están en dns/INSTRUCCIONES-IONOS.md\n`);
  process.exit(0);
}

const LIMITE = Date.now() + 4 * 60 * 60 * 1000;  // se rinde a las 4 h
let vuelta = 0;

while (Date.now() < LIMITE) {
  if (vuelta++) console.log(`\n  ${ahora()} · comprobación ${vuelta}`);
  if (informe()) { await darElCambiazo(); process.exit(0); }
  await new Promise((r) => setTimeout(r, 120000));  // cada 2 min
}

console.log(`\n  Cuatro horas sin propagar. Algo no se guardó bien en IONOS.`);
console.log(`  Repasa dns/INSTRUCCIONES-IONOS.md y vuelve a lanzarlo.\n`);
process.exit(1);
