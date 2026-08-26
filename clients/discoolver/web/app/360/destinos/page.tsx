import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { draftMode } from "next/headers";
import { defaultDestinos360Content } from "@/lib/content/b360/destinos";
import { defaultDestinos360Content as defaultDestinos360ContentEn } from "@/lib/content/b360/en/destinos";
import { withLocale, type Locale } from "@/lib/i18n";
import { pageContent, slugFor } from "@/lib/cms-pages";
import { DemoForm } from "@/components/b360/DemoForm";
import { Section, Head, Cta, Faq, Stat, Steps, Pending, isPending, Txt } from "@/components/b360/Bits";
import { FondoEscena } from "@/components/b360/Escena360";
import { waHref } from "@/lib/site";

export const metadata: Metadata = buildMetadata({
  title: "Soluciones para destinos turísticos",
  description:
    "Plataforma SaaS para ayuntamientos, patronatos y DMO: redistribuye el flujo de visitantes, da datos propios del destino y monetiza el comercio local.",
  path: "/360/destinos",
  image: "/assets/360/og-360.jpg",
  siteName: "discoolver 360",
});

export async function Destinos360({ locale = "es" }: { locale?: Locale }) {
  const { isEnabled: isDraft } = await draftMode();
  const slug = slugFor("360-destinos", locale);
  const fallback = locale === "es" ? defaultDestinos360Content : defaultDestinos360ContentEn;
  const c = await pageContent(slug, fallback, isDraft);
  const K = (k: string) => c[k as keyof typeof c] as string;

  return (
    <>
      {/* ---------- hero ---------- */}
      <section className="hero b360-escena">
        <FondoEscena src="/assets/360/escenas/hero-destinos.jpg" alt="Oficina de turismo con pantallas de mapas y cuadros de mando" prioridad intensidad="alta" />
        <div className="wrap">
          <span className="label">{c.hero_eyebrow}</span>
          <h1 className="h-hero">{c.hero_title}</h1>
          <p className="lead">{c.hero_sub}</p>
          <div className="btns">
            <Cta href={withLocale("/360/demo?v=destino", locale)}>{c.hero_cta_label}</Cta>
          </div>
          <p className="small" style={{ marginTop: 18 }}>{c.hero_cta_sub}</p>
          <div
            className="grid g-4"
            style={{ marginTop: 44, paddingTop: 32, borderTop: "1px solid var(--b-line-soft)" }}
          >
            {[1, 2, 3, 4].map((n) => (
              <Stat key={n} v={K(`hero_stat_${n}_val`)} l={K(`hero_stat_${n}_label`)} />
            ))}
          </div>
        </div>
      </section>

      {/* ---------- el problema de quien firma ---------- */}
      <Section alt>
        <Head label={c.problema_eyebrow} title={c.problema_title} lead={c.problema_lead} />
        <div className="grid g-2" style={{ marginTop: 36 }}>
          {[1, 2, 3].map((n) => (
            <div className="card" key={n}>
              <span className="card__n">0{n}</span>
              <h3 className="h-card">{K(`problema_${n}_title`)}</h3>
              <p style={{ fontSize: 14.5, margin: 0 }}>{K(`problema_${n}_text`)}</p>
            </div>
          ))}
          <div className="card" style={{ borderColor: "var(--b-line)" }}>
            <span className="card__n">04</span>
            <h3 className="h-card">{c.problema_4_title}</h3>
            <div className="mod__price" style={{ marginTop: 8 }}>{c.problema_4_dato}</div>
            <p style={{ fontSize: 14.5, margin: "10px 0 0" }}>{c.problema_4_text}</p>
            {/* La fuente solo se pinta si existe: la cifra del 70% se retiró
                por no tener atribución documental (el campo quedó vacío). */}
            {c.problema_4_fuente.trim() !== "" && (
              <p className="small" style={{ marginTop: 12, color: "var(--b-slate)", fontFamily: "var(--b-mono)", fontSize: 11.5 }}>
                {c.problema_4_fuente}
              </p>
            )}
          </div>
        </div>
      </Section>

      {/* ---------- qué hace la plataforma POR EL DESTINO ---------- */}
      <Section>
        <Head label={c.plataforma_eyebrow} title={c.plataforma_title} lead={c.plataforma_lead} />
        <p className="h-card" style={{ color: "var(--b-primary)", fontSize: 22, maxWidth: "34ch", marginTop: -4 }}>
          {c.plataforma_claim}
        </p>
        <div className="grid g-2" style={{ marginTop: 34 }}>
          {[1, 2, 3, 4].map((n) => (
            <div className="card" key={n}>
              <h3 className="h-card">{K(`plataforma_${n}_title`)}</h3>
              <p style={{ fontSize: 14.5, margin: 0 }}>{K(`plataforma_${n}_text`)}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ---------- módulos ---------- */}
      <Section id="modulos" alt>
        <Head label={c.modulos_eyebrow} title={c.modulos_title} lead={c.modulos_lead} />
        <div className="grid g-2" style={{ marginTop: 34 }}>
          {[1, 2, 3, 4, 5, 6, 7].map((n) => (
            <div className="card mod" key={n}>
              <span className="card__n">MÓDULO 0{n}</span>
              <h3 className="h-card">{K(`modulo_${n}_nombre`)}</h3>
              <p>{K(`modulo_${n}_desc`)}</p>
              <div className="mod__price" style={n === 7 ? { color: "var(--b-accent)" } : undefined}>
                {K(`modulo_${n}_precio`)}
              </div>
            </div>
          ))}
        </div>
        <div className="card" style={{ marginTop: 22, display: "flex", flexWrap: "wrap", gap: 16, alignItems: "baseline", justifyContent: "space-between" }}>
          <span style={{ fontFamily: "var(--b-mono)", fontSize: 12, letterSpacing: ".12em", color: "var(--b-muted)", textTransform: "uppercase" }}>
            {c.modulos_total_label}
          </span>
          <span className="mod__price" style={{ margin: 0 }}>{c.modulos_total_valor}</span>
        </div>
        <p className="small" style={{ marginTop: 18 }}>{c.modulos_nota}</p>

      </Section>

      {/* ---------- los datos son del destino ---------- */}
      <Section>
        <div className="split">
          <div>
            <Head label={c.datos_eyebrow} title={c.datos_title} lead={c.datos_lead} accent />
            <p className="h-card" style={{ color: "var(--b-accent)", fontSize: 20, maxWidth: "30ch" }}>
              {c.datos_claim}
            </p>
            <ul className="ticks" style={{ marginTop: 22 }}>
              {[1, 2, 3].map((n) => <li key={n}>{K(`datos_bullet_${n}`)}</li>)}
            </ul>
          </div>
          <div className="card" style={{ borderColor: "var(--b-line)" }}>
            <span className="card__n">{c.datos_mockup_label}</span>
            <p style={{ fontSize: 14.5 }}>{c.datos_bi_nota}</p>
            {isPending(c.datos_pendiente) && <Pending>{c.datos_pendiente}</Pending>}
          </div>
        </div>
      </Section>

      {/* ---------- monetización ---------- */}
      <Section alt>
        <Head label={c.monetizacion_eyebrow} title={c.monetizacion_title} lead={c.monetizacion_lead} />
        <div className="grid g-3" style={{ marginTop: 34 }}>
          {[1, 2].map((n) => (
            <div className="card" key={n}>
              <h3 className="h-card">{K(`monetizacion_${n}_title`)}</h3>
              <p style={{ fontSize: 14.5, margin: 0 }}>{K(`monetizacion_${n}_text`)}</p>
            </div>
          ))}
          <div className="card" style={{ borderColor: "var(--b-line)" }}>
            <h3 className="h-card">{c.monetizacion_3_title}</h3>
            <div className="mod__price" style={{ color: "var(--b-accent)" }}>{c.monetizacion_3_dato}</div>
            <p style={{ fontSize: 14.5, margin: "10px 0 0" }}>{c.monetizacion_3_text}</p>
          </div>
        </div>
        <p className="h-card" style={{ marginTop: 30, fontSize: 20, color: "var(--b-primary)", maxWidth: "44ch" }}>
          {c.monetizacion_claim}
        </p>
        <p className="small">{c.monetizacion_nota}</p>
      </Section>

      {/* ---------- caso Ronda ---------- */}
      <Section id="ronda">
        <div className="caso">
          <span className="label label--accent">{c.caso_eyebrow}</span>
          <h2 className="h-sec">{c.caso_title}</h2>
          <div className="split" style={{ marginTop: 8 }}>
            <div>
              <h3 className="h-card">{c.caso_contexto_title}</h3>
              <p>{c.caso_contexto_text}</p>
              <h3 className="h-card" style={{ marginTop: 26 }}>{c.caso_despliegue_title}</h3>
              <ul className="ticks">
                {[1, 2, 3, 4, 5].map((n) => <li key={n}>{K(`caso_despliegue_${n}`)}</li>)}
              </ul>
              <p className="small" style={{ color: "var(--b-text)" }}>{c.caso_estado}</p>
            </div>
            <div>
              <div className="caso__stats" style={{ marginTop: 0, paddingTop: 0, borderTop: 0 }}>
                {[1, 2].map((n) => (
                  <Stat key={n} v={K(`caso_stat_${n}_val`)} l={K(`caso_stat_${n}_label`)} />
                ))}
              </div>
              <div style={{ marginTop: 26, paddingTop: 24, borderTop: "1px solid var(--b-line-soft)" }}>
                <h3 className="h-card">{c.caso_segundo_title}</h3>
                <p style={{ fontSize: 14.5 }}>{c.caso_segundo_text}</p>
                <p className="small" style={{ color: "var(--b-slate)" }}>{c.caso_respaldo}</p>
              </div>
            </div>
          </div>
          <div style={{ marginTop: 26, display: "grid", gap: 10 }}>
            {/* La cita ya es real; los demás pendientes del caso se resolvieron
                (datos → solo en demo, CdS → aceleradora). Solo se pinta lo que tenga contenido. */}
            {[1, 2, 3, 4]
              .map((n) => K(`caso_pendiente_${n}`))
              .filter((v) => v.trim() !== "")
              .map((v, i) =>
                isPending(v) ? (
                  <Pending key={i}>{v}</Pending>
                ) : (
                  <p key={i} className="b360-quote">{v}</p>
                ),
              )}
          </div>
        </div>
      </Section>

      {/* ---------- integración sin fricción ---------- */}
      <Section alt>
        <Head label={c.integracion_eyebrow} title={c.integracion_title} lead={c.integracion_lead} />
        <div className="split" style={{ marginTop: 30 }}>
          <div className="grid g-2">
            {[1, 2, 3, 4].map((n) => (
              <div className="card" key={n}>
                <h3 className="h-card">{K(`integracion_${n}_title`)}</h3>
                <p style={{ fontSize: 14.5, margin: 0 }}>{K(`integracion_${n}_text`)}</p>
              </div>
            ))}
          </div>
          <div className="card" style={{ borderColor: "var(--b-line)", textAlign: "center" }}>
            <div className="mod__price" style={{ fontSize: 56, marginTop: 8 }}>{c.integracion_dato_val}</div>
            <div className="mod__unit">{c.integracion_dato_unidad}</div>
            <p style={{ fontSize: 14.5, marginTop: 14 }}>{c.integracion_dato_label}</p>
            
          </div>
        </div>
      </Section>

      {/* ---------- cómo se contrata y cómo se justifica ---------- */}
      <Section>
        <Head label={c.contratacion_eyebrow} title={c.contratacion_title} />
        <div className="split" style={{ marginTop: 26 }}>
          <Steps
            items={[1, 2, 3, 4, 5].map((n) => ({
              t: K(`contratacion_paso_${n}_title`),
              d: K(`contratacion_paso_${n}_text`),
            }))}
          />
          <div>
            <div className="card">
              <h3 className="h-card">{c.justificacion_title}</h3>
              <ul className="ticks" style={{ marginBottom: 0 }}>
                {[1, 2, 3, 4, 5].map((n) => <li key={n}>{K(`justificacion_${n}`)}</li>)}
              </ul>
            </div>
            <div className="card" style={{ marginTop: 16, borderColor: "var(--b-line)" }}>
              <h3 className="h-card">{c.contratacion_publica_title}</h3>
              <Txt v={c.contratacion_publica_text} />
            </div>
          </div>
        </div>
      </Section>

      {/* ---------- FAQ ---------- */}
      <Section alt>
        <h2 className="h-sec" style={{ marginBottom: 28 }}>{c.faq_title}</h2>
        <div style={{ maxWidth: 820 }}>
          <Faq items={[1, 2, 3, 4, 5, 6, 7].map((n) => ({ q: K(`faq_${n}_q`), a: K(`faq_${n}_a`) }))} />
        </div>
      </Section>

      {/* ---------- CTA + formulario ---------- */}
      <Section>
        <div className="split">
          <div>
            <h2 className="h-sec">{c.cta_title}</h2>
            <p className="lead">{c.cta_sub}</p>
            <p className="small">{c.cta_reaseguro}</p>
            <div style={{ marginTop: 20, display: "grid", gap: 10 }}>
              <a href={`mailto:${c.cta_contacto_email}`} style={{ fontFamily: "var(--b-mono)", fontSize: 13, color: "var(--b-primary)" }}>
                {c.cta_contacto_email}
              </a>
              <span style={{ fontFamily: "var(--b-mono)", fontSize: 13, color: "var(--b-slate)" }}>
                {c.cta_contacto_direccion}
              </span>
              <a href={waHref()} target="_blank" rel="noopener noreferrer" style={{ fontFamily: "var(--b-mono)", fontSize: 13, color: "var(--b-primary)" }}>
                {c.cta_pendiente_telefono}
              </a>
            </div>
          </div>
          <div className="card" style={{ borderColor: "var(--b-line)" }}>
            <h3 className="h-card">{c.cta_form_title}</h3>
            {/* Antes: una maqueta con los campos disabled. Un formulario
                decorativo no se publica — este es el real, el mismo de /360/demo. */}
            <div style={{ marginTop: 18 }}>
              <DemoForm locale={locale} defaultVertical="Destino · ayuntamiento, patronato o DMO" />
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}

export default function Page() {
  return <Destinos360 locale="es" />;
}
