# Toolkit Tools — Field Reference (from ai-agency-screens PDFs)

## Pattern for All 8 Tools

Each tool follows the ToolRunnerPage component:
```tsx
const TOOL_CONFIG: ToolConfig = {
  slug: 'tool-name',
  icon: '🎯',
  title: 'Tool Title',
  subtitle: 'Salsa Burgers',  // dynamic from client
  timing: '20-25 min',
  brandBrainNote: 'Brand Brain cargado — campos pre-rellenados',
  submitButtonColor: '#FF6B35',  // varies by tool
  submitButtonText: 'Generar [Tool Name]',
  fields: [
    // field definitions from PDFs
  ],
}
```

Use `/api/toolkit/generate` endpoint with tool_slug + input_data.

---

## ✅ 1. Action Plan 30/60/90 (DONE)
**Slug:** `action-plan`  
**Icon:** 🎯  
**Color:** #FF6B35 (orange)  
**Timing:** 20-25 min

**Fields (from PDF):**
- horizonte (select): 30/60/90 days
- situacion_actual (textarea): Current state
- reto_principal (textarea): Main challenge
- areas_prioritarias (select): Sales/Marketing/Ops/Product/Team
- objetivos (textarea): Specific objectives
- recursos (textarea): Available team + budget
- briefing_url (text, optional): Brand briefing URL
- contexto_adicional (textarea, optional): Additional context

---

## 2. Brand Briefing (from PDF)
**Slug:** `brand-briefing`  
**Icon:** 💭  
**Color:** #A78BFA (purple)  
**Timing:** 15-20 min

**Fields (from PDF):**
- nombre_cliente (text): Client name (pre-filled from Brand Brain)
- website_url (text): Website URL
- sector_industria (text): Sector/Industry
- color_principal (color): Primary brand color (hex input + color picker)
- audiencia_objetivo (textarea): Target audience description
- pilares_contenido (textarea): Content pillars (one per line, 5-7 expected)
- contexto_adicional (textarea, optional): Additional context

**Special UI:**
- Pilares section has "Sugerir pilares con IA" link
- Shows "PILARES SUGERIDOS POR CLAUDE" section below with draggable list
- Button "Confirmar pilares y continuar" before final generate

---

## 3. SEO Audit (from PDF)
**Slug:** `seo-audit`  
**Icon:** 🔍  
**Color:** #F87171 (red)  
**Timing:** 30-40 min

**Fields (estimated from audit pattern):**
- url_sitio (text): Website URL to audit
- palabras_clave_objetivo (textarea): Target keywords (one per line)
- competidores_top_3 (textarea): Top 3 competitors (one per line)
- ubicacion_objetivo (text): Target location (SEO geo-targeting)
- audito_tipo (select): Full / Competitive / Technical only
- historial_trafico (textarea, optional): Traffic history/goals

---

## 4. Marketing Audit (from PDF)
**Slug:** `marketing-audit`  
**Icon:** 📊  
**Color:** #60A5FA (blue)  
**Timing:** 25-35 min

**Fields:**
- url_sitio (text): Website
- canales_actuales (textarea): Current marketing channels (social, email, ads, etc.)
- presupuesto_anual (text): Annual marketing budget
- metricas_clave (textarea): Key metrics being tracked
- objetivos_trim (textarea): Quarterly objectives
- competencia_directa (textarea): Direct competitors
- recursos_team (textarea): Current team/resources

---

## 5. Content Pack (from PDF)
**Slug:** `content-pack`  
**Icon:** 📝  
**Color:** #FBBF24 (amber)  
**Timing:** 45-60 min

**Fields:**
- tema_principal (text): Main content theme
- formatos_deseados (select, multi): Blog / Social / Video Scripts / Whitepapers / etc.
- frecuencia (select): Monthly / Quarterly / etc.
- audiencia_description (textarea): Audience description
- tono_voz (select): Professional / Casual / Humorous / Educational
- casos_uso (textarea): Use cases/scenarios
- palabras_clave (textarea): Target keywords (one per line)

---

## 6. Investor Deck (from PDF)
**Slug:** `investor-deck`  
**Icon:** 📈  
**Color:** #34D399 (green)  
**Timing:** 60-90 min

**Fields:**
- nombre_empresa (text): Company name
- descripcion_breve (textarea): One-line pitch
- problema_solved (textarea): Problem you solve
- mercado_tam (text): Total Addressable Market (TAM)
- traccion_actual (textarea): Current traction (revenue, users, etc.)
- equipo_description (textarea): Team overview
- ronda_size (text): Funding round size (USD)
- uso_fondos (textarea): Use of funds breakdown

---

## 7. Competitive Analysis (from PDF)
**Slug:** `competitive-analysis`  
**Icon:** ⚔️  
**Color:** #EC4899 (pink)  
**Timing:** 40-50 min

**Fields:**
- competidor_1 (text): Main competitor URL/name
- competidor_2 (text): Secondary competitor
- competidor_3 (text): Tertiary competitor
- tu_proposicion (textarea): Your unique value prop
- mercado_posicion (select): Market Leader / Challenger / Niche
- diferenciadores (textarea): Your key differentiators (one per line)
- precio_posicionamiento (text): Your price positioning vs competitors
- vulnerabilidades_competencia (textarea): Competitor weaknesses

---

## 8. Brandbook Content System (from PDF)
**Slug:** `brandbook-content-system`  
**Icon:** 📚  
**Color:** #8B5CF6 (purple)  
**Timing:** 30-40 min

**Fields:**
- brand_name (text): Brand name
- industria (text): Industry
- target_audience (textarea): Target audience description
- brand_mission (textarea): Brand mission (from Brand Brain if available)
- tone_personality (textarea): Brand personality/tone
- content_buckets (textarea): Main content themes (one per line)
- visual_guidelines (textarea): Visual/design guidelines
- ejemplos_referencia (textarea, optional): Reference brand examples

---

## Implementation Checklist

For each remaining tool (2-8):

- [ ] Create `/app/(dashboard)/toolkit/[tool-slug]/page.tsx`
- [ ] Define `TOOL_CONFIG` with fields from above reference
- [ ] Call ToolRunnerPage with config
- [ ] Test form renders correctly
- [ ] Test POST to `/api/toolkit/generate`
- [ ] Verify result displays
- [ ] Run `npm run build`

---

## Notes

- All fields should match the exact labels/hints from ai-agency-screens PDFs
- Brand Brain data pre-fills applicable fields (name, mission, tone, etc.)
- Each tool has a different color (use values from "Color" row above)
- Icons from PDF headers
- Timing estimates match PDF "min - Salsa Burgers" headers
- All tools use same submit endpoint: `/api/toolkit/generate` with `tool_slug` + `input_data`

---

## Next Steps

1. Update remaining 7 tool pages using this reference
2. Verify all fields match PDFs exactly
3. Run full build
4. Test E2E: create action → see result → save to memory
5. All 8 tools in one coordinated commit

**Estimated time per tool:** 5-10 min (copy pattern from action-plan, adjust fields)
