'use client'
import { useState, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Copy, Check, Lock, Sparkles, RotateCcw } from 'lucide-react'
import { clsx } from 'clsx'

interface Variant {
  id: string
  text: string
  engagementScore?: number
  platform?: string
}

interface OracleArchetypeProps {
  agentColor: string
  agentEmoji: string
  agentName: string
  briefContent?: string
  onVariantSelect?: (variant: Variant) => void
  onSaveToLibrary?: (variant: Variant) => void
  isLoading?: boolean
  variants?: Variant[]
  defaultVariants?: Variant[]
}

export default function OracleArchetype({
  agentColor,
  agentEmoji,
  agentName,
  briefContent = '',
  onVariantSelect,
  onSaveToLibrary,
  isLoading = false,
  variants = [],
  defaultVariants = [
    {
      id: 'a',
      text: 'El FOMO es un feature, no un bug. Lee cómo los mejores startups lo dominan...',
      engagementScore: 87,
    },
    {
      id: 'b',
      text: '5 decisiones que toman los fundadores antes de levantarfunding. ¿Las conoces?',
      engagementScore: 79,
    },
    {
      id: 'c',
      text: 'Cuando todo se rompe en el unit economics, esto es lo que funciona.',
      engagementScore: 72,
    },
    {
      id: 'd',
      text: 'Los mejores CTOs no hablan de tech. Hablan de esto.',
      engagementScore: 84,
    },
    {
      id: 'e',
      text: 'Tu tasa de churn dice más sobre tu producto que cualquier métrica.',
      engagementScore: 76,
    },
  ],
}: OracleArchetypeProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [lockedId, setLockedId] = useState<string | null>(null)
  const currentVariants = variants.length > 0 ? variants : defaultVariants
  const selectedVariant = currentVariants[selectedIndex]

  useEffect(() => {
    setEditText(selectedVariant.text)
  }, [selectedIndex, selectedVariant])

  const handlePrevious = () => {
    setSelectedIndex(prev => (prev === 0 ? currentVariants.length - 1 : prev - 1))
    setIsEditing(false)
  }

  const handleNext = () => {
    setSelectedIndex(prev => (prev === currentVariants.length - 1 ? 0 : prev + 1))
    setIsEditing(false)
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(selectedVariant.text)
    setCopiedId(selectedVariant.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleSave = () => {
    setSavedIds(prev => new Set([...prev, selectedVariant.id]))
    onSaveToLibrary?.(selectedVariant)
    setTimeout(() => {
      setSavedIds(prev => {
        const next = new Set(prev)
        next.delete(selectedVariant.id)
        return next
      })
    }, 2000)
  }

  const handleLock = () => {
    setLockedId(selectedVariant.id)
    onVariantSelect?.(selectedVariant)
    // Animation effect
    setTimeout(() => setLockedId(null), 1500)
  }

  const handleRegenerate = () => {
    // Placeholder for regenerate logic
    console.log('Regenerating variant:', selectedVariant.id)
  }

  return (
    <div className="space-y-8">
      {/* Brief Card */}
      {briefContent && (
        <div className="card p-6 border-l-4" style={{ borderLeftColor: agentColor }}>
          <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: agentColor }}>
            📝 Brief
          </div>
          <div className="text-sm text-white/90 leading-relaxed">{briefContent}</div>
        </div>
      )}

      {/* Generate Button */}
      <div className="flex justify-center">
        <button
          disabled={isLoading}
          className="px-6 py-3 rounded-lg font-medium text-sm transition-all flex items-center gap-2"
          style={{
            backgroundColor: `${agentColor}20`,
            color: agentColor,
            border: `1px solid ${agentColor}40`,
            opacity: isLoading ? 0.5 : 1,
          }}
        >
          <Sparkles size={16} />
          {isLoading ? 'Generando variantes...' : 'Generar 5 variantes'}
        </button>
      </div>

      {/* Workshop - Carousel */}
      <div className="space-y-4">
        <div className="text-xs font-semibold uppercase tracking-wider px-1" style={{ color: agentColor }}>
          ⚡ Workshop
        </div>

        <div className="card p-6 space-y-4 relative overflow-hidden">
          {/* Variant Display */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-white">
                Variante {String.fromCharCode(65 + selectedIndex)}
                {lockedId === selectedVariant.id && (
                  <span className="ml-2 text-xs px-2 py-1 rounded" style={{ backgroundColor: `${agentColor}30`, color: agentColor }}>
                    ✓ Locked
                  </span>
                )}
              </div>
              {selectedVariant.engagementScore && (
                <div className="flex items-center gap-1 text-xs text-[#888]">
                  <span className="text-lg">🔥</span>
                  <span>{selectedVariant.engagementScore}% engagement vs 64% avg</span>
                </div>
              )}
            </div>

            <p className="text-base text-white/90 leading-relaxed italic">"{selectedVariant.text}"</p>

            {/* Engagement Bar */}
            {selectedVariant.engagementScore && (
              <div className="w-full bg-[#1E1E1E] rounded h-2 overflow-hidden">
                <div
                  className="h-full transition-all duration-300"
                  style={{ width: `${selectedVariant.engagementScore}%`, backgroundColor: agentColor }}
                />
              </div>
            )}
          </div>

          {/* Carousel Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-[#1E1E1E]">
            <button
              onClick={handlePrevious}
              className="p-2 hover:bg-[#1E1E1E] rounded-lg transition-colors"
            >
              <ChevronLeft size={18} className="text-[#666]" />
            </button>

            <div className="flex items-center gap-2">
              {currentVariants.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedIndex(idx)}
                  className={clsx(
                    'w-2 h-2 rounded-full transition-all',
                    idx === selectedIndex ? 'w-6' : '',
                  )}
                  style={{
                    backgroundColor: idx === selectedIndex ? agentColor : '#444',
                  }}
                />
              ))}
            </div>

            <button
              onClick={handleNext}
              className="p-2 hover:bg-[#1E1E1E] rounded-lg transition-colors"
            >
              <ChevronRight size={18} className="text-[#666]" />
            </button>
          </div>
        </div>
      </div>

      {/* Editor - Inline Editable */}
      <div className="space-y-3">
        <div className="text-xs font-semibold uppercase tracking-wider px-1" style={{ color: agentColor }}>
          🎨 Editor
        </div>

        <div className="card p-6">
          {isEditing ? (
            <textarea
              value={editText}
              onChange={e => setEditText(e.target.value)}
              className="w-full bg-[#0D0D0D] text-white text-sm leading-relaxed p-4 rounded border border-[#1E1E1E] focus:border-[#333] focus:outline-none resize-none"
              rows={4}
            />
          ) : (
            <div className="relative group cursor-text" onClick={() => setIsEditing(true)}>
              <p className="text-sm text-white/90 leading-relaxed">{editText}</p>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-r from-transparent via-[#1E1E1E]/50 to-transparent rounded pointer-events-none" />
              <span className="text-xs text-[#555] absolute bottom-0 right-0 mt-2 group-hover:text-[#888] transition-colors">
                Click to edit
              </span>
            </div>
          )}

          <div className="flex gap-2 mt-4 pt-4 border-t border-[#1E1E1E]">
            {isEditing && (
              <button
                onClick={() => setIsEditing(false)}
                className="px-3 py-1.5 text-xs rounded bg-[#1E1E1E] hover:bg-[#2E2E2E] text-[#999]"
              >
                Done
              </button>
            )}
            <button
              onClick={handleRegenerate}
              className="px-3 py-1.5 text-xs rounded flex items-center gap-1 text-[#666] hover:text-white"
            >
              <RotateCcw size={12} />
              Regenerate
            </button>
          </div>
        </div>
      </div>

      {/* Lock & Ship Actions */}
      <div className="space-y-3">
        <div className="text-xs font-semibold uppercase tracking-wider px-1" style={{ color: agentColor }}>
          ✅ Lock & Ship
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleCopy}
            className="card p-4 flex items-center justify-center gap-2 hover:bg-[#1E1E1E] transition-colors relative group"
          >
            {copiedId === selectedVariant.id ? (
              <>
                <Check size={16} style={{ color: agentColor }} />
                <span className="text-xs font-medium" style={{ color: agentColor }}>
                  Copied
                </span>
              </>
            ) : (
              <>
                <Copy size={16} className="text-[#666] group-hover:text-white" />
                <span className="text-xs font-medium text-[#666] group-hover:text-white">
                  Copy
                </span>
              </>
            )}
          </button>

          <button
            onClick={handleSave}
            className="card p-4 flex items-center justify-center gap-2 hover:bg-[#1E1E1E] transition-colors"
          >
            {savedIds.has(selectedVariant.id) ? (
              <>
                <Check size={16} style={{ color: agentColor }} />
                <span className="text-xs font-medium" style={{ color: agentColor }}>
                  Saved
                </span>
              </>
            ) : (
              <>
                <Sparkles size={16} className="text-[#666]" />
                <span className="text-xs font-medium text-[#666]">Save</span>
              </>
            )}
          </button>
        </div>

        <button
          onClick={handleLock}
          className="w-full py-3 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2"
          style={{
            backgroundColor: agentColor,
            color: 'white',
            opacity: lockedId === selectedVariant.id ? 0.7 : 1,
            transform: lockedId === selectedVariant.id ? 'scale(0.98)' : 'scale(1)',
          }}
        >
          <Lock size={16} />
          {lockedId === selectedVariant.id ? 'Locked ✓' : 'Use This Variant'}
        </button>
      </div>
    </div>
  )
}
