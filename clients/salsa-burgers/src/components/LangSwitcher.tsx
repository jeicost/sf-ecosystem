"use client";

import { useLanguage } from "@/context/LanguageContext";
import type { Lang } from "@/lib/translations";

/**
 * Selector de idioma.
 *
 * POR QUÉ NO EXISTÍA HASTA AHORA. La web ya estaba traducida entera a tres
 * idiomas —`src/lib/translations.ts`, 132 claves por idioma, sin un solo hueco—
 * y doce componentes ya leían `useLanguage()`. Lo único que faltaba era esto:
 * `setLang` no lo llamaba NADIE, así que la única forma de ver la web en
 * tailandés era escribir `?lang=th` a mano en la barra del navegador
 * (auditoría 20-ago-2026). Una hamburguesería de Bangkok con la carta traducida
 * al tailandés y sin manera de llegar a ella.
 *
 * El botón también escribe `?lang=` en la URL, no solo en el almacenamiento del
 * navegador: así un enlace en tailandés se puede compartir por LINE o WhatsApp
 * y abre en tailandés en el móvil de otra persona. `replaceState` en vez de
 * navegar para no recargar ni ensuciar el historial con cada pulsación.
 */

const IDIOMAS: { code: Lang; label: string; aria: string }[] = [
  { code: "en", label: "EN", aria: "Read in English" },
  { code: "th", label: "ไทย", aria: "อ่านภาษาไทย" },
  { code: "es", label: "ES", aria: "Leer en español" },
];

export function LangSwitcher({ size = "sm" }: { size?: "sm" | "lg" }) {
  const { lang, setLang } = useLanguage();

  const elegir = (code: Lang) => {
    setLang(code);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("lang", code);
      window.history.replaceState({}, "", url);
    }
  };

  const grande = size === "lg";

  return (
    <div
      role="group"
      aria-label="Language"
      className={`flex items-center rounded-full border border-white/20 ${grande ? "gap-1 p-1" : "gap-0.5 p-0.5"}`}
    >
      {IDIOMAS.map((i) => {
        const activo = lang === i.code;
        return (
          <button
            key={i.code}
            type="button"
            onClick={() => elegir(i.code)}
            aria-label={i.aria}
            aria-current={activo ? "true" : undefined}
            className={`rounded-full font-black uppercase tracking-wider transition-colors ${
              grande ? "px-4 py-2 text-base" : "px-2.5 py-1 text-[11px]"
            } ${
              activo
                ? "bg-white text-black"
                : "text-white/60 hover:text-white"
            }`}
          >
            {i.label}
          </button>
        );
      })}
    </div>
  );
}
