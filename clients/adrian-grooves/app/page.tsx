import { draftMode } from 'next/headers'
import type { Metadata } from 'next'
import { cmsState, cmsVal, ctaSeguro, loadCmsSections, loadCmsSectionsLive, section } from '@/lib/cms-pages'
import { faqItems } from '@/lib/faq'
import { buildMetadata } from '@/lib/seo'
import { site } from '@/lib/site'
import { courseJsonLd, faqJsonLd, ventaAbierta } from '@/lib/jsonld'
import { Nav } from '@/components/Nav'
import { Footer } from '@/components/Footer'
import { ScrollReveal } from '@/components/ScrollReveal'
import { StickyCta } from '@/components/StickyCta'
import { CtaTracker } from '@/components/CtaTracker'
import { DraftBanner } from '@/components/DraftBanner'
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
import { Trabajo } from '@/components/sections/Trabajo'
import { Entrega } from '@/components/sections/Entrega'
import { Lista } from '@/components/sections/Lista'
import { Oferta } from '@/components/sections/Oferta'
import { Garantia } from '@/components/sections/Garantia'
import { Faq } from '@/components/sections/Faq'
import { CtaFinal } from '@/components/sections/CtaFinal'


/**
 * Título y descripción desde el CMS (sección `seo`). Antes solo se leían de
 * `lib/site.ts`: editar el SEO en el admin no cambiaba nada en la página, y
 * nadie se enteraba porque el campo se guardaba sin error.
 */
export async function generateMetadata(): Promise<Metadata> {
  const seo = section(loadCmsSections('home'), 'seo')
  const title = typeof seo['seo_title'] === 'string' && seo['seo_title'].trim() ? seo['seo_title'].trim() : undefined
  const description =
    typeof seo['seo_description'] === 'string' && seo['seo_description'].trim() ? seo['seo_description'].trim() : undefined
  return buildMetadata({ rawTitle: title, description })
}

export default async function Home() {
  // Draft Mode (EDUX-N4 preview): when active, prefer a live request-time
  // fetch from sf-cms (may include unpublished drafts) over the build-time
  // bake. Any failure falls back to the static content — preview must never
  // blank the page or break normal (non-draft) rendering.
  const { isEnabled: isDraft } = await draftMode()
  const cms = isDraft
    ? (await loadCmsSectionsLive('home')) ?? loadCmsSections('home')
    : loadCmsSections('home')
  // El interruptor del lanzamiento: ancla = venta cerrada, URL = venta abierta.
  const cta = ctaSeguro(section(cms, 'hero')['cta_url'], site.checkoutUrl)
  const abierta = ventaAbierta(cta)
  const faqs = faqItems(section(cms, 'faq'), abierta)
  // Los componentes de cliente reciben los textos YA resueltos para el estado
  // actual: lo que se les pasa acaba serializado en el HTML.
  const lista = section(cms, 'lista')
  const listaTextos = Object.fromEntries(
    (['eyebrow', 'headline', 'intro', 'cta', 'success', 'label', 'placeholder', 'error_invalido', 'error_fallo', 'consent', 'bonus_note'] as const)
      .map((k) => [k, cmsState(lista, k, abierta)])
      .filter(([, v]) => v !== undefined),
  )
  const stickyLabel = cmsState(section(cms, 'hero'), 'sticky_cta', abierta) ?? 'Quiero mis vídeos a otro nivel'
  const pixels = loadPagePixels('home')

  return (
    <>
      {isDraft && <DraftBanner />}
      <PagePixels pixels={pixels} />
      <ScrollReveal />
      <CtaTracker />
      <Nav ctaUrl={cta} />
      <main>
        <Hero data={section(cms, 'hero')} abierta={abierta} ctaUrl={cta} />
        <Problema data={section(cms, 'problema')} />
        <GranIdea data={section(cms, 'gran-idea')} />
        <Autor data={section(cms, 'autor')} />
        <Transformacion data={section(cms, 'transformacion')} />
        <Programa data={section(cms, 'programa')} abierta={abierta} />
        <Entrega data={section(cms, 'entrega')} />
        <Comunidad data={section(cms, 'comunidad')} />
        <Bonus data={section(cms, 'bonus')} />
        <ParaQuien data={section(cms, 'para-quien')} />
        <Trabajo data={section(cms, 'trabajo')} abierta={abierta} />
        {/* Sin testimonios reales no renderiza nada — ya no hay fallback inventado. */}
        <Testimonios data={section(cms, 'testimonios')} />
        <Oferta data={section(cms, 'oferta')} abierta={abierta} ctaUrl={cta} />
        <Lista textos={listaTextos} abierta={abierta} />
        <Garantia data={section(cms, 'garantia')} abierta={abierta} />
        <Faq eyebrow={cmsVal(section(cms, 'faq'), 'eyebrow')} headline={cmsVal(section(cms, 'faq'), 'headline')} items={faqs} />
        <CtaFinal data={section(cms, 'cta-final')} abierta={abierta} ctaUrl={cta} />
      </main>
      <Footer />
      <StickyCta ctaUrl={cta} price={site.price} label={stickyLabel} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(courseJsonLd(cta)) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(faqs)) }} />
    </>
  )
}
