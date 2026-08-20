import type { Metadata } from 'next'
import { Eyebrow } from '@/lib/constants'
import { AboutStory, ABOUT_STORY_DEFAULTS, AboutManifesto, ABOUT_MANIFESTO_DEFAULTS, AboutNumbers, ABOUT_NUMBERS_DEFAULTS, AboutValues, ABOUT_VALUES_DEFAULTS, AboutApproach, ABOUT_APPROACH_DEFAULTS } from '@/components/sections/AboutSections'
import { Team } from '@/components/sections/Team'
import { Testimonials } from '@/components/sections/Testimonials'
import { CtaBanner } from '@/components/CtaBanner'
import { loadCmsSections, mergeCms } from '@/lib/cms-pages'
import { TEAM_DEFAULTS, TESTIMONIALS_DEFAULTS } from '@/lib/section-defaults'

export const metadata: Metadata = {
  title: 'About — NC Global Assets',
  description: 'Local operating partner for international brands in Thailand. 15+ years Bangkok experience, hands-on execution and market expertise.',
  alternates: { canonical: '/about' },
  openGraph: {
    type: 'website',
    url: 'https://www.ncglobalassets.com/about',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630 }],
  },
}

const HERO_DEFAULTS = {
  eyebrow: 'About NC Global Assets',
  headline_top: 'A local operating partner',
  headline_gold: 'international brands',
  body: 'We combine deep local knowledge, hands-on execution and long-term commercial alignment to help international brands enter, operate and grow in Thailand.',
  creds: [
    { val: 'BKK', label: 'Operating base' },
    { val: '15+', label: 'Years exp.' },
    { val: '6+', label: 'Years digital mktg' },
    { val: 'SEA', label: 'Reach' },
  ],
}

export default function AboutPage() {
  const cms = loadCmsSections('about')
  const hero = mergeCms(HERO_DEFAULTS, cms['hero']?.data)
  const story = mergeCms(ABOUT_STORY_DEFAULTS, cms['story']?.data)
  const manifesto = mergeCms(ABOUT_MANIFESTO_DEFAULTS, cms['manifesto']?.data)
  const numbers = mergeCms(ABOUT_NUMBERS_DEFAULTS, cms['numbers']?.data)
  const values = mergeCms(ABOUT_VALUES_DEFAULTS, cms['values']?.data)
  const approach = mergeCms(ABOUT_APPROACH_DEFAULTS, cms['approach']?.data)
  const team = mergeCms(TEAM_DEFAULTS, cms['team']?.data)
  const testimonials = mergeCms(TESTIMONIALS_DEFAULTS, cms['testimonials']?.data)

  const creds = hero.creds

  return (
    <>
      <section className="about-hero">
        <div className="about-hero__bg" style={{ backgroundImage: 'url(/assets/freepik_elegant-bangkok-skyline-a_2861587914.webp)' }} />
        <div className="container">
          <div className="about-hero__inner--full">
            <Eyebrow style={{ color: 'var(--accent)' }}>{hero.eyebrow}</Eyebrow>
            <h1 className="about-hero__headline">
              {hero.headline_top}<br/>built for <span className="gold italic">{hero.headline_gold}</span>
            </h1>
            <p className="about-hero__body">{hero.body}</p>
            <div className="about-hero__creds">
              {creds.map((c, i) => (
                <div className="about-hero__cred" key={i}>
                  <span className="about-hero__cred-val">{c.val}</span>
                  <span className="about-hero__cred-label">{c.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="about-hero__sep" />
      </section>

      <AboutStory data={story} />
      <AboutManifesto data={manifesto} />
      <AboutNumbers data={numbers} />
      <AboutValues data={values} />
      <AboutApproach data={approach} />
      <Team data={team} />
      <Testimonials data={testimonials} />
      <CtaBanner text="Ready to explore working together?" cta="Book a Call" />
    </>
  )
}
