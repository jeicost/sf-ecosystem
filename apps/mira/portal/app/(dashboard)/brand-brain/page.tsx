import BrandBrainEditor from '@/components/BrandBrainEditor'
import ActivationChecklist from '@/components/brain/ActivationChecklist'
import BrainChatGate from '@/components/brain/BrainChatGate'
import BrainInbox from '@/components/brain/BrainInbox'

export const metadata = {
  title: 'Brand Brain — MIRA Portal',
}

export default function BrandBrainPage() {
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
        <BrainChatGate />
      </div>
      <div id="brand-brain-editor">
        <BrandBrainEditor />
      </div>
    </div>
  )
}
