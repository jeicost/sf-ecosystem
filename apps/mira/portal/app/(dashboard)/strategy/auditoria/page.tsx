import { redirect } from 'next/navigation'

// Audit shared its backend agent (Blueprint) with Innovation — its job now
// lives in /strategy/proyectos (see the "Business model audit" quick prompt).
export default function AuditoriaRedirect() {
  redirect('/strategy/proyectos')
}
