"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, MessageCircle, Send, ChevronDown } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useOrder } from "@/context/OrderContext";
import { Lang } from "@/lib/translations";

type Message = { role: "bot" | "user"; text: string };

const faqs: Record<Lang, { q: string; a: string }[]> = {
  en: [
    {
      q: "🍔 What burgers do you have?",
      a: "We have 3 lines: **Salsa Classics** (7 burgers, from the OG to the Truffle Flow), **Bangkok Specials** (4 burgers with local flavours like Khao Soi & Tom Yum), and **Global Fusion** (5 burgers like K-Spice, Miso Onsen & Mala). Plus **Salsa Deluxe** for premium occasions (Lobster, Foie, Dry-Aged Ribeye). Check the full menu!",
    },
    {
      q: "🥫 What sauces do you make?",
      a: "We craft **16 artisan sauces** in-house every single day: House Sauce, Mala (level 1 & 2), Tom Yum, Truffle Mayo, BBQ, Katsu Mayo, Gochujang, Khao Soi sauce and more. Every bottle is made fresh — that's the Salsa difference.",
    },
    {
      q: "🚴 How fast is delivery?",
      a: "Hot and fresh in approximately **30 minutes** across all Bangkok areas. We deliver via Grab and LINE MAN — just pick your platform!",
    },
    {
      q: "📍 Where are you located?",
      a: "We're at **507, 10 Sathu Pradit Rd, Chong Nonsi, Yan Nawa, Bangkok 10120**. Order for delivery via Grab or LINE MAN and we'll bring it straight to you.",
    },
    {
      q: "🕐 Opening hours?",
      a: "**Mon–Thu:** 11:00 AM – 10:00 PM\n**Fri–Sat:** 11:00 AM – 11:00 PM\n**Sunday:** 12:00 PM – 9:00 PM",
    },
    {
      q: "🥩 Is it real Wagyu?",
      a: "100% yes. Every burger uses **Premium Wagyu Beef** — no exceptions. Quality is non-negotiable at Salsa Burgers.",
    },
  ],
  th: [
    {
      q: "🍔 มีเบอร์เกอร์อะไรบ้าง?",
      a: "เรามี 3 ไลน์: **ซัลซ่าคลาสสิก** (7 เบอร์เกอร์), **สเปเชียลกรุงเทพ** (4 เบอร์เกอร์ เช่น ข้าวซอย & ต้มยำ) และ **ฟิวชันโลก** (5 เบอร์เกอร์ เช่น K-Spice, มิโซะ ออนเซ็น & มาล่า) พร้อมไลน์ **ซัลซ่าดีลักซ์** สำหรับโอกาสพิเศษ (กุ้งมังกร, ฟัวกราส์, ริบอาย) ดูเมนูทั้งหมดได้เลย!",
    },
    {
      q: "🥫 ซอสมีอะไรบ้าง?",
      a: "เราทำซอสซิกเนเจอร์กว่า 6+ ชนิดเองทุกวัน: เฮาส์ซอส, มาล่า (ระดับ 1 & 2), ต้มยำ, ทรัฟเฟิลมาโย, บาร์บีคิว, คัตสึมาโย, โกชูจัง, ซอสข้าวซอย และอื่นๆ ทุกขวดทำสดใหม่ทุกวัน",
    },
    {
      q: "🚴 ส่งเร็วแค่ไหน?",
      a: "ร้อนสดใน **ประมาณ 30 นาที** ทั่วกรุงเทพฯ สั่งผ่าน Grab หรือ LINE MAN เลือกได้เลย!",
    },
    {
      q: "📍 อยู่ที่ไหน?",
      a: "เราอยู่ที่ **507, 10 ถนนสาธุประดิษฐ์, ช่องนนทรี, ยานนาวา, กรุงเทพฯ 10120** — สั่งส่งผ่าน Grab หรือ LINE MAN ได้เลย",
    },
    {
      q: "🕐 เวลาทำการ?",
      a: "**จันทร์–พฤหัสบดี:** 11:00 – 22:00 น.\n**ศุกร์–เสาร์:** 11:00 – 23:00 น.\n**อาทิตย์:** 12:00 – 21:00 น.",
    },
    {
      q: "🥩 ใช้วากิวจริงๆ ไหม?",
      a: "จริง 100% เบอร์เกอร์ทุกชิ้นใช้ **เนื้อวากิวพรีเมียม** ไม่มีข้อยกเว้น คุณภาพคือสิ่งที่เราไม่ยอมลดทอน",
    },
  ],
  es: [
    {
      q: "🍔 ¿Qué hamburguesas tenéis?",
      a: "Tenemos 3 líneas: **Clásicos Salsa** (7 burgers), **Especiales Bangkok** (4 burgers con sabores locales como Khao Soi & Tom Yum) y **Fusión Global** (5 burgers como K-Spice, Miso Onsen & Mala). Más **Salsa Deluxe** para ocasiones premium (Langosta, Foie, Ribeye). ¡Mira el menú completo!",
    },
    {
      q: "🥫 ¿Qué salsas hacéis?",
      a: "Elaboramos más de 6 salsas artesanas en casa cada día: House Sauce, Mala (nivel 1 & 2), Tom Yum, Truffle Mayo, BBQ, Katsu Mayo, Gochujang, salsa Khao Soi y más. Cada botella, fresca del día — esa es la diferencia Salsa.",
    },
    {
      q: "🚴 ¿Cuánto tarda el reparto?",
      a: "Caliente y fresco en aproximadamente **30 minutos** por toda Bangkok. Repartimos vía Grab y LINE MAN — ¡elige tu plataforma!",
    },
    {
      q: "📍 ¿Dónde estáis?",
      a: "Estamos en **507, 10 Sathu Pradit Rd, Chong Nonsi, Yan Nawa, Bangkok 10120**. Pide a domicilio vía Grab o LINE MAN.",
    },
    {
      q: "🕐 ¿Horario?",
      a: "**Lun–Jue:** 11:00 – 22:00\n**Vie–Sáb:** 11:00 – 23:00\n**Domingo:** 12:00 – 21:00",
    },
    {
      q: "🥩 ¿Es Wagyu de verdad?",
      a: "100% sí. Todas nuestras hamburguesas usan **Wagyu Premium** — sin excepciones. La calidad es innegociable en Salsa Burgers.",
    },
  ],
};

