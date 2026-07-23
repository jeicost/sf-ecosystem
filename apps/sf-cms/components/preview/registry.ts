import type { ComponentType } from 'react'
import { HeroPreview } from './sections/HeroPreview'
import { IntroGridPreview } from './sections/IntroGridPreview'
import { ServicesPreviewPreview } from './sections/ServicesPreviewPreview'
import { CaseStudyPreview } from './sections/CaseStudyPreview'
import { FaqPreview } from './sections/FaqPreview'
import { CtaBannerPreview } from './sections/CtaBannerPreview'
import { TestimonialsPreview } from './sections/TestimonialsPreview'
import { TeamPreview } from './sections/TeamPreview'
import { ContentPreview } from './sections/ContentPreview'

type PreviewComponent = ComponentType<{ data: Record<string, unknown> }>

/**
 * Maps section.type -> generic neutral preview component.
 * These are CMS-local admin previews, not the branded per-site components
 * client sites render (@sf/cms-client's RenderSections) — see plan for why.
 */
export const PREVIEW_REGISTRY: Record<string, PreviewComponent | null> = {
  hero: HeroPreview,
  'intro-grid': IntroGridPreview,
  'services-preview': ServicesPreviewPreview,
  'case-study': CaseStudyPreview,
  faq: FaqPreview,
  'cta-banner': CtaBannerPreview,
  testimonials: TestimonialsPreview,
  team: TeamPreview,
  content: ContentPreview, // generic per-field overrides (merge-override pages)
  seo: null, // metadata section, not rendered visually
}
