import type { Metadata } from 'next'
import { defaultHomeContent as defaultHomeContentEn } from '@/lib/content/en/home'
import { pageContent } from '@/lib/cms-pages'
import { buildHomeMetadata } from '@/lib/seo'
import HomeView from '../home-view'

/**
 * Home en inglés. Mismo componente, otro contenido y otra página en el CMS
 * (slug `home-en`). Todo lo que se cambie aquí hay que cambiarlo en / también.
 */
const content = pageContent('home-en', defaultHomeContentEn)

export const metadata: Metadata = buildHomeMetadata({
  title: content.meta_title,
  description: content.meta_description,
  locale: 'en',
})

export default function Page() {
  return (
    <>
      {/*
        El <html lang> lo fija el layout raíz, que es común a las dos versiones y
        declara "es". Un export estático no puede variar el layout por ruta, así
        que /en lo corrige en cuanto carga: sin esto, un lector de pantalla leería
        la página inglesa con la pronunciación castellana.
      */}
      <script dangerouslySetInnerHTML={{ __html: "document.documentElement.lang='en'" }} />
      <HomeView content={content} locale="en" />
    </>
  )
}
