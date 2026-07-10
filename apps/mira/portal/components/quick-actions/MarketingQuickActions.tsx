'use client'

import { useState } from 'react'
import { QuickActionButton } from '../QuickActionButton'
import { QuickActionResult } from '../QuickActionResult'

export function MarketingQuickActions() {
  const [activeActionId, setActiveActionId] = useState<string | null>(null)

  const actions = [
    {
      id: 'crear_post',
      title: 'Crear Post',
      description: 'Generate social media post with AI image',
      actionType: 'crear_post',
      form: (
        <div className="space-y-3">
          <input
            type="text"
            name="topic"
            placeholder="Post topic"
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 text-sm"
            required
          />
          <select
            name="platform"
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
            required
          >
            <option value="instagram">Instagram</option>
            <option value="linkedin">LinkedIn</option>
            <option value="twitter">Twitter</option>
          </select>
          <select
            name="tone"
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
            required
          >
            <option value="professional">Professional</option>
            <option value="casual">Casual</option>
            <option value="humorous">Humorous</option>
          </select>
        </div>
      ),
    },
    {
      id: 'crear_newsletter',
      title: 'Crear Newsletter',
      description: 'Generate 5-article newsletter',
      actionType: 'crear_newsletter',
      form: (
        <div className="space-y-3">
          <input
            type="text"
            name="theme"
            placeholder="Newsletter theme"
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 text-sm"
            required
          />
          <input
            type="text"
            name="tone"
            placeholder="Tone (e.g., informative, entertaining)"
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 text-sm"
            required
          />
          <input
            type="number"
            name="article_count"
            placeholder="Number of articles"
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 text-sm"
            defaultValue="5"
          />
        </div>
      ),
    },
    {
      id: 'crear_video_brief',
      title: 'Crear Video Brief',
      description: 'Generate video script and storyboard',
      actionType: 'crear_video_brief',
      form: (
        <div className="space-y-3">
          <input
            type="text"
            name="product"
            placeholder="Product/feature to showcase"
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 text-sm"
            required
          />
          <select
            name="duration"
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
            required
          >
            <option value="15s">15 seconds</option>
            <option value="30s">30 seconds</option>
            <option value="60s">60 seconds</option>
          </select>
          <select
            name="style"
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
            required
          >
            <option value="educational">Educational</option>
            <option value="entertaining">Entertaining</option>
            <option value="testimonial">Testimonial</option>
          </select>
        </div>
      ),
    },
    {
      id: 'crear_carousel',
      title: 'Crear Carousel',
      description: 'Design carousel slides concept',
      actionType: 'crear_carousel',
      form: (
        <div className="space-y-3">
          <textarea
            name="idea"
            placeholder="Carousel idea or concept"
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 text-sm h-16"
            required
          />
          <input
            type="text"
            name="brand_colors"
            placeholder="Brand colors (e.g., #FF5733, #00FF00)"
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 text-sm"
          />
          <input
            type="number"
            name="slide_count"
            placeholder="Number of slides"
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 text-sm"
            defaultValue="5"
          />
        </div>
      ),
    },
    {
      id: 'crear_campaña_ads',
      title: 'Crear Campaña Ads',
      description: 'Generate ads strategy and copy variations',
      actionType: 'crear_campaña_ads',
      form: (
        <div className="space-y-3">
          <select
            name="goal"
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
            required
          >
            <option value="awareness">Awareness</option>
            <option value="conversion">Conversion</option>
            <option value="retention">Retention</option>
          </select>
          <input
            type="number"
            name="budget"
            placeholder="Budget (USD)"
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 text-sm"
            required
          />
          <input
            type="text"
            name="audience"
            placeholder="Target audience description"
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 text-sm"
            required
          />
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-3">⚡ Quick Actions</h3>
        <div className="grid grid-cols-2 gap-2">
          {actions.map((action) => (
            <QuickActionButton
              key={action.id}
              title={action.title}
              description={action.description}
              actionType={action.actionType}
              department="marketing"
              inputForm={action.form}
              onActionComplete={(actionId) => setActiveActionId(actionId)}
            />
          ))}
        </div>
      </div>

      {activeActionId && (
        <QuickActionResult
          actionId={activeActionId}
          resourceName={actions.find((a) => a.id === activeActionId)?.title || 'Resource'}
          department="marketing"
          outputType="json"
        />
      )}
    </div>
  )
}
