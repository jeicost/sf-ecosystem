import { Reveal } from "@/components/ui/Reveal";
import { HeroForm } from "@/components/ui/HeroForm";
import type { HomeContent } from "@/lib/content/home";

/** City-request waitlist — reuses the existing formsubmit-backed form. */
export function Waitlist({ content }: { content: HomeContent }) {
  return (
    <section className="section waitlist" id="waitlist" aria-labelledby="waitlist-title">
      <div className="container" style={{ textAlign: "center" }}>
        <Reveal delay={0}>
          <span className="eyebrow">{content.waitlist_eyebrow}</span>
          <h2 className="display-lg section__title" id="waitlist-title">
            {content.waitlist_title_1} <span style={{ color: "var(--primary)" }}>{content.waitlist_title_em}</span>
          </h2>
          <p className="section__lead" style={{ margin: "16px auto 0" }}>
            {content.waitlist_text}
          </p>
        </Reveal>
        <Reveal delay={140}>
          <HeroForm />
        </Reveal>
      </div>
    </section>
  );
}
