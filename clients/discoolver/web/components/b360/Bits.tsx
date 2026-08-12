import Link from "next/link";
import { waHref } from "@/lib/site";

/**
 * Primitivas compartidas de la marca 360.
 *
 * `Pending` es deliberado: el copy trae campos con [PENDIENTE: qué falta — de quién]
 * y en una propuesta en revisión eso vale más visible que escondido. Cuando el dato
 * llegue, se sustituye el valor en lib/content/b360 y el aviso desaparece solo.
 */

export function Pending({ children }: { children: string }) {
  const txt = children.replace(/^\[PENDIENTE:?\s*/i, "").replace(/\]$/, "");
  return (
    <span
      style={{
        display: "block",
        border: "1px dashed var(--b-primary)",
        background: "var(--b-primary-soft)",
        borderRadius: 8,
        padding: "10px 14px",
        fontFamily: "var(--b-mono)",
        fontSize: 12.5,
        lineHeight: 1.5,
        color: "#fff",
      }}
    >
      <strong style={{ color: "var(--b-primary)" }}>PENDIENTE · </strong>
      {txt}
    </span>
  );
}

/** Pinta el valor, o el aviso si el valor es un pendiente. */
export function Txt({ v, className }: { v: string; className?: string }) {
  if (v.trim().startsWith("[PENDIENTE")) return <Pending>{v}</Pending>;
  return <p className={className}>{v}</p>;
}

export function isPending(v: string) {
  return v.trim().startsWith("[PENDIENTE");
}

export function Section({
  id,
  alt,
  tight,
  children,
}: {
  id?: string;
  alt?: boolean;
  tight?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className={`sec${alt ? " sec--alt" : ""}${tight ? " sec--tight" : ""}`}>
      <div className="wrap">{children}</div>
    </section>
  );
}

export function Head({
  label,
  title,
  lead,
  accent,
}: {
  label?: string;
  title: string;
  lead?: string;
  accent?: boolean;
}) {
  return (
    <>
      {label && <span className={`label${accent ? " label--accent" : ""}`}>{label}</span>}
      <h2 className="h-sec">{title}</h2>
      {lead && (isPending(lead) ? <Pending>{lead}</Pending> : <p className="lead">{lead}</p>)}
    </>
  );
}

export function Cta({
  href,
  children,
  variant = "1",
}: {
  href: string;
  children: React.ReactNode;
  variant?: "1" | "2";
}) {
  const cls = `btn btn-${variant}`;
  if (href.startsWith("http") || href.startsWith("mailto") || href.startsWith("tel")) {
    return (
      <a href={href} className={cls}>
        {children} <span aria-hidden="true">→</span>
      </a>
    );
  }
  return (
    <Link href={href} className={cls}>
      {children} <span aria-hidden="true">→</span>
    </Link>
  );
}

export function Faq({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div className="faq">
      {items.map((it, i) => (
        <details key={it.q} open={i === 0}>
          <summary>{it.q}</summary>
          {isPending(it.a) ? (
            <div style={{ padding: "0 44px 22px 0" }}>
              <Pending>{it.a}</Pending>
            </div>
          ) : (
            <p>{it.a}</p>
          )}
        </details>
      ))}
    </div>
  );
}

export function Stat({ v, l }: { v: string; l: string }) {
  return (
    <div className="stat">
      <span className="stat__v">{v}</span>
      <span className="stat__l">{l}</span>
    </div>
  );
}

export function Steps({ items }: { items: { t: string; d: string }[] }) {
  return (
    <div className="steps">
      {items.map((s) => (
        <div className="step" key={s.t}>
          <h4>{s.t}</h4>
          {isPending(s.d) ? <Pending>{s.d}</Pending> : <p>{s.d}</p>}
        </div>
      ))}
    </div>
  );
}

/** Banda de cierre reutilizable en las cuatro páginas. */
export function Band({
  label,
  title,
  text,
  ctaLabel,
  ctaHref,
  note,
  email,
  phone,
}: {
  label?: string;
  title: string;
  text: string;
  ctaLabel: string;
  ctaHref: string;
  note?: string;
  email?: string;
  phone?: string;
}) {
  return (
    <Section>
      <div className="band">
        {label && <span className="label">{label}</span>}
        <h2 className="h-sec">{title}</h2>
        <p className="lead">{text}</p>
        <div className="btns">
          <Cta href={ctaHref}>{ctaLabel}</Cta>
        </div>
        {note && <p className="small" style={{ marginTop: 22 }}>{note}</p>}
        <div style={{ marginTop: 14, display: "grid", gap: 8, justifyItems: "center" }}>
          {email && !isPending(email) && (
            <a href={`mailto:${email}`} style={{ fontFamily: "var(--b-mono)", fontSize: 12.5, color: "var(--b-primary)" }}>
              {email}
            </a>
          )}
          {phone && (isPending(phone) ? <Pending>{phone}</Pending> : (
            <a href={waHref()} target="_blank" rel="noopener noreferrer" style={{ fontFamily: "var(--b-mono)", fontSize: 12.5, color: "var(--b-muted)" }}>
              {phone}
            </a>
          ))}
        </div>
      </div>
    </Section>
  );
}
