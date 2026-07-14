'use client'

export function InvestorDeckResult({ data }: { data?: any }) {
  if (!data) return <div className="text-gray-400">No data</div>
  const [currentSlide, setCurrentSlide] = React.useState(0)
  const slides = [
    'title_slide', 'executive_summary', 'the_problem', 'the_solution', 'go_to_market',
    'business_model', 'unit_economics', 'market_and_competition', 'traction_and_validation',
    'customer_testimonials', 'team', 'board_and_advisors', 'financials', 'risks_and_mitigation',
    'product_roadmap', 'the_ask', 'contact_and_next_steps'
  ]

  return (
    <div className="w-full">
      {/* Header */}
      <div className="bg-black border-b border-white/10 p-6 md:p-8">
        <h1 className="text-5xl font-black text-white mb-2">INVESTOR DECK</h1>
        <p className="text-gray-400 max-w-2xl">17-slide pitch deck: market, competition, traction, team, financials, and ask</p>
      </div>

      {/* Slides Navigation */}
      <div className="bg-black border-b border-white/10 p-6 flex items-center justify-between">
        <button
          onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded text-white text-sm"
        >
          ← Previous
        </button>
        <div className="text-gray-400 text-sm">
          Slide {currentSlide + 1} of {slides.length}
        </div>
        <button
          onClick={() => setCurrentSlide(Math.min(slides.length - 1, currentSlide + 1))}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded text-white text-sm"
        >
          Next →
        </button>
      </div>

      {/* Slide Content */}
      <div className="bg-black p-6 md:p-8 space-y-8 min-h-96">
        {currentSlide === 0 && data.title_slide && (
          <section>
            <h2 className="text-4xl font-black text-white mb-4">{data.title_slide.company}</h2>
            <div className="text-xl text-yellow-400 font-bold mb-3">{data.title_slide.tagline}</div>
            <div className="text-gray-400">Mission: {data.title_slide.mission}</div>
          </section>
        )}

        {currentSlide === 1 && data.executive_summary && (
          <section>
            <h2 className="text-3xl font-black text-white mb-4">Executive Summary</h2>
            <p className="text-gray-300">{data.executive_summary.problem_solution_market}</p>
            <p className="text-gray-400 mt-3 text-sm">{data.executive_summary.why_now}</p>
          </section>
        )}

        {currentSlide === 2 && data.the_problem && (
          <section>
            <h2 className="text-3xl font-black text-white mb-4">The Problem</h2>
            <div className="text-3xl text-red-400 font-bold mb-3">TAM: {data.the_problem.tam}</div>
            <div className="space-y-2">
              {data.the_problem.pain_points && data.the_problem.pain_points.map((pp: string, idx: number) => (
                <div key={idx} className="text-gray-300">• {pp}</div>
              ))}
            </div>
          </section>
        )}

        {currentSlide === 3 && data.the_solution && (
          <section>
            <h2 className="text-3xl font-black text-white mb-4">The Solution</h2>
            <p className="text-gray-300 mb-3">{data.the_solution.description}</p>
            <div className="border-l-4 border-green-500 bg-green-500/5 p-4 rounded-r">
              <div className="text-green-400 font-bold mb-1">UNIQUE VALUE PROP</div>
              <p className="text-gray-300">{data.the_solution.unique_value_prop}</p>
            </div>
          </section>
        )}

        {currentSlide === 4 && data.go_to_market && (
          <section>
            <h2 className="text-3xl font-black text-white mb-4">Go-to-Market</h2>
            <div className="space-y-3">
              {data.go_to_market.acquisition_channels && (
                <div>
                  <div className="font-bold text-white mb-2">Acquisition Channels</div>
                  {data.go_to_market.acquisition_channels.map((ch: string, idx: number) => (
                    <div key={idx} className="text-gray-300 text-sm">• {ch}</div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {currentSlide === 5 && data.business_model && (
          <section>
            <h2 className="text-3xl font-black text-white mb-4">Business Model</h2>
            <div className="space-y-2">
              <div><span className="text-gray-400">Revenue Streams:</span> <span className="text-white font-bold">{data.business_model.revenue_streams?.join(', ')}</span></div>
              <div><span className="text-gray-400">Pricing:</span> <span className="text-white font-bold">{data.business_model.pricing_strategy}</span></div>
            </div>
          </section>
        )}

        {currentSlide === 6 && data.unit_economics && (
          <section>
            <h2 className="text-3xl font-black text-white mb-4">Unit Economics</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="border border-white/10 bg-white/5 p-4 rounded">
                <div className="text-xs text-gray-400">CAC</div>
                <div className="text-2xl font-black text-white">{data.unit_economics.cac}</div>
              </div>
              <div className="border border-white/10 bg-white/5 p-4 rounded">
                <div className="text-xs text-gray-400">LTV</div>
                <div className="text-2xl font-black text-white">{data.unit_economics.ltv}</div>
              </div>
              <div className="border border-white/10 bg-white/5 p-4 rounded">
                <div className="text-xs text-gray-400">Payback</div>
                <div className="text-2xl font-black text-white">{data.unit_economics.payback_period}</div>
              </div>
              <div className="border border-white/10 bg-white/5 p-4 rounded">
                <div className="text-xs text-gray-400">Gross Margin</div>
                <div className="text-2xl font-black text-white">{data.unit_economics.gross_margin}</div>
              </div>
            </div>
          </section>
        )}

        {currentSlide === 7 && data.market_and_competition && (
          <section>
            <h2 className="text-3xl font-black text-white mb-4">Market & Competition</h2>
            <div className="text-2xl text-green-400 font-bold mb-2">Market Size: {data.market_and_competition.market_size}</div>
            <div className="text-gray-300">Growth Rate: {data.market_and_competition.growth_rate}</div>
            <div className="text-gray-400 text-sm mt-2">Differentiation: {data.market_and_competition.differentiation}</div>
          </section>
        )}

        {currentSlide === 8 && data.traction_and_validation && (
          <section>
            <h2 className="text-3xl font-black text-white mb-4">Traction</h2>
            <div className="space-y-2">
              <div><span className="text-gray-400">Customers:</span> <span className="text-white font-bold">{data.traction_and_validation.customers_count}</span></div>
              <div><span className="text-gray-400">Revenue:</span> <span className="text-green-400 font-bold">{data.traction_and_validation.revenue_mrr_arr}</span></div>
              <div><span className="text-gray-400">Growth:</span> <span className="text-white font-bold">{data.traction_and_validation.growth_trajectory}</span></div>
            </div>
          </section>
        )}

        {currentSlide === 9 && data.customer_testimonials && data.customer_testimonials.length > 0 && (
          <section>
            <h2 className="text-3xl font-black text-white mb-4">Customer Testimonials</h2>
            <div className="border-l-4 border-blue-500 bg-blue-500/5 p-4 rounded-r">
              <p className="text-gray-300 italic mb-2">{data.customer_testimonials[0].quote}</p>
              <div className="text-sm text-gray-400">— {data.customer_testimonials[0].customer}, {data.customer_testimonials[0].company}</div>
            </div>
          </section>
        )}

        {currentSlide === 10 && data.team && data.team.length > 0 && (
          <section>
            <h2 className="text-3xl font-black text-white mb-4">Team</h2>
            <div className="space-y-2">
              {data.team.slice(0, 3).map((member: any, idx: number) => (
                <div key={idx} className="border border-white/10 bg-white/5 p-3 rounded">
                  <div className="font-bold text-white">{member.name}</div>
                  <div className="text-xs text-gray-400">{member.role}</div>
                  <div className="text-xs text-gray-500 mt-1">{member.background}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {currentSlide === 11 && data.board_and_advisors && data.board_and_advisors.length > 0 && (
          <section>
            <h2 className="text-3xl font-black text-white mb-4">Board & Advisors</h2>
            <div className="space-y-2">
              {data.board_and_advisors.map((advisor: any, idx: number) => (
                <div key={idx} className="text-gray-300">
                  <div className="font-bold">{advisor.name}</div>
                  <div className="text-xs text-gray-500">{advisor.background}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {currentSlide === 12 && data.financials && (
          <section>
            <h2 className="text-3xl font-black text-white mb-4">Financials</h2>
            <div className="space-y-2">
              <div><span className="text-gray-400">Funding History:</span> <span className="text-white font-bold">{data.financials.funding_history}</span></div>
              <div><span className="text-gray-400">Monthly Burn:</span> <span className="text-red-400 font-bold">{data.financials.monthly_burn}</span></div>
              <div><span className="text-gray-400">24mo Projection:</span> <span className="text-green-400 font-bold">{data.financials['24mo_revenue_projection']}</span></div>
            </div>
          </section>
        )}

        {currentSlide === 13 && data.risks_and_mitigation && data.risks_and_mitigation.length > 0 && (
          <section>
            <h2 className="text-3xl font-black text-white mb-4">Risks & Mitigation</h2>
            <div className="space-y-2">
              {data.risks_and_mitigation.slice(0, 2).map((risk: any, idx: number) => (
                <div key={idx} className="border border-white/10 bg-white/5 p-3 rounded">
                  <div className="font-bold text-white text-sm">{risk.risk}</div>
                  <div className="text-xs text-gray-400 mt-1">Mitigation: {risk.mitigation}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {currentSlide === 14 && data.product_roadmap && (
          <section>
            <h2 className="text-3xl font-black text-white mb-4">Product Roadmap</h2>
            <div className="border-l-4 border-purple-500 bg-purple-500/5 p-4 rounded-r">
              <div className="text-gray-300 mb-2">{data.product_roadmap.how_funding_accelerates}</div>
              {data.product_roadmap.next_12_months && (
                <div className="mt-3 text-xs text-gray-400 space-y-1">
                  {data.product_roadmap.next_12_months.map((m: any, idx: number) => (
                    <div key={idx}>Q{m.q}: {m.milestone}</div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {currentSlide === 15 && data.the_ask && (
          <section>
            <h2 className="text-3xl font-black text-white mb-4">The Ask</h2>
            <div className="space-y-3">
              <div className="text-4xl font-black text-green-400">{data.the_ask.amount}</div>
              <div className="text-gray-400">Valuation: <span className="text-white font-bold">{data.the_ask.valuation}</span></div>
              <div className="border border-white/10 bg-white/5 p-4 rounded mt-4">
                <div className="text-xs text-gray-400 font-bold mb-2">USE OF FUNDS</div>
                {data.the_ask.use_of_funds_breakdown && data.the_ask.use_of_funds_breakdown.map((use: any, idx: number) => (
                  <div key={idx} className="text-xs text-gray-300">{use.category}: {use.percentage}</div>
                ))}
              </div>
            </div>
          </section>
        )}

        {currentSlide === 16 && data.contact_and_next_steps && (
          <section>
            <h2 className="text-3xl font-black text-white mb-4">Contact & Next Steps</h2>
            <div className="space-y-2">
              <div><span className="text-gray-400">Email:</span> <span className="text-white font-bold">{data.contact_and_next_steps.contact_email}</span></div>
              <div><span className="text-gray-400">Timeline:</span> <span className="text-white">{data.contact_and_next_steps.process_timeline}</span></div>
            </div>
          </section>
        )}
      </div>

      {/* Footer */}
      <div className="bg-black border-t border-white/10 p-6 md:p-8 text-center text-xs text-gray-500">
        {data?.generatedAt && <div>Generated {data.generatedAt}</div>}
      </div>
    </div>
  )
}

import React from 'react'