const greetings: Record<Lang, string> = {
  en: "Hey! 👋 I'm the Salsa bot. Ask me anything about our burgers, sauces or delivery — or tap a question below.",
  th: "สวัสดี! 👋 ฉันคือบอทของซัลซ่า ถามฉันได้เลยเกี่ยวกับเบอร์เกอร์ ซอส หรือการจัดส่ง หรือแตะคำถามด้านล่าง",
  es: "¡Hola! 👋 Soy el bot de Salsa. Pregúntame lo que quieras sobre hamburguesas, salsas o reparto — o toca una pregunta abajo.",
};

const orderLabels: Record<Lang, string> = {
  en: "Order now →",
  th: "สั่งเดี๋ยวนี้ →",
  es: "Pedir ahora →",
};

const inputPlaceholders: Record<Lang, string> = {
  en: "Type your question…",
  th: "พิมพ์คำถาม…",
  es: "Escribe tu pregunta…",
};

function formatText(text: string) {
  return text.split("\n").map((line, i) => (
    <span key={i}>
      {line.split(/\*\*(.*?)\*\*/g).map((part, j) =>
        j % 2 === 1 ? <strong key={j} className="text-white font-black">{part}</strong> : part
      )}
      {i < text.split("\n").length - 1 && <br />}
    </span>
  ));
}

