import Script from 'next/script'

/**
 * Per-page tracking pixels baked from the CMS (pages.json → `pixels`).
 * Rendered inside a page's server component; layered on top of the site-wide
 * GTM/GA in app/layout.tsx. Every field is optional — an empty object renders
 * nothing. Custom head/body HTML is a deliberate raw-HTML escape hatch, only
 * editable by CMS admins.
 */
export interface PagePixels {
  ga4_id?: string
  gtm_id?: string
  meta_pixel_id?: string
  google_ads_id?: string
  google_ads_conversion_label?: string
  tiktok_pixel_id?: string
  linkedin_partner_id?: string
  custom_head?: string
  custom_body?: string
}

export function loadPagePixels(slug: string): PagePixels {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pages = require('../content/pages.json')
    return (pages?.[slug]?.pixels as PagePixels) ?? {}
  } catch {
    return {}
  }
}

export function PagePixels({ pixels }: { pixels: PagePixels }) {
  if (!pixels || Object.keys(pixels).length === 0) return null

  return (
    <>
      {pixels.gtm_id && (
        <Script id={`gtm-${pixels.gtm_id}`} strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${pixels.gtm_id}');`}
        </Script>
      )}

      {pixels.ga4_id && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${pixels.ga4_id}`} strategy="afterInteractive" />
          <Script id={`ga4-${pixels.ga4_id}`} strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${pixels.ga4_id}');`}
          </Script>
        </>
      )}

      {pixels.google_ads_id && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${pixels.google_ads_id}`} strategy="afterInteractive" />
          <Script id={`gads-${pixels.google_ads_id}`} strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${pixels.google_ads_id}');`}
          </Script>
        </>
      )}

      {pixels.meta_pixel_id && (
        <Script id={`meta-${pixels.meta_pixel_id}`} strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${pixels.meta_pixel_id}');fbq('track','PageView');`}
        </Script>
      )}

      {pixels.tiktok_pixel_id && (
        <Script id={`tt-${pixels.tiktok_pixel_id}`} strategy="afterInteractive">
          {`!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{};ttq._i[e]=[];ttq._i[e]._u=i;ttq._t=ttq._t||{};ttq._t[e]=+new Date;ttq._o=ttq._o||{};ttq._o[e]=n||{};var o=d.createElement("script");o.type="text/javascript";o.async=!0;o.src=i+"?sdkid="+e+"&lib="+t;var a=d.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};ttq.load('${pixels.tiktok_pixel_id}');ttq.page();}(window,document,'ttq');`}
        </Script>
      )}

      {pixels.linkedin_partner_id && (
        <Script id={`li-${pixels.linkedin_partner_id}`} strategy="afterInteractive">
          {`window._linkedin_partner_id='${pixels.linkedin_partner_id}';window._linkedin_data_partner_ids=window._linkedin_data_partner_ids||[];window._linkedin_data_partner_ids.push('${pixels.linkedin_partner_id}');(function(l){if(!l){window.lintrk=function(a,b){window.lintrk.q.push([a,b])};window.lintrk.q=[]}var s=document.getElementsByTagName('script')[0];var b=document.createElement('script');b.type='text/javascript';b.async=true;b.src='https://snap.licdn.com/li.lms-analytics/insight.min.js';s.parentNode.insertBefore(b,s)})(window.lintrk);`}
        </Script>
      )}

      {pixels.custom_head && (
        <div dangerouslySetInnerHTML={{ __html: pixels.custom_head }} />
      )}
      {pixels.custom_body && (
        <div dangerouslySetInnerHTML={{ __html: pixels.custom_body }} />
      )}
    </>
  )
}
