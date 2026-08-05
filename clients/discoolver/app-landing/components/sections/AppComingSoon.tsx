"use client";

import Image from "next/image";
import { useState } from "react";
import { Reveal } from "@/components/ui/Reveal";
import { Icon } from "@/components/ui/Icon";
import { Countdown } from "@/components/ui/Countdown";
import type { HomeContent } from "@/lib/content/home";

export function AppComingSoon({ content }: { content: HomeContent }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "app" }),
      });
      setStatus(res.ok ? "done" : "error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <section className="section app-soon" id="app" aria-labelledby="app-soon-title" style={{ position: "relative" }}>
      <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
        <Image src="/assets/img-phone-mockup.jpg" alt="" fill sizes="100vw" style={{ objectFit: "cover" }} />
        <div style={{ position: "absolute", inset: 0, background: "rgba(10,10,15,.88)" }} />
      </div>
      <div className="container" style={{ position: "relative", zIndex: 2 }}>
        <div className="app-soon__grid">
          <Reveal delay={0}>
            <div>
              <span className="eyebrow" style={{ color: "var(--accent)" }}>
                {content.app_soon_eyebrow}
              </span>
              <h2 className="display-lg" id="app-soon-title" style={{ marginTop: 16 }}>
                {content.app_soon_title_1} <span style={{ color: "var(--accent)" }}>{content.app_soon_title_num}</span> {content.app_soon_title_2}
                <br />
                {content.app_soon_title_3}
              </h2>
              <p style={{ marginTop: 20, fontSize: 17, color: "rgba(255,255,255,.7)", maxWidth: 520 }}>{content.app_soon_desc}</p>
              <Countdown />
              <form className="app-soon__form" aria-label="Suscribirse al aviso de lanzamiento de la app" onSubmit={handleSubmit}>
                <input
                  type="email"
                  placeholder="tu@correo.com"
                  required
                  aria-required="true"
                  aria-label="Tu email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <button type="submit" className="btn btn-primary" disabled={status === "loading"}>
                  {content.app_soon_cta} <Icon name="arrow-right" size={14} />
                </button>
              </form>
              {status === "done" && (
                <p role="status" style={{ marginTop: 12, fontSize: 13, color: "var(--accent)" }}>
                  Listo — te avisaremos por email en cuanto lancemos.
                </p>
              )}
              {status === "error" && (
                <p role="alert" style={{ marginTop: 12, fontSize: 13, color: "#ff8f7d" }}>
                  No se pudo enviar la solicitud. Inténtalo de nuevo en unos minutos.
                </p>
              )}
              <div style={{ display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
                <button className="btn btn-ghost" disabled aria-label="App Store — próximamente" style={{ borderColor: "rgba(255,255,255,.3)", color: "rgba(255,255,255,.9)" }}>
                  <Icon name="app-store" size={16} />
                  App Store · pronto
                </button>
                <button className="btn btn-ghost" disabled aria-label="Google Play — próximamente" style={{ borderColor: "rgba(255,255,255,.3)", color: "rgba(255,255,255,.9)" }}>
                  <Icon name="google-play" size={16} />
                  Google Play · pronto
                </button>
              </div>
            </div>
          </Reveal>
          <Reveal delay={140}>
            <div className="app-soon__phone-wrap">
              <div className="app-soon__sticker" aria-hidden="true">
                {content.app_soon_sticker}
              </div>
              <div className="phone-frame" aria-hidden="true">
                <div className="phone-frame__notch" />
                <div className="phone-frame__screen">
                  <div className="phone-app">
                    <div className="phone-app__top">
                      <div>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, opacity: 0.6, letterSpacing: ".1em", textTransform: "uppercase" }}>
                          Madrid · ahora
                        </div>
                        <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 22, lineHeight: 1.1, marginTop: 2, color: "#fff" }}>
                          Hola, <span style={{ color: "var(--primary)" }}>Lucía</span>
                        </div>
                      </div>
                      <div className="phone-app__avatar" />
                    </div>
                    <div className="phone-app__hero-card">
                      <Image src="/assets/phone-hero.jpg" alt="" width={280} height={210} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      <div className="phone-app__hero-meta">
                        <span className="phone-app__pill">Cool Map · 4 cerca</span>
                        <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 18, color: "#fff" }}>
                          Plan de hoy: <em style={{ color: "var(--accent)", fontStyle: "normal" }}>al sunset</em>
                        </span>
                      </div>
                    </div>
                    <div className="phone-app__row">
                      <div className="phone-app__chip is-active">Todos</div>
                      <div className="phone-app__chip">Gastro</div>
                      <div className="phone-app__chip">Cultura</div>
                      <div className="phone-app__chip">Aire libre</div>
                    </div>
                    <div className="phone-app__cards">
                      <div className="phone-app__card">
                        <Image src="/assets/phone-card-1.jpg" alt="" width={140} height={127} />
                        <div className="phone-app__card-body">
                          <div style={{ fontSize: 11, opacity: 0.6 }}>Gastro</div>
                          <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 13, color: "#fff", marginTop: 2 }}>Vermut &amp; vinilos</div>
                        </div>
                      </div>
                      <div className="phone-app__card">
                        <Image src="/assets/phone-card-2.jpg" alt="" width={140} height={127} />
                        <div className="phone-app__card-body">
                          <div style={{ fontSize: 11, opacity: 0.6 }}>Aire libre</div>
                          <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 13, color: "#fff", marginTop: 2 }}>Kayak al sunset</div>
                        </div>
                      </div>
                    </div>
                    <div className="phone-app__nav">
                      <div className="phone-app__nav-item is-active">
                        <Icon name="search" size={16} />
                      </div>
                      <div className="phone-app__nav-item">
                        <Icon name="pin" size={16} />
                      </div>
                      <div className="phone-app__nav-item">
                        <Icon name="calendar" size={16} />
                      </div>
                      <div className="phone-app__nav-item">
                        <Icon name="heart" size={16} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="app-soon__glow" />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
