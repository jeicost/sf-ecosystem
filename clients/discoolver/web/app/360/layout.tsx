import type { Metadata } from "next";
import { Brand360Shell } from "@/components/b360/Brand360Shell";

export const metadata: Metadata = {
  title: {
    // El `template` ya pone la marca en las subpáginas: sus títulos van SIN
    // "| discoolver 360" o sale dos veces. Pasó, y con el sufijo duplicado seis
    // de las ocho subpáginas se iban de 60 caracteres y Google las truncaba.
    // Presupuesto para el título de una subpágina: 43 caracteres.
    default: "discoolver 360 — Plataforma para destinos, alojamientos y agencias",
    template: "%s — discoolver 360",
  },
  // El root layout declara los iconos del B2C. 360 es otra marca: se sobrescriben
  // aquí para todo el segmento.
  icons: {
    // Juego completo: el .ico manda en la pestaña de escritorio, los PNG en
    // Android/PWA y el apple-icon lleva fondo sólido (iOS no respeta el alfa).
    icon: [
      { url: "/assets/360/favicon.ico", sizes: "16x16 32x32 48x48" },
      { url: "/assets/360/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/assets/360/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/assets/360/apple-icon.png",
  },
};

export default function Brand360Layout({ children }: { children: React.ReactNode }) {
  return <Brand360Shell locale="es">{children}</Brand360Shell>;
}