export function ChatBot() {
  const { lang } = useLanguage();
  const { openOrder } = useOrder();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [hasNew, setHasNew] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  const currentFaqs = faqs[lang];

  useEffect(() => {
    if (open) {
      setHasNew(false);
      if (messages.length === 0) {
        setMessages([{ role: "bot", text: greetings[lang] }]);
      }
    }
  }, [open, lang, messages.length]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendFaq = (faq: { q: string; a: string }) => {
    setMessages((prev) => [
      ...prev,
      { role: "user", text: faq.q },
      { role: "bot", text: faq.a },
    ]);
  };

  const sendMessage = () => {
    const text = input.trim();
    if (!text) return;
    setInput("");

    const lower = text.toLowerCase();
    const match = currentFaqs.find((f) =>
      f.q.toLowerCase().includes(lower) ||
      lower.includes(f.q.toLowerCase().replace(/[^a-záéíóúàèùâêîôûäëïöü0-9฀-๿ ]/gi, "").trim().split(" ").filter(w => w.length > 3)[0] || "")
    );

    const fallbacks: Record<Lang, string> = {
      en: "Great question! I'm not sure about that one — tap the WhatsApp button below to chat directly with us 🌶️",
      th: "คำถามดีมาก! ไม่แน่ใจเลย — แตะปุ่ม WhatsApp ด้านล่างเพื่อคุยกับเราโดยตรง 🌶️",
      es: "¡Buena pregunta! No estoy seguro — pulsa el botón de WhatsApp abajo para hablar con nosotros directamente 🌶️",
    };

    setMessages((prev) => [
      ...prev,
      { role: "user", text },
      { role: "bot", text: match ? match.a : fallbacks[lang] },
    ]);
  };

  return (
    <>
      {/* Floating button */}
      <div className="fixed right-4 md:right-8 z-50" style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 24px)" }}>
        <AnimatePresence mode="wait">
          {!open && (
            <motion.button
              key="fab"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setOpen(true)}
              className="relative w-14 h-14 rounded-full shadow-2xl flex items-center justify-center"
              style={{ backgroundColor: "#ff0000", boxShadow: "0 0 30px rgba(255,0,0,0.5)" }}
            >
              <MessageCircle size={24} className="text-white" />
              {hasNew && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#ffd23f] rounded-full border-2 border-black" />
              )}
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="chat"
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="fixed z-50 flex flex-col"
            style={{
              bottom: "calc(env(safe-area-inset-bottom, 0px) + 90px)",
              right: "1.5rem",
              width: "min(380px, calc(100vw - 3rem))",
              height: "min(520px, calc(100svh - 160px))",
            }}
          >
            <div
              className="flex flex-col h-full rounded-3xl overflow-hidden border border-white/10 shadow-2xl"
              style={{ backgroundColor: "#111111" }}
            >
              {/* Header */}
              <div
                className="flex items-center justify-between px-5 py-4 border-b border-white/10 flex-none"
                style={{ backgroundColor: "#1a1a1a" }}
              >
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/images/salsa-logo.png" alt="" loading="lazy" className="h-8 w-auto" />
                  <div>
                    <p className="text-white font-black text-sm uppercase tracking-wide">Salsa Bot</p>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-white/40 text-xs">Online</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white transition-all"
                >
                  <ChevronDown size={16} />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                        msg.role === "user"
                          ? "text-white font-medium rounded-tr-sm"
                          : "text-white/80 font-medium rounded-tl-sm"
                      }`}
                      style={{
                        backgroundColor: msg.role === "user" ? "#ff0000" : "#222222",
                      }}
                    >
                      {formatText(msg.text)}
                    </div>
                  </motion.div>
                ))}
                <div ref={bottomRef} />
              </div>

              {/* Quick chips */}
              <div className="px-4 pb-2 flex gap-2 overflow-x-auto scrollbar-hide flex-none">
                {currentFaqs.slice(0, 4).map((faq) => (
                  <button
                    key={faq.q}
                    onClick={() => sendFaq(faq)}
                    className="flex-none px-3 py-1.5 rounded-full text-xs font-bold border border-white/15 text-white/70 hover:border-[#ff0000] hover:text-white transition-all whitespace-nowrap"
                    style={{ backgroundColor: "#1a1a1a" }}
                  >
                    {faq.q.split(" ").slice(0, 4).join(" ")}…
                  </button>
                ))}
              </div>

              {/* WhatsApp CTA */}
              <div className="px-4 pb-3 flex-none">
                <a
                  href="https://wa.me/66838291723?text=Hi%20Salsa%20Burgers!%20I%20have%20a%20question%3A%20"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-2xl text-xs font-black uppercase tracking-wide text-white transition-all hover:opacity-90"
                  style={{ backgroundColor: "#25D366" }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  {lang === "th" ? "แชทผ่าน WhatsApp" : lang === "es" ? "Chat por WhatsApp" : "Chat on WhatsApp"}
                </a>
              </div>

              {/* Input */}
              <div className="px-4 pb-4 flex-none">
                <form
                  onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
                  className="flex items-center gap-2 px-4 py-3 rounded-2xl border border-white/10"
                  style={{ backgroundColor: "#1a1a1a" }}
                >
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={inputPlaceholders[lang]}
                    className="flex-1 bg-transparent text-white text-sm placeholder-white/30 outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim()}
                    className="w-8 h-8 rounded-full flex items-center justify-center transition-all disabled:opacity-30"
                    style={{ backgroundColor: input.trim() ? "#ff0000" : "transparent" }}
                  >
                    <Send size={14} className="text-white" />
                  </button>
                </form>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
