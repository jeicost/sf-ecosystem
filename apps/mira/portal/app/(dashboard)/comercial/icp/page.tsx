import { redirect } from 'next/navigation'

// The ICP Profile page was shared config with no workflow of its own (its
// criteria feed Discovery/Scoring/Proposals) — it now lives as the
// "Criterios ICP" tab inside /comercial/discovery.
export default function IcpRedirect() {
  redirect('/comercial/discovery')
}
