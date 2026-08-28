// lib/grounding/economics-contract.ts
//
// El plan de acción de Adrian Grooves (28-ago-2026) tenía delante 3.000 € de
// presupuesto, un objetivo de >30 alumnos/mes y un precio de ~99 €. No cruzó
// esos tres números ni una vez. 30 × 99 = 2.970 €/mes de ingreso al objetivo;
// 3.000 ÷ 30 = 100 € de CAC máximo. Es decir: al objetivo declarado el CAC
// tiene que quedar por debajo del precio o cada alumno pierde dinero. Esa es
// la primera frase que escribe un especialista y no estaba en el informe.
//
// No fue culpa del modelo: NINGÚN prompt le pedía hacer aritmética. Se le pedía
// no inventar cifras y obedeció hasta el extremo de no calcular las que tenía.
//
// Se inyecta en las herramientas que manejan números de negocio (ver
// ECONOMICS_TOOLS en lib/generation/toolkit-prompts.ts).

export const DERIVED_ECONOMICS_CONTRACT: string = `DERIVED ECONOMICS — DO THE ARITHMETIC BEFORE YOU WRITE ANYTHING:

Before drafting a single recommendation, cross every number you were actually
given. Deriving a figure from two figures the client provided is NOT inventing
data — it is the analysis they are paying for. Refusing to do it is the failure.

STEP 1 — List the figures present in INPUT, CLIENT CONTEXT or BRAND CONTEXT:
price points, budgets, volume targets, team size, timeframes, current metrics.

STEP 2 — Cross them. Whichever of these the numbers allow:
  · unit price x volume target            = revenue at goal
  · budget / volume target                = maximum affordable cost per unit
  · maximum cost per unit vs unit price   = is acquisition profitable at goal?
  · budget / campaign duration            = spend rate
  · revenue at goal vs team cost or time  = does the goal pay for the work?
  · current metric vs target metric       = the multiple required, and by when

STEP 3 — Say out loud whether the goal is arithmetically plausible. Three
possible verdicts, and you must pick one:
  · "plausible"   — the numbers work, state the margin.
  · "tight"       — it works only if a specific variable behaves; name it.
  · "implausible" — it does not work; state which number has to change and by
                    how much for it to work.
  Never soften an implausible verdict into optimism. A client who finds out
  later that the arithmetic never worked loses trust in the whole document.

STEP 4 — Emit the working in a top-level 'derived_economics' field:
{
  "figures_used": [{"name": "", "value": "", "source": "input|brand_brain|context"}],
  "calculations": [{"what": "", "working": "30 x 99 = 2970", "result": "2.970 €/mes"}],
  "verdict": "plausible|tight|implausible",
  "verdict_reasoning": "one or two sentences, plainly",
  "what_would_change_it": ["the specific lever and the size of move needed"]
}

RULES:
· If a needed figure is missing, say which one and what the answer WOULD depend
  on — do not skip the section. A calculation you cannot close is still
  information: "no puedo cerrar el CAC objetivo sin saber X".
· Only cross figures that were actually provided. Do not import benchmarks,
  industry averages or "typical" rates as if they were this client's numbers.
· Round for readability, but show the working so the client can check it.
· Every later recommendation in the document must be consistent with this
  section. If the verdict is "implausible", the plan addresses THAT first.`
