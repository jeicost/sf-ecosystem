import { redirect } from 'next/navigation'

// The CRM page was a read-only mirror of Pipeline's data with no actions of
// its own — it now lives as the "Enviados a CRM" tab inside /comercial/pipeline.
export default function CrmRedirect() {
  redirect('/comercial/pipeline')
}
