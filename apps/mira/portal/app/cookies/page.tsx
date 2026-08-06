import type { Metadata } from 'next'
import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'
import MiraLogo from '@/components/mira-logo'

export const metadata: Metadata = {
  title: 'Cookie Policy — MIRA',
}

export default function CookiesPage() {
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
            <Link href="/privacy" className="hover:text-ink">Privacy</Link>
            <Link href="/cookies" className="text-ink">Cookies</Link>
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

        <h1 className="text-2xl font-semibold text-ink tracking-tight mb-1">Cookie Policy</h1>
        <p className="text-xs text-ink-tertiary mb-8">Last updated: July 23, 2026</p>

        <div className="space-y-7 text-sm text-ink-secondary leading-relaxed">
          <section>
            <h2 className="text-base font-semibold text-ink mb-2">1. What cookies are</h2>
            <p>
              Cookies are small files stored in your browser when you visit a website. We also use equivalent
              local storage mechanisms (localStorage) to remember preferences such as language or visual
              theme.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-ink mb-2">2. Cookies we use</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <span className="text-ink">Essential / session</span> — necessary to keep you signed in and for
                authentication (managed by Supabase) to work correctly. They cannot be disabled without losing
                the ability to use MIRA.
              </li>
              <li>
                <span className="text-ink">Preferences</span> — remember settings such as the theme
                (light/dark) or the language, stored locally in your browser.
              </li>
              <li>
                <span className="text-ink">Analytics</span> — on our informational website we use Google Tag
                Manager and Google Analytics to understand how the site is used in an aggregated and anonymous
                way.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-ink mb-2">3. Third-party cookies</h2>
            <p>
              Some analytics cookies come from third-party services (Google). These companies may process the
              information according to their own privacy policies.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-ink mb-2">4. How to manage cookies</h2>
            <p>
              You can delete or block cookies from your browser settings. Please note that blocking essential
              cookies will prevent you from signing in and using MIRA normally.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-ink mb-2">5. Changes to this policy</h2>
            <p>
              We may update this Cookie Policy to reflect changes in the tools we use. We will publish the date
              of the latest update on this same page.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-ink mb-2">6. Contact</h2>
            <p>
              For any questions about cookies, write to us at [contacto@startupsfactory.es].
            </p>
          </section>
        </div>
      </main>
    </div>
  )
}
