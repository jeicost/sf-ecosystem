'use client'

import Script from 'next/script'
import { useSyncExternalStore } from 'react'
import type { PagePixels } from './PagePixels'

const CLAVE = 'ag-consentimiento-cookies'
const EVENTO = 'ag-consentimiento'
type Decision = 'si' | 'no' | null

// Respaldo en memoria: si localStorage no existe o lanza (modo privado,
// bloqueos), la decisión vale para esta visita en vez de perderse.
let enMemoria: Decision = null

function leer(): Decision {
  try {
    const v = window.localStorage.getItem(CLAVE)
    return v === 'si' || v === 'no' ? v : enMemoria
  } catch {
    return enMemoria
  }
}
function guardar(v: 'si' | 'no') {
  enMemoria = v
  try {
    window.localStorage.setItem(CLAVE, v)
  } catch {
    // Sin almacenamiento queda en memoria.
  }
  window.dispatchEvent(new Event(EVENTO))
}
function suscribir(avisar: () => void) {
  window.addEventListener('storage', avisar)
  window.addEventListener(EVENTO, avisar)
  return () => {
    window.removeEventListener('storage', avisar)
    window.removeEventListener(EVENTO, avisar)
  }
}

/**
 * Aviso de cookies + carga de los píxeles SOLO tras aceptar.
 * Rechazar es tan fácil como aceptar (mismo tamaño, misma altura): lo exige la
 * AEPD y es lo honesto.
 */
export function PixelConsent({ pixels }: { pixels: Omit<PagePixels, 'custom_head' | 'custom_body'> }) {
  // En el servidor (y durante la hidratación) no se sabe qué decidió el
  // visitante: 'pendiente' no pinta ni el aviso ni los píxeles, y así el HTML
  // del servidor y el primer render del navegador coinciden.
  const decision = useSyncExternalStore<Decision | 'pendiente'>(suscribir, leer, () => 'pendiente')

  return (
    <>
      {decision === 'si' && (
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

        </>
      )}

      {decision === null && (
        <div
          role="dialog"
          aria-label="Aviso de cookies"
          className="fixed inset-x-3 bottom-3 z-[60] mx-auto max-w-xl rounded-sm border border-line-bright bg-surface-2 p-4 shadow-[var(--shadow-lift)] sm:inset-x-auto sm:right-6 sm:bottom-6"
        >
          <p className="text-[0.88rem] leading-relaxed text-muted">
            Uso cookies de medición y publicidad (píxel de Meta) para saber qué anuncios funcionan. Solo se activan si
            aceptas.{' '}
            <a href="/privacidad" className="underline underline-offset-2 hover:text-text">
              Más información
            </a>
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button onClick={() => guardar('no')} className="rounded-sm border border-line-bright px-3 py-2.5 text-sm text-text hover:border-text">
              Rechazar
            </button>
            <button onClick={() => guardar('si')} className="btn-primary px-3 py-2.5 text-sm">
              Aceptar
            </button>
          </div>
        </div>
      )}
    </>
  )
}
