import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'

// Test endpoint: Simulate n8n webhook responses for testing
// Usage: curl -X POST http://localhost:3005/api/quick-actions/test?action_id=UUID

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const actionId = searchParams.get('action_id')

  // Check if test mode is enabled (dev only)
  const testMode = process.env.NODE_ENV !== 'production' || searchParams.get('test_key') === process.env.TEST_API_KEY

  if (!testMode) {
    return NextResponse.json({ error: 'Test mode disabled in production' }, { status: 403 })
  }

  if (!actionId) {
    return NextResponse.json({ error: 'Missing action_id query param' }, { status: 400 })
  }

  try {
    const admin = adminClient()

    // Get the action request from Supabase
    const { data: action, error: fetchError } = await admin
      .from('quick_actions_results')
      .select('*')
      .eq('id', actionId)
      .single()

    if (fetchError || !action) {
      return NextResponse.json({ error: 'Action not found' }, { status: 404 })
    }

    // Generate mock output based on action_type
    const mockOutput = generateMockOutput(action.action_type, action.input_data)

    // Update Supabase with mock output
    const { error: updateError } = await admin
      .from('quick_actions_results')
      .update({
        output_data: mockOutput.output_data,
        output_type: mockOutput.output_type,
      })
      .eq('id', actionId)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Mock output generated for ${action.action_type}`,
      action_id: actionId,
      output_data: mockOutput.output_data,
      output_type: mockOutput.output_type,
    })
  } catch (error) {
    console.error('Test error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function generateMockOutput(actionType: string, inputData: any) {
  switch (actionType) {
    // Comercial
    case 'crear_campaña':
      return {
        output_type: 'document',
        output_data: {
          leads: ['prospect1@company.com', 'prospect2@company.com', 'prospect3@company.com'],
          icebreakers: [
            'Hi [Name], I noticed your company is in the tech space. We help similar companies automate their processes...',
            'I found your profile and thought you might be interested in our sales automation platform...',
            'Your company seems to be growing fast. We can help streamline your sales process...',
          ],
          campaign_name: `Outreach Campaign - ${inputData.client_name || 'Unknown'}`,
          leads_count: 3,
          file_id: 'mock-drive-id-123',
        },
      }

    case 'generar_icp':
      return {
        output_type: 'json',
        output_data: {
          icp_score: 87,
          category: 'hot',
          bant: {
            budget: 8,
            authority: 7,
            need: 9,
            timeline: 8,
          },
          reasoning: 'Strong alignment with company profile, good budget, quick decision timeline',
          next_steps: ['Schedule qualification call', 'Send case studies', 'Prepare proposal'],
        },
      }

    case 'crear_propuesta':
      return {
        output_type: 'document',
        output_data: {
          proposal_title: `Proposal for ${inputData.prospect_name || 'Prospect'}`,
          pages: 8,
          sections: ['Executive Summary', 'Problem Analysis', 'Solution Overview', 'Implementation', 'Pricing', 'Next Steps'],
          file_id: 'mock-drive-pdf-456',
          proposal_url: 'https://drive.google.com/file/d/mock-file-id',
          download_link: 'https://drive.google.com/uc?export=download&id=mock-file-id',
        },
      }

    case 'calificar_reply':
      return {
        output_type: 'json',
        output_data: {
          sentiment: 'positive',
          bant_score: {
            budget: 7,
            authority: 8,
            need: 9,
            timeline: 6,
          },
          overall_score: 30,
          recommendation: 'Schedule call within 48 hours',
          next_action: 'send_proposal',
          reasoning:
            'Prospect shows high interest in solution, authority is clear, timeline is moderate - worth pursuing',
        },
      }

    // Marketing
    case 'crear_post':
      return {
        output_type: 'image',
        output_data: {
          copy: `🚀 Just launched our latest feature!

We're excited to introduce [Feature Name] - designed to help you [benefit].

Key highlights:
• Saves time
• Improves efficiency
• Easy to use

Ready to try it? Link in bio 👆

#AI #Automation #Innovation #${inputData.topic || 'Tech'}`,
          image_url: 'https://via.placeholder.com/1080x1080?text=AI+Post+Image',
          platform: inputData.platform || 'linkedin',
          hashtags: ['#AI', '#Automation', '#' + (inputData.topic || 'Innovation')],
          file_id: 'mock-drive-image-789',
        },
      }

    case 'crear_newsletter':
      return {
        output_type: 'document',
        output_data: {
          subject: `This Week in ${inputData.theme || 'Tech'} - Edition ${Math.floor(Math.random() * 100)}`,
          articles: [
            { title: 'AI Automation Trends', summary: 'Latest developments in AI-powered workflows...', link: 'https://example.com/1' },
            { title: 'Case Study: 3x Productivity', summary: 'How one team automated their entire sales process...', link: 'https://example.com/2' },
            { title: 'Tool Roundup: Top 5 Platforms', summary: 'Best automation tools for 2026...', link: 'https://example.com/3' },
            { title: 'Interview: Industry Expert', summary: 'Q&A with automation thought leader...', link: 'https://example.com/4' },
            { title: 'Your Turn: Reader Spotlight', summary: 'How are YOU using automation? Share your story...', link: 'https://example.com/5' },
          ],
          cta: 'Ready to automate? Start free today →',
          file_id: 'mock-drive-newsletter-001',
          html_url: 'https://drive.google.com/file/d/mock-newsletter',
        },
      }

    case 'crear_video_brief':
      return {
        output_type: 'json',
        output_data: {
          title: `Video Script: ${inputData.product || 'Our Product'} Explained`,
          duration: inputData.duration || '30s',
          scenes: [
            {
              time: '0-5s',
              action: 'Show product interface',
              voiceover: 'Tired of manual processes? Meet our solution...',
            },
            {
              time: '5-15s',
              action: 'Demo key feature',
              voiceover: 'With just one click, automate your entire workflow...',
            },
            {
              time: '15-25s',
              action: 'Show results',
              voiceover: 'Users report 3x faster execution and 50% cost savings...',
            },
            {
              time: '25-30s',
              action: 'CTA frame',
              voiceover: 'Start your free trial today. Link in bio.',
            },
          ],
          music_suggestions: ['Upbeat', 'Modern', 'Professional'],
          editing_notes: 'Use B-roll, fast transitions, energetic pacing',
        },
      }

    case 'crear_carousel':
      return {
        output_type: 'json',
        output_data: {
          title: 'Carousel Concept',
          slide_count: 5,
          slides: [
            { text: 'Problem: Manual processes are slow 🐌', design_notes: 'Bold red background, white text' },
            { text: 'Solution: Automated workflows ⚡', design_notes: 'Gradient blue, icon of gears' },
            { text: 'Benefit 1: Save 20 hours/week 📅', design_notes: 'Green accent, chart icon' },
            { text: 'Benefit 2: Reduce errors by 90% ✅', design_notes: 'Purple accent, checkmark' },
            { text: 'Call to action: Start free trial 🚀', design_notes: 'Bright call-to-action button' },
          ],
          figma_url: 'https://www.figma.com/file/mock-carousel',
          file_id: 'mock-carousel-design-001',
        },
      }

    case 'crear_campaña_ads':
      return {
        output_type: 'document',
        output_data: {
          strategy: `Ads Strategy for ${inputData.goal || 'awareness'} campaign`,
          budget_allocation: {
            google: 40,
            meta: 50,
            linkedin: 10,
          },
          ad_variations: [
            { headline: 'Automate Your Sales in Minutes', body: 'No coding required. Start free today.', cta: 'Get Started' },
            { headline: '3x More Productive', body: 'Join 1000+ companies automating workflows.', cta: 'Learn More' },
            {
              headline: 'Save 20 Hours Every Week',
              body: 'Our automation platform handles repetitive tasks.',
              cta: 'Try Free',
            },
          ],
          targeting: {
            audience: 'B2B SaaS founders and ops managers',
            age_range: '25-55',
            interests: ['Business automation', 'Productivity tools', 'SaaS'],
          },
          expected_performance: {
            ctr: '2.5%',
            conversion_rate: '3.2%',
            cpc: '$1.20',
          },
        },
      }

    // Strategy
    case 'generar_reporte':
      return {
        output_type: 'document',
        output_data: {
          period: inputData.period || 'monthly',
          summary: 'Strong growth across all metrics. Revenue up 15% MoM, customer acquisition steady.',
          kpis: {
            revenue: '$425,000',
            mrr: '$42,500',
            churn: '2.1%',
            new_customers: 12,
            retention: '97.9%',
          },
          highlights: ['Highest revenue month on record', 'Customer satisfaction at 4.8/5', 'Team productivity +20%'],
          file_id: 'mock-report-2026-07',
        },
      }

    case 'analizar_competencia':
      return {
        output_type: 'document',
        output_data: {
          competitors_analyzed: 3,
          matrix: {
            features: { you: 9, competitor_a: 7, competitor_b: 6 },
            pricing: { you: 'Mid-range', competitor_a: 'Premium', competitor_b: 'Budget' },
            support: { you: 8, competitor_a: 6, competitor_b: 5 },
          },
          opportunities: ['Add AI features (competitors lack)', 'Improve UX/onboarding', 'Bundle with integrations'],
          threats: ['Competitor A expanding sales team', 'Price wars possible', 'New entrant from China'],
          recommendation: 'Focus on differentiation via AI features, maintain premium positioning',
          file_id: 'mock-competitive-analysis',
        },
      }

    case 'brainstorm_ideas':
      return {
        output_type: 'json',
        output_data: {
          topic: inputData.topic || 'growth',
          total_ideas: 100,
          top_5: [
            'Partner with industry influencers for content',
            'Launch ambassador program with customers',
            'Create viral TikTok series showing before/after',
            'Host monthly webinars with thought leaders',
            'Build community Slack group for users',
          ],
          categories: {
            content: 30,
            partnerships: 25,
            community: 20,
            product: 15,
            other: 10,
          },
          implementation_tips: ['Start with easiest wins', 'Measure each initiative', 'Iterate based on data'],
        },
      }

    case 'proyectar_revenue':
      return {
        output_type: 'json',
        output_data: {
          current_mrr: inputData.current_mrr || 42500,
          growth_rate: inputData.growth_rate || 10,
          months: inputData.months || 12,
          projections: [
            { month: 1, conservative: 42500, realistic: 42500, optimistic: 42500 },
            { month: 6, conservative: 65500, realistic: 74200, optimistic: 82000 },
            { month: 12, conservative: 98000, realistic: 125000, optimistic: 165000 },
          ],
          scenarios: {
            conservative: '10% monthly growth',
            realistic: '12% monthly growth with partnerships',
            optimistic: '15% monthly growth with viral feature',
          },
          recommendation: 'Plan for realistic scenario; use conservative for budgeting',
        },
      }

    // Community
    case 'responder_ticket':
      return {
        output_type: 'json',
        output_data: {
          response: `Hi [Customer Name],

Thank you for reaching out. I understand [brief restatement of issue].

Here's how we can help:
1. [Solution step 1]
2. [Solution step 2]
3. [Escalation if needed]

I've included [relevant resource] that should help. Feel free to reply if you need further assistance.

Best regards,
Support Team`,
          tone: 'professional and empathetic',
          includes_resources: true,
          suggested_category: 'Technical Support',
        },
      }

    case 'crear_faq':
      return {
        output_type: 'document',
        output_data: {
          topic: inputData.topic || 'General',
          faqs: [
            { question: 'How do I get started?', answer: 'Sign up for free, connect your data, and run your first automation in 5 minutes.' },
            { question: 'Is there a free trial?', answer: 'Yes, 14-day free trial with full feature access. No credit card required.' },
            { question: 'Can I customize workflows?', answer: 'Yes, our visual builder lets you create custom workflows without code.' },
            { question: 'Is my data secure?', answer: 'We use enterprise-grade encryption and comply with SOC 2 Type II standards.' },
            { question: 'What integrations do you support?', answer: 'We support 500+ integrations including Salesforce, HubSpot, Slack, and more.' },
          ],
          file_id: 'mock-faq-document',
        },
      }

    case 'crear_tutorial':
      return {
        output_type: 'json',
        output_data: {
          title: `How to Use ${inputData.feature || 'Our Platform'}`,
          skill_level: inputData.skill_level || 'beginner',
          steps: [
            { step: 1, title: 'Sign up', description: 'Create your account and verify email', time: '2 min' },
            { step: 2, title: 'Connect data', description: 'Link your CRM or database', time: '5 min' },
            { step: 3, title: 'Create workflow', description: 'Use visual builder to automate', time: '10 min' },
            { step: 4, title: 'Run and monitor', description: 'Execute automation and track results', time: 'Ongoing' },
          ],
          video_script: 'High-level overview of process with screen recordings',
          estimated_time: '20 minutes',
          difficulty: 'Beginner-friendly',
        },
      }

    default:
      return {
        output_type: 'json',
        output_data: {
          message: `Test output for ${actionType}`,
          generated_at: new Date().toISOString(),
          example: 'This is a mock response for testing',
        },
      }
  }
}
