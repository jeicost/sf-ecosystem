import type { Metadata } from 'next'
import Script from 'next/script'
import { Analytics } from '@vercel/analytics/next'
import CookieConsent from './cookie-consent'

const GTM_ID = 'GTM-5QZTPDX5'
const DOMAIN = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.miralanding.com'

export const metadata: Metadata = {
  metadataBase: new URL(DOMAIN),
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
  title: 'MIRA — Stop Operating. Start Directing.',
  description: 'MIRA is the AI team that knows your brand and runs your departments. 30 agents across Marketing, Sales, Strategy, Innovation, Admin and Finance. You direct, they execute.',
  alternates: {
    canonical: DOMAIN,
  },
  openGraph: {
    title: 'MIRA — Stop Operating. Start Directing.',
    description: 'MIRA is the AI team that knows your brand and runs your departments. 30 agents across Marketing, Sales, Strategy, Innovation, Admin and Finance. You direct, they execute.',
    url: DOMAIN,
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'MIRA — Stop Operating. Start Directing.' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MIRA — Stop Operating. Start Directing.',
    description: 'MIRA is the AI team that knows your brand and runs your departments. 30 agents across Marketing, Sales, Strategy, Innovation, Admin and Finance. You direct, they execute.',
    images: ['/og-image.png'],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <Script id="gtm-head" strategy="beforeInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM_ID}');`}
        </Script>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <style>{`
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
          html { scroll-behavior: smooth; }
          body { font-family: 'Space Grotesk', -apple-system, sans-serif; background: #0a0a0f; color: #f4f4f8; -webkit-font-smoothing: antialiased; overflow-x: hidden; }
          @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
          @keyframes pulse-glow { 0%,100%{opacity:0.6} 50%{opacity:1} }
          @keyframes fade-in { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
          @keyframes spin { to{transform:rotate(360deg)} }
          .animate-float { animation: float 6s ease-in-out infinite; }
          .animate-float-delay-1 { animation: float 7s ease-in-out 0.5s infinite; }
          .animate-float-delay-2 { animation: float 5.5s ease-in-out 1s infinite; }
          .animate-float-delay-3 { animation: float 8s ease-in-out 1.5s infinite; }
          .animate-float-delay-4 { animation: float 6.5s ease-in-out 2s infinite; }
          .animate-float-delay-5 { animation: float 7.5s ease-in-out 2.5s infinite; }
          .gradient-text { background: linear-gradient(135deg, #a78bfa 0%, #7c3aed 50%, #c4b5fd 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
          .card-dark { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; }
          .btn-primary { background: linear-gradient(135deg, #7c3aed, #5b21b6); color: #fff; font-weight: 700; padding: 14px 28px; border-radius: 14px; border: none; cursor: pointer; font-family: inherit; font-size: 15px; letter-spacing: -0.01em; transition: all 0.2s; box-shadow: 0 0 32px rgba(124,58,237,0.4); text-decoration: none; display: inline-flex; align-items: center; gap: 8px; }
          .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 0 48px rgba(124,58,237,0.6); opacity: 0.95; }
          .btn-secondary { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.7); font-weight: 600; padding: 14px 28px; border-radius: 14px; border: 1px solid rgba(255,255,255,0.15); cursor: pointer; font-family: inherit; font-size: 15px; letter-spacing: -0.01em; transition: all 0.2s; text-decoration: none; display: inline-flex; align-items: center; gap: 8px; }
          .btn-secondary:hover { background: rgba(255,255,255,0.1); color: #fff; }
          ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: #0a0a0f; } ::-webkit-scrollbar-thumb { background: #2a2a3a; border-radius: 3px; }
        `}</style>
      </head>
      <body>
        <noscript>
          <iframe src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
            height="0" width="0" style={{ display: 'none', visibility: 'hidden' }} />
        </noscript>
        {children}
        <CookieConsent />
        <Analytics />
      </body>
    </html>
  )
}
