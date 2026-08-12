import Link from "next/link";
import type { ReactNode } from "react";
import type { LegalDoc as Doc } from "@/lib/content/legal";
import type { Locale } from "@/lib/i18n";

/**
 * Render de un documento legal. Mismo esqueleto visual que /privacidad
 * (que ya estaba en producción) para que las cuatro páginas legales se lean
 * igual: `.section` + contenedor de 760px + `.prose`.
 *
 * `inline` entiende dos marcas y nada más: **negrita** y [texto](destino).
 * Es deliberado — el contenido legal viene de lib/content/legal.ts como texto
 * plano y así no hace falta dangerouslySetInnerHTML en ningún sitio.
 */
function inline(text: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)]+)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1] !== undefined) {
      out.push(<strong key={`${keyBase}-b${i}`}>{m[1]}</strong>);
    } else {
      const href = m[3];
      const external = href.startsWith("http") || href.startsWith("mailto:");
      out.push(
        external ? (
          <a
            key={`${keyBase}-a${i}`}
            href={href}
            {...(href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          >
            {m[2]}
          </a>
        ) : (
          <Link key={`${keyBase}-a${i}`} href={href}>
            {m[2]}
          </Link>
        ),
      );
    }
    last = m.index + m[0].length;
    i += 1;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function LegalDoc({ doc, locale = "es" }: { doc: Doc; locale?: Locale }) {
  return (
    <main className="section" style={{ paddingTop: 120 }}>
      <div className="container" style={{ maxWidth: 760 }}>
        <span className="eyebrow">{doc.eyebrow}</span>
        <h1 className="display-lg" style={{ marginBottom: 24 }}>
          {doc.h1}
        </h1>
        <p className="section__lead" style={{ marginBottom: 40 }}>
          {doc.lead}
        </p>

        <div className="prose" style={{ display: "grid", gap: 28 }}>
          {doc.sections.map((s, si) => (
            <section key={s.h}>
              <h2 className="display-sm">{s.h}</h2>
              {s.p?.map((p, pi) => <p key={pi}>{inline(p, `s${si}p${pi}`)}</p>)}
              {s.ul && (
                <ul>
                  {s.ul.map((li, li_) => (
                    <li key={li_}>{inline(li, `s${si}l${li_}`)}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        <p style={{ marginTop: 40, fontSize: 14, color: "var(--ink-2)" }}>{doc.updatedLabel}</p>

        <p style={{ marginTop: 24 }}>
          <Link href={locale === "en" ? "/en" : "/"} className="btn btn-ghost">
            {doc.back}
          </Link>
        </p>
      </div>
    </main>
  );
}
