"use client";

import { usePathname } from "next/navigation";
import { localeFromPath, UI, t } from "@/lib/i18n";
import { LegalLangSwitch } from "@/components/layout/LegalLangSwitch";

/**
 * El `<html>` del sitio, y el único motivo por el que es un componente cliente:
 * `lang` solo se puede pintar en el layout raíz, y un layout raíz de servidor no
 * sabe en qué ruta está. Con `lang="es"` fijo, las trece páginas de /en se
 * servían declarándose en español —lo primero que mira un lector de pantalla al
 * elegir voz, y lo que Google usa para decidir a quién le sirve la página—.
 *
 * `usePathname` se resuelve también en el render de servidor, así que el HTML
 * que sale por el cable ya lleva el idioma correcto: se comprueba con curl, no
 * hace falta ejecutar JS. Es el mismo criterio que ya usaban Nav y Footer.
 */
export function HtmlShell({
  className,
  children,
}: {
  className: string;
  children: React.ReactNode;
}) {
  const locale = localeFromPath(usePathname());

  return (
    <html lang={locale} className={className}>
      <body>
        <a href="#main-content" className="skip-link">
          {t(locale).skip}
        </a>
        <LegalLangSwitch />
        {children}
      </body>
    </html>
  );
}
