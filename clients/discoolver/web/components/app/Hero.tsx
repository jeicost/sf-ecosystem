import Image from "next/image";
import { Reveal } from "@/components/ui/Reveal";
import { HeroEntrar } from "@/components/app/HeroEntrar";
import type { Locale } from "@/lib/i18n";
import type { AppHomeContent } from "@/lib/content/app-home";

const AVATAR_COLORS = ["#C9FF3F", "#C426C4", "#00D4D4", "#F2F0EA"];

export function Hero({ content, locale = "es" }: { content: AppHomeContent; locale?: Locale }) {
  return (
    <header className="hero" id="main-content">
      <div className="container">
        <div className="hero__grid">
          <div>
            <Reveal delay={0}>
              <span className="eyebrow">{content.hero_eyebrow}</span>
            </Reveal>
            <Reveal delay={80}>
              <h1 className="display-xl" style={{ marginTop: 24 }}>
                {content.hero_title_line1}{" "}
                <span className="hero__city" style={{ color: "var(--primary)", position: "relative", display: "inline-block" }}>
                  {content.hero_title_highlight1}
                  <span
                    aria-hidden="true"
                    style={{ position: "absolute", left: 0, right: 0, bottom: "0.08em", height: "0.1em", background: "var(--accent)", zIndex: -1 }}
                  />
                </span>
                <br />
                {content.hero_title_line2}
                <br />
                {content.hero_title_line3} <span style={{ color: "var(--primary)" }}>{content.hero_title_highlight2}</span>
              </h1>
            </Reveal>
            <Reveal delay={160}>
              <p className="hero__sub" style={{ marginTop: 32, maxWidth: 560, fontSize: 19, lineHeight: 1.5, color: "var(--ink-2)" }}>
                {content.hero_sub} <strong style={{ color: "var(--ink)" }}>{content.hero_sub_strong}</strong>
              </p>
            </Reveal>
            <Reveal delay={220}>
              {/* Aquí había un formulario de email que pedía la ciudad y
                  prometía avisar. La plataforma YA está abierta, así que el
                  primer paso del hero es entrar en ella, no apuntarse a una
                  lista. La captación de ciudades sigue viva en el bloque de
                  la próxima ciudad y en /guias. */}
              <HeroEntrar locale={locale} />
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 18, fontSize: 13, color: "var(--ink-2)", flexWrap: "wrap" }}>
                <div style={{ display: "flex", marginRight: 4 }} aria-hidden="true">
                  {AVATAR_COLORS.map((color, i) => (
                    <span
                      key={color}
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: "50%",
                        background: color,
                        border: "2px solid var(--paper)",
                        marginLeft: i === 0 ? 0 : -8,
                        display: "inline-block",
                      }}
                    />
                  ))}
                </div>
                <span>
                  <strong style={{ color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{content.hero_social_count}</strong>{" "}
                  {content.hero_social_label}
                </span>
                <span aria-hidden="true" style={{ width: 4, height: 4, background: "var(--ink-2)", borderRadius: "50%", display: "inline-block" }} />
                <span style={{ color: "var(--primary)", fontWeight: 500 }}>{content.hero_social_live}</span>
              </div>
            </Reveal>
            <Reveal delay={320}>
              <div className="hero__stats">
                <div>
                  <div className="stat__num">{content.hero_stat1_num}</div>
                  <div className="stat__label">{content.hero_stat1_label}</div>
                </div>
                <div>
                  <div className="stat__num">{content.hero_stat2_num}</div>
                  <div className="stat__label">{content.hero_stat2_label}</div>
                </div>
                <div>
                  <div className="stat__num">{content.hero_stat3_num}</div>
                  <div className="stat__label">{content.hero_stat3_label}</div>
                </div>
                <div>
                  <div className="stat__num">{content.hero_stat4_num}</div>
                  <div className="stat__label">{content.hero_stat4_label}</div>
                </div>
              </div>
            </Reveal>
          </div>
          <Reveal delay={200}>
            <div className="hero__visual">
              <video
                src="/assets/v-hero-owl.mp4"
                poster="/assets/poster-hero-owl.jpg"
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                aria-label="Demo de Discoolver mostrando planes en la ciudad"
              />
              <div className="hero__visual-meta">
                <span className="hero__visual-pill">{content.hero_visual_pill}</span>
                <span className="hero__visual-title">{content.hero_visual_title}</span>
              </div>
              <div className="hero__mini hero__mini--bunny" aria-hidden="true">
                <Image src="/assets/img-bunny.jpg" alt="" width={140} height={180} style={{ objectFit: "cover", objectPosition: "center 20%" }} />
              </div>
              <div className="hero__mini hero__mini--fox" aria-hidden="true">
                <Image src="/assets/img-fox.jpg" alt="" width={120} height={120} style={{ objectFit: "cover", objectPosition: "center 30%" }} />
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </header>
  );
}
