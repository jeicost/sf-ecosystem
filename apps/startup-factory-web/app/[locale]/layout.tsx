import type { Metadata } from "next";
import { Space_Grotesk, DM_Sans, Sarabun } from "next/font/google";
import "../globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { locales } from "@/lib/i18n/config";
import type { Locale } from "@/lib/i18n/config";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const sarabun = Sarabun({
  variable: "--font-sarabun",
  subsets: ["latin", "thai"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://startupsfactory.es"),
  openGraph: {
    siteName: "Startup Factory",
    type: "website",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/og-image.jpg"],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Startup Factory",
  url: "https://startupsfactory.es",
  logo: "https://startupsfactory.es/logo-white.svg",
  description:
    "El venture builder hispanohablante que evalúa proyectos de forma individual, trabaja con el <10% con potencial real y ofrece equipo, estrategia e IA a medida.",
  foundingLocation: {
    "@type": "Place",
    name: "Bangkok, Thailand",
  },
  founder: {
    "@type": "Person",
    name: "Carlos Jacoste",
    url: "https://www.linkedin.com/in/carlosjacoste/",
    jobTitle: "Co-founder & CEO",
  },
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer service",
    url: "https://startupsfactory.es/es/aplica",
  },
  sameAs: [
    "https://www.instagram.com/_startupsfactory",
    "https://www.linkedin.com/in/carlosjacoste/",
  ],
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isThai = locale === "th";

  return (
    <html
      lang={locale}
      className={`${spaceGrotesk.variable} ${dmSans.variable} ${sarabun.variable} h-full antialiased`}
    >
      <body
        className={`min-h-full flex flex-col bg-[#0F0F0F] text-[#F5F0E8] ${
          isThai ? "font-[family-name:var(--font-sarabun)]" : ""
        }`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <Navbar locale={locale as Locale} />
        <main className="flex-1">{children}</main>
        <Footer locale={locale as Locale} />
      </body>
    </html>
  );
}
