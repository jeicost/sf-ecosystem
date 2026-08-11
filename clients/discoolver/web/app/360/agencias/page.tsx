import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { draftMode } from "next/headers";
import { defaultAgencias360Content } from "@/lib/content/b360/agencias";
import { defaultAgencias360Content as defaultAgencias360ContentEn } from "@/lib/content/b360/en/agencias";
import { withLocale, type Locale } from "@/lib/i18n";
import { pageContent } from "@/lib/cms-pages";
import { Section, Head, Cta, Stat, Steps, Pending } from "@/components/b360/Bits";

export const metadata: Metadata = buildMetadata({
  title: "Agencias, DMC y touroperadores receptivos | discoolver 360",
  description:
    "Digitalizamos el catálogo local del destino y te damos marketplace y punto de venta para venderlo. Módulos desde 100 €/mes y comisión del 10-15%.",
  path: "/360/agencias",
  image: "/assets/360/og-360.png",
  siteName: "discoolver 360",
  // Agencias sigue fuera del nav y sin indexar hasta que exista el piloto
  // con una DMC (decisión CEO 11-ago). El resto de 360 ya se estrenó.
  noindex: true,
});

export async function Agencias360({ locale = "es" }: { locale?: Locale }) {
  const { isEnabled: isDraft } = await draftMode();
  const slug = locale === "en" ? ("360-agencias-en" as const) : ("360-agencias" as const);
  const fallback = locale === "en" ? defaultAgencias360ContentEn : defaultAgencias360Content;
  const c = await pageContent(slug, fallback, isDraft);
  const K = (k: string) => c[k as keyof typeof c] as string;

  return (
    <>
      {/* ---------- hero ---------- */}
      <section className="hero">
        <div className="wrap">
          <span className="label">{c.hero_label}</span>
          <h1 className="h-hero">{c.hero_title}</h1>
          <p className="lead">{c.hero_sub}</p>
          <div className="btns">
            <Cta href={c.hero_cta_1_url}>{c.hero_cta_1}</Cta>
            <Cta href={c.hero_cta_2_url} variant="2">{c.hero_cta_2}</Cta>
          </div>
          {/* La honestidad va en el hero a propósito: es la vertical con menos material
              y decirlo arriba vale más que descubrirlo abajo. */}
          <p
            className="small"
            style={{
              marginTop: 28,
              paddingTop: 22,
              borderTop: "1px solid var(--b-line-soft)",
              maxWidth: "74ch",
            }}
          >
            {c.hero_honestidad}
          </p>
        </div>
      </section>

      {/* ---------- a quién sirve ---------- */}
      <Section alt>
        <Head label={c.perfiles_label} title={c.perfiles_title} lead={c.perfiles_lead} />
        <div className="grid g-3" style={{ marginTop: 34 }}>
          {[1, 2, 3].map((n) => (
            <div className="card" key={n}>
              <span className="card__n">0{n}</span>
              <h3 className="h-card">{K(`perfil_${n}_nombre`)}</h3>
              <p style={{ fontSize: 14.5, margin: 0 }}>{K(`perfil_${n}_texto`)}</p>
            </div>
          ))}
        </div>
        <div className="card" style={{ marginTop: 18, borderColor: "var(--b-line)" }}>
          <h3 className="h-card">{c.no_encaje_titulo}</h3>
          <p style={{ margin: 0, fontSize: 14.5 }}>{c.no_encaje_texto}</p>
        </div>
      </Section>

      {/* ---------- qué damos ---------- */}
      <Section>
        <Head label={c.que_damos_label} title={c.que_damos_title} lead={c.que_damos_lead} />
        <div className="grid g-2" style={{ marginTop: 34 }}>
          {[1, 2, 3, 4].map((n) => (
            <div className="card" key={n}>
              <h3 className="h-card">{K(`bloque_${n}_titulo`)}</h3>
              <p style={{ fontSize: 14.5, margin: 0 }}>{K(`bloque_${n}_texto`)}</p>
            </div>
          ))}
        </div>
        <p className="small" style={{ marginTop: 22 }}>{c.comision_texto}</p>
        <div style={{ marginTop: 12 }}>
        </div>
      </Section>

      {/* ---------- cómo encaja ---------- */}
      <Section alt>
        <Head label={c.encaje_label} title={c.encaje_title} />
        <div style={{ marginTop: 26, maxWidth: 720 }}>
          <Steps
            items={[1, 2, 3, 4].map((n) => ({
              t: K(`paso_${n}_titulo`),
              d: K(`paso_${n}_texto`),
            }))}
          />
        </div>
        <div style={{ marginTop: 20, maxWidth: 720 }}>
          <Pending>{c.encaje_pendiente}</Pending>
        </div>
      </Section>

      {/* ---------- caso Ronda ---------- */}
      <Section id="ronda">
        <div className="caso">
          <span className="label label--accent">{c.caso_label}</span>
          <h2 className="h-sec">{c.caso_title}</h2>
          <p style={{ maxWidth: "72ch" }}>{c.caso_texto}</p>
          <div className="caso__stats">
            {[1, 2, 3].map((n) => (
              <Stat key={n} v={K(`caso_stat_${n}_valor`)} l={K(`caso_stat_${n}_label`)} />
            ))}
          </div>
          <p className="small" style={{ marginTop: 26 }}>{c.caso_honestidad}</p>
          <div style={{ marginTop: 14 }}>
            <Pending>{c.caso_pendiente}</Pending>
          </div>
        </div>
      </Section>

      {/* ---------- módulos ---------- */}
      <Section id="modulos" alt>
        <Head label={c.modulos_label} title={c.modulos_title} lead={c.modulos_lead} />
        <div className="grid g-2" style={{ marginTop: 34 }}>
          {[1, 2, 3, 4, 5, 6, 7].map((n) => (
            <div className="card mod" key={n} style={n <= 2 ? { borderColor: "var(--b-line)" } : undefined}>
              {n <= 2 && <span className="card__n">NÚCLEO PARA AGENCIA</span>}
              <h3 className="h-card">{K(`modulo_${n}_nombre`)}</h3>
              <p>{K(`modulo_${n}_para_que`)}</p>
              <div className="mod__price" style={n === 7 ? { color: "var(--b-accent)" } : undefined}>
                {K(`modulo_${n}_precio`)}
              </div>
            </div>
          ))}
        </div>
        <p className="small" style={{ marginTop: 20 }}>{c.modulos_stack}</p>
        <div style={{ marginTop: 12 }}>
          <Pending>{c.modulos_pendiente}</Pending>
        </div>
      </Section>

      {/* ---------- CTA ---------- */}
      <Section>
        <div className="band">
          <span className="label">{c.cta_label}</span>
          <h2 className="h-sec">{c.cta_title}</h2>
          <p className="lead">{c.cta_texto}</p>
          <div className="btns">
            <Cta href={c.cta_boton_url}>{c.cta_boton}</Cta>
          </div>
          <div style={{ marginTop: 22, display: "grid", gap: 8, justifyItems: "center" }}>
            <a href={`mailto:${c.cta_contacto_email}`} style={{ fontFamily: "var(--b-mono)", fontSize: 12.5, color: "var(--b-primary)" }}>
              {c.cta_contacto_email}
            </a>
            <a href={`tel:${c.cta_contacto_telefono.replace(/[^\d+]/g, "")}`} style={{ fontFamily: "var(--b-mono)", fontSize: 12.5, color: "var(--b-muted)" }}>
              {c.cta_contacto_telefono}
            </a>
            <span style={{ fontFamily: "var(--b-mono)", fontSize: 12.5, color: "var(--b-slate)" }}>
              {c.cta_contacto_direccion}
            </span>
          </div>
        </div>
      </Section>
    </>
  );
}

export default function Page() {
  return <Agencias360 locale="es" />;
}
