import type { Metadata } from 'next'
import Link from 'next/link'
import { buildMetadata } from '@/lib/seo'
import { site } from '@/lib/site'
import { Nav } from '@/components/Nav'
import { Footer } from '@/components/Footer'

export const metadata: Metadata = buildMetadata({
  title: 'Checklist antes de cada rodaje',
  path: '/recursos/checklist',
  // No indexable: es el recurso que se entrega al dejar el correo, no una
  // página de captación por sí misma.
  noindex: true,
})

/**
 * El gancho de captación, entregado AL INSTANTE.
 *
 * El plan de acción pedía un lead magnet antes del 5-oct y la herramienta de
 * email todavía no existe. En vez de prometer un correo que hoy nadie puede
 * enviar, el formulario guarda el correo y enseña este enlace en el acto: la
 * promesa se cumple sola. Cuando haya herramienta de email, además se manda.
 *
 * Es uno de los siete bonus del curso («Mi checklist antes de cada rodaje»),
 * así que enseña de verdad lo que el curso vende y no es un PDF de relleno.
 *
 * ⚠️ Escrito a partir del temario y de la voz de marca del Brand Brain, NO
 * dictado por Adrian: antes de mandarle tráfico (6-oct según el plan) tiene que
 * leerlo y corregir lo que no haría él.
 */

type Bloque = { titulo: string; cuando: string; items: string[] }

const BLOQUES: Bloque[] = [
  {
    titulo: 'El día antes',
    cuando: 'En casa, con tiempo',
    items: [
      'Baterías cargadas —todas— y tarjetas formateadas EN LA CÁMARA, no en el ordenador.',
      'Espacio libre comprobado: los minutos que vas a grabar, por tres.',
      'Decide el look: resolución, fotogramas por segundo y obturación (el doble de los fps). Si vas a querer cámara lenta, decídelo ahora, no en el set.',
      'Mira la previsión del tiempo y la hora a la que se pone el sol si grabas con luz natural. La luz buena dura menos de lo que crees.',
      'Escribe los planos que necesitas sí o sí para contar la historia. Si no caben en una cara de folio, sobran.',
    ],
  },
  {
    titulo: 'Al llegar',
    cuando: 'Antes de sacar la cámara',
    items: [
      'Mira dónde está la luz antes de decidir dónde pones a la persona. Primero la luz, después el encuadre.',
      'Escucha. Nevera, aire acondicionado, obra en la calle: lo que oyes ahora se va a oír en el vídeo.',
      'Busca el fondo más limpio que tengas a mano. Un fondo con menos cosas hace más por el plano que cualquier objetivo caro.',
      'Ajusta el balance de blancos a mano y déjalo fijo. En automático cambia a mitad de toma y se nota.',
      'Pon el ISO lo más bajo que te permita la luz. El ruido de tus vídeos casi siempre viene de aquí, no de la cámara.',
    ],
  },
  {
    titulo: 'Antes de cada toma',
    cuando: 'Diez segundos, siempre los mismos',
    items: [
      'Enfoque comprobado en los ojos, y comprobado otra vez si la persona se mueve.',
      'Exposición: mira que no se te queme la piel ni las ventanas. Lo quemado no se recupera después.',
      '¿Se está grabando el audio? Niveles que se muevan, ni pegados abajo ni tocando el rojo.',
      'Cuenta tres segundos en silencio antes de la acción y tres después. Te vas a acordar de esto al montar.',
      'Pregúntate para qué se mueve la cámara. Si no hay respuesta, no la muevas.',
    ],
  },
  {
    titulo: 'Antes de recoger',
    cuando: 'Cuando crees que has terminado',
    items: [
      'Repasa la lista de planos imprescindibles. Volver cuesta mucho más que quedarse cinco minutos.',
      'Graba treinta segundos de ambiente del sitio, en silencio. Salva montajes enteros.',
      'Un par de planos de recurso: detalles, manos, objetos. Son el pegamento del montaje.',
      'Revisa una toma entera en pantalla, con sonido. No el principio: una entera.',
      'Copia las tarjetas antes de dormir, a dos sitios distintos.',
    ],
  },
]

const OLVIDOS = [
  'El balance de blancos en automático.',
  'Grabar a 60 fps «por si acaso» y perder la cadencia de cine.',
  'Confiar en el micro de la cámara estando a tres metros.',
  'Mover la cámara sin motivo.',
  'Grabar con el sol de frente al mediodía porque «hay mucha luz».',
]

export default function Checklist() {
  return (
    <>
      <Nav ctaUrl={`/${site.checkoutUrl}`} />
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-32 sm:px-8">
        <span className="timecode">Recurso gratuito · {site.name}</span>
        <h1 className="display mt-6 text-3xl sm:text-5xl">Mi checklist antes de cada rodaje</h1>
        <p className="mt-6 text-lg leading-relaxed text-muted">
          Esto es lo que repaso yo antes de darle a grabar, en rodajes de verdad. No es teoría: es el orden en el que
          miro las cosas para no volver a casa con material que no se puede arreglar. Imprímela, o guárdala en el móvil.
        </p>

        <div className="mt-12 space-y-10">
          {BLOQUES.map((b, i) => (
            <section key={b.titulo}>
              <div className="flex items-baseline gap-3 border-b border-line pb-3">
                <span className="font-mono text-2xl font-semibold text-accent">{String(i + 1).padStart(2, '0')}</span>
                <h2 className="text-xl font-semibold text-text" style={{ fontFamily: 'var(--font-display)' }}>
                  {b.titulo}
                </h2>
                <span className="ml-auto font-mono text-[0.66rem] uppercase tracking-[0.14em] text-muted">{b.cuando}</span>
              </div>
              <ul className="mt-5 space-y-3">
                {b.items.map((item) => (
                  <li key={item} className="flex gap-3 text-[0.98rem] leading-relaxed text-muted">
                    <span aria-hidden className="mt-2 h-2 w-2 shrink-0 border border-accent/70" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <section className="mt-14 rounded-sm border border-accent/40 bg-surface-2 p-6 sm:p-8">
          <h2 className="font-mono text-sm uppercase tracking-[0.14em] text-accent">Los cinco que veo siempre</h2>
          <ul className="mt-4 space-y-2">
            {OLVIDOS.map((o) => (
              <li key={o} className="text-[0.96rem] leading-relaxed text-text">
                — {o}
              </li>
            ))}
          </ul>
        </section>

        <p className="mt-12 text-[0.98rem] leading-relaxed text-muted">
          Si quieres el porqué de cada punto —y no solo la lista—, eso es exactamente lo que enseño en el curso.{' '}
          <Link href="/#lista" className="text-accent underline underline-offset-4">
            Aquí te cuento cuándo abre
          </Link>
          .
        </p>
      </main>
      <Footer />
    </>
  )
}
