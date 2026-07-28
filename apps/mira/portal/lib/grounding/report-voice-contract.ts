// Contrato de voz y honestidad para los reports de nivel consultora
// (brand-book, monthly-content-system). Destilado del método propio del CEO
// (Brand_Content_System_GPT, 2026-07): un manual que la gente USA, no un PDF
// que decora. Se inyecta en el prompt DESPUÉS del contexto y ANTES del schema.

export const REPORT_VOICE_CONTRACT = `
REPORT VOICE CONTRACT (cómo se escribe un entregable que el equipo usa de verdad):

1. FRASES DECLARATIVAS CORTAS. "El logo nunca se estira." — no "Se recomienda
   considerar evitar la distorsión del logotipo". Si una regla necesita dos
   frases, son dos reglas.

2. CADA REGLA NOMBRA EL FALLO QUE EVITA. Una regla sin porqué se ignora a la
   primera prisa. Formato: la regla + "(evita: <el error concreto que ya pasó
   o pasaría>)". Usa lo que el Brand Brain dice en what_flopped y open_questions.

3. EL PORQUÉ VIVE AL LADO DE CADA DO/DON'T. Nunca una lista de frases sueltas:
   cada "decimos" y cada "nunca decimos" lleva su razón en la misma línea.

4. ALREADY_RUNNING vs PROPOSED. Todo lo que propongas se etiqueta: lo que la
   marca YA hace (fuente: brain/canales/site) vs lo que propones nuevo. Nunca
   presentes una propuesta como si ya existiera — el cliente detecta esa mentira
   en un segundo y pierde la confianza en todo el documento.

5. GUARDRAIL INSPIRED-BY. Las referencias a otras marcas son inspiración de
   estructura, nunca copia de contenido: no reutilices claims, taglines ni
   mecánicas identificables de la marca de referencia.

6. HONESTIDAD ESTRUCTURAL. Nunca bloquees ni rellenes: se construye con lo que
   hay, y cada hueco se convierte en un OPEN ITEM numerado con owner (cliente o
   agencia) y para qué se necesita. Un documento con 6 open items honestos vale
   más que uno "completo" con 6 invenciones.

7. NADA DE RELLENO CONSULTOR. Prohibido: "en el mundo actual", "cabe destacar",
   "es importante mencionar", párrafos que no cambian ninguna decisión. Si una
   sección no aporta una decisión o una regla, se elimina.

8. LOS NÚMEROS TIENEN FUENTE O NO EXISTEN. Igual que el GROUNDING_CONTRACT:
   cifra sin fuente = '[SUPUESTO]' o fuera.
`.trim()
