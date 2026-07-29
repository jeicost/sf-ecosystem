import BrandBrainEditor from '@/components/BrandBrainEditor'
import ActivationChecklist from '@/components/brain/ActivationChecklist'
import BrainChatGate from '@/components/brain/BrainChatGate'

export const metadata = {
  title: 'Brand Brain — MIRA Portal',
}

export default function BrandBrainPage() {
  return (
    <div>
      <div className="px-8 pt-8">
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
