import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { draftMode } from "next/headers";
import { defaultAlojamientos360Content } from "@/lib/content/b360/alojamientos";
import { defaultAlojamientos360Content as defaultAlojamientos360ContentEn } from "@/lib/content/b360/en/alojamientos";
import { withLocale, type Locale } from "@/lib/i18n";
import { pageContent } from "@/lib/cms-pages";
import { Section, Head, Cta, Faq, Stat, Steps, Pending, Txt } from "@/components/b360/Bits";

export const metadata: Metadata = buildMetadata({
  title: "Concierge digital para alojamientos",
  description:
    "El concierge digital que entra en tu check-in, responde al huésped 24/7 y convierte tus recomendaciones en una línea de ingresos para el alojamiento.",
  path: "/360/alojamientos",
  image: "/assets/360/og-360.jpg",
  siteName: "discoolver 360",
});

export async function Alojamientos360({ locale = "es" }: { locale?: Locale }) {
  const { isEnabled: isDraft } = await draftMode();
  const slug = locale === "en" ? ("360-alojamientos-en" as const) : ("360-alojamientos" as const);
  const fallback = locale === "en" ? defaultAlojamientos360ContentEn : defaultAlojamientos360Content;
  const c = await pageContent(slug, fallback, isDraft);
  const K = (k: string) => c[k as keyof typeof c] as string;

  return (
    <>
      {/* ---------- hero ---------- */}
      <section className="hero">
        <div className="wrap">
          <span className="label">{c.hero_eyebrow}</span>
          <h1 className="h-hero">{c.hero_title}</h1>
          <p className="lead">{c.hero_sub}</p>
          <div className="btns">
            <Cta href={withLocale("/360/demo?v=alojamiento", locale)}>{c.hero_cta_primary}</Cta>
            <Cta href="#modulos" variant="2">{c.hero_cta_secondary}</Cta>
          </div>
          <p className="small" style={{ marginTop: 26, maxWidth: "62ch" }}>{c.hero_reassurance}</p>
        </div>
      </section>

      {/* ---------- el problema del hotelero ---------- */}
      <Section alt>
        <Head label={c.problema_eyebrow} title={c.problema_title} lead={c.problema_intro} />
        <div className="grid g-3" style={{ marginTop: 36 }}>
          {[1, 2, 3].map((n) => (
            <div className="card" key={n}>
              <span className="card__n">0{n}</span>
              <h3 className="h-card">{K(`problema_${n}_titulo`)}</h3>
              <p style={{ fontSize: 14.5, margin: 0 }}>{K(`problema_${n}_texto`)}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ---------- concierge digital ---------- */}
      <Section id="concierge">
        <Head label={c.concierge_eyebrow} title={c.concierge_title} lead={c.concierge_lead} />
        <div className="grid g-2" style={{ marginTop: 34 }}>
          {[1, 2, 3, 4].map((n) => (
            <div className="card mod" key={n}>
              <h3 className="h-card">{K(`concierge_${n}_nombre`)}</h3>
              <p>{K(`concierge_${n}_texto`)}</p>
              <div className="mod__price">{K(`concierge_${n}_precio`)}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* ---------- check-in ---------- */}
      <Section id="check-in" alt>
        <Head label={c.checkin_eyebrow} title={c.checkin_title} lead={c.checkin_intro} />
        <div className="split" style={{ marginTop: 26 }}>
          <Steps
            items={[1, 2, 3].map((n) => ({
              t: K(`checkin_paso_${n}_momento`),
              d: K(`checkin_paso_${n}_accion`),
            }))}
          />
          <div className="card" style={{ borderColor: "var(--b-line)" }}>
            <h3 className="h-card">Integración</h3>
            <Txt v={c.checkin_integracion} />
            
          </div>
        </div>
      </Section>

      {/* ---------- comisión por venta de recomendaciones ---------- */}
      <Section id="comision">
        <Head label={c.comision_eyebrow} title={c.comision_title} lead={c.comision_intro} />
        <div className="split" style={{ marginTop: 30 }}>
          <div>
            <Steps
              items={[1, 2, 3].map((n) => ({ t: `Paso ${n}`, d: K(`comision_flujo_${n}`) }))}
            />
          </div>
          <div>
            <div className="card" style={{ borderColor: "var(--b-line)" }}>
              <div className="caso__stats" style={{ marginTop: 0, paddingTop: 0, borderTop: 0 }}>
                <Stat v={c.comision_dato_plataforma_valor} l={c.comision_dato_plataforma_label} />
                {/* "Tu parte" en un slot de cifra hacía conspicua la ausencia
                    del número. Como titular + texto, cuenta el mecanismo. */}
                <div>
                  <h3 className="h-card" style={{ marginBottom: 6 }}>{c.comision_dato_alojamiento_valor}</h3>
                  <p style={{ fontSize: 14.5, margin: 0 }}>{c.comision_dato_alojamiento_label}</p>
                </div>
              </div>
              <div style={{ marginTop: 20 }}>
                <Txt v={c.comision_nota} />
              </div>
            </div>
            <p className="h-card" style={{ marginTop: 24, fontSize: 19, color: "var(--b-primary)" }}>
              {c.comision_cierre}
            </p>
          </div>
        </div>
      </Section>

      {/* ---------- los tres segmentos ---------- */}
      <Section alt>
        <Head label={c.segmentos_eyebrow} title={c.segmentos_title} />
        <div className="grid g-3" style={{ marginTop: 34 }}>
          {[1, 2, 3].map((n) => (
            <div className="card" key={n}>
              <span className="card__n">{K(`segmento_${n}_nombre`).toUpperCase()}</span>
              <h3 className="h-card">{K(`segmento_${n}_compra`)}</h3>
              <p style={{ fontSize: 14.5 }}>{K(`segmento_${n}_texto`)}</p>
              <p className="small" style={{ margin: 0, color: "var(--b-accent)" }}>
                {K(`segmento_${n}_cierre`)}
              </p>
            </div>
          ))}
        </div>
      </Section>

      {/* ---------- caso Ronda ---------- */}
      <Section id="ronda">
        <div className="caso">
          <span className="label label--accent">{c.caso_eyebrow}</span>
          <h2 className="h-sec">{c.caso_title}</h2>
          <p style={{ maxWidth: "72ch" }}>{c.caso_texto}</p>
          <div className="caso__stats">
            {[1, 2, 3, 4].map((n) => (
              <Stat key={n} v={K(`caso_dato_${n}_valor`)} l={K(`caso_dato_${n}_label`)} />
            ))}
          </div>
        </div>
      </Section>

      {/* ---------- módulos aplicables ---------- */}
      <Section id="modulos" alt>
        <Head label={c.modulos_eyebrow} title={c.modulos_title} lead={c.modulos_lead} />
        <div className="grid g-2" style={{ marginTop: 34 }}>
          {[1, 2, 3, 4, 5, 6, 7].map((n) => (
            <div className="card mod" key={n}>
              <span className="card__n">{K(`modulo_${n}_para`)}</span>
              <h3 className="h-card">{K(`modulo_${n}_nombre`)}</h3>
              <p>{K(`modulo_${n}_desc`)}</p>
              <div className="mod__price" style={n === 7 ? { color: "var(--b-accent)" } : undefined}>
                {K(`modulo_${n}_precio`)}
              </div>
            </div>
          ))}
        </div>
        <p className="small" style={{ marginTop: 20 }}>{c.modulos_stack}</p>
        <div style={{ marginTop: 12 }}>
          
        </div>
      </Section>

      {/* ---------- qué hace falta para arrancar ---------- */}
      <Section>
        <Head label={c.arranque_eyebrow} title={c.arranque_title} />
        <div className="split" style={{ marginTop: 26 }}>
          <Steps
            items={[1, 2, 3, 4].map((n) => ({
              t: K(`arranque_paso_${n}_titulo`),
              d: K(`arranque_paso_${n}_texto`),
            }))}
          />
          <div>
            <div className="card">
              <h3 className="h-card">Lo que necesitas poner tú</h3>
              <ul className="ticks" style={{ marginBottom: 0 }}>
                <li>{c.arranque_requisito_integracion}</li>
                <li>{c.arranque_requisito_tiempo}</li>
                <li>{c.arranque_requisito_personal}</li>
              </ul>
            </div>
            <div style={{ marginTop: 16, display: "grid", gap: 10 }}>
              
              
            </div>
          </div>
        </div>
      </Section>

      {/* ---------- FAQ ---------- */}
      <Section alt>
        <span className="label">{c.faq_eyebrow}</span>
        <h2 className="h-sec" style={{ marginBottom: 28 }}>{c.faq_title}</h2>
        <div style={{ maxWidth: 820 }}>
          <Faq
            items={[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => ({
              q: K(`faq_${n}_pregunta`),
              a: K(`faq_${n}_respuesta`),
            }))}
          />
        </div>
      </Section>

      {/* ---------- CTA ---------- */}
      <Section>
        <div className="band">
          <h2 className="h-sec">{c.cta_title}</h2>
          <p className="lead">{c.cta_sub}</p>
          <div className="btns">
            <Cta href={withLocale("/360/demo?v=alojamiento", locale)}>{c.cta_boton}</Cta>
          </div>
          <p className="small" style={{ marginTop: 22 }}>{c.cta_reassurance}</p>
          <p className="small" style={{ fontFamily: "var(--b-mono)", fontSize: 12.5 }}>{c.cta_contacto}</p>
        </div>
      </Section>
    </>
  );
}

export default function Page() {
  return <Alojamientos360 locale="es" />;
}
