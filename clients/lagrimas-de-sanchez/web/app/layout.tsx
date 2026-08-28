import type { Metadata } from "next";
import { Bodoni_Moda, Libre_Franklin, Barlow_Condensed, IBM_Plex_Mono } from "next/font/google";
import { Nav } from "@/components/Nav";
import { Pie } from "@/components/Pie";
import "./globals.css";

const bodoni = Bodoni_Moda({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-bodoni",
  display: "swap",
});

const sans = Libre_Franklin({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

const cond = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-cond",
  display: "swap",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-mono",
  display: "swap",
});

import { site } from "@/lib/site";

const URL_SITIO = site.url;

export const metadata: Metadata = {
  metadataBase: new URL(URL_SITIO),
  title: {
    default: "Lágrimas de Sánchez",
    template: "%s · Lágrimas de Sánchez",
  },
  description:
    "Una botella de cristal ámbar con 57 piezas horneadas en el vidrio a 600 grados. No es una etiqueta. No se despega.",
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: URL_SITIO,
    siteName: "Lágrimas de Sánchez",
    title: "Lágrimas de Sánchez",
    description:
      "57 piezas horneadas en el vidrio a 600 grados. No es una etiqueta. No se despega.",
  },
  robots: { index: true, follow: true },
  alternates: { canonical: "/" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${bodoni.variable} ${sans.variable} ${cond.variable} ${mono.variable}`}>
      <body className="flex min-h-screen flex-col antialiased">
        <Nav />
        <div className="flex-1">{children}</div>
        <Pie />
      </body>
    </html>
  );
}
