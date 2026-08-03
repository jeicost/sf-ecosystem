import type { Metadata } from "next";
import { Inter, Noto_Sans_Thai } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { LanguageProvider } from "@/context/LanguageContext";
import { OrderProvider } from "@/context/OrderContext";
import { OrderModal } from "@/components/OrderModal";
import { ChatBot } from "@/components/ChatBot";
import { Analytics } from "@vercel/analytics/next";

const DOMAIN = "https://www.salsaburgers.com";

export const revalidate = 3600;

// ── Read CMS data at build time ──────────────────────────────
function getCmsData() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pages    = require("../../content/pages.json");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const settings = require("../../content/settings.json");
    return { pages, settings };
  } catch { return { pages: {}, settings: {} }; }
}

const { pages: cmsPages, settings: cmsSettings } = getCmsData();
const homePage = cmsPages?.home ?? {};
const homeSeo  = homePage.sections?.seo?.data ?? {};

// ── Schema.org ───────────────────────────────────────────────
// CMS schema_* fields override the defaults below
const schemaType = homePage.schema?.type || "Restaurant";
const restaurantSchema: Record<string, unknown> = {
  "@context": "https://schema.org",
  "@type": schemaType,
  name:        homePage.schema?.name        || "Salsa Burgers",
  description: homePage.schema?.description || "Premium Wagyu beef burgers with 16 artisan house sauces. Bangkok's boldest burger brand, focused on delivery.",
  url:         DOMAIN,
  telephone:   homePage.schema?.telephone   || "+66825366653",
  image:       homePage.schema?.image       || `${DOMAIN}/images/OG_burger_640x640.jpg`,
  menu:        `${DOMAIN}/menu`,
  address: {
    "@type":           "PostalAddress",
    streetAddress:     homePage.schema?.address || "507 Sathu Pradit Rd",
    addressLocality:   homePage.schema?.city    || "Yan Nawa, Bangkok",
    addressRegion:     "Bangkok",
    postalCode:        "10120",
    addressCountry:    homePage.schema?.country || "TH",
  },
  geo: {
    "@type":    "GeoCoordinates",
    latitude:   13.6944,
    longitude:  100.5329,
  },
  openingHoursSpecification: homePage.schema?.openingHours ? [
    {
      "@type":    "OpeningHoursSpecification",
      dayOfWeek: ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],
      opens:      homePage.schema.openingHours.split("-")[0]?.trim() || "11:00",
      closes:     homePage.schema.openingHours.split("-")[1]?.trim() || "23:30",
    },
  ] : [
    {
      "@type":    "OpeningHoursSpecification",
      dayOfWeek: ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],
      opens:     "11:00",
      closes:    "23:30",
    },
  ],
  ...(schemaType === "Restaurant" && {
    servesCuisine: homePage.schema?.cuisine
      ? homePage.schema.cuisine.split(",").map((s: string) => s.trim())
      : ["American", "Thai Fusion", "Wagyu Burger"],
  }),
  priceRange: homePage.schema?.priceRange || "$$",
  aggregateRating: {
    "@type":       "AggregateRating",
    ratingValue:   "5",
    reviewCount:   "28",
    bestRating:    "5",
  },
  sameAs: homePage.schema?.sameAs
    ? homePage.schema.sameAs.split(",").map((s: string) => s.trim()).filter(Boolean)
    : [
        "https://www.facebook.com/salsaburgersth",
        "https://www.instagram.com/salsa_burgers",
        "https://www.tiktok.com/@salsa_burgers",
      ],
};

// ── Fonts ────────────────────────────────────────────────────
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "600", "700", "900"],
  variable: "--font-inter",
});

const notoSansThai = Noto_Sans_Thai({
  subsets: ["thai"],
  weight: ["400", "600", "700", "900"],
  variable: "--font-thai",
});

