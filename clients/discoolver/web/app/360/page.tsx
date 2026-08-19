import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import { draftMode } from "next/headers";
import { defaultHome360Content } from "@/lib/content/b360/home";
import { defaultHome360Content as defaultHome360ContentEn } from "@/lib/content/b360/en/home";
import { withLocale, type Locale } from "@/lib/i18n";
import { pageContent } from "@/lib/cms-pages";
import { Section, Head, Cta, Faq, Stat, Steps, Pending, isPending } from "@/components/b360/Bits";
import { FondoEscena, MarcoEscena } from "@/components/b360/Escena360";
import { waHref } from "@/lib/site";

export const metadata: Metadata = buildMetadata({
  title: "discoolver 360 — plataforma para destinos turísticos",
  description:
    "Marketplace, punto de venta, rutas, eventos, asistente de voz, señalética y business intelligence para destinos, alojamientos y agencias. Módulos desde 100 €/mes.",
  path: "/360",
  image: "/assets/360/og-360.jpg",
  siteName: "discoolver 360",
});

export async function Home360({ locale = "es" }: { locale?: Locale }) {
  const { isEnabled: isDraft } = await draftMode();
  const slug = locale === "en" ? ("360-home-en" as const) : ("360-home" as const);
  const fallback = locale === "en" ? defaultHome360ContentEn : defaultHome360Content;
  const c = await pageContent(slug, fallback, isDraft);

  const MODULOS = [1, 2, 3, 4, 5, 6, 7].map((n) => ({
    nombre: c[`modulo_${n}_nombre` as keyof typeof c] as string,
    resuelve: c[`modulo_${n}_resuelve` as keyof typeof c] as string,
    precio: c[`modulo_${n}_precio` as keyof typeof c] as string,
  }));

  // La foto de cada vertical va por posición, igual que el resto de sus campos.
  const FOTO_VERT = ["vert-destinos", "vert-alojamientos", "vert-agencias"];
  const VERTICALES = [1, 2, 3].map((n) => ({
    foto: FOTO_VERT[n - 1],
    etiqueta: c[`vert_${n}_etiqueta` as keyof typeof c] as string,
    frase: c[`vert_${n}_frase` as keyof typeof c] as string,
    texto: c[`vert_${n}_texto` as keyof typeof c] as string,
    label: c[`vert_${n}_cta_label` as keyof typeof c] as string,
    href: c[`vert_${n}_cta_href` as keyof typeof c] as string,
  }));

  // Una vertical cuyo texto sigue en [PENDIENTE] no se publica sola por estar
  // en el array: hay que escribirle el texto a mano. Así fue como agencias
  // estuvo fuera desde el 10-ago hasta que hubo propuesta de valor.
  const publicables = VERTICALES.filter((v) => !isPending(v.texto));

  const FAQ = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => ({
    q: c[`faq_${n}_p` as keyof typeof c] as string,
    a: c[`faq_${n}_r` as keyof typeof c] as string,
  }));

  return (
    <>
      {/* ---------- hero ---------- */}
      <section className="hero b360-escena">
        <FondoEscena src="/assets/360/escenas/hero-360.jpg" alt="Un destino mediterráneo a hora azul con una capa de datos sobre los tejados" prioridad intensidad="alta" />
        <div className="wrap">
          <span className="label">{c.hero_eyebrow}</span>
          <h1 className="h-hero">{c.hero_title}</h1>
          <p className="lead">{c.hero_sub}</p>
          <div className="btns">
            <Cta href={withLocale(c.hero_cta_primary_href, locale)}>{c.hero_cta_primary_label}</Cta>
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
        <p className="small" style={{ marginTop: 22 }}>{c.inversion_nota}</p>
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
          {/* El caso de Ronda es la única prueba real que tiene 360 y se
              contaba sin enseñar el sitio. */}
          <MarcoEscena
            src="/assets/360/escenas/ronda.jpg"
            alt="Ronda a hora dorada: el Puente Nuevo sobre el Tajo y las casas al borde del acantilado"
            alto={380}
            className="caso__foto"
          />
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
            {isPending(c.caso_cita) ? (
              <Pending>{c.caso_cita}</Pending>
            ) : (
              <p className="b360-quote">{c.caso_cita}</p>
            )}
          </div>
        </div>
      </Section>

      {/* ---------- verticales ---------- */}
      <Section>
        <Head label={c.vert_eyebrow} title={c.vert_titulo} lead={c.vert_intro} />
        {/* Agencias entra en el bloque desde el 13-ago-2026: el CEO la abre para
            revisarla con dirección comercial. Sigue el filtro por [PENDIENTE]
            para cualquier vertical futura — una tarjeta sin texto aprobado no se
            publica sola por estar en el array. El grid se adapta al número de
            verticales que sobrevivan al filtro, que es lo que fallaba antes:
            estaba fijado a dos y la tercera se quedaba sola con medio bloque en
            blanco al lado. */}
        <div
          className="grid"
          style={{
            marginTop: 36,
            gridTemplateColumns: `repeat(${Math.min(publicables.length, 3)}, minmax(0, 1fr))`,
          }}
        >
          {publicables.map((v) => (
            <Link href={withLocale(v.href, locale)} className="card vert vert--foto" key={v.etiqueta}>
              <span className="vert__media">
                <Image
                  src={`/assets/360/escenas/${v.foto}.jpg`}
                  alt=""
                  fill
                  sizes="(max-width: 900px) 100vw, 33vw"
                  quality={78}
                  style={{ objectFit: "cover" }}
                />
              </span>
              <span className="card__n">{v.etiqueta.toUpperCase()}</span>
              <h3 className="h-card" style={{ fontSize: 19 }}>{v.frase}</h3>
              <p style={{ fontSize: 14.5, margin: 0 }}>{v.texto}</p>
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
            <Cta href={withLocale(c.cta_boton_href, locale)}>{c.cta_boton_label}</Cta>
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
            {isPending(c.cta_telefono) ? (
              <div style={{ maxWidth: 560 }}>
                <Pending>{c.cta_telefono}</Pending>
              </div>
            ) : (
              <a
                href={waHref()} target="_blank" rel="noopener noreferrer"
                style={{ fontFamily: "var(--b-mono)", fontSize: 12.5, color: "var(--b-primary)" }}
              >
                {c.cta_telefono}
              </a>
            )}
          </div>
        </div>
      </Section>
    </>
  );
}

export default function Page() {
  return <Home360 locale="es" />;
}
