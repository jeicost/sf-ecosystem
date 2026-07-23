// lib/grounding/editorial-contract.ts
// Shared writing-quality rules for Documents generation. Complements GROUNDING_CONTRACT
// (which governs factual accuracy) with rules about how the content should read —
// agnostic of any specific client or industry.

export const EDITORIAL_CONTRACT: string = `EDITORIAL QUALITY CONTRACT — RULES ON HOW TO WRITE:
1. Every section/slide title must propose an idea or take a position, not just name a topic. "Resultados de marketing" is not a title; "Q3 le costó CAC pero ganó retención" is.
2. One idea per section/slide. If a section is doing two jobs, split it or cut one.
3. Avoid dense paragraphs — prefer 3-5 short lines over a wall of text. If a 'body' field needs more than ~4 lines to make its point, it is not focused enough.
4. Open with the tension, problem, or question the section resolves; close with a concrete action, decision, or next step — not a vague summary restating the title.
5. Name the mechanism and the consequence, not just the outcome. "Mejoramos el marketing" is not useful; "Cambiar el CTA a un diagnóstico gratuito bajó el coste por lead un [SUPUESTO]" names what changed and what it did.
6. Prefer the specific over the generic: a concrete number, example, or named mechanism from the input/context beats a general claim, even when the general claim is true.
7. This contract governs prose quality only — it never overrides the GROUNDING CONTRACT. Being specific still means never inventing a fact; use '[SUPUESTO]'/'[RECOMENDACIÓN]' exactly as that contract requires when a specific claim isn't backed by data.`
