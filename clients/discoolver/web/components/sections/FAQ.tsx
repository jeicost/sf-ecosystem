"use client";

import { useState } from "react";
import { Reveal } from "@/components/ui/Reveal";
import type { HomeContent } from "@/lib/content/home";

export function FAQ({ content }: { content: HomeContent }) {
  const [openIndex, setOpenIndex] = useState<number>(0);
  const items = [1, 2, 3, 4, 5, 6, 7].map((n) => ({
    q: content[`faq_q${n}` as keyof HomeContent],
    a: content[`faq_a${n}` as keyof HomeContent],
  }));

  return (
    <section className="section" id="faq" style={{ background: "var(--paper)" }} aria-labelledby="faq-title">
      <div className="container">
        <Reveal delay={0}>
          <div className="section__head">
            <div className="section__head-text">
              <span className="eyebrow">{content.faq_eyebrow}</span>
              <h2 className="display-lg section__title" id="faq-title">
                {content.faq_title_1} <span style={{ color: "var(--primary)" }}>{content.faq_title_highlight}</span>
              </h2>
              <p className="section__lead">
                {content.faq_lead_pre}{" "}
                <a href={`mailto:${content.faq_lead_email}`} style={{ color: "var(--primary)", textDecoration: "underline" }}>
                  {content.faq_lead_email}
                </a>
                {content.faq_lead_post}
              </p>
            </div>
          </div>
        </Reveal>
        <div className="faq__list" role="list" aria-label="Preguntas frecuentes">
          {items.map((item, i) => {
            const isOpen = openIndex === i;
            return (
              <Reveal delay={i * 40} key={item.q}>
                <div role="listitem">
                  <button
                    className={`faq__item ${isOpen ? "is-open" : ""}`}
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${i}`}
                    id={`faq-question-${i}`}
                    onClick={() => setOpenIndex(isOpen ? -1 : i)}
                  >
                    <div className="faq__row">
                      <span className="faq__num" aria-hidden="true">
                        0{i + 1}
                      </span>
                      <span className="faq__q">{item.q}</span>
                      <span className="faq__icon" aria-hidden="true">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                          <path d="M5 12h14" />
                          <path d="M12 5v14" className="faq__icon-v" />
                        </svg>
                      </span>
                    </div>
                    <div className="faq__answer" id={`faq-answer-${i}`} role="region" aria-labelledby={`faq-question-${i}`}>
                      <p>{item.a}</p>
                    </div>
                  </button>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
