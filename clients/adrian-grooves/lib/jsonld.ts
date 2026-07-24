import { site } from './site'

export function courseJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: 'De cero a vídeos que parecen profesionales',
    description: site.description,
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
      url: `${site.url}${site.checkoutUrl}`,
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
