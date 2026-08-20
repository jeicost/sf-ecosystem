import { Poppins, Inter, Space_Mono } from "next/font/google";
import { Nav360 } from "@/components/b360/Nav360";
import { Footer360 } from "@/components/b360/Footer360";
import type { Locale } from "@/lib/i18n";
import "@/app/360/brand360.css";

/**
 * Shell de la marca discoolver 360, compartido por /360 (ES) y /en/360 (EN).
 * Es el antiguo layout anidado, extraído para no duplicar fuentes ni banner.
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

export function Brand360Shell({ children, locale }: { children: React.ReactNode; locale: Locale }) {
  return (
    <div className={`b360 ${poppins.variable} ${inter.variable} ${spaceMono.variable}`}>
      <Nav360 locale={locale} />
      <main id="main-content">{children}</main>
      <Footer360 locale={locale} />
    </div>
  );
}
