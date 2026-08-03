"use client";

import { useState } from "react";
import { Reveal } from "@/components/ui/Reveal";
import type { InfluencersContent } from "@/lib/content/influencers";

const FOCUS_TAGS = ["Food", "Culture", "Nightlife", "Outdoor", "Budget", "Luxury", "Wellness", "LGBTQ+", "Tech Travel", "Family"];
const REGIONS = ["Europe", "Latin America", "North America", "Asia Pacific", "Middle East & Africa", "Southeast Asia", "Global"];

const inputStyle: React.CSSProperties = {
  padding: "12px 16px",
  background: "var(--bg-card)",
  border: "1.5px solid var(--line)",
  borderRadius: "var(--radius-md)",
  color: "var(--ink)",
  fontFamily: "var(--font-body)",
  fontSize: 14,
  outline: "none",
};

export function InfluencerForm({ content }: { content: InfluencersContent }) {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  function toggleTag(tag: string) {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    const formData = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.get("creator-email"),
          type: "creator",
          source: "influencer",
          focus: selectedTags,
          region: formData.get("region"),
          instagram: formData.get("instagram"),
          tiktok: formData.get("tiktok"),
          youtube: formData.get("youtube"),
          website: formData.get("website"),
          other: formData.get("other"),
          message: formData.get("message"),
        }),
      });
      setStatus(res.ok ? "done" : "error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <section id="apply" className="section" aria-labelledby="apply-title" style={{ background: "var(--bg-soft)" }}>
      <div className="container" style={{ maxWidth: 800 }}>
        <Reveal delay={0}>
          <span className="eyebrow">{content.apply_eyebrow}</span>
          <h2 className="display-lg section__title" id="apply-title" style={{ marginTop: 12 }}>
            {content.apply_title} <span style={{ color: "var(--primary)", fontStyle: "italic" }}>{content.apply_title_highlight}</span>
          </h2>
        </Reveal>
        <form style={{ marginTop: 40 }} onSubmit={handleSubmit} noValidate>
          <Reveal delay={80}>
            <fieldset style={{ border: "none", padding: 0, marginBottom: 32 }}>
              <legend style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--ink-2)", marginBottom: 14, display: "block" }}>
                {content.apply_content_focus_label}
              </legend>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {FOCUS_TAGS.map((tag) => {
                  const active = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      aria-pressed={active}
                      className="btn"
                      onClick={() => toggleTag(tag)}
                      style={{
                        padding: "8px 16px",
                        fontSize: 13,
                        background: active ? "var(--primary)" : "transparent",
                        color: active ? "#fff" : "var(--ink)",
                        border: `1.5px solid ${active ? "var(--primary)" : "var(--line)"}`,
                        borderRadius: "var(--radius-xl)",
                        transition: "all .2s",
                      }}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          </Reveal>
          <Reveal delay={120}>
            <div style={{ marginBottom: 24 }}>
              <label htmlFor="region" style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--ink-2)", display: "block", marginBottom: 10 }}>
                {content.apply_region_label}
              </label>
              <select id="region" name="region" style={{ ...inputStyle, width: "100%", padding: "14px 16px", color: "var(--ink-2)", appearance: "none", cursor: "pointer" }} defaultValue="">
                <option value="" disabled>
                  Select a region
                </option>
                {REGIONS.map((region) => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </select>
            </div>
          </Reveal>
          <Reveal delay={160}>
            <fieldset style={{ border: "none", padding: 0, marginBottom: 24 }}>
              <legend style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--ink-2)", marginBottom: 14, display: "block" }}>
                {content.apply_socials_label}
              </legend>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <input type="url" name="instagram" placeholder="Instagram" style={inputStyle} />
                <input type="url" name="tiktok" placeholder="Tiktok" style={inputStyle} />
                <input type="url" name="youtube" placeholder="Youtube" style={inputStyle} />
                <input type="url" name="website" placeholder="Blog / Website" style={inputStyle} />
                <input type="url" name="other" placeholder="Other" style={inputStyle} />
              </div>
            </fieldset>
          </Reveal>
          <Reveal delay={200}>
            <div style={{ marginBottom: 24 }}>
              <label htmlFor="message" style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--ink-2)", display: "block", marginBottom: 10 }}>
                {content.apply_message_label}
              </label>
              <textarea
                id="message"
                name="message"
                rows={4}
                placeholder={content.apply_message_placeholder}
                style={{ ...inputStyle, width: "100%", padding: "14px 16px", fontSize: 15, resize: "vertical", lineHeight: 1.6, boxSizing: "border-box" }}
              />
            </div>
          </Reveal>
          <Reveal delay={240}>
            <div style={{ marginBottom: 32 }}>
              <label htmlFor="creator-email" style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--ink-2)", display: "block", marginBottom: 10 }}>
                {content.apply_email_label}
              </label>
              <input
                id="creator-email"
                name="creator-email"
                type="email"
                required
                placeholder="your@email.com"
                autoComplete="email"
                style={{ ...inputStyle, width: "100%", padding: "14px 16px", fontSize: 15, boxSizing: "border-box" }}
              />
            </div>
          </Reveal>
          <Reveal delay={280}>
            <button type="submit" className="btn btn-primary" style={{ fontSize: 16, padding: "16px 32px", width: "100%" }} disabled={status === "loading"}>
              {status === "done" ? "¡Solicitud enviada!" : content.apply_submit}
            </button>
            {status === "error" && (
              <p role="alert" style={{ marginTop: 14, fontSize: 13, color: "#ff8f7d", textAlign: "center" }}>
                No se pudo enviar la solicitud. Inténtalo de nuevo en unos minutos.
              </p>
            )}
          </Reveal>
        </form>
      </div>
    </section>
  );
}
