"use client";

import { usePathname } from "next/navigation";
import { Reveal } from "@/components/ui/Reveal";
import { Icon } from "@/components/ui/Icon";
import type { AppHomeContent } from "@/lib/content/app-home";
import { localeFromPath, UI } from "@/lib/i18n";
import { PLATFORM } from "@/lib/platform";

const STEP_ICONS = ["pin", "compass", "calendar", "buddy"] as const;

/**
 * El texto de los pasos viene del CMS y ya estaba traducido; lo que salía en
 * español en /en era el enlace a la plataforma y sus aria-label, que no son
 * copy editable y vivían escritos a mano aquí. El idioma se lee de la URL
 * porque la home la comparten `/` y `/en` y el locale no baja hasta aquí.
 */
export function HowItWorks({ content }: { content: AppHomeContent }) {
  const t = UI[localeFromPath(usePathname())].home;
  // Cada herramienta enlaza a su contrapartida REAL en la plataforma: la
  // landing promete, app.discoolver.com cumple. Mismo orden que los campos.
  const steps = [
    { title: content.step_1_title, desc: content.step_1_desc, href: PLATFORM.coolMap },
    { title: content.step_2_title, desc: content.step_2_desc, href: PLATFORM.planMyTrip },
    { title: content.step_3_title, desc: content.step_3_desc, href: PLATFORM.smartCalendar },
    { title: content.step_4_title, desc: content.step_4_desc, href: PLATFORM.collections },
  ];

  return (
    <section className="section" id="descubre" style={{ paddingTop: 0 }} aria-labelledby="how-it-works-title">
      <div className="container">
        <Reveal delay={0}>
          <div className="section__head">
            <div className="section__head-text">
              <span className="eyebrow">{content.how_it_works_eyebrow}</span>
              <h2 className="display-lg section__title" id="how-it-works-title">
                {content.how_it_works_title_1}
                <br />
                {content.how_it_works_title_2} <span style={{ color: "var(--primary)" }}>{content.how_it_works_title_highlight}</span>{" "}
                {content.how_it_works_title_3}
              </h2>
            </div>
          </div>
        </Reveal>
        <Reveal delay={120}>
          <ol className="steps" aria-label={t.comoFuncionaAria}>
            {steps.map((step, i) => (
              <li className="step" key={step.title}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <span className="step__num" aria-hidden="true">
                    0{i + 1}
                  </span>
                  <span className="step__icon" aria-hidden="true">
                    <Icon name={STEP_ICONS[i]} />
                  </span>
                </div>
                <h3 className="step__title">{step.title}</h3>
                <p className="step__desc">{step.desc}</p>
                <a
                  href={step.href}
                  aria-label={t.abrirAria.replace("{x}", step.title)}
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: "auto", paddingTop: 16, fontWeight: 600, fontSize: 14 }}
                >
                  {t.abrir} <Icon name="arrow-up-right" size={13} />
                </a>
              </li>
            ))}
          </ol>
        </Reveal>
      </div>
    </section>
  );
}
