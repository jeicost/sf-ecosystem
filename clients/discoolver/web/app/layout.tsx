import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Geist, Geist_Mono, Noto_Sans_Thai } from "next/font/google";
import { buildMetadata } from "@/lib/seo";
import { site } from "@/lib/site";
import { organizationJsonLd } from "@/lib/jsonld";
import { Consent } from "@/components/ui/Consent";
import { HtmlShell } from "@/components/layout/HtmlShell";
import "./globals.css";

/**
 * Tailandés. NINGUNA de las fuentes de marca —Space Grotesk, Geist, Geist Mono—
 * tiene glifos tailandeses, así que pedirles `subsets: ["thai"]` ni siquiera
 * compila. Va como RESPALDO en la cadena de font-family: el navegador saca cada
 * glifo de la primera fuente que lo tenga, así que el latino sigue saliendo de
 * la fuente de marca y solo el tailandés cae aquí.
 *
 * Así funciona en TODAS las páginas, no solo en /th: un nombre tailandés dentro
 * de una ficha en español también se lee bien. Sin esto, cuando Nirada traduzca
 * el texto se vería con la fuente de sistema o con cuadros.
 */
const notoThai = Noto_Sans_Thai({
  subsets: ["thai"],
  variable: "--font-thai",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

/** El color de la barra del navegador. Va en `viewport` y no en `metadata`:
 *  Next 16 lo ignora en metadata y avisa en cada build. */
export const viewport: Viewport = { themeColor: "#C426C4" };

export const metadata: Metadata = {
  ...buildMetadata({
    title: "Discoolver — Guías de viaje escritas por quien vive la ciudad",
    description: site.description,
    path: "/",
  }),
  metadataBase: new URL(site.url),
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // El <html> (idioma y salto al contenido) lo pinta HtmlShell: el layout raíz
  // es servidor y no sabe si está sirviendo /guias o /en/guias.
  return (
    <HtmlShell className={`${spaceGrotesk.variable} ${geist.variable} ${geistMono.variable} ${notoThai.variable}`}>
      {children}
      <Consent />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd()) }}
      />
    </HtmlShell>
  );
}
