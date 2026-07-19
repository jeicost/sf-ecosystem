import { ItemGrid } from './ItemGrid'

export function ServicesPreviewPreview({ data }: { data: Record<string, unknown> }) {
  const items = Array.isArray(data.items) ? data.items : []
  return <ItemGrid items={items} />
}
