"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { Reveal } from "@/components/ui/Reveal";
import { Icon } from "@/components/ui/Icon";
import type { AppHomeContent } from "@/lib/content/app-home";
import { localeFromPath, UI, t } from "@/lib/i18n";
import { PLATFORM } from "@/lib/platform";

/**
 * Las herramientas de la plataforma, con la plataforma dentro.
 *
 * QUÉ ERA. Cuatro tarjetas de texto plano con "Ábrelo en la plataforma"
 * repetido cuatro veces, y un titular a tres líneas que dejaba media pantalla
 * vacía. Se prometía un producto vivo sin enseñarlo ni una vez.
 *
 * QUÉ ES AHORA. Capturas REALES de app.discoolver.com (19-ago-2026, Madrid).
 * Nada de mockups: la regla de la casa prohíbe inventar interfaz igual que
 * prohíbe inventar testimonios.
 *
 * LO QUE NO SE PUDO ENSEÑAR, Y SE DICE. `/wishlist` está detrás de login, así
 * que la cuarta tarjeta no lleva captura: lleva el aviso de que necesita cuenta
 * y el CTA para crearla. Enseñar una pantalla de "inicia sesión" como si fuera
 * producto habría sido peor, y esconder que hace falta cuenta, deshonesto.
 */
const HERRAMIENTAS = [
  { img: "/assets/product/app-map.jpg", href: PLATFORM.coolMap, pideCuenta: false },
  { img: "/assets/product/app-search.jpg", href: PLATFORM.planMyTrip, pideCuenta: false },
  { img: "/assets/product/app-calendar.jpg", href: PLATFORM.smartCalendar, pideCuenta: false },
  // Comprobado el 19-ago-2026: /wishlist es la única que topa con muro de
  // login. Por eso es la única que lleva etiqueta — y la única sin captura.
  { img: null, href: PLATFORM.collections, pideCuenta: true },
] as const;

export function HowItWorks({ content }: { content: AppHomeContent }) {
  const locale = localeFromPath(usePathname());
  const txt = t(locale).home;
  const es = locale !== "en";
  // Cada herramienta lleva su descriptor en español al lado del nombre de
  // producto (regla de marca: ningún nombre en inglés viaja solo) y su propio
  // CTA, que promete el resultado en vez de decir "abrir".
  const steps = [1, 2, 3, 4].map((n) => ({
    title: content[`step_${n}_title` as keyof AppHomeContent],
    descriptor: content[`step_${n}_descriptor` as keyof AppHomeContent],
    desc: content[`step_${n}_desc` as keyof AppHomeContent],
    cta: content[`step_${n}_cta` as keyof AppHomeContent],
  }));

  return (
    <section className="section herramientas" id="descubre" aria-labelledby="how-it-works-title">
      <div className="container">
        <Reveal delay={0}>
          <div className="section__head herramientas__head">
            <div className="section__head-text">
              <span className="eyebrow">{content.how_it_works_eyebrow}</span>
              <h2 className="display-lg section__title" id="how-it-works-title">
                {content.how_it_works_title_1}{" "}
                <span style={{ color: "var(--primary)" }}>{content.how_it_works_title_highlight}</span>
              </h2>
              <p className="section__lead">{content.how_it_works_lead}</p>
            </div>
            <a className="btn btn-primary" href={PLATFORM.home}>
              {content.how_it_works_cta} <Icon name="arrow-right" size={13} />
            </a>
          </div>
        </Reveal>
        <Reveal delay={120}>
          <ol className="herramientas__grid" aria-label={txt.comoFuncionaAria}>
            {steps.map((step, i) => {
              const h = HERRAMIENTAS[i];
              return (
                <li className="herramienta" key={step.title}>
                  <a href={h.href} className="herramienta__link" aria-label={txt.abrirAria.replace("{x}", step.title)}>
                    <div className={`herramienta__shot${h.img ? "" : " herramienta__shot--vacia"}`}>
                      {h.img ? (
                        <Image
                          src={h.img}
                          alt={
                            es
                              ? `${step.title} en app.discoolver.com, con datos reales de Madrid`
                              : `${step.title} on app.discoolver.com, with real Madrid data`
                          }
                          width={1400}
                          height={875}
                          sizes="(max-width: 720px) 100vw, 50vw"
                        />
                      ) : (
                        <span className="herramienta__candado">
                          <Icon name="heart" size={22} />
                        </span>
                      )}
                    </div>
                    <div className="herramienta__texto">
                      <span className="herramienta__meta">
                        <span className="herramienta__num" aria-hidden="true">
                          0{i + 1}
                        </span>
                        {h.pideCuenta && (
                          <span className="herramienta__etiqueta">{content.herramientas_cuenta}</span>
                        )}
                      </span>
                      <h3 className="herramienta__titulo">
                        {step.title} <span className="herramienta__descriptor">— {step.descriptor}</span>
                      </h3>
                      <p className="herramienta__desc">{step.desc}</p>
                      <span className="herramienta__cta">
                        {step.cta} <Icon name="arrow-right" size={13} />
                      </span>
                    </div>
                  </a>
                </li>
              );
            })}
          </ol>
        </Reveal>
        {/* La línea de gratuidad no es decorativa: más abajo la home vende las
            guías a 14€/29€ y sin esto el visitante da por hecho que ese precio
            es el de la plataforma. */}
        <Reveal delay={200}>
          <p className="herramientas__pie">{content.herramientas_pie}</p>
        </Reveal>
      </div>
    </section>
  );
}
