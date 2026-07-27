import { redirect } from 'next/navigation'

// Trends was a static mock wrapper around the same job the analizar_tendencias
// quick action does from Strategy's My Team — retired per the simplification.
export default function TendenciasRedirect() {
  redirect('/strategy')
}
