"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { localeFromPath } from "@/lib/i18n";

/**
 * Consentimiento de cookies y medición, acoplados a propósito.
 *
 * La regla es una sola: **no se carga nada de medición hasta que alguien dice
 * que sí**, y si no hay nada que medir tampoco se pregunta.
 *
 *   · Sin `NEXT_PUBLIC_GA_ID` → ni banner ni scripts. Es el estado en el que
 *     estaba la web hasta hoy, y es el que hace verdad la página /cookies
 *     cuando dice que no se instala ninguna.
 *   · Con `NEXT_PUBLIC_GA_ID` → sale el banner. Google Analytics solo se
 *     inyecta después de «Aceptar», nunca antes, y «Rechazar» se recuerda
 *     igual que la aceptación para no volver a preguntar en cada página.
 *
 * Esto es lo que exige el RGPD para cookies no necesarias: consentimiento
 * previo, informado y tan fácil de negar como de dar. Por eso los dos botones
 * pesan lo mismo — no hay un «Aceptar» gigante y un «Rechazar» escondido.
 */
const CLAVE = "dc_consent";           // "si" | "no"
const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function cargarAnalitica(id: string) {
  if (document.getElementById("ga-src")) return;
  const s = document.createElement("script");
  s.id = "ga-src";
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
  document.head.appendChild(s);
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params -- gtag exige `arguments`
    window.dataLayer!.push(arguments);
  };
  window.gtag("js", new Date());
  // Sin cookies de publicidad ni señales de anuncios: solo medición de web.
  window.gtag("config", id, { anonymize_ip: true, allow_google_signals: false });
}

export function Consent() {
  const [visible, setVisible] = useState(false);
  // El banner lo monta el layout raíz, que sirve a los dos idiomas: sin esto
  // salía en castellano —y enlazando a /cookies— también en las 13 páginas
  // inglesas. Se derivará del path, igual que hace HtmlShell con el <html lang>.
  const locale = localeFromPath(usePathname());
  const es = locale === "es";

  useEffect(() => {
    if (!GA_ID) return;                       // nada que consentir
    const guardado = localStorage.getItem(CLAVE);
    if (guardado === "si") {
      cargarAnalitica(GA_ID);
      return;
    }
    if (guardado === "no") return;
    setVisible(true);
  }, []);

  if (!GA_ID || !visible) return null;

  const decidir = (valor: "si" | "no") => {
    localStorage.setItem(CLAVE, valor);
    setVisible(false);
    if (valor === "si") cargarAnalitica(GA_ID);
  };

  return (
    <div className="consent" role="dialog" aria-live="polite" aria-label="Cookies">
      <p className="consent__texto">
        {es ? (
          <>
            Usamos una cookie de medición para saber qué se lee y qué no. Nada de publicidad
            ni de seguimiento entre webs. Lo contamos entero en{" "}
            <Link href="/cookies">la política de cookies</Link>.
          </>
        ) : (
          <>
            We use one measurement cookie to know what gets read and what doesn&apos;t. No
            advertising, no tracking across sites. It&apos;s all spelled out in our{" "}
            <Link href="/en/cookies">cookie policy</Link>.
          </>
        )}
      </p>
      <div className="consent__botones">
        <button type="button" className="btn btn-ghost" onClick={() => decidir("no")}>
          {es ? "Rechazar" : "Reject"}
        </button>
        <button type="button" className="btn btn-primary" onClick={() => decidir("si")}>
          {es ? "Aceptar" : "Accept"}
        </button>
      </div>
    </div>
  );
}
