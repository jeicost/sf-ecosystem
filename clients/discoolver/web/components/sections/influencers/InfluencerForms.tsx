"use client";

import { useState } from "react";
import { Reveal } from "@/components/ui/Reveal";
import { AvisoDatos } from "@/components/ui/AvisoDatos";
import { Icon } from "@/components/ui/Icon";
import type { InfluencersContent } from "@/lib/content/influencers";
import type { Locale } from "@/lib/i18n";

/**
 * The two application forms, one per track. Five fields each — name, email,
 * handle, city, link. NO password: the account is created when an editor
 * approves the application, so asking for credentials here is pure friction.
 *
 * Both post to /api/waitlist (the existing server-side formsubmit forwarder);
 * only `source` changes, which is what sets the email subject. The endpoint
 * never fakes success, so a failed send is surfaced to the applicant.
 */

type Status = "idle" | "loading" | "done" | "error";

interface FormCopy {
  id: string;
  source: string;
  title: string;
  sub: string;
  labels: { name: string; email: string; handle: string; city: string; link: string };
  submit: string;
  note: string;
  featured?: boolean;
}

function CreatorForm({ copy, successText, errorText, locale = "es", ciudadesAbiertas }: { copy: FormCopy; successText: string; errorText: string; locale?: Locale; ciudadesAbiertas?: string }) {
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    const data = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.get("email"),
          name: data.get("name"),
          handle: data.get("handle"),
          city: data.get("city"),
          link: data.get("link"),
          source: copy.source,
        }),
      });
      setStatus(res.ok ? "done" : "error");
    } catch {
      setStatus("error");
    }
  }

  const fields = [
    { key: "name", label: copy.labels.name, type: "text", autoComplete: "name", placeholder: locale === "en" ? "First and last name" : "Nombre y apellido", required: true },
    { key: "email", label: copy.labels.email, type: "email", autoComplete: "email", placeholder: locale === "en" ? "you@email.com" : "tu@correo.com", required: true },
    { key: "handle", label: copy.labels.handle, type: "text", autoComplete: "off", placeholder: locale === "en" ? "@yourhandle" : "@tuhandle", required: true },
    { key: "city", label: copy.labels.city, type: "text", autoComplete: "address-level2", placeholder: locale === "en" ? "Madrid, Bangkok, Lisbon…" : "Madrid, Bilbao, Bangkok…", required: true, ayuda: ciudadesAbiertas },
    { key: "link", label: copy.labels.link, type: "url", autoComplete: "off", placeholder: "https://…", required: true },
  ] as const;

  return (
    <form id={copy.id} className={`cform ${copy.featured ? "cform--featured" : ""}`} onSubmit={handleSubmit} aria-labelledby={`${copy.id}-title`}>
      <div className="cform__head">
        <h3 className="cform__title" id={`${copy.id}-title`}>
          {copy.title}
        </h3>
        <p className="cform__sub">{copy.sub}</p>
      </div>

      {fields.map((field) => (
        <div className="cform__field" key={field.key}>
          <label htmlFor={`${copy.id}-${field.key}`}>{field.label}</label>
          <input
            id={`${copy.id}-${field.key}`}
            name={field.key}
            type={field.type}
            required={field.required}
            aria-required={field.required}
            autoComplete={field.autoComplete}
            placeholder={field.placeholder}
          />
          {"ayuda" in field && field.ayuda && <p className="cform__ayuda">{field.ayuda}</p>}
        </div>
      ))}

      <button type="submit" className="btn btn-primary cform__submit" disabled={status === "loading" || status === "done"}>
        {status === "loading" ? (locale === "en" ? "Sending…" : "Enviando…") : copy.submit} <Icon name="arrow-right" size={14} />
      </button>
      <p className="cform__note">{copy.note}</p>
      <AvisoDatos
        locale={locale}
        finalidad={locale === "es" ? "valorar tu candidatura y contestarte" : "assess your application and get back to you"}
      />

      {status === "done" && (
        <p role="status" className="cform__status cform__status--ok">
          {successText}
        </p>
      )}
      {status === "error" && (
        <p role="alert" className="cform__status cform__status--error">
          {errorText}
        </p>
      )}
    </form>
  );
}

export function InfluencerForms({ content, locale = "es" , ciudadesAbiertas }: { content: InfluencersContent; locale?: Locale; ciudadesAbiertas?: string }) {
  const forms: FormCopy[] = [
    {
      id: "form-guia",
      source: "creator-guide",
      title: content.form_top_title,
      sub: content.form_top_sub,
      labels: {
        name: content.form_top_name,
        email: content.form_top_email,
        handle: content.form_top_handle,
        city: content.form_top_city,
        link: content.form_top_link,
      },
      submit: content.form_top_submit,
      note: content.form_top_note,
      featured: true,
    },
    {
      id: "form-video",
      source: "creator-video",
      title: content.form_micro_title,
      sub: content.form_micro_sub,
      labels: {
        name: content.form_micro_name,
        email: content.form_micro_email,
        handle: content.form_micro_handle,
        city: content.form_micro_city,
        link: content.form_micro_link,
      },
      submit: content.form_micro_submit,
      note: content.form_micro_note,
    },
  ];

  return (
    <section className="section" id="candidaturas" aria-labelledby="forms-title">
      <div className="container">
        <Reveal delay={0}>
          <div className="section__head">
            <div className="section__head-text">
              <span className="eyebrow">{content.forms_eyebrow}</span>
              <h2 className="display-lg section__title" id="forms-title">
                {content.forms_title_1} <span style={{ color: "var(--primary)" }}>{content.forms_title_em}</span>
              </h2>
              <p className="section__lead">{content.forms_lead}</p>
            </div>
          </div>
        </Reveal>
        <div className="forms-grid">
          {forms.map((copy, i) => (
            <Reveal delay={i * 120} key={copy.id}>
              <CreatorForm ciudadesAbiertas={ciudadesAbiertas} locale={locale} copy={copy} successText={content.form_success} errorText={content.form_error} />
            </Reveal>
          ))}
        </div>
        <Reveal delay={200}>
          <p className="cform__fine">{content.forms_fine_print}</p>
        </Reveal>
      </div>
    </section>
  );
}
