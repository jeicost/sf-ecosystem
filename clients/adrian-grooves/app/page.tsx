import { loadCmsSections, section } from '@/lib/cms-pages'
import { site } from '@/lib/site'
import { courseJsonLd, faqJsonLd } from '@/lib/jsonld'
import { Nav } from '@/components/Nav'
import { Footer } from '@/components/Footer'
import { ScrollReveal } from '@/components/ScrollReveal'
import { StickyCta } from '@/components/StickyCta'
import { PagePixels, loadPagePixels } from '@/components/PagePixels'
import { Hero } from '@/components/sections/Hero'
import { Problema } from '@/components/sections/Problema'
import { GranIdea } from '@/components/sections/GranIdea'
import { Autor } from '@/components/sections/Autor'
import { Transformacion } from '@/components/sections/Transformacion'
import { Programa } from '@/components/sections/Programa'
import { Comunidad } from '@/components/sections/Comunidad'
import { Bonus } from '@/components/sections/Bonus'
import { ParaQuien } from '@/components/sections/ParaQuien'
import { Testimonios } from '@/components/sections/Testimonios'
import { Oferta } from '@/components/sections/Oferta'
import { Garantia } from '@/components/sections/Garantia'
import { Faq } from '@/components/sections/Faq'
import { CtaFinal } from '@/components/sections/CtaFinal'

const DEFAULT_FAQS = [
  { q: '¿Me sirve si solo tengo el móvil?', a: 'Sí. Todo está pensado para aplicarse con lo que ya tienes, empezando por el móvil.' },
  { q: '¿Necesito comprar equipo?', a: 'No. Uno de los objetivos es que dejes de pensar que la solución es comprar.' },
  { q: '¿Y si no me convence?', a: 'Tienes 14 días de garantía. Si no es para ti, te devuelvo el dinero íntegro.' },
]

export default function Home() {
  const cms = loadCmsSections('home')
  const cta = (section(cms, 'hero')['cta_url'] as string) || site.checkoutUrl
  const pixels = loadPagePixels('home')

  return (
    <>
      <PagePixels pixels={pixels} />
      <ScrollReveal />
      <Nav ctaUrl={cta} />
      <main>
        <Hero data={section(cms, 'hero')} ctaUrl={cta} />
        <Problema data={section(cms, 'problema')} />
        <GranIdea data={section(cms, 'gran-idea')} />
        <Autor data={section(cms, 'autor')} />
        <Transformacion data={section(cms, 'transformacion')} />
        <Programa data={section(cms, 'programa')} />
        <Comunidad data={section(cms, 'comunidad')} />
        <Bonus data={section(cms, 'bonus')} />
        <ParaQuien data={section(cms, 'para-quien')} />
        <Testimonios data={section(cms, 'testimonios')} />
        <Oferta data={section(cms, 'oferta')} ctaUrl={cta} />
        <Garantia data={section(cms, 'garantia')} />
        <Faq data={section(cms, 'faq')} />
        <CtaFinal data={section(cms, 'cta-final')} ctaUrl={cta} />
      </main>
      <Footer />
      <StickyCta ctaUrl={cta} price={site.price} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(courseJsonLd()) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(DEFAULT_FAQS)) }} />
    </>
  )
}
