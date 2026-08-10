import type { Metadata } from "next";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import { draftMode } from "next/headers";
import { defaultHome360Content } from "@/lib/content/b360/home";
import { pageContent } from "@/lib/cms-pages";
import { Section, Head, Cta, Faq, Stat, Steps, Pending, isPending } from "@/components/b360/Bits";

export const metadata: Metadata = buildMetadata({
  title: "discoolver 360 — plataforma para destinos turísticos",
  description:
    "Marketplace, punto de venta, rutas, eventos, asistente de voz, señalética y business intelligence para destinos, alojamientos y agencias. Módulos desde 100 €/mes.",
  path: "/360",
  image: "/assets/360/og-360.png",
  siteName: "discoolver 360",
  // Va de la mano del banner "PROPUESTA EN REVISIÓN" del layout: mientras /360
  // sea una propuesta no puede indexarse. Se quitan los dos a la vez con el OK.
  noindex: true,
});

export default async function Home360() {
  const { isEnabled: isDraft } = await draftMode();
  const c = await pageContent("360-home", defaultHome360Content, isDraft);

  const MODULOS = [1, 2, 3, 4, 5, 6, 7].map((n) => ({
    nombre: c[`modulo_${n}_nombre` as keyof typeof c] as string,
    resuelve: c[`modulo_${n}_resuelve` as keyof typeof c] as string,
    precio: c[`modulo_${n}_precio` as keyof typeof c] as string,
  }));

  const VERTICALES = [1, 2, 3].map((n) => ({
    etiqueta: c[`vert_${n}_etiqueta` as keyof typeof c] as string,
    frase: c[`vert_${n}_frase` as keyof typeof c] as string,
    texto: c[`vert_${n}_texto` as keyof typeof c] as string,
    label: c[`vert_${n}_cta_label` as keyof typeof c] as string,
    href: c[`vert_${n}_cta_href` as keyof typeof c] as string,
  }));

  const FAQ = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => ({
    q: c[`faq_${n}_p` as keyof typeof c] as string,
    a: c[`faq_${n}_r` as keyof typeof c] as string,
  }));

  return (
    <>
      {/* ---------- hero ---------- */}
      <section className="hero">
        <div className="wrap">
          <span className="label">{c.hero_eyebrow}</span>
          <h1 className="h-hero">{c.hero_title}</h1>
          <p className="lead">{c.hero_sub}</p>
          <div className="btns">
            <Cta href={c.hero_cta_primary_href}>{c.hero_cta_primary_label}</Cta>
            <Cta href={c.hero_cta_secondary_href} variant="2">
              {c.hero_cta_secondary_label}
            </Cta>
          </div>
          <p className="small" style={{ marginTop: 30, maxWidth: "60ch" }}>
            {c.hero_note}
          </p>
          <p
            className="small"
            style={{
              marginTop: 26,
              paddingTop: 22,
              borderTop: "1px solid var(--b-line-soft)",
              fontFamily: "var(--b-mono)",
              fontSize: 12.5,
              lineHeight: 1.7,
              maxWidth: "78ch",
            }}
          >
            {c.hero_proof}
          </p>
        </div>
      </section>

      {/* ---------- diferenciales ---------- */}
      <Section alt>
        <Head label={c.diferenciales_eyebrow} title={c.diferenciales_titulo} />
        <div className="grid g-3" style={{ marginTop: 40 }}>
          {[1, 2, 3].map((n) => (
            <div className="card" key={n}>
              <span className="card__n">0{n}</span>
              <h3 className="h-card">{c[`dif_${n}_titulo` as keyof typeof c] as string}</h3>
              <p style={{ fontSize: 14.5, margin: 0 }}>{c[`dif_${n}_texto` as keyof typeof c] as string}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ---------- módulos ---------- */}
      <Section id="modulos">
        <Head label={c.modulos_eyebrow} title={c.modulos_titulo} lead={c.modulos_intro} />
        <div className="grid g-2" style={{ marginTop: 34 }}>
          {MODULOS.map((m, i) => (
            <div className="card mod" key={m.nombre}>
              <span className="card__n">MÓDULO 0{i + 1}</span>
              <h3 className="h-card">{m.nombre}</h3>
              <p>{m.resuelve}</p>
              <div>
                <div className="mod__price" style={i === 6 ? { color: "var(--b-accent)" } : undefined}>
                  {m.precio}
                </div>
              </div>
            </div>
          ))}
        </div>
        {isPending(c.modulos_nota) ? (
          <div style={{ marginTop: 22 }}>
            <Pending>{c.modulos_nota}</Pending>
          </div>
        ) : (
          <p className="small" style={{ marginTop: 22 }}>{c.modulos_nota}</p>
        )}
      </Section>

      {/* ---------- inversión: la honestidad económica ---------- */}
      <Section alt>
        <Head label={c.inversion_eyebrow} title={c.inversion_titulo} lead={c.inversion_intro} />
        <div className="grid g-3" style={{ marginTop: 36 }}>
          {[1, 2, 3].map((n) => (
            <div className="card" key={n}>
              <div
                className="mod__price"
                style={{ marginTop: 0, color: n === 2 ? "var(--b-accent)" : "var(--b-primary)" }}
              >
                {c[`inversion_${n}_valor` as keyof typeof c] as string}
              </div>
              <h3 className="h-card" style={{ marginTop: 12 }}>
                {c[`inversion_${n}_titulo` as keyof typeof c] as string}
              </h3>
              <p style={{ fontSize: 14.5, margin: 0 }}>
                {c[`inversion_${n}_texto` as keyof typeof c] as string}
              </p>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 22 }}>
          <Pending>{c.inversion_nota}</Pending>
        </div>
      </Section>

      {/* ---------- ecosistema ---------- */}
      <Section>
        <Head label={c.eco_eyebrow} title={c.eco_titulo} lead={c.eco_intro} />
        <div style={{ marginTop: 26, maxWidth: 760 }}>
          <Steps
            items={[1, 2, 3].map((n) => ({
              t: c[`paso_${n}_titulo` as keyof typeof c] as string,
              d: c[`paso_${n}_texto` as keyof typeof c] as string,
            }))}
          />
        </div>
        <p className="small" style={{ marginTop: 26, color: "var(--b-accent)" }}>
          {c.eco_cierre}
        </p>
      </Section>

      {/* ---------- caso Ronda ---------- */}
      <Section id="ronda" alt>
        <div className="caso">
          <span className="label label--accent">{c.caso_eyebrow}</span>
          <h2 className="h-sec">{c.caso_titulo}</h2>
          <div className="split" style={{ marginTop: 8 }}>
            <div>
              <p>{c.caso_contexto}</p>
              <ul className="ticks" style={{ marginTop: 20 }}>
                {[1, 2, 3, 4].map((n) => (
                  <li key={n}>{c[`caso_bullet_${n}` as keyof typeof c] as string}</li>
                ))}
              </ul>
              <p className="small" style={{ color: "var(--b-text)" }}>{c.caso_estado}</p>
            </div>
            <div>
              <div className="caso__stats" style={{ marginTop: 0, paddingTop: 0, borderTop: 0 }}>
                {[1, 2, 3, 4].map((n) => (
                  <Stat
                    key={n}
                    v={c[`caso_dato_${n}_valor` as keyof typeof c] as string}
                    l={c[`caso_dato_${n}_label` as keyof typeof c] as string}
                  />
                ))}
              </div>
            </div>
          </div>
          <p
            className="small"
            style={{ marginTop: 30, paddingTop: 24, borderTop: "1px solid var(--b-line-soft)" }}
          >
            {c.caso_segundo}
          </p>
          <div style={{ marginTop: 16 }}>
            <Pending>{c.caso_cita}</Pending>
          </div>
        </div>
      </Section>

      {/* ---------- verticales ---------- */}
      <Section>
        <Head label={c.vert_eyebrow} title={c.vert_titulo} lead={c.vert_intro} />
        <div className="grid g-3" style={{ marginTop: 36 }}>
          {VERTICALES.map((v) => (
            <Link href={v.href} className="card vert" key={v.etiqueta}>
              <span className="card__n">{v.etiqueta.toUpperCase()}</span>
              <h3 className="h-card" style={{ fontSize: 19 }}>{v.frase}</h3>
              {isPending(v.texto) ? (
                <Pending>{v.texto}</Pending>
              ) : (
                <p style={{ fontSize: 14.5, margin: 0 }}>{v.texto}</p>
              )}
              <span className="vert__go">{v.label} →</span>
            </Link>
          ))}
        </div>
      </Section>

      {/* ---------- FAQ ---------- */}
      <Section alt>
        <h2 className="h-sec" style={{ marginBottom: 28 }}>{c.faq_titulo}</h2>
        <div style={{ maxWidth: 820 }}>
          <Faq items={FAQ} />
        </div>
      </Section>

      {/* ---------- CTA ---------- */}
      <Section>
        <div className="band">
          <span className="label">{c.cta_eyebrow}</span>
          <h2 className="h-sec">{c.cta_titulo}</h2>
          <p className="lead">{c.cta_texto}</p>
          <div className="btns">
            <Cta href={c.cta_boton_href}>{c.cta_boton_label}</Cta>
          </div>
          <p className="small" style={{ marginTop: 22 }}>{c.cta_reaseguro}</p>
          <div style={{ marginTop: 14, display: "grid", gap: 10, justifyItems: "center" }}>
            <a
              href={`mailto:${c.cta_email}`}
              style={{ fontFamily: "var(--b-mono)", fontSize: 12.5, color: "var(--b-primary)" }}
            >
              {c.cta_email}
            </a>
            <span style={{ fontFamily: "var(--b-mono)", fontSize: 12.5, color: "var(--b-slate)" }}>
              {c.cta_direccion}
            </span>
            <div style={{ maxWidth: 560 }}>
              <Pending>{c.cta_telefono}</Pending>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
