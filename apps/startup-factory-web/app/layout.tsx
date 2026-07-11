import type { Metadata } from "next";
import { Space_Grotesk, DM_Sans } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const DOMAIN = "https://www.startupsfactory.es";

export const revalidate = 3600;

// ── Read CMS data at build time ──────────────────────────────
function getCmsData() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pages    = require("../content/pages.json");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const settings = require("../content/settings.json");
    return { pages, settings };
  } catch { return { pages: {}, settings: {} }; }
}

const { pages: cmsPages, settings: cmsSettings } = getCmsData();
const homePage = cmsPages?.home ?? {};

// ── Schema.org — CMS-driven, falls back to defaults ─────────
const schemaType = homePage.schema?.type || "Organization";
const orgSchema: Record<string, unknown> = {
  "@context": "https://schema.org",
  "@type": schemaType,
  name:        homePage.schema?.name        || "Startup Factory",
  description: homePage.schema?.description || "AI agency and venture studio building products, teams and systems for ambitious founders.",
  url:         DOMAIN,
  ...(homePage.schema?.telephone && { telephone: homePage.schema.telephone }),
  ...(homePage.schema?.address && {
    address: {
      "@type":         "PostalAddress",
      streetAddress:   homePage.schema.address,
      addressLocality: homePage.schema.city    || "Bangkok",
      addressCountry:  homePage.schema.country || "TH",
    },
  }),
  sameAs: homePage.schema?.sameAs
    ? homePage.schema.sameAs.split(",").map((s: string) => s.trim()).filter(Boolean)
    : ["https://www.instagram.com/startups.factory"],
};

// ── Fonts ─────────────────────────────────────────────────────
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

// ── Metadata ──────────────────────────────────────────────────
const seoTitle       = homePage.seoTitle       || "Startups Factory | AI Agency & Venture Studio";
const seoDescription = homePage.seoDescription || "Fábrica de equipos para proyectos. Montamos el squad exacto que necesitas — por horas, por sprint o como partner — y lo ponemos a ejecutar contigo.";
const ogImage        = homePage.ogImage        || "/og-image.jpg";

export const metadata: Metadata = {
  title:       seoTitle,
  description: seoDescription,
  keywords:    homePage.keywords || "startup factory, AI agency, venture studio, team as a service, Bangkok",
  metadataBase: new URL(DOMAIN),
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  verification: {
    google: "k3xy5rJr7oDFqyn7NXEcImw97CLFhZi_Uh03v_GQAIw",
  },
  alternates: {
    canonical: "/",
    languages: {
      "es": `${DOMAIN}/es`,
      "en": `${DOMAIN}/en`,
      "th": `${DOMAIN}/th`,
      "x-default": DOMAIN,
    },
  },
  openGraph: {
    type:        "website",
    siteName:    "Startups Factory",
    title:       seoTitle,
    description: seoDescription,
    url:         DOMAIN,
    locale:      "es_ES",
    images: [{
      url:    ogImage.startsWith("http") ? ogImage : `${DOMAIN}${ogImage}`,
      width:  1200,
      height: 630,
      alt:    "Startup Factory",
    }],
  },
  twitter: {
    card:        "summary_large_image",
    title:       seoTitle,
    description: seoDescription,
    images:      [ogImage.startsWith("http") ? ogImage : `${DOMAIN}${ogImage}`],
  },
};

// ── Analytics from CMS settings ──────────────────────────────
const gaMeasurementId: string | null = cmsSettings?.ga_measurement_id ?? null;
const gtmContainerId:  string | null = cmsSettings?.gtm_container_id  ?? null;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html className={`${spaceGrotesk.variable} ${dmSans.variable}`}>
      <head>
        {/* Schema.org JSON-LD — CMS-driven */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
        />
        {/* GTM — head snippet */}
        {gtmContainerId && (
          <Script id="gtm-head" strategy="beforeInteractive">
            {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmContainerId}');`}
          </Script>
        )}
      </head>
      <body>
        {/* GTM — noscript */}
        {gtmContainerId && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${gtmContainerId}`}
              height="0" width="0"
              style={{ display: 'none', visibility: 'hidden' }}
            />
          </noscript>
        )}
        {children}

        {/* GA4 — only when no GTM (avoid double tracking) */}
        {gaMeasurementId && !gtmContainerId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaMeasurementId}', { page_path: window.location.pathname });
              `}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
