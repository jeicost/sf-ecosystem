"use client";

import { useState } from "react";

type Option = { value: string; label: string };

type Props = {
  formId: string;
  calendlyUrl: string;
  labels: {
    formH2: string;
    nameLabel: string;
    namePlaceholder: string;
    emailLabel: string;
    tipoLabel: string;
    tipoOptions: Option[];
    messageLabel: string;
    messagePlaceholder: string;
    submitBtn: string;
    sendingBtn: string;
    successTitle: string;
    successDesc: string;
    errorMsg: string;
    bookTitle: string;
    bookDesc: string;
    bookBtn: string;
  };
};

export default function ContactForm({ formId, calendlyUrl, labels: l }: Props) {
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "error">("idle");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    const form = e.currentTarget;
    const data = new FormData(form);
    try {
      const res = await fetch(`https://formspree.io/f/${formId}`, {
        method: "POST",
        body: data,
        headers: { Accept: "application/json" },
      });
      if (res.ok) {
        setStatus("ok");
        form.reset();
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="space-y-6">
      {status === "ok" ? (
        <div className="card-dark rounded-2xl p-10 text-center">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#3D2FFF]/20 to-[#A855F7]/10 border border-white/10 flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#A855F7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <h3 className="font-[family-name:var(--font-space-grotesk)] font-bold text-xl text-white mb-2">{l.successTitle}</h3>
          <p className="text-white/40">{l.successDesc}</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="nombre" className="block text-sm font-medium text-white/70 mb-2">{l.nameLabel}</label>
            <input
              id="nombre" name="nombre" type="text" placeholder={l.namePlaceholder} required
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white placeholder-white/25 focus:outline-none focus:border-[#A855F7]/50 transition-colors"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-white/70 mb-2">{l.emailLabel}</label>
            <input
              id="email" name="email" type="email" placeholder="tu@email.com" required
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white placeholder-white/25 focus:outline-none focus:border-[#A855F7]/50 transition-colors"
            />
          </div>
          <div>
            <label htmlFor="tipo" className="block text-sm font-medium text-white/70 mb-2">{l.tipoLabel}</label>
            <select
              id="tipo" name="tipo"
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#A855F7]/50 transition-colors"
            >
              {l.tipoOptions.map((o) => (
                <option key={o.value} value={o.label} className="bg-[#0D0D14]">{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="mensaje" className="block text-sm font-medium text-white/70 mb-2">{l.messageLabel}</label>
            <textarea
              id="mensaje" name="mensaje" rows={5} placeholder={l.messagePlaceholder} required
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white placeholder-white/25 focus:outline-none focus:border-[#A855F7]/50 transition-colors resize-none"
            />
          </div>

          {status === "error" && (
            <p className="text-sm text-red-400">{l.errorMsg}</p>
          )}

          <button
            type="submit"
            disabled={status === "sending"}
            className="w-full btn-gradient text-white font-[family-name:var(--font-space-grotesk)] font-bold py-4 rounded-full text-base disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === "sending" ? l.sendingBtn : l.submitBtn}
          </button>
          <p className="text-xs text-white/25 text-center">Gratuita · Sin compromiso · Respondemos en 24h</p>
        </form>
      )}

      {/* Calendly */}
      <div className="card-dark rounded-2xl p-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3D2FFF]/20 to-[#A855F7]/10 border border-white/10 flex items-center justify-center mb-4">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#A855F7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M16 2v4M8 2v4M3 10h18" />
          </svg>
        </div>
        <h3 className="font-[family-name:var(--font-space-grotesk)] font-bold text-white mb-2">{l.bookTitle}</h3>
        <p className="text-white/40 text-sm leading-relaxed mb-4">{l.bookDesc}</p>
        <a
          href={calendlyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 border border-white/15 text-white font-[family-name:var(--font-space-grotesk)] font-semibold px-5 py-2.5 rounded-full text-sm hover:bg-white/[0.06] hover:border-white/25 transition-all duration-200"
        >
          {l.bookBtn}
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      </div>
    </div>
  );
}
