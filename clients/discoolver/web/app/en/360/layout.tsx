import type { Metadata, Viewport } from "next";
import { Brand360Shell } from "@/components/b360/Brand360Shell";

/** El color de la barra del navegador. Va en `viewport` y no en `metadata`:
 *  Next 16 lo ignora en metadata y avisa en cada build. */
export const viewport: Viewport = { themeColor: "#FF00C8" };

export const metadata: Metadata = {
  title: {
    // Mismo trato que el espejo español: el sufijo lo pone el template, los
    // títulos de las subpáginas no repiten la marca y caben en 43 caracteres.
    default: "discoolver 360 — The platform for destinations, accommodation and agencies",
    template: "%s — discoolver 360",
  },
  manifest: "/manifest-360.webmanifest",
  icons: {
    icon: [
      { url: "/assets/360/favicon.ico", sizes: "16x16 32x32 48x48" },
      { url: "/assets/360/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/assets/360/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/assets/360/apple-icon.png",
  },
};

export default function Brand360LayoutEn({ children }: { children: React.ReactNode }) {
  return <Brand360Shell locale="en">{children}</Brand360Shell>;
}
