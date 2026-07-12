"use client";

import { motion } from "motion/react";
import { useState } from "react";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { Mail, Phone, MapPin, Clock } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function ContactPage() {
  const { t } = useLanguage();
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError(false);
    try {
      const res = await fetch("https://formsubmit.co/ajax/info@salsaburgers.com", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          message: form.message,
          _subject: `New message from ${form.name} — Salsa Burgers`,
        }),
      });
      const data = await res.json();
      if (data.success === "true" || data.success === true) {
        setSent(true);
        setForm({ name: "", email: "", phone: "", message: "" });
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setSending(false);
    }
  };

  const contactInfo = [
    { icon: Mail, label: t.contact.labelEmail, value: "info@salsaburgers.com", color: "#ff0000" },
    { icon: Phone, label: t.contact.labelPhone, value: "+66 82 536 6653", color: "#ff0000" },
    { icon: MapPin, label: t.contact.labelAddress, value: "507, 10 Sathu Pradit Rd\nChong Nonsi, Yan Nawa\nBangkok 10120, Thailand", color: "#ff0000" },
  ];

  return (
    <main className="bg-[#0a0a0a]">
      <Nav />

      <section className="relative min-h-screen pt-32 pb-20 overflow-hidden bg-black">
        <div className="absolute inset-0 bg-gradient-to-br from-[#ff0000]/6 via-black to-black" />

        <div className="relative z-10 max-w-[1300px] mx-auto px-6 sm:px-8 lg:px-12">

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <div className="inline-block mb-6">
              <span className="text-[#ffd23f] text-xs font-black uppercase tracking-[0.3em] px-5 py-2 border border-[#ffd23f]/40 rounded-full">
                {t.contact.badge}
              </span>
            </div>
            <h1
              className="font-black uppercase tracking-tighter leading-none mb-4"
              style={{ fontSize: "clamp(3.5rem, 8vw, 9rem)" }}
            >
              <span className="text-white">{t.contact.title1} </span>
              <span style={{ color: "#ff0000" }}>{t.contact.title2}</span>
            </h1>
            <p className="text-white/60 text-xl font-medium max-w-lg mx-auto">
              {t.contact.sub}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

            {/* Left — Visit Us */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
            >
              <h2 className="text-2xl font-black text-white uppercase mb-6">{t.contact.visitUs}</h2>

              <div className="space-y-4 mb-8">
                {contactInfo.map(({ icon: Icon, label, value, color }) => (
                  <div
                    key={label}
                    className="flex items-start gap-5 p-5 rounded-2xl border border-white/[0.07]"
                    style={{ backgroundColor: "#111" }}
                  >
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center flex-none"
                      style={{ backgroundColor: `${color}20` }}
                    >
                      <Icon size={20} style={{ color }} />
                    </div>
                    <div>
                      <p className="text-white/40 text-xs font-black uppercase tracking-widest mb-1">{label}</p>
                      <p className="text-white font-bold text-base leading-relaxed" style={{ whiteSpace: "pre-line" }}>{value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Opening Hours */}
              <div
                className="p-6 rounded-2xl border border-white/[0.07]"
                style={{ backgroundColor: "#111" }}
              >
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-[#ff0000]/20 flex items-center justify-center">
                    <Clock size={18} className="text-[#ff0000]" />
                  </div>
                  <h3 className="text-white font-black uppercase text-sm tracking-widest">{t.contact.openingHours}</h3>
                </div>
                <div className="space-y-3">
                  {t.contact.days.map(({ days, hours }) => (
                    <div key={days} className="flex justify-between items-center">
                      <span className="text-white/60 text-sm font-medium">{days}</span>
                      <span className="text-white text-sm font-bold">{hours}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Right — Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <h2 className="text-2xl font-black text-white uppercase mb-6">{t.contact.sendMessage}</h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-white/50 text-xs font-black uppercase tracking-wider mb-2">{t.contact.fieldName}</label>
                  <input
                    type="text"
                    placeholder={t.contact.fieldNamePlaceholder}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-5 py-4 rounded-xl text-white font-medium placeholder-white/30 focus:outline-none focus:border-[#ff0000] transition-colors"
                    style={{ backgroundColor: "#1a1a1a", border: "1.5px solid rgba(255,255,255,0.1)" }}
                  />
                </div>
                <div>
                  <label className="block text-white/50 text-xs font-black uppercase tracking-wider mb-2">{t.contact.fieldEmail}</label>
                  <input
                    type="email"
                    placeholder={t.contact.fieldEmailPlaceholder}
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-5 py-4 rounded-xl text-white font-medium placeholder-white/30 focus:outline-none focus:border-[#ff0000] transition-colors"
                    style={{ backgroundColor: "#1a1a1a", border: "1.5px solid rgba(255,255,255,0.1)" }}
                  />
                </div>
                <div>
                  <label className="block text-white/50 text-xs font-black uppercase tracking-wider mb-2">{t.contact.fieldPhone}</label>
                  <input
                    type="tel"
                    placeholder={t.contact.fieldPhonePlaceholder}
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-5 py-4 rounded-xl text-white font-medium placeholder-white/30 focus:outline-none focus:border-[#ff0000] transition-colors"
                    style={{ backgroundColor: "#1a1a1a", border: "1.5px solid rgba(255,255,255,0.1)" }}
                  />
                </div>
                <div>
                  <label className="block text-white/50 text-xs font-black uppercase tracking-wider mb-2">{t.contact.fieldMessage}</label>
                  <textarea
                    placeholder={t.contact.fieldMessagePlaceholder}
                    rows={5}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="w-full px-5 py-4 rounded-xl text-white font-medium placeholder-white/30 focus:outline-none focus:border-[#ff0000] transition-colors resize-none"
                    style={{ backgroundColor: "#1a1a1a", border: "1.5px solid rgba(255,255,255,0.1)" }}
                  />
                </div>

                <motion.button
                  type="submit"
                  disabled={sending}
                  whileHover={{ scale: sending ? 1 : 1.02 }}
                  whileTap={{ scale: sending ? 1 : 0.98 }}
                  className="w-full py-5 rounded-full font-black text-white uppercase tracking-widest text-base flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
                  style={{ background: sent ? "#1a1a1a" : "linear-gradient(135deg, #f01a00, #af1200)", border: sent ? "1.5px solid rgba(255,255,255,0.15)" : "none" }}
                >
                  {sending ? (
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity="0.3" /><path d="M12 2a10 10 0 0 1 10 10" /></svg>
                      Sending...
                    </span>
                  ) : sent ? (
                    <span className="text-[#ff0000]">{t.contact.sent} ✓</span>
                  ) : error ? (
                    <span className="text-white">{t.contact.submit} — try again</span>
                  ) : (
                    <>
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                      </svg>
                      {t.contact.submit}
                    </>
                  )}
                </motion.button>
              </form>
            </motion.div>
          </div>

        </div>
      </section>

      <Footer />
    </main>
  );
}
