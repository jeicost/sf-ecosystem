import BrandBrainEditor from '@/components/BrandBrainEditor'
import ActivationChecklist from '@/components/brain/ActivationChecklist'
import BrainChat from '@/components/brain/BrainChat'
import BrainInbox from '@/components/brain/BrainInbox'
import { getSessionUser } from '@/lib/resolve-client'

export const metadata = {
  title: 'Brand Brain — MIRA Portal',
}

export default async function BrandBrainPage() {
  // Quién es agencia se resuelve AQUÍ, en el servidor, donde la sesión es
  // autoritativa. Antes lo hacía BrainChatGate en el navegador con un
  // `supabase.auth.getUser()` dentro de un useEffect de montaje único: si la
  // sesión aún no estaba hidratada devolvía null, el plan caía a 'starter' y
  // el efecto no se vuelve a ejecutar, así que un super_admin se quedaba sin
  // poder confirmar nada para siempre. Es el mismo fallo que se arregló en
  // BrainInbox el 2026-08-06, reportado en producción.
  const plan = (await getSessionUser())?.user_metadata?.plan as string | undefined
  const isAgency = plan === 'super_admin' || plan === 'admin'

  return (
    <div>
      <div className="px-8 pt-8">
        {/* Lo aprendido y pendiente de aprobar va PRIMERO y siempre visible:
            antes solo aparecía dentro del desplegable de "Cuéntale a MIRA",
            que está cerrado casi siempre, y por eso las propuestas del sync de
            Drive parecían no existir. */}
        <BrainInbox />
        <ActivationChecklist />
        {/* P6: "Cuéntale a MIRA" — actualizar el brain conversando, con confirmación */}
        <BrainChat isAgency={isAgency} />
      </div>
      <div id="brand-brain-editor">
        <BrandBrainEditor />
      </div>
    </div>
  )
}
