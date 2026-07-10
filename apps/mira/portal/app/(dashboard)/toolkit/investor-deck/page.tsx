'use client'

import { useState } from 'react'
import { Play } from 'lucide-react'
import ToolkitToolPage from '@/components/toolkit-tool-page'
import { useToolkitGeneration } from '@/hooks/useToolkitGeneration'

export default function InvestorDeckPage() {
  const [fundingRound, setFundingRound] = useState('seed')
  const [amount, setAmount] = useState('')
  const [tam, setTam] = useState('')
  const { isGenerating, status, error, startGeneration } = useToolkitGeneration('investor-deck')

  const handleGenerate = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      alert('Por favor ingresa un monto válido')
      return
    }
    if (!tam || parseFloat(tam) <= 0) {
      alert('Por favor ingresa un TAM válido')
      return
    }
    await startGeneration({ funding_round: fundingRound, amount_sought: parseFloat(amount), tam: parseFloat(tam) })
  }

  return (
    <ToolkitToolPage
      icon="💼"
      name="Investor Deck"
      description="Presentación de inversión profesional: propuesta de valor, mercado, financieros y proyecciones. Listo para pitching."
      color="#EF4444"
      estimatedTime="30-40 minutos"
      outputFormat="Deck Figma editable (20 slides) + PDF"
      isGenerating={isGenerating}
    >
      <div className="space-y-4">
        <div className="card px-6 py-5">
          <p className="text-sm font-semibold text-white mb-4">Crear Investor Deck</p>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-white mb-2">
                Ronda de inversión
              </label>
              <select
                value={fundingRound}
                onChange={e => setFundingRound(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{ background: 'rgba(30,41,59,0.5)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <option value="seed">Seed</option>
                <option value="seriesA">Series A</option>
                <option value="seriesB">Series B</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-white mb-2">
                Monto buscado (USD)
              </label>
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="Ej: 500000"
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{ background: 'rgba(30,41,59,0.5)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-white mb-2">
                TAM (Total Addressable Market) - USD
              </label>
              <input
                type="number"
                value={tam}
                onChange={e => setTam(e.target.value)}
                placeholder="Ej: 50000000"
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{ background: 'rgba(30,41,59,0.5)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}
              />
            </div>
          </div>
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !amount || !tam}
            className="w-full mt-6 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all"
            style={{
              background: isGenerating || !amount || !tam ? 'rgba(239,68,68,0.4)' : 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
              color: 'white',
              opacity: !amount || !tam ? 0.6 : 1,
            }}
          >
            <Play size={16} />
            {isGenerating ? 'Generando deck...' : 'Crear Investor Deck'}
          </button>
        </div>

        {error && (
          <div className="card px-6 py-4" style={{ background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)' }}>
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {status && (
          <div className="card px-6 py-5">
            <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: '#EF4444' }}>
              Estructura de Presentación
            </p>
            <div className="space-y-2 text-sm text-white">
              {[
                'Cover + Mission',
                'Problem + Market Opportunity',
                'Solution + Competitive Advantage',
                'Business Model + GTM Strategy',
                'Traction + Key Metrics',
                'Team + Experience',
                'Financial Projections + Ask',
              ].map((slide, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="font-semibold" style={{ color: '#FCA5A5' }}>{i + 1}.</span>
                  <span>{status.result_data?.slides?.[i] || slide}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </ToolkitToolPage>
  )
}
