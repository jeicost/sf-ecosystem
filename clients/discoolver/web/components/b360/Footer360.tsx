import Link from "next/link";
import { Logo360 } from "@/components/b360/Logo360";
import { withLocale, type Locale } from "@/lib/i18n";
import { WHATSAPP, waHref } from "@/lib/site";

/**
 * Footer de 360. Regla heredada de la auditoría: NINGÚN enlace a "#".
 * La web antigua tenía el footer entero apuntando a "#" (Press, Affiliates,
 * Ambassadors…). Aquí solo se lista lo que existe y tiene destino real.
 */
const F = {
  es: { verticales: "Verticales", destinos: "Destinos", alojamientos: "Alojamientos",
        plataforma: "Plataforma", modulos: "Los 7 módulos", ronda: "Caso Ronda", demo: "Pedir demo",
        marca: "La marca de viajero", app: "La app", privacidad: "Privacidad",
        avisoLegal: "Aviso legal", terminos: "Términos", cookies: "Cookies", whatsapp: "WhatsApp",
        claim: "La plataforma que convierte el tráfico turístico de un destino en ingreso para su tejido local." },
  en: { verticales: "Verticals", destinos: "Destinations", alojamientos: "Accommodation",
        plataforma: "Platform", modulos: "The 7 modules", ronda: "Ronda case study", demo: "Book a demo",
        marca: "The traveller brand", app: "The app", privacidad: "Privacy",
        avisoLegal: "Legal notice", terminos: "Terms", cookies: "Cookies", whatsapp: "WhatsApp",
        claim: "The platform that turns a destination's tourist traffic into revenue for its local businesses." },
} as const;

export function Footer360({ locale = "es" }: { locale?: Locale }) {
  const t = F[locale];
  return (
    <footer className="b360-foot">
      <div className="wrap">
        <div className="b360-foot__grid">
          <div>
            <Logo360 size={30} href={locale === "en" ? "/en/360" : "/360"} locale={locale} />
            <p className="small" style={{ marginTop: 14, maxWidth: "34ch" }}>
              {t.claim}
            </p>
          </div>
          <div>
            <h5>{t.verticales}</h5>
            <ul>
              <li><Link href={withLocale("/360/destinos", locale)}>{t.destinos}</Link></li>
              <li><Link href={withLocale("/360/alojamientos", locale)}>{t.alojamientos}</Link></li>
            </ul>
          </div>
          <div>
            <h5>{t.plataforma}</h5>
            <ul>
              <li><Link href={withLocale("/360", locale) + "#modulos"}>{t.modulos}</Link></li>
              <li><Link href={withLocale("/360", locale) + "#ronda"}>{t.ronda}</Link></li>
              <li><Link href={withLocale("/360/demo", locale)}>{t.demo}</Link></li>
            </ul>
          </div>
          <div>
            <h5>discoolver</h5>
            <ul>
              {/* El diccionario ya traía `marca` y `app` traducidos, pero el JSX
                  pintaba el castellano a pelo y encima mandaba a la home española:
                  desde /en/360 se salía del inglés sin haberlo pedido. */}
              <li><Link href={withLocale("/", locale)}>{t.marca}</Link></li>
              <li>
                <a href="https://app.discoolver.com" target="_blank" rel="noopener noreferrer">
                  {t.app}
                </a>
              </li>
              <li><Link href={withLocale("/privacidad", locale)}>{t.privacidad}</Link></li>
            </ul>
          </div>
        </div>
        <div className="b360-foot__bar">
          <span>© {new Date().getFullYear()} Discoolverworld S.L.</span>
          <span className="b360-foot__legal">
            <Link href={withLocale("/aviso-legal", locale)}>{t.avisoLegal}</Link>
            {" · "}
            <Link href={withLocale("/terminos", locale)}>{t.terminos}</Link>
            {" · "}
            <Link href={withLocale("/cookies", locale)}>{t.cookies}</Link>
            {" · "}
            <a href="mailto:info@discoolver.com">info@discoolver.com</a>
            {" · "}
            <a href={waHref()} target="_blank" rel="noopener noreferrer">
              {t.whatsapp} {WHATSAPP.display}
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
