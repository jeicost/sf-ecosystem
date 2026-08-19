import { Reveal } from "@/components/ui/Reveal";
import { VideoBajoDemanda } from "@/components/app/VideoBajoDemanda";
import { PLATFORM } from "@/lib/platform";
import type { Locale } from "@/lib/i18n";
import type { AppHomeContent } from "@/lib/content/app-home";

/**
 * El bloque magenta. Estructura original (eyebrow + H2 + cuatro bullets con
 * check) — el CEO la mantiene a propósito; lo que cambió el 19-ago-2026 es el
 * copy y tres cosas concretas:
 *
 *  · **Fuera la cita anónima** ("Sugerencias con criterio. Sitios de verdad.").
 *    No la firmaba nadie y los testimonios van a tener sección propia.
 *  · **Cada bullet abre con su beneficio en negrita.** Por eso son dos campos
 *    por bullet (`_lead` y `_text`) y no marcado dentro de un campo: quien edite
 *    desde el CMS no tiene que saber escribir asteriscos.
 *  · **La bullet 2 enlaza a Plan My Trip**, que es la herramienta que la cumple.
 *
 * El vídeo pasa por VideoBajoDemanda: en móvil no se descarga (13 MB), se
 * enseña el póster.
 */
export function TravelBrain({ content, locale = "es" }: { content: AppHomeContent; locale?: Locale }) {
  const bullets = [1, 2, 3, 4].map((n) => ({
    lead: content[`travel_brain_bullet_${n}_lead` as keyof AppHomeContent],
    text: content[`travel_brain_bullet_${n}` as keyof AppHomeContent],
    href: n === 2 ? PLATFORM.planMyTrip : null,
  }));

  return (
    <section className="brain" aria-labelledby="travel-brain-title">
      <div className="container brain__grid">
        <Reveal delay={0}>
          <div className="brain__media">
            <VideoBajoDemanda
              src="/assets/v-card-accommodations.mp4"
              poster="/assets/poster-smart-card.jpg"
              ancho={640}
              alto={800}
              etiqueta={
                locale === "en"
                  ? "Discoolver planning tools in use"
                  : "Herramientas de planificación de Discoolver en uso"
              }
            />
            <span className="brain__badge" aria-hidden="true">
              {content.travel_brain_badge}
            </span>
          </div>
        </Reveal>
        <Reveal delay={120}>
          <div>
            <span className="eyebrow brain__eyebrow">{content.travel_brain_eyebrow}</span>
            <h2 className="display-lg brain__titulo" id="travel-brain-title">
              {content.travel_brain_title_1}{" "}
              <span className="brain__acento">{content.travel_brain_title_highlight}</span>
            </h2>
            <ul role="list" className="brain__lista">
              {bullets.map((b, i) => (
                <li key={i}>
                  <span className="brain__check" aria-hidden="true">
                    ✓
                  </span>
                  <span>
                    <strong>{b.lead}</strong> {b.href ? <a href={b.href}>{b.text}</a> : b.text}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
