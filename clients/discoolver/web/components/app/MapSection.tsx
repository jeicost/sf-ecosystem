"use client";

import { usePathname } from "next/navigation";
import { Reveal } from "@/components/ui/Reveal";
import { Icon } from "@/components/ui/Icon";
import type { AppHomeContent } from "@/lib/content/app-home";
import { localeFromPath, UI } from "@/lib/i18n";
import { PLATFORM } from "@/lib/platform";

const PINS = [
  { left: "22%", top: "32%", num: "01" },
  { left: "58%", top: "22%", num: "02" },
  { left: "72%", top: "60%", num: "03" },
  { left: "38%", top: "70%", num: "04" },
  { left: "50%", top: "48%", num: "05" },
];

export function MapSection({ content }: { content: AppHomeContent }) {
  // El mapa es una maqueta: los nombres salen del CMS, pero el cromo de la
  // interfaz ("5 cerca de ti") y las etiquetas para lector de pantalla iban
  // fijas en español también en /en.
  const t = UI[localeFromPath(usePathname())].home;
  const pills = [1, 2, 3, 4, 5].map((n) => ({
    cat: content[`map_pin_${n}_cat` as keyof AppHomeContent],
    name: content[`map_pin_${n}_name` as keyof AppHomeContent],
  }));

  return (
    <section className="section" id="mapa" style={{ background: "var(--bg-soft)" }} aria-labelledby="map-title">
      <div className="container">
        <Reveal delay={0}>
          <div className="section__head">
            <div className="section__head-text">
              <span className="eyebrow">{content.map_eyebrow}</span>
              <h2 className="display-lg section__title" id="map-title">
                {content.map_title} <span style={{ color: "var(--primary)" }}>{content.map_title_highlight}</span> {content.map_title_2}
              </h2>
              <p className="section__lead">{content.map_lead}</p>
            </div>
            {/* Antes: href="#main-content", devolvía al hero. El mapa existe de verdad. */}
            <a className="btn btn-ink" href={PLATFORM.coolMap}>
              {content.map_cta} <Icon name="arrow-up-right" size={14} />
            </a>
          </div>
        </Reveal>
        <Reveal delay={100}>
          <div className="map" role="application" aria-label={t.mapaAria}>
            <aside className="map__sidebar" aria-label={t.puntosAria}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--ink-2)" }}>
                  {t.cercaDeTi.replace("{n}", String(pills.length))}
                </span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-2)" }}>2 km</span>
              </div>
              {pills.map((pill, i) => (
                <button
                  key={pill.name}
                  className={`map__pill ${i === 1 ? "is-active" : ""}`}
                  aria-pressed={i === 1}
                  aria-label={`0${i + 1} · ${pill.cat} · ${pill.name}`}
                >
                  <span className="map__pill-cat">
                    0{i + 1} · {pill.cat}
                  </span>
                  <span className="map__pill-title">{pill.name}</span>
                </button>
              ))}
            </aside>
            <div className="map__canvas" aria-hidden="true">
              <div className="map__streets" />
              {PINS.map((pin, i) => (
                <button key={pin.num} className={`map__pin ${i === 1 ? "is-active" : ""}`} style={{ left: pin.left, top: pin.top }} aria-label={pills[i].name}>
                  <span>{pin.num}</span>
                </button>
              ))}
              <div className="map__pop" role="tooltip" style={{ left: "min(58%, calc(100% - 260px))", top: "calc(22% + 28px)" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--primary)", letterSpacing: ".1em", textTransform: "uppercase" }}>
                  {pills[1].cat}
                </span>
                <strong>{pills[1].name}</strong>
                <p style={{ color: "var(--ink-2)", fontSize: 13 }}>{content.map_popup_desc}</p>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
