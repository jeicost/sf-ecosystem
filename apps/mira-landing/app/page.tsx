import type { Metadata } from 'next'
import { defaultHomeContent } from '@/lib/content/home'
import { pageContent } from '@/lib/cms-pages'
import { buildHomeMetadata } from '@/lib/seo'
import HomeView from './home-view'

/**
 * Home en castellano — el idioma por defecto del sitio, en la raíz.
 * El inglés vive en /en y monta el mismo componente con el otro contenido.
 *
 * Esta página no tiene texto: resuelve el copy (fallback de lib/content/home.ts
 * pisado por la página `home` de SF-CMS) y se lo pasa a HomeView. Añadir una
 * frase aquí sería sacarla del CMS y del inglés a la vez.
 */
const content = pageContent('home', defaultHomeContent)

export const metadata: Metadata = buildHomeMetadata({
  title: content.meta_title,
  description: content.meta_description,
  locale: 'es',
})

export default function Page() {
  return <HomeView content={content} locale="es" />
}
