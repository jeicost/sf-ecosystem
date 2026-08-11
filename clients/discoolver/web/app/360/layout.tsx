import type { Metadata } from "next";
import { Brand360Shell } from "@/components/b360/Brand360Shell";

export const metadata: Metadata = {
  title: {
    default: "discoolver 360 — Plataforma para destinos, alojamientos y agencias",
    template: "%s — discoolver 360",
  },
  // El root layout declara los iconos del B2C. 360 es otra marca: se sobrescriben
  // aquí para todo el segmento.
  icons: {
    icon: [{ url: "/assets/360/icon-512.png", sizes: "512x512", type: "image/png" }],
    apple: "/assets/360/apple-icon.png",
  },
};

export default function Brand360Layout({ children }: { children: React.ReactNode }) {
  return <Brand360Shell locale="es">{children}</Brand360Shell>;
}
