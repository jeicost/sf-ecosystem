// Tipo compartido cliente/servidor del bundle de autofill de quick actions.
export interface AutofillBundle {
  tone: string | null
  audience: string | null
  industry: string | null
  brand_colors: string | null
  company_name: string | null
}
