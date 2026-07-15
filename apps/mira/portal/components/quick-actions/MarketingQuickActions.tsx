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
    {
      id: 'crear_post_visual',
      title: '🎨 Post Visual',
      description: 'Generate social post with AI image',
      actionType: 'crear_post_visual',
      form: (
        <div className="space-y-3">
          <input
            type="text"
            name="topic"
            placeholder="Post topic"
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 text-sm"
            required
          />
          <textarea
            name="copy"
            placeholder="Post copy/description"
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 text-sm h-16"
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
          <input
            type="text"
            name="style"
            placeholder="Image style (e.g., minimalist, vibrant, professional)"
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 text-sm"
          />
        </div>
      ),
    },
    {
      id: 'crear_carrusel_visual',
      title: '📸 Carousel Visual',
      description: 'Generate carousel with AI-generated images',
      actionType: 'crear_carrusel_visual',
      form: (
        <div className="space-y-3">
          <textarea
            name="concept"
            placeholder="Carousel concept or story"
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 text-sm h-16"
            required
          />
          <input
            type="number"
            name="numberOfSlides"
            placeholder="Number of slides"
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 text-sm"
            defaultValue="5"
            min="2"
            max="10"
          />
          <input
            type="text"
            name="style"
            placeholder="Visual style (e.g., minimal, bold, gradient)"
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 text-sm"
          />
          <input
            type="text"
            name="cta"
            placeholder="Call-to-action text (optional)"
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 text-sm"
          />
        </div>
      ),
    },
    {
      id: 'editar_imagen_visual',
      title: '✏️ Editar Imagen',
      description: 'Refine and edit AI-generated images',
      actionType: 'editar_imagen_visual',
      form: (
        <div className="space-y-3">
          <input
            type="text"
            name="imageUrl"
            placeholder="Image URL (paste link to existing image)"
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 text-sm"
            required
          />
          <textarea
            name="refinement"
            placeholder="What to change? (e.g., 'make background darker', 'fix the text')"
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 text-sm h-16"
            required
          />
          <select
            name="preserveElements"
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
          >
            <option value="">No protected elements</option>
            <option value="text">Keep text as is</option>
            <option value="logo">Keep logo as is</option>
            <option value="layout">Keep layout as is</option>
          </select>
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
        />
      )}
    </div>
  )
}
