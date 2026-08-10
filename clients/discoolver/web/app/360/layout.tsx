import type { Metadata } from "next";
import { Poppins, Inter, Space_Mono } from "next/font/google";
import { Nav360 } from "@/components/b360/Nav360";
import { Footer360 } from "@/components/b360/Footer360";
import "./brand360.css";

/**
 * Layout de la marca discoolver 360 (B2B).
 *
 * Es un layout ANIDADO, no un root layout alternativo: el root de la app sigue
 * siendo app/layout.tsx y no se toca. Aquí solo se añaden las tres fuentes de
 * 360 y un contenedor .b360 que activa sus tokens (ver brand360.css). Todo lo
 * de la marca B2C —tokens de :root, Nav, Footer, componentes— queda intacto y
 * fuera de /360 esta hoja no pinta nada.
 */

const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-poppins",
  display: "swap",
  weight: ["300", "400", "600", "700", "900"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  variable: "--font-space-mono",
  display: "swap",
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "discoolver 360 — Plataforma para destinos, alojamientos y agencias",
    template: "%s — discoolver 360",
  },
  // El root layout declara los iconos del B2C. 360 es otra marca: se sobrescriben
  // aquí para todo el segmento en vez de fiarse de la convención de ficheros
  // (app/360/icon.png), que no gana a un `icons` explícito heredado de la raíz.
  icons: {
    icon: [{ url: "/assets/360/icon-512.png", sizes: "512x512", type: "image/png" }],
    apple: "/assets/360/apple-icon.png",
  },
};

export default function Brand360Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`b360 ${poppins.variable} ${inter.variable} ${spaceMono.variable}`}>
      {/* Propuesta en revisión: se retira cuando Carlos dé el OK y antes de cortar el dominio. */}
      <div className="b360-wip">
        <strong>PROPUESTA EN REVISIÓN</strong> · discoolver 360 · las webs actuales siguen intactas
        para poder compararlas
      </div>
      <Nav360 />
      <main id="main-content">{children}</main>
      <Footer360 />
    </div>
  );
}
