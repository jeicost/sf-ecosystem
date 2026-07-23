import BrandBrainEditor from '@/components/BrandBrainEditor'
import ActivationChecklist from '@/components/brain/ActivationChecklist'

export const metadata = {
  title: 'Brand Brain — MIRA Portal',
}

export default function BrandBrainPage() {
  return (
    <div>
      <div className="px-8 pt-8">
        <ActivationChecklist />
      </div>
      <div id="brand-brain-editor">
        <BrandBrainEditor />
      </div>
    </div>
  )
}
