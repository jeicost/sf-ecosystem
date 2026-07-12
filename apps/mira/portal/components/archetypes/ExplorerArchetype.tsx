'use client'
import { useState } from 'react'
import { Search, Filter, ChevronDown, ChevronUp, ArrowRight, Target, Zap } from 'lucide-react'
import { clsx } from 'clsx'

interface SearchResult {
  id: string
  name: string
  tier: 'HOT' | 'WARM' | 'COLD'
  score: number
  signal: string
  jurisdiction?: string
  industry?: string
  insight?: string
}

interface ExplorerArchetypeProps {
  agentColor: string
  agentEmoji: string
  agentName: string
  hotResults?: SearchResult[]
  warmResults?: SearchResult[]
  coldResults?: SearchResult[]
  onSelectResult?: (result: SearchResult) => void
  isLoading?: boolean
  onSearch?: (filters: Record<string, string>) => void
}

const DEFAULT_RESULTS = {
  hot: [
    {
      id: '1',
      name: 'Acme Ventures Series A',
      tier: 'HOT' as const,
      score: 92,
      signal: 'Just raised €2.5M, hiring 5+ engineers',
      jurisdiction: 'Madrid, ES',
      industry: 'AI/SaaS',
      insight: 'CEO tweeted about hiring, expansion phase',
    },
    {
      id: '2',
      name: 'TechHub Growth Stage',
      tier: 'HOT' as const,
      score: 88,
      signal: 'Product Hunt launch this week',
      jurisdiction: 'Barcelona, ES',
      industry: 'Developer Tools',
      insight: 'Marketing push signals go-to-market timing',
    },
  ],
  warm: [
    {
      id: '3',
      name: 'EuroScale Expansion',
      tier: 'WARM' as const,
      score: 71,
      signal: 'Hiring VP Growth, Series B likely Q3',
      jurisdiction: 'Berlin, DE',
      industry: 'E-commerce',
      insight: 'Hiring patterns suggest scale-up phase',
    },
  ],
  cold: [
    {
      id: '4',
      name: 'Bootstrapped Indie',
      tier: 'COLD' as const,
      score: 35,
      signal: 'Solo founder, profitable, no expansion',
      jurisdiction: 'Remote',
      industry: 'SaaS',
      insight: 'Not seeking growth capital',
    },
  ],
}

const getTierColor = (tier: 'HOT' | 'WARM' | 'COLD') => {
  switch (tier) {
    case 'HOT':
      return { bg: '#DC262630', text: '#EF4444', emoji: '🔥', label: 'Hot' }
    case 'WARM':
      return { bg: '#F59E0B30', text: '#F59E0B', emoji: '🟡', label: 'Warm' }
    case 'COLD':
      return { bg: '#3B82F630', text: '#3B82F6', emoji: '🔵', label: 'Cold' }
  }
}