// ── Metadata (reads from CMS, falls back to defaults) ────────
// Cap at 60 chars for optimal SERP display — CMS may have longer legacy title
const rawTitle = homePage.seoTitle || "Salsa Burgers Bangkok | Wagyu Burger Delivery";
const seoTitle = rawTitle.length > 60 ? "Salsa Burgers Bangkok | Wagyu Burger Delivery" : rawTitle;
const seoDescription = homePage.seoDescription || "Salsa Burgers is Bangkok's boldest premium burger brand. Wagyu beef, 16 house-made artisan sauces. Delivery via Grab & LINE MAN. Yan Nawa, Sathorn, Bangkok.";
const seoKeywords    = homePage.keywords       || "Salsa Burgers, burger Bangkok, Wagyu burger Bangkok, burger delivery Bangkok, best burger Bangkok";
const ogImage        = homePage.ogImage        || "/images/OG_burger_640x640.jpg";

export const metadata: Metadata = {
  title:       seoTitle,
  description: seoDescription,
  keywords:    seoKeywords,
  metadataBase: new URL(DOMAIN),
  robots: { index: true, follow: true },
  alternates: {
    canonical: "/",
    languages: {
      "en":       DOMAIN,
      "th":       `${DOMAIN}/th`,
      "x-default": DOMAIN,
    },
  },
  openGraph: {
    type:        "website",
    url:         DOMAIN,
    title:       seoTitle,
    description: seoDescription,
    siteName:    "Salsa Burgers",
    images: [{
      url:    ogImage.startsWith("http") ? ogImage : `${DOMAIN}${ogImage}`,
      width:  1200,
      height: 630,
      alt:    "Salsa Burgers Bangkok — Premium Wagyu Burger",
    }],
  },
  twitter: {
    card:    "summary_large_image",
    site:    "@salsa_burgers",
    creator: "@salsa_burgers",
    title:   seoTitle,
    description: seoDescription,
    images: [ogImage.startsWith("http") ? ogImage : `${DOMAIN}${ogImage}`],
  },
  verification: {
    google: "qkudBNEAy43dn3trv7az9KaFPHUNuoJuD2tqf-j2Dyo",
  },
  icons: {
    icon:  "/images/salsa-logo.png",
    apple: "/images/salsa-logo.png",
  },
};

// ── Tracking pixels from CMS settings (site-wide, per-project) ──
const gaMeasurementId: string | null = cmsSettings?.ga_measurement_id ?? null;
const gtmContainerId:  string | null = cmsSettings?.gtm_container_id  ?? null;
const googleAdsId:     string | null = cmsSettings?.google_ads_id     ?? null;
const tiktokPixelId:   string | null = cmsSettings?.tiktok_pixel_id   ?? null;

