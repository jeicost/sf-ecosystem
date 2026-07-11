"use client";

import { useState } from "react";

const FORMSPREE_ID = "xnjwnydg";

type FormData = {
  // Aplicante
  nombre: string;
  email: string;
  socialHandle: string;
  pais: string;
  // Proyecto
  nombreProyecto: string;
  queHace: string;
  problemaResuelve: string;
  fase: string;
  tiempoEnEllo: string;
  // Análisis
  claridadProblema: number;
  validacionTraccion: number;
  equipo: number;
  commitmentFounder: number;
  potencialMercado: number;
  fitConSF: number;
  // Lo que buscan
  necesidades: string[];
  presupuesto: string;
  // Evaluación final
  puntuacionGeneral: number;
  recomendacion: string;
  areasAMejorar: string;
  notasParaCarlos: string;
  cuandoVolver: string;
};

const INITIAL: FormData = {
  nombre: "", email: "", socialHandle: "", pais: "",
  nombreProyecto: "", queHace: "", problemaResuelve: "", fase: "", tiempoEnEllo: "",
  claridadProblema: 0, validacionTraccion: 0, equipo: 0, commitmentFounder: 0, potencialMercado: 0, fitConSF: 0,
  necesidades: [], presupuesto: "",
  puntuacionGeneral: 0, recomendacion: "", areasAMejorar: "", notasParaCarlos: "", cuandoVolver: "",
};

const FASES = ["Idea — no ha empezado", "MVP en construcción", "MVP lanzado, sin clientes", "Primeros clientes", "Creciendo, necesita escala"];
const TIEMPOS = ["Menos de 1 mes", "1-3 meses", "3-6 meses", "6-12 meses", "Más de 1 año"];
const NECESIDADES_OPS = ["Equipo / squad", "Estrategia", "IA & Automatización", "Growth & Marketing", "Financiación / ronda", "Conexiones / socios", "Validación / feedback", "Otro"];
const PRESUPUESTO_OPS = ["Sin presupuesto claro", "< 1.000 €/mes", "1.000 – 3.000 €/mes", "3.000 – 6.000 €/mes", "> 6.000 €/mes", "Modelo equity / venture"];

