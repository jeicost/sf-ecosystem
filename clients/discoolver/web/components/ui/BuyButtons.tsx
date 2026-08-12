"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { RENUNCIA, type Sku } from "@/lib/checkout";
import type { Locale } from "@/lib/i18n";

/**
 * Los botones de compra de una guía. Solo se montan cuando la tienda está
 * abierta (NEXT_PUBLIC_CHECKOUT=1 — el que decide es el server component que
 * los renderiza); hasta entonces las fichas siguen en "Avísame".
 *
 * POST /api/checkout → redirección a Stripe Checkout. El error se enseña,
 * nunca se finge éxito (misma regla que la waitlist).
 *
 * LA CASILLA NO ES OPCIONAL. El artículo 103.m del TRLGDCU solo quita el
 * derecho de desistimiento al contenido digital si el comprador consiente
 * expresamente la entrega inmediata **y** reconoce que por eso pierde los 14
 * días. Sin eso, quien se descargue la guía puede pedir el dinero de vuelta y
 * tendría razón. Por eso el botón de la digital está deshabilitado hasta que
 * se marca, y el servidor vuelve a comprobarlo por su cuenta: una casilla del
 * navegador se salta con una petición a mano.
 *
 * El papel NO la lleva: conserva sus 14 días como cualquier producto físico.
 */
const T = {
  es: {
    digital: "Comprar digital · 14€",
    papel: "Papel · 29€",
    cargando: "Abriendo el pago…",
    error: "No se pudo abrir el pago. Prueba otra vez o escribe a hola@discoolver.com.",
    faltaRenuncia: "Marca la casilla para poder comprar la versión digital.",
    verTerminos: "Ver términos",
  },
  en: {
    digital: "Buy digital · €14",
    papel: "Print · €29",
    cargando: "Opening checkout…",
    error: "Couldn't open checkout. Try again or write to hola@discoolver.com.",
    faltaRenuncia: "Tick the box to buy the digital version.",
    verTerminos: "See terms",
  },
} as const;

export function BuyButtons({
  digital,
  papel,
  locale = "es",
}: {
  digital: Sku;
  papel: Sku;
  locale?: Locale;
}) {
  const [busy, setBusy] = useState<Sku | null>(null);
  const [error, setError] = useState<null | "red" | "renuncia">(null);
  const [renuncia, setRenuncia] = useState(false);
  const t = T[locale];
  const idCasilla = useId();

  async function buy(sku: Sku) {
    const esDigital = sku === digital;
    if (esDigital && !renuncia) {
      setError("renuncia");
      return;
    }
    setBusy(sku);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sku, locale, renuncia: esDigital ? renuncia : undefined }),
      });
      const data = (await res.json()) as { ok: boolean; url?: string };
      if (data.ok && data.url) {
        window.location.href = data.url;
        return;
      }
      setError("red");
    } catch {
      setError("red");
    }
    setBusy(null);
  }

  return (
    <div style={{ marginTop: 12 }}>
      <label htmlFor={idCasilla} className="renuncia">
        <input
          id={idCasilla}
          type="checkbox"
          checked={renuncia}
          onChange={(e) => {
            setRenuncia(e.target.checked);
            if (e.target.checked) setError(null);
          }}
        />
        <span>
          {RENUNCIA[locale]}{" "}
          <Link href={locale === "en" ? "/en/terminos" : "/terminos"}>{t.verTerminos}</Link>
        </span>
      </label>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 12 }}>
        <button
          type="button"
          className="btn btn-primary"
          style={{ padding: "10px 18px", fontSize: 14 }}
          disabled={busy !== null || !renuncia}
          title={renuncia ? undefined : t.faltaRenuncia}
          onClick={() => buy(digital)}
        >
          {busy === digital ? t.cargando : t.digital}
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          style={{ padding: "10px 18px", fontSize: 14 }}
          disabled={busy !== null}
          onClick={() => buy(papel)}
        >
          {busy === papel ? t.cargando : t.papel}
        </button>
        {error && (
          <p role="alert" style={{ width: "100%", margin: 0, fontSize: 13, color: "var(--primary-2)" }}>
            {error === "renuncia" ? t.faltaRenuncia : t.error}
          </p>
        )}
      </div>
    </div>
  );
}
