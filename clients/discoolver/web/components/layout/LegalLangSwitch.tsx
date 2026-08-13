"use client";

import { usePathname } from "next/navigation";
import { altPath } from "@/lib/i18n";
import { LangSwitch } from "@/components/layout/LangSwitch";

/**
 * El selector de idioma de las cuatro páginas legales (y sus cuatro gemelas
 * inglesas), que son las únicas del sitio que se sirven sin nav ni pie: quien
 * llegaba a /en/privacidad desde un buscador no tenía forma de volver al
 * español —ni al revés— más que editando la URL a mano.
 *
 * Se monta desde el layout raíz por eso mismo: es el único ancestro común de
 * las ocho. Cuando el documento legal deje de ser un `<main>` pelado y monte
 * chrome propio, esto se mueve ahí y este componente desaparece.
 */
const LEGALES = ["/aviso-legal", "/privacidad", "/terminos", "/cookies"];

export function LegalLangSwitch() {
  const pathname = usePathname();
  if (!pathname || !LEGALES.includes(altPath(pathname, "es"))) return null;

  return (
    <LangSwitch
      style={{
        position: "fixed",
        top: 20,
        right: 20,
        zIndex: 50,
        padding: "8px 14px",
        border: "1px solid var(--bg-card)",
        borderRadius: "var(--radius-sm)",
        background: "var(--bg-card)",
        color: "var(--ink)",
        fontFamily: "var(--font-mono)",
        fontSize: 12,
        letterSpacing: "0.08em",
        textDecoration: "none",
      }}
    />
  );
}
