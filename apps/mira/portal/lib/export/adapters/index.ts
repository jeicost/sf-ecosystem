// Adapter registry: tool slug → ToolAdapter, with generic fallback.

import type { ToolAdapter } from './types'
import { genericAdapter } from './generic'
import { adapter as seoAudit } from './seo-audit'
import { adapter as marketingAudit } from './marketing-audit'
import { adapter as brandBriefing } from './brand-briefing'
import { adapter as competitiveAnalysis } from './competitive-analysis'
import { adapter as investorDeck } from './investor-deck'
import { adapter as contentPack } from './content-pack'
import { adapter as actionPlan } from './action-plan'
import { adapter as brandbookContentSystem } from './brandbook-content-system'
import { adapter as brandBook } from './brand-book'
import { adapter as marketingCampaignGenerator } from './marketing-campaign-generator'
import { adapter as communityGrowthBlueprint } from './community-growth-blueprint'

const ADAPTERS: Record<string, ToolAdapter> = {
  'seo-audit': seoAudit,
  'marketing-audit': marketingAudit,
  'brand-briefing': brandBriefing,
  'competitive-analysis': competitiveAnalysis,
  'investor-deck': investorDeck,
  'content-pack': contentPack,
  'action-plan': actionPlan,
  'brandbook-content-system': brandbookContentSystem,
  'brand-book': brandBook,
  'marketing-campaign-generator': marketingCampaignGenerator,
  'community-growth-blueprint': communityGrowthBlueprint,
}

export function getAdapter(toolSlug: string): ToolAdapter {
  return ADAPTERS[toolSlug] ?? genericAdapter
}

export { genericAdapter }
export type { ToolAdapter }