// ── Meta Pixel: CMS primero, env var como red de seguridad ───
// (la env es lo único que mantuvo el pixel vivo cuando los settings del CMS
// llegaron vacíos — no quitarla)
const metaPixelId: string | null =
  cmsSettings?.meta_pixel_id ?? process.env.NEXT_PUBLIC_META_PIXEL_ID ?? null;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${notoSansThai.variable} antialiased`}>
      <head>
        {/* Resource hints — speed up external connections */}
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="preconnect" href="https://www.google-analytics.com" />
        <link rel="dns-prefetch" href="https://vitals.vercel-insights.com" />
        {/* Schema.org JSON-LD — driven by CMS */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(restaurantSchema) }}
        />
        {/* FAQ Schema — activates rich snippets in Google */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            { "@type": "Question", "name": "What burgers does Salsa Burgers have?", "acceptedAnswer": { "@type": "Answer", "text": "Salsa Burgers has 3 lines: Salsa Classics (7 burgers from OG to Truffle Flow), Bangkok Specials (Khao Soi, Tom Yum), Global Fusion (K-Spice, Miso Onsen, Mala), and Salsa Deluxe (Lobster, Foie Gras, Dry-Aged Ribeye). All made with 100% Premium Wagyu Beef." } },
            { "@type": "Question", "name": "How fast is delivery from Salsa Burgers Bangkok?", "acceptedAnswer": { "@type": "Answer", "text": "Hot and fresh in approximately 30 minutes across Bangkok. We deliver via Grab and LINE MAN." } },
            { "@type": "Question", "name": "Where is Salsa Burgers located in Bangkok?", "acceptedAnswer": { "@type": "Answer", "text": "Salsa Burgers is at 507, 10 Sathu Pradit Rd, Chong Nonsi, Yan Nawa, Bangkok 10120. We are a premium ghost kitchen — order via Grab or LINE MAN for delivery." } },
            { "@type": "Question", "name": "What are Salsa Burgers opening hours?", "acceptedAnswer": { "@type": "Answer", "text": "Monday–Thursday: 11:00 AM – 10:00 PM. Friday–Saturday: 11:00 AM – 11:00 PM. Sunday: 12:00 PM – 9:00 PM." } },
            { "@type": "Question", "name": "Does Salsa Burgers use real Wagyu beef?", "acceptedAnswer": { "@type": "Answer", "text": "Yes, 100% Premium Wagyu Beef in every burger — no exceptions. Quality is non-negotiable at Salsa Burgers." } },
            { "@type": "Question", "name": "How many sauces does Salsa Burgers make?", "acceptedAnswer": { "@type": "Answer", "text": "Salsa Burgers crafts 16 artisan sauces in-house every day: House Sauce, Truffle Mayo, BBQ, Mala (level 1 & 2), Tom Yum, Katsu Mayo, Gochujang, Khao Soi sauce and more." } }
          ]
        })}} />
        {/* GTM head snippet */}
        {gtmContainerId && (
          <script dangerouslySetInnerHTML={{ __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmContainerId}');` }} />
        )}
        {/* Meta Pixel head snippet */}
        {metaPixelId && (
          <script dangerouslySetInnerHTML={{ __html: `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window, document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init', '${metaPixelId}');` }} />
        )}
        {/* TikTok Pixel head snippet */}
        {tiktokPixelId && (
          <script dangerouslySetInnerHTML={{ __html: `!function (w, d, t) {w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};n=document.createElement("script");n.type="text/javascript",n.async=!0,n.src=r+"?sdkid="+e+"&lib="+t;e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};ttq.load('${tiktokPixelId}');ttq.page();}(window, document, 'ttq');` }} />
        )}
      </head>

      <body className="min-h-screen bg-[#0a0a0a] text-white">
        {/* GTM noscript fallback */}
        {gtmContainerId && (
          <noscript dangerouslySetInnerHTML={{ __html: `<iframe src="https://www.googletagmanager.com/ns.html?id=${gtmContainerId}" height="0" width="0" style="display:none;visibility:hidden"></iframe>` }} />
        )}
        {/* Meta Pixel noscript fallback */}
        {metaPixelId && (
          <noscript dangerouslySetInnerHTML={{ __html: `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${metaPixelId}&ev=PageView&noscript=1" />` }} />
        )}
        <LanguageProvider>
          <OrderProvider>
            {children}
            <OrderModal />
            <ChatBot />
          </OrderProvider>
        </LanguageProvider>

        {/* Vercel Analytics */}
        <Analytics />

        {/* Google Analytics 4 + Google Ads — injected from CMS settings.
            Un solo gtag.js sirve para ambos: se carga con el primer ID
            disponible y se hace gtag('config', ...) por cada uno presente.
            Nota: el contenedor GTM del sitio está vacío (verificado
            2026-08-03), así que cargar GA4/Ads directos NO duplica nada. */}
        {(gaMeasurementId || googleAdsId) && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId || googleAdsId}`}
              strategy="afterInteractive"
            />
            <Script id="gtag-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                ${gaMeasurementId ? `gtag('config', '${gaMeasurementId}', { page_path: window.location.pathname });` : ''}
                ${googleAdsId ? `gtag('config', '${googleAdsId}');` : ''}
              `}
            </Script>
          </>
        )}

        {/* Meta Pixel PageView tracking */}
        {metaPixelId && (
          <Script id="meta-pixel-pageview" strategy="afterInteractive">
            {`if (window.fbq) { fbq('track', 'PageView'); }`}
          </Script>
        )}
      </body>
    </html>
  );
}
