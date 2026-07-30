'use client'
import { useState } from 'react'
import { X, Plus } from 'lucide-react'

interface EditableTagListProps {
  tags: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
}

export function EditableTagList({ tags, onChange, placeholder = 'Add item...' }: EditableTagListProps) {
  const [input, setInput] = useState('')

  const handleAdd = () => {
    if (input.trim() && !tags.includes(input.trim())) {
      onChange([...tags, input.trim()])
      setInput('')
    }
  }

  const handleRemove = (index: number) => {
    onChange(tags.filter((_, i) => i !== index))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAdd()
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          className="flex-1 px-3 py-2 rounded bg-surface border border-line text-sm text-ink placeholder-ink-tertiary focus:outline-none focus:border-[#EC4899]"
        />
        <button
          type="button"
          onClick={handleAdd}
          className="px-3 py-2 rounded bg-[#EC4899] text-white text-sm font-medium hover:bg-[#E00B7F]"
        >
          <Plus size={16} />
        </button>
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag, index) => (
            <div
              key={index}
              className="flex items-center gap-2 px-2 py-1 rounded bg-[#EC4899]/20 border border-[#EC4899]/40 text-sm text-ink"
            >
              {tag}
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="text-ink-secondary hover:text-[#FF6B6B]"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
