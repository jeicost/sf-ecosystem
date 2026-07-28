import { redirect } from 'next/navigation'

// Brief eliminado (Plan Maestro B2, decisión CEO 2026-07-28): era un relay
// hardcodeado a 2 clientes que producía menos que crear_post. Las quick
// actions + modo "Cuéntamelo" cubren su función.
export default function BriefRedirect() {
  redirect('/roster')
}