function RatingRow({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-white/[0.06] last:border-0">
      <span className="text-sm text-white/70 flex-1">{label}</span>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`w-9 h-9 rounded-lg font-bold text-sm transition-all duration-150 ${
              value >= n
                ? "bg-gradient-to-br from-[#3D2FFF] to-[#A855F7] text-white"
                : "bg-white/[0.05] border border-white/[0.08] text-white/30 hover:border-white/20"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

function Section({ title, eyebrow, children }: { title: string; eyebrow: string; children: React.ReactNode }) {
  return (
    <div className="card-dark rounded-2xl p-8">
      <p className="text-xs font-semibold text-[#A855F7] uppercase tracking-[0.15em] mb-2">{eyebrow}</p>
      <h2 className="font-[family-name:var(--font-space-grotesk)] font-black text-xl text-white mb-6">{title}</h2>
      {children}
    </div>
  );
}

function Input({ label, name, value, onChange, placeholder, type = "text", required = false }: {
  label: string; name: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; required?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wide">{label}{required && " *"}</label>
      <input
        type={type} name={name} value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder} required={required}
        className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-[#A855F7]/50 transition-colors text-sm"
      />
    </div>
  );
}

function TextArea({ label, name, value, onChange, placeholder, rows = 3 }: {
  label: string; name: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wide">{label}</label>
      <textarea
        name={name} value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder} rows={rows}
        className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-[#A855F7]/50 transition-colors resize-none text-sm"
      />
    </div>
  );
}

export default function CallReportForm() {
  const [form, setForm] = useState<FormData>(INITIAL);
  const [step, setStep] = useState(0);
  const [status, setStatus] = useState<"idle" | "preview" | "ok">("idle");
  const [sending, setSending] = useState(false);
  const [submitError, setSubmitError] = useState(false);

  const set = (field: keyof FormData) => (value: string | number) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const toggleNecesidad = (val: string) =>
    setForm((prev) => ({
      ...prev,
      necesidades: prev.necesidades.includes(val)
        ? prev.necesidades.filter((n) => n !== val)
        : [...prev.necesidades, val],
    }));

  const avgRating = () => {
    const vals = [form.claridadProblema, form.validacionTraccion, form.equipo, form.commitmentFounder, form.potencialMercado, form.fitConSF].filter(Boolean);
    return vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : "—";
  };

  const buildEmailBody = () => `
SF CALL REPORT — ${new Date().toLocaleDateString("es-ES")} ${new Date().toLocaleTimeString("es-ES")}

═══════════════════════════════════
APLICANTE
═══════════════════════════════════
Nombre: ${form.nombre}
Email: ${form.email}
Social: ${form.socialHandle}
País: ${form.pais}

═══════════════════════════════════
EL PROYECTO
═══════════════════════════════════
Nombre: ${form.nombreProyecto}
Qué hace: ${form.queHace}
Problema que resuelve: ${form.problemaResuelve}
Fase: ${form.fase}
Tiempo en ello: ${form.tiempoEnEllo}

═══════════════════════════════════
ANÁLISIS (1-5)
═══════════════════════════════════
Claridad del problema: ${form.claridadProblema}/5
Validación / tracción: ${form.validacionTraccion}/5
Equipo: ${form.equipo}/5
Commitment del founder: ${form.commitmentFounder}/5
Potencial de mercado: ${form.potencialMercado}/5
Fit con SF: ${form.fitConSF}/5
MEDIA: ${avgRating()}/5

═══════════════════════════════════
LO QUE BUSCAN
═══════════════════════════════════
Necesidades: ${form.necesidades.join(", ") || "—"}
Presupuesto: ${form.presupuesto}

═══════════════════════════════════
EVALUACIÓN DEL ENTREVISTADOR
═══════════════════════════════════
RECOMENDACIÓN: ${form.recomendacion}
Puntuación general: ${form.puntuacionGeneral}/10
Áreas a mejorar: ${form.areasAMejorar || "—"}
Cuándo volver (si aplica): ${form.cuandoVolver || "—"}

Notas para Carlos:
${form.notasParaCarlos || "Sin notas adicionales."}
`.trim();

  const handleSubmit = async () => {
    setSending(true);
    setSubmitError(false);
    try {
      const res = await fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          _subject: `[SF CALL] ${form.recomendacion} — ${form.nombreProyecto} (${form.nombre})`,
          _replyto: form.email,
          tipo: "call-report-interno",
          informe: buildEmailBody(),
          aplicante_email: form.email,
          aplicante_nombre: form.nombre,
          proyecto: form.nombreProyecto,
          recomendacion: form.recomendacion,
          puntuacion: `${form.puntuacionGeneral}/10`,
          media_ratings: `${avgRating()}/5`,
        }),
      });
      if (res.ok) setStatus("ok");
      else setSubmitError(true);
    } catch {
      setSubmitError(true);
    } finally {
      setSending(false);
    }
  };

  if (status === "ok") {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="card-dark rounded-3xl p-14 max-w-lg w-full text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#3D2FFF] to-[#A855F7] flex items-center justify-center mx-auto mb-6">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><path d="M5 14l6.5 6.5L23 8" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <h2 className="font-[family-name:var(--font-space-grotesk)] font-black text-3xl text-white mb-3">Informe enviado</h2>
          <p className="text-white/45 mb-3">Carlos recibirá el informe completo de <span className="text-white font-semibold">{form.nombre}</span> en su email.</p>
          <div className={`inline-block px-4 py-2 rounded-full text-sm font-bold mb-8 ${
            form.recomendacion === "PASA" ? "bg-[#3D2FFF]/20 text-[#A855F7] border border-[#3D2FFF]/30" :
            form.recomendacion === "NO PASA" ? "bg-white/[0.05] text-white/40 border border-white/[0.08]" :
            "bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20"
          }`}>
            {form.recomendacion}
          </div>
          <button onClick={() => { setForm(INITIAL); setStep(0); setStatus("idle"); }}
            className="w-full btn-gradient text-white font-[family-name:var(--font-space-grotesk)] font-bold py-4 rounded-full">
            Nueva call
          </button>
        </div>
      </div>
    );
  }

  // Preview antes de enviar
  if (status === "preview") {
    return (
      <div className="min-h-screen bg-black py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <span className="text-xs font-semibold text-[#A855F7] uppercase tracking-[0.15em] mb-3 block">Revisar antes de enviar</span>
            <h2 className="font-[family-name:var(--font-space-grotesk)] font-black text-3xl text-white">Informe de Carlos</h2>
          </div>

          {/* Badge recomendación */}
          <div className={`text-center mb-6 py-4 rounded-2xl border ${
            form.recomendacion === "PASA" ? "bg-[#3D2FFF]/15 border-[#3D2FFF]/30" :
            form.recomendacion === "NO PASA" ? "bg-white/[0.03] border-white/[0.08]" :
            "bg-[#F59E0B]/10 border-[#F59E0B]/20"
          }`}>
            <p className="text-xs text-white/40 mb-1">Recomendación del entrevistador</p>
            <p className={`font-[family-name:var(--font-space-grotesk)] font-black text-3xl ${
              form.recomendacion === "PASA" ? "gradient-text" : form.recomendacion === "NO PASA" ? "text-white/40" : "text-[#F59E0B]"
            }`}>{form.recomendacion}</p>
            <p className="text-white/40 text-sm mt-1">Puntuación: {form.puntuacionGeneral}/10 · Media análisis: {avgRating()}/5</p>
          </div>

          {/* Preview del informe */}
          <div className="card-dark rounded-2xl p-6 mb-6">
            <pre className="text-xs text-white/60 leading-relaxed whitespace-pre-wrap font-mono overflow-auto max-h-96">
              {buildEmailBody()}
            </pre>
          </div>

          <div className="flex gap-4">
            <button onClick={() => setStatus("idle")} className="flex-1 border border-white/15 text-white font-semibold py-4 rounded-full hover:bg-white/[0.05] transition-all">
              ← Volver a editar
            </button>
            <button onClick={handleSubmit} disabled={sending}
              className="flex-1 btn-gradient text-white font-[family-name:var(--font-space-grotesk)] font-bold py-4 rounded-full disabled:opacity-50">
              {sending ? "Enviando..." : "Enviar a Carlos →"}
            </button>
          </div>
          {submitError && <p className="text-red-400 text-sm text-center mt-4">Error al enviar. Inténtalo de nuevo.</p>}
        </div>
      </div>
    );
  }

  const sections = [
    { key: "aplicante", label: "Aplicante" },
    { key: "proyecto", label: "Proyecto" },
    { key: "analisis", label: "Análisis" },
    { key: "necesidades", label: "Necesidades" },
    { key: "evaluacion", label: "Evaluación" },
  ];

  return (
    <div className="min-h-screen bg-black py-10 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <span className="text-xs font-semibold text-[#A855F7] uppercase tracking-[0.15em] mb-3 block">SF · Herramienta interna</span>
          <h1 className="font-[family-name:var(--font-space-grotesk)] font-black text-3xl text-white mb-2">Informe de call</h1>
          <p className="text-white/40 text-sm">Rellena durante la sesión de 30 min. Carlos lo recibe al terminar.</p>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {sections.map((s, i) => (
            <div key={s.key} className="flex-1 flex flex-col items-center gap-1 cursor-pointer" onClick={() => setStep(i)}>
              <div className={`h-1.5 w-full rounded-full transition-all ${i <= step ? "bg-gradient-to-r from-[#3D2FFF] to-[#A855F7]" : "bg-white/[0.08]"}`} />
              <span className={`text-[10px] font-semibold uppercase tracking-wide ${i === step ? "text-[#A855F7]" : "text-white/25"}`}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* SECCIÓN 1 — Aplicante */}
        {step === 0 && (
          <Section eyebrow="01 / 05" title="Datos del aplicante">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input label="Nombre completo" name="nombre" value={form.nombre} onChange={set("nombre")} placeholder="Nombre Apellido" required />
                <Input label="Email" name="email" value={form.email} onChange={set("email")} placeholder="tu@email.com" type="email" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Instagram / LinkedIn" name="social" value={form.socialHandle} onChange={set("socialHandle")} placeholder="@usuario" />
                <Input label="País / Ciudad" name="pais" value={form.pais} onChange={set("pais")} placeholder="España" />
              </div>
            </div>
          </Section>
        )}

        {/* SECCIÓN 2 — Proyecto */}
        {step === 1 && (
          <Section eyebrow="02 / 05" title="El proyecto">
            <div className="space-y-4">
              <Input label="Nombre del proyecto / startup" name="proyecto" value={form.nombreProyecto} onChange={set("nombreProyecto")} placeholder="Nombre del proyecto" required />
              <TextArea label="¿Qué hace en 1 frase?" name="queHace" value={form.queHace} onChange={set("queHace")} placeholder="[Nombre] ayuda a [quién] a [hacer qué] mediante [cómo]" rows={2} />
              <TextArea label="Problema que resuelve" name="problema" value={form.problemaResuelve} onChange={set("problemaResuelve")} placeholder="¿Qué dolor real resuelve? ¿Quién lo tiene?" rows={3} />
              <div>
                <label className="block text-xs font-medium text-white/50 mb-2 uppercase tracking-wide">Fase actual</label>
                <div className="space-y-2">
                  {FASES.map((f) => (
                    <label key={f} className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all border ${form.fase === f ? "border-[#A855F7]/40 bg-[#3D2FFF]/10" : "border-white/[0.06] hover:border-white/15"}`}>
                      <input type="radio" name="fase" value={f} checked={form.fase === f} onChange={() => set("fase")(f)} className="accent-[#A855F7]" />
                      <span className="text-sm text-white/70">{f}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-white/50 mb-2 uppercase tracking-wide">Tiempo trabajando en esto</label>
                <div className="grid grid-cols-2 gap-2">
                  {TIEMPOS.map((t) => (
                    <label key={t} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl cursor-pointer transition-all border text-sm ${form.tiempoEnEllo === t ? "border-[#A855F7]/40 bg-[#3D2FFF]/10 text-white" : "border-white/[0.06] text-white/50 hover:border-white/15"}`}>
                      <input type="radio" name="tiempo" value={t} checked={form.tiempoEnEllo === t} onChange={() => set("tiempoEnEllo")(t)} className="accent-[#A855F7]" />
                      {t}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </Section>
        )}

        {/* SECCIÓN 3 — Análisis */}
        {step === 2 && (
          <Section eyebrow="03 / 05" title="Análisis durante la call">
            <p className="text-xs text-white/30 mb-6">Puntúa del 1 (muy bajo) al 5 (excelente) según lo que observas en la conversación.</p>
            <div>
              <RatingRow label="Claridad del problema que resuelven" value={form.claridadProblema} onChange={(v) => set("claridadProblema")(v)} />
              <RatingRow label="Validación / tracción real" value={form.validacionTraccion} onChange={(v) => set("validacionTraccion")(v)} />
              <RatingRow label="Calidad del equipo / perfil del founder" value={form.equipo} onChange={(v) => set("equipo")(v)} />
              <RatingRow label="Commitment y energía del founder" value={form.commitmentFounder} onChange={(v) => set("commitmentFounder")(v)} />
              <RatingRow label="Potencial / tamaño del mercado" value={form.potencialMercado} onChange={(v) => set("potencialMercado")(v)} />
              <RatingRow label="Fit con Startup Factory" value={form.fitConSF} onChange={(v) => set("fitConSF")(v)} />
            </div>
            {avgRating() !== "—" && (
              <div className="mt-6 py-4 text-center rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <p className="text-white/40 text-xs mb-1">Media de ratings</p>
                <p className="font-[family-name:var(--font-space-grotesk)] font-black text-4xl gradient-text">{avgRating()}<span className="text-xl text-white/30">/5</span></p>
              </div>
            )}
          </Section>
        )}

        {/* SECCIÓN 4 — Necesidades */}
        {step === 3 && (
          <Section eyebrow="04 / 05" title="Lo que buscan">
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-white/50 mb-3 uppercase tracking-wide">Principales necesidades (selecciona todas las que apliquen)</label>
                <div className="grid grid-cols-2 gap-2">
                  {NECESIDADES_OPS.map((n) => (
                    <label key={n} className={`flex items-center gap-2 px-4 py-3 rounded-xl cursor-pointer transition-all border text-sm ${form.necesidades.includes(n) ? "border-[#A855F7]/40 bg-[#3D2FFF]/10 text-white" : "border-white/[0.06] text-white/50 hover:border-white/15"}`}>
                      <input type="checkbox" value={n} checked={form.necesidades.includes(n)} onChange={() => toggleNecesidad(n)} className="accent-[#A855F7]" />
                      {n}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-white/50 mb-2 uppercase tracking-wide">Presupuesto / capacidad de inversión</label>
                <div className="space-y-2">
                  {PRESUPUESTO_OPS.map((p) => (
                    <label key={p} className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all border text-sm ${form.presupuesto === p ? "border-[#A855F7]/40 bg-[#3D2FFF]/10 text-white" : "border-white/[0.06] text-white/50 hover:border-white/15"}`}>
                      <input type="radio" name="presupuesto" value={p} checked={form.presupuesto === p} onChange={() => set("presupuesto")(p)} className="accent-[#A855F7]" />
                      {p}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </Section>
        )}

        {/* SECCIÓN 5 — Evaluación final */}
        {step === 4 && (
          <Section eyebrow="05 / 05" title="Evaluación final para Carlos">
            <div className="space-y-6">
              {/* Puntuación */}
              <div>
                <label className="block text-xs font-medium text-white/50 mb-3 uppercase tracking-wide">Puntuación general (1-10)</label>
                <div className="flex gap-2 flex-wrap">
                  {[1,2,3,4,5,6,7,8,9,10].map((n) => (
                    <button key={n} type="button" onClick={() => set("puntuacionGeneral")(n)}
                      className={`w-11 h-11 rounded-xl font-bold text-sm transition-all ${
                        form.puntuacionGeneral === n ? "bg-gradient-to-br from-[#3D2FFF] to-[#A855F7] text-white scale-110" : "bg-white/[0.05] border border-white/[0.08] text-white/40 hover:border-white/20"
                      }`}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Recomendación */}
              <div>
                <label className="block text-xs font-medium text-white/50 mb-3 uppercase tracking-wide">Recomendación *</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { val: "PASA", label: "✅ PASA", cls: "border-[#3D2FFF]/50 bg-[#3D2FFF]/15 text-[#A855F7]" },
                    { val: "POSIBLE", label: "⏳ POSIBLE", cls: "border-[#F59E0B]/40 bg-[#F59E0B]/10 text-[#F59E0B]" },
                    { val: "NO PASA", label: "⛔ NO PASA", cls: "border-white/15 bg-white/[0.04] text-white/50" },
                  ].map((r) => (
                    <button key={r.val} type="button" onClick={() => set("recomendacion")(r.val)}
                      className={`py-4 rounded-xl font-bold text-sm border transition-all ${form.recomendacion === r.val ? r.cls + " scale-105" : "border-white/[0.06] text-white/25 hover:border-white/15"}`}>
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Áreas a mejorar (si no pasa o posible) */}
              {(form.recomendacion === "NO PASA" || form.recomendacion === "POSIBLE") && (
                <>
                  <TextArea label="Áreas específicas que debe mejorar" name="areas" value={form.areasAMejorar} onChange={set("areasAMejorar")} placeholder="¿Qué necesita trabajar para volver a aplicar?" rows={3} />
                  <Input label="¿Cuándo podría volver? (orientativo)" name="cuando" value={form.cuandoVolver} onChange={set("cuandoVolver")} placeholder="ej: En 2-3 meses, cuando tenga primeros clientes" />
                </>
              )}

              {/* Notas libres */}
              <TextArea label="Notas libres para Carlos" name="notas" value={form.notasParaCarlos} onChange={set("notasParaCarlos")} placeholder="Todo lo que no cabe en el formulario. Feeling, contexto, algo llamativo, lo que creas importante..." rows={5} />
            </div>
          </Section>
        )}

        {/* Navegación */}
        <div className="flex gap-4 mt-6">
          {step > 0 && (
            <button onClick={() => setStep(step - 1)}
              className="flex-1 border border-white/15 text-white font-semibold py-4 rounded-full hover:bg-white/[0.05] transition-all">
              ← Anterior
            </button>
          )}
          {step < 4 ? (
            <button onClick={() => setStep(step + 1)}
              className="flex-1 btn-gradient text-white font-[family-name:var(--font-space-grotesk)] font-bold py-4 rounded-full">
              Siguiente →
            </button>
          ) : (
            <button
              onClick={() => setStatus("preview")}
              disabled={!form.recomendacion || form.puntuacionGeneral === 0}
              className="flex-1 btn-gradient text-white font-[family-name:var(--font-space-grotesk)] font-bold py-4 rounded-full disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Revisar y enviar →
            </button>
          )}
        </div>

        {/* Indicador sección actual */}
        <p className="text-center text-xs text-white/20 mt-4">
          Sección {step + 1} de 5 · {sections[step].label}
        </p>
      </div>
    </div>
  );
}
