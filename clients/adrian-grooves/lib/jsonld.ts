import { site } from './site'

/**
 * ¿Está abierta la venta? Se deduce del ÚNICO interruptor que ya existe:
 * `hero.cta_url` del CMS. Mientras sea un ancla (`#lista`) el curso todavía no
 * se puede comprar; cuando pase a ser la URL absoluta del checkout de Hotmart,
 * sí. Así el 15-oct se cambia un campo en el CMS y los datos estructurados se
 * enteran solos — sin un segundo interruptor en el código que alguien olvidaría
 * mover, que es exactamente como se acaba declarando `InStock` un producto que
 * no se puede comprar.
 */
export function ventaAbierta(ctaUrl: string): boolean {
  return /^https?:\/\//i.test(ctaUrl)
}

export function courseJsonLd(ctaUrl: string = site.checkoutUrl) {
  const abierta = ventaAbierta(ctaUrl)
  return {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: 'De cero a vídeos que parecen profesionales',
    description: site.description,
    inLanguage: site.lang,
    provider: {
      '@type': 'Person',
      name: site.name,
      url: site.url,
    },
    offers: {
      '@type': 'Offer',
      price: site.price,
      priceCurrency: 'EUR',
      category: 'Paid',
      // PreOrder mientras no haya checkout: declarar InStock un curso que aún no
      // se puede comprar es una promesa falsa en los datos estructurados, y
      // Google la penaliza cuando el usuario llega y no puede pagar.
      availability: abierta ? 'https://schema.org/InStock' : 'https://schema.org/PreOrder',
      url: abierta ? ctaUrl : `${site.url}/#lista`,
    },
    // El curso se entrega por goteo: se declara tal cual en vez de fingir que
    // está completo desde el primer día.
    hasCourseInstance: {
      '@type': 'CourseInstance',
      courseMode: 'online',
      courseWorkload: 'P9W',
    },
  }
}

export function faqJsonLd(faqs: { q: string; a: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  }
}

export function personJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: site.name,
    jobTitle: 'Filmmaker',
    url: site.url,
    description:
      'Filmmaker especializado en videoclips y producción audiovisual. Ha trabajado en rodajes para artistas como Natos y Waor, YSY A y C.R.O.',
  }
}
