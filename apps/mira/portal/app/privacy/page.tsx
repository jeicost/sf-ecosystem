import type { Metadata } from 'next'
import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'
import MiraLogo from '@/components/mira-logo'

export const metadata: Metadata = {
  title: 'Privacy Policy — MIRA',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-page">
      <header className="border-b border-line-subtle">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/login" className="flex items-center gap-2">
            <MiraLogo size={22} variant="icon" />
            <span className="text-sm font-bold text-ink">MIRA</span>
          </Link>
          <nav className="flex items-center gap-4 text-xs text-ink-tertiary">
            <Link href="/terms" className="hover:text-ink">Terms</Link>
            <Link href="/privacy" className="text-ink">Privacy</Link>
            <Link href="/cookies" className="hover:text-ink">Cookies</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        <div className="mb-8 flex items-start gap-3 rounded-xl border px-4 py-3"
          style={{ background: 'rgba(245,158,11,0.1)', borderColor: 'rgba(245,158,11,0.3)' }}>
          <AlertTriangle size={16} className="mt-0.5 shrink-0" style={{ color: '#fbbf24' }} />
          <p className="text-xs font-medium leading-relaxed" style={{ color: '#fbbf24' }}>
            Legal template — review with a lawyer before publishing. It does not replace professional legal advice.
          </p>
        </div>

        <h1 className="text-2xl font-semibold text-ink tracking-tight mb-1">Privacy Policy</h1>
        <p className="text-xs text-ink-tertiary mb-8">Last updated: July 23, 2026</p>

        <div className="space-y-7 text-sm text-ink-secondary leading-relaxed">
          <section>
            <h2 className="text-base font-semibold text-ink mb-2">1. Data controller</h2>
            <p>
              The controller of your personal data is Startup Factory, operator of MIRA. For any
              privacy-related questions, contact [contacto@startupsfactory.es].
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-ink mb-2">2. What data we collect</h2>
            <p>We collect three types of data:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1.5">
              <li>
                <span className="text-ink">Account data</span> — name, email and password (stored in
                encrypted form), subscribed plan and role within your organization.
              </li>
              <li>
                <span className="text-ink">Brand and business content</span> — documents, briefs, information
                about your company and any material you upload or connect to your Brand Brain for the AI
                agents to use as context.
              </li>
              <li>
                <span className="text-ink">Usage data</span> — pages visited, actions within the product and
                aggregated analytics, to understand how MIRA is used and improve it.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-ink mb-2">3. How we use your data</h2>
            <p>We use this data to:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1.5">
              <li>Provide the Service, including the generation of results by the AI agents.</li>
              <li>Provide support and respond to your inquiries.</li>
              <li>Improve the product and detect and fix errors.</li>
              <li>Send you communications related to your account or the Service.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-ink mb-2">4. Who we share data with</h2>
            <p>
              We do not sell your data. We share it only with providers necessary to operate MIRA, acting as
              data processors: database hosting and authentication (Supabase), application hosting (Vercel),
              AI model providers to generate the agents&apos; results (e.g. Anthropic, OpenAI) and analytics
              tools (Google Analytics / Google Tag Manager).
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-ink mb-2">5. Data retention</h2>
            <p>
              We keep your data while your account is active. If you cancel your account, we will retain the
              data for as long as reasonably necessary to comply with legal obligations or resolve disputes,
              and will delete or anonymize it afterwards.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-ink mb-2">6. Your rights</h2>
            <p>
              You can request access to, rectification of or deletion of your personal data at any time by
              writing to [contacto@startupsfactory.es]. As the product is in beta, these requests are handled
              manually and we will respond within a reasonable timeframe.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-ink mb-2">7. Security</h2>
            <p>
              We apply reasonable technical measures (encryption in transit, access control, authentication)
              to protect your data. No system is 100% infallible; if we detect a relevant security incident,
              we will inform you.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-ink mb-2">8. Cookies</h2>
            <p>
              MIRA uses essential session cookies and, on the informational website, analytics cookies. More
              detail in our <Link href="/cookies" className="underline hover:text-ink">Cookie Policy</Link>.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-ink mb-2">9. Minors</h2>
            <p>
              MIRA is not directed at anyone under 18 years of age and we do not knowingly collect data from
              minors.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-ink mb-2">10. Changes to this policy</h2>
            <p>
              We may update this Privacy Policy to reflect changes in the product or in applicable
              regulations. We will publish the date of the latest update on this same page.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-ink mb-2">11. Contact</h2>
            <p>
              For any privacy questions, write to us at [contacto@startupsfactory.es].
            </p>
          </section>
        </div>
      </main>
    </div>
  )
}
