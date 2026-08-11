"use client";

import { useState } from "react";
import type { Sku } from "@/lib/checkout";
import type { Locale } from "@/lib/i18n";

/**
 * Los botones de compra de una guía. Solo se montan cuando la tienda está
 * abierta (NEXT_PUBLIC_CHECKOUT=1 — el que decide es el server component que
 * los renderiza); hasta entonces las fichas siguen en "Avísame".
 *
 * POST /api/checkout → redirección a Stripe Checkout. El error se enseña,
 * nunca se finge éxito (misma regla que la waitlist).
 */
const T = {
  es: { digital: "Comprar digital · 14€", papel: "Papel · 29€", cargando: "Abriendo el pago…", error: "No se pudo abrir el pago. Prueba otra vez o escribe a hola@discoolver.com." },
  en: { digital: "Buy digital · €14", papel: "Print · €29", cargando: "Opening checkout…", error: "Couldn't open checkout. Try again or write to hola@discoolver.com." },
} as const;

export function BuyButtons({ digital, papel, locale = "es" }: { digital: Sku; papel: Sku; locale?: Locale }) {
  const [busy, setBusy] = useState<Sku | null>(null);
  const [error, setError] = useState(false);
  const t = T[locale];

  async function buy(sku: Sku) {
    setBusy(sku);
    setError(false);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sku, locale }),
      });
      const data = (await res.json()) as { ok: boolean; url?: string };
      if (data.ok && data.url) {
        window.location.href = data.url;
        return;
      }
      setError(true);
    } catch {
      setError(true);
    }
    setBusy(null);
  }

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 12 }}>
      <button type="button" className="btn btn-primary" style={{ padding: "10px 18px", fontSize: 14 }} disabled={busy !== null} onClick={() => buy(digital)}>
        {busy === digital ? t.cargando : t.digital}
      </button>
      <button type="button" className="btn btn-ghost" style={{ padding: "10px 18px", fontSize: 14 }} disabled={busy !== null} onClick={() => buy(papel)}>
        {busy === papel ? t.cargando : t.papel}
      </button>
      {error && (
        <p role="alert" style={{ width: "100%", margin: 0, fontSize: 13, color: "var(--primary-2)" }}>
          {t.error}
        </p>
      )}
    </div>
  );
}