export default function ExplorerArchetype({
  agentColor,
  agentEmoji,
  agentName,
  hotResults = DEFAULT_RESULTS.hot,
  warmResults = DEFAULT_RESULTS.warm,
  coldResults = DEFAULT_RESULTS.cold,
  onSelectResult,
  isLoading = false,
  onSearch,
}: ExplorerArchetypeProps) {
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(hotResults[0] || null)
  const [expandedTier, setExpandedTier] = useState<'HOT' | 'WARM' | 'COLD' | null>('HOT')
  const [filters, setFilters] = useState({ keyword: '', industry: '', jurisdiction: '' })
  const [showFilters, setShowFilters] = useState(false)

  const handleSelectResult = (result: SearchResult) => {
    setSelectedResult(result)
    onSelectResult?.(result)
  }

  const handleSearch = () => {
    onSearch?.(filters)
  }

  const allResults = [
    ...hotResults.map(r => ({ ...r, tier: 'HOT' as const })),
    ...warmResults.map(r => ({ ...r, tier: 'WARM' as const })),
    ...coldResults.map(r => ({ ...r, tier: 'COLD' as const })),
  ]

  const tierCounts = {
    HOT: hotResults.length,
    WARM: warmResults.length,
    COLD: coldResults.length,
  }

  const renderTierSection = (tier: 'HOT' | 'WARM' | 'COLD', results: SearchResult[]) => {
    const tierColor = getTierColor(tier)
    const isExpanded = expandedTier === tier

    return (
      <div key={tier} className="border border-[#1E1E1E] rounded-lg overflow-hidden">
        <button
          onClick={() => setExpandedTier(isExpanded ? null : tier)}
          className="w-full px-4 py-3 bg-[#0D0D0D] hover:bg-[#1E1E1E] transition-colors flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <span className="text-lg">{tierColor.emoji}</span>
            <div className="text-left">
              <div className="text-sm font-semibold text-white">{tierColor.label}</div>
              <div className="text-xs text-[#666]">{results.length} result{results.length !== 1 ? 's' : ''}</div>
            </div>
          </div>
          {isExpanded ? (
            <ChevronUp size={16} className="text-[#666]" />
          ) : (
            <ChevronDown size={16} className="text-[#666]" />
          )}
        </button>

        {isExpanded && (
          <div className="space-y-2 p-3 bg-[#0D0D0D]/50">
            {results.map(result => {
              const isSelected = selectedResult?.id === result.id
              return (
                <button
                  key={result.id}
                  onClick={() => handleSelectResult(result)}
                  className={clsx(
                    'w-full p-3 rounded-lg text-left transition-all border text-sm',
                    isSelected
                      ? 'border-[#1E1E1E] bg-[#1E1E1E]'
                      : 'border-transparent hover:bg-[#1A1A1A]'
                  )}
                >
                  <div className="flex items-start gap-2 justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-white text-sm mb-1">{result.name}</div>
                      <div className="text-xs text-[#999] leading-relaxed">{result.signal}</div>
                      {result.jurisdiction && (
                        <div className="text-xs text-[#666] mt-1">📍 {result.jurisdiction}</div>
                      )}
                    </div>
                    {isSelected && (
                      <ArrowRight size={16} style={{ color: agentColor }} className="flex-shrink-0 mt-1" />
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-3 gap-6">
      {/* Left: Hunter Mode + Harvest */}
      <div className="col-span-2 space-y-6">
        {/* Hunter Mode - Filters */}
        <div className="card p-6 space-y-4">
          <div className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: agentColor }}>
            🎯 Hunter Mode
          </div>

          <div className="space-y-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-3 text-[#666]" />
              <input
                type="text"
                placeholder="Keyword or company..."
                value={filters.keyword}
                onChange={e => setFilters({ ...filters, keyword: e.target.value })}
                className="w-full pl-10 pr-3 py-2 rounded bg-[#0D0D0D] border border-[#1E1E1E] text-sm text-white focus:border-[#333] focus:outline-none"
              />
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 text-xs text-[#666] hover:text-white transition-colors"
            >
              <Filter size={14} />
              {showFilters ? 'Hide' : 'Show'} advanced filters
            </button>

            {showFilters && (
              <div className="space-y-2 p-3 bg-[#0D0D0D] rounded border border-[#1E1E1E]">
                <input
                  type="text"
                  placeholder="Industry (e.g. AI, SaaS)..."
                  value={filters.industry}
                  onChange={e => setFilters({ ...filters, industry: e.target.value })}
                  className="w-full px-3 py-2 rounded bg-[#1E1E1E] border border-[#333] text-xs text-white focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Location (e.g. ES, EU)..."
                  value={filters.jurisdiction}
                  onChange={e => setFilters({ ...filters, jurisdiction: e.target.value })}
                  className="w-full px-3 py-2 rounded bg-[#1E1E1E] border border-[#333] text-xs text-white focus:outline-none"
                />
              </div>
            )}

            <button
              onClick={handleSearch}
              disabled={isLoading}
              className="w-full py-2 rounded text-xs font-medium transition-all"
              style={{
                backgroundColor: `${agentColor}20`,
                color: agentColor,
                border: `1px solid ${agentColor}40`,
                opacity: isLoading ? 0.5 : 1,
              }}
            >
              {isLoading ? 'Searching...' : 'Search'}
            </button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-2 pt-4 border-t border-[#1E1E1E]">
            <div className="text-center p-2 bg-[#0D0D0D] rounded">
              <div className="text-lg font-bold" style={{ color: '#EF4444' }}>
                {tierCounts.HOT}
              </div>
              <div className="text-xs text-[#666] mt-1">Hot</div>
            </div>
            <div className="text-center p-2 bg-[#0D0D0D] rounded">
              <div className="text-lg font-bold" style={{ color: '#F59E0B' }}>
                {tierCounts.WARM}
              </div>
              <div className="text-xs text-[#666] mt-1">Warm</div>
            </div>
            <div className="text-center p-2 bg-[#0D0D0D] rounded">
              <div className="text-lg font-bold" style={{ color: '#3B82F6' }}>
                {tierCounts.COLD}
              </div>
              <div className="text-xs text-[#666] mt-1">Cold</div>
            </div>
          </div>
        </div>

        {/* Harvest - Results by Tier */}
        <div className="card p-6 space-y-4">
          <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: agentColor }}>
            🌾 Harvest
          </div>

          <div className="space-y-3">
            {renderTierSection('HOT', hotResults)}
            {renderTierSection('WARM', warmResults)}
            {renderTierSection('COLD', coldResults)}
          </div>
        </div>
      </div>

      {/* Right: Deep Dive */}
      {selectedResult && (
        <div className="col-span-1">
          <div className="card p-6 space-y-5 sticky top-8">
            <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: agentColor }}>
              🔎 Deep Dive
            </div>

            <div>
              <div className="text-lg font-semibold text-white mb-2">{selectedResult.name}</div>
              <div
                className="inline-block px-2 py-1 rounded text-xs font-medium"
                style={{
                  backgroundColor: getTierColor(selectedResult.tier).bg,
                  color: getTierColor(selectedResult.tier).text,
                }}
              >
                {getTierColor(selectedResult.tier).emoji} {getTierColor(selectedResult.tier).label}
              </div>
            </div>

            {selectedResult.industry && (
              <div className="space-y-1">
                <div className="text-xs font-semibold text-white uppercase">Industry</div>
                <div className="text-sm text-[#999]">{selectedResult.industry}</div>
              </div>
            )}

            <div className="space-y-1">
              <div className="text-xs font-semibold text-white uppercase">Key Signal</div>
              <div className="text-sm text-[#999]">{selectedResult.signal}</div>
            </div>

            {selectedResult.insight && (
              <div className="space-y-2 border-t border-[#1E1E1E] pt-4">
                <div className="text-xs font-semibold text-white uppercase">Insight</div>
                <div className="text-sm text-[#999]">{selectedResult.insight}</div>
              </div>
            )}

            <div className="pt-3 grid grid-cols-2 gap-2">
              <button
                className="px-3 py-2 text-xs rounded font-medium transition-colors"
                style={{
                  backgroundColor: `${agentColor}20`,
                  color: agentColor,
                  border: `1px solid ${agentColor}40`,
                }}
              >
                Research
              </button>
              <button
                className="px-3 py-2 text-xs rounded font-medium text-white"
                style={{ backgroundColor: agentColor }}
              >
                Contact
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
