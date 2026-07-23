// lib/grounding/grounding-contract.ts
// Anti-hallucination contract appended to generation prompts. English, to match
// the existing prompt language in lib/generation/toolkit-prompts.ts.

export const GROUNDING_CONTRACT: string = `GROUNDING CONTRACT — STRICT RULES ON FACTS:
1. The ONLY facts you may state are those present in the VERIFIED SITE FACTS, SOURCES, CLIENT CONTEXT, or USER INPUT blocks above. Everything else is opinion, not fact.
2. Any non-factual text field (advice, hypothesis, projection) MUST be prefixed with '[RECOMENDACIÓN]' or '[SUPUESTO]' so the reader can tell it apart from measured data.
3. Numeric fields with no supporting data in the context MUST be null or "unknown". NEVER invent a figure, percentage, count, or estimate to fill a field.
4. NEVER cite publication dates, page-speed metrics (FCP, LCP, CLS, Core Web Vitals), search rankings, traffic numbers, or follower/review counts unless they appear verbatim in the context blocks.
5. In financial documents, business metrics (CAC, LTV, MRR, revenue, user counts) may ONLY come from the user input or project memory. If missing, use the literal placeholder '[COMPLETAR: dato real]' instead of a number.
6. Do not attribute quotes, testimonials, or statements to people or companies unless they appear in SOURCES.
7. When SOURCES are provided, factual claims derived from them should reference the matching source URL.
8. If the site was unreachable (SITE UNREACHABLE), do not describe the site's content, design, or SEO state as if you had seen it — mark all site-dependent fields as unknown.
9. Add to your JSON output an array field 'data_gaps' listing every piece of data you needed but could not find in the context (e.g. "monthly traffic", "CAC", "competitor pricing").
10. It is always better to output null, "unknown", '[COMPLETAR: dato real]', or a '[SUPUESTO]'-prefixed estimate than a fabricated fact. Fabricated data is a critical failure.`

// Lighter, conversational variant for the Agent chat (streamed prose, no JSON
// schema to constrain, no SITE FACTS/SOURCES blocks) — same principle as
// GROUNDING_CONTRACT, phrased so it doesn't read like a legal disclaimer
// dropped into a live conversation. See docs/DEBT.md punto (t).
export const AGENT_CHAT_GROUNDING_NOTE: string =
  '\n\nPrecisión: no presentes cifras, fechas, nombres de clientes o competidores, ni datos de negocio como verificados a menos que aparezcan en el contexto de marca, la memoria del proyecto, los documentos cargados de esta conversación, o resultados reales de la herramienta web_search. Si necesitas un dato actual o verificable que no tienes, usa web_search en vez de adivinar. Cuando hagas una recomendación, estimación o supuesto, dilo explícitamente ("mi recomendación sería...", "asumiendo que...") en vez de presentarlo como un hecho. Si tras buscar sigues sin el dato, dilo — no lo inventes para sonar más completo.'
