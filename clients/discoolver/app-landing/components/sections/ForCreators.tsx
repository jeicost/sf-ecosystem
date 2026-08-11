import Image from "next/image";
import { Reveal } from "@/components/ui/Reveal";
import { Icon } from "@/components/ui/Icon";
import type { HomeContent } from "@/lib/content/home";

const IMAGES = ["/assets/img-feat-monetizable.jpg", "/assets/img-feat-personalized.jpg", "/assets/img-feat-maps-calendar.jpg", "/assets/img-metro-kangaroo.jpg"];

export function ForCreators({ content }: { content: HomeContent }) {
  const values = [1, 2, 3, 4].map((n) => ({
    title: content[`creator_value_${n}_title` as keyof HomeContent],
    desc: content[`creator_value_${n}_desc` as keyof HomeContent],
    image: IMAGES[n - 1],
  }));

  return (
    <section className="section" id="creators" style={{ background: "var(--bg-soft)" }} aria-labelledby="creators-title">
      <div className="container">
        <Reveal delay={0}>
          <div className="section__head">
            <div className="section__head-text">
              <span className="eyebrow">{content.creators_eyebrow}</span>
              <h2 className="display-lg section__title" id="creators-title">
                {content.creators_title_1}
                <br />
                <span style={{ color: "var(--primary)" }}>{content.creators_title_highlight}</span>
              </h2>
              <p className="section__lead">{content.creators_lead}</p>
            </div>
            <a className="btn btn-ink" href="/influencers">
              {content.creators_cta} <Icon name="arrow-up-right" size={14} />
            </a>
          </div>
        </Reveal>
        <div className="creator-values" role="list">
          {values.map((value, i) => (
            <Reveal delay={i * 80} key={value.title}>
              <div role="listitem" style={{ background: "var(--bg-card)", border: "1.5px solid var(--line)", borderRadius: "var(--radius-md)", overflow: "hidden", height: "100%" }}>
                <div style={{ position: "relative", width: "100%", aspectRatio: "4/3", overflow: "hidden" }}>
                  <Image src={value.image} alt="" fill sizes="(max-width: 640px) 100vw, 25vw" style={{ objectFit: "cover" }} />
                  <div
                    style={{
                      position: "absolute",
                      top: 12,
                      left: 12,
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      background: "var(--primary)",
                      color: "#fff",
                      display: "grid",
                      placeItems: "center",
                      fontFamily: "var(--font-display)",
                      fontWeight: 700,
                      fontSize: 14,
                      zIndex: 2,
                    }}
                    aria-hidden="true"
                  >
                    0{i + 1}
                  </div>
                </div>
                <div style={{ padding: 20 }}>
                  <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 22, marginBottom: 8, letterSpacing: "-0.02em" }}>{value.title}</h3>
                  <p style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.5 }}>{value.desc}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
