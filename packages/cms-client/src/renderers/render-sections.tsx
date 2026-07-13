/**
 * Generic Section Renderer
 *
 * Maps CMS section types to React components from a registry.
 * Each site passes its own component registry — new section types work
 * automatically without code changes, as long as a component is registered.
 */

import React from 'react'
import { Section, SectionRegistry } from '../types/index'

export interface RenderSectionsProps {
  sections: Section[]
  registry: SectionRegistry
  locale?: string
  fallbackComponent?: React.ComponentType<{ section: Section }>
}

/**
 * Render an array of CMS sections using a component registry
 *
 * @param sections - Array of sections from CMS (each with id, type, data)
 * @param registry - Mapping of section type → React component
 * @param locale - Optional locale to pass to components
 * @param fallbackComponent - Component to render if section type not found (defaults to error boundary)
 * @returns React elements, one per section
 *
 * @example
 * const registry = {
 *   hero: HeroSection,
 *   'features-grid': FeaturesSection,
 *   testimonials: TestimonialSection,
 * }
 *
 * <RenderSections
 *   sections={page.sections}
 *   registry={registry}
 *   locale="es"
 *   fallbackComponent={UnknownSectionFallback}
 * />
 */
export function RenderSections({
  sections,
  registry,
  locale,
  fallbackComponent: Fallback,
}: RenderSectionsProps): React.ReactNode {
  return (
    <>
      {sections.map((section) => {
        const Component = registry[section.type]

        if (!Component) {
          if (Fallback) {
            return (
              <Fallback key={section.id} section={section} />
            )
          }

          // Default error fallback
          return (
            <div
              key={section.id}
              style={{
                padding: '2rem',
                backgroundColor: '#fee',
                borderLeft: '4px solid #c33',
                marginBottom: '1rem',
              }}
            >
              <p style={{ margin: '0.5rem 0 0' }}>
                <strong>Unknown section type:</strong> "{section.type}"
              </p>
              <p style={{ margin: '0.25rem 0', fontSize: '0.875rem', color: '#666' }}>
                (Make sure "{section.type}" is registered in your section registry)
              </p>
            </div>
          )
        }

        return (
          <Component
            key={section.id}
            data={section.data}
            locale={locale}
          />
        )
      })}
    </>
  )
}

/**
 * Helper: merge CMS data over a hardcoded i18n dictionary.
 * Used during migration from fully-static sites to CMS-backed.
 *
 * @example
 * const heroText = mergeCmsData(
 *   { headline: 'Default headline', subheading: 'Default subheading' },
 *   cmsData?.['headline_en'],
 *   'en'
 * )
 */
export function mergeCmsData(
  hardcodedDict: Record<string, unknown>,
  cmsData: unknown,
  locale: string,
): Record<string, unknown> {
  if (!cmsData || typeof cmsData !== 'object') {
    return hardcodedDict
  }

  const merged = { ...hardcodedDict }

  for (const [key, value] of Object.entries(cmsData)) {
    // CMS keys are typically "fieldName_en", "fieldName_es", etc.
    const localizedKey = `${key}_${locale}`

    if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      localizedKey in cmsData
    ) {
      // Multi-locale field detected; use the localized version
      const localizedValue = (cmsData as Record<string, unknown>)[localizedKey]
      if (localizedValue) {
        merged[key] = localizedValue
      }
    } else if (value !== null && value !== '') {
      // Scalar CMS value; use it
      merged[key] = value
    }
  }

  return merged
}
