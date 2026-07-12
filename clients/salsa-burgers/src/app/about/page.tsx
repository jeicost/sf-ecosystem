"use client";

import { motion } from "motion/react";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { useLanguage } from "@/context/LanguageContext";

export default function AboutPage() {
  const { t } = useLanguage();

  return (
    <main className="bg-[#0a0a0a]">
      <Nav />

      <section className="relative min-h-screen pt-32 pb-20 overflow-hidden bg-black">
        {/* Red glow */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#ff0000]/8 via-black to-black" />
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.06, 0.12, 0.06] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/4 right-1/4 w-[600px] h-[600px] bg-[#ff0000] rounded-full blur-[200px]"
          />
        </div>

        <div className="relative z-10 max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20 items-center">

            {/* Left — content */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.9 }}
            >
              <div className="inline-block mb-6">
                <span className="text-[#ffd23f] text-xs font-black uppercase tracking-[0.3em] px-5 py-2 border border-[#ffd23f]/40 rounded-full">
                  {t.about.badge}
                </span>
              </div>

              <h1
                className="font-black uppercase tracking-tighter leading-[0.88] mb-8"
                style={{ fontSize: "clamp(3rem, 7vw, 8rem)" }}
              >
                <span className="text-white">{t.about.title1} </span>
                <span style={{ color: "#ff0000" }}>{t.about.title2}</span>
                <br />
                <span style={{ color: "#ff0000" }}>{t.about.title3}</span>
              </h1>

              <div className="space-y-5 text-white/70 text-lg font-medium leading-relaxed mb-8">
                <p>
                  {t.about.p1.split(t.about.p1bold)[0]}<strong className="text-white">{t.about.p1bold}</strong>{t.about.p1.split(t.about.p1bold)[1]}
                </p>
                <p>
                  {t.about.p2.split(t.about.p2accent1)[0]}<strong style={{ color: "#ffd23f" }}>{t.about.p2accent1}</strong>{t.about.p2.split(t.about.p2accent1)[1]?.split(t.about.p2accent2)[0]}<strong style={{ color: "#ffd23f" }}>{t.about.p2accent2}</strong>{t.about.p2.split(t.about.p2accent2).pop()}
                </p>
                <p>
                  {t.about.p3.split(t.about.p3bold)[0]}<strong className="text-white">{t.about.p3bold}</strong>{t.about.p3.split(t.about.p3bold).pop()}
                </p>
              </div>

              {/* Quote */}
              <div className="border-l-4 border-[#ff0000] pl-6 mb-10">
                <p className="text-white text-xl font-black italic">
                  {t.about.quote}
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6">
                {[
                  { value: "15+", label: t.about.stat1, color: "#ff0000" },
                  { value: "16", label: t.about.stat2, color: "#ffd23f" },
                  { value: "100%", label: t.about.stat3, color: "#ffffff" },
                ].map((stat) => (
                  <div key={stat.label}>
                    <div className="text-4xl sm:text-5xl font-black mb-1" style={{ color: stat.color }}>
                      {stat.value}
                    </div>
                    <div className="text-white/50 text-xs font-black uppercase tracking-widest">{stat.label}</div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Right — brand photo */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.9, delay: 0.15 }}
              className="relative"
            >
              <div className="relative rounded-3xl overflow-hidden" style={{ aspectRatio: "3/4" }}>
                {/* Drip effect top */}
                <div className="absolute top-0 left-0 right-0 z-10 flex justify-around">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="w-3 rounded-b-full"
                      style={{
                        height: `${40 + i * 15}px`,
                        backgroundColor: "#ff0000",
                        opacity: 0.7 + i * 0.05,
                      }}
                    />
                  ))}
                </div>

                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/freepik_please-create-smoke-with-_2719497859.jpg"
                  alt="Salsa Burgers Experience"
                  className="w-full h-full object-cover object-center"
                  style={{ imageRendering: "crisp-edges" }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
