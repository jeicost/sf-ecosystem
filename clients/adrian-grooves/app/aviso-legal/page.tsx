import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo'
import { site } from '@/lib/site'
import { Dato, LegalPage } from '@/components/legal/LegalPage'

export const metadata: Metadata = buildMetadata({ title: 'Aviso legal', path: '/aviso-legal', noindex: true })

export default function AvisoLegal() {
  const l = site.legal
  return (
    <LegalPage titulo="Aviso legal" actualizado="21 de septiembre de 2026">
      <p>
        En cumplimiento del artículo 10 de la Ley 34/2002, de Servicios de la Sociedad de la Información y de Comercio
        Electrónico (LSSI-CE), estos son los datos del titular de esta web:
      </p>
      <ul>
        <li>Titular: <Dato v={l.titular} que="razón social" />, sociedad de responsabilidad limitada (LLC) constituida en el Estado de Wyoming, EE. UU.</li>
        <li>Registro: <Dato v={l.registro} que="registro y número" /></li>
        <li>Domicilio: <Dato v={l.domicilio} que="domicilio" /></li>
        <li>Correo de contacto: <Dato v={l.email} que="correo de contacto" /></li>
      </ul>

      <h2>Objeto</h2>
      <p>
        Esta web presenta y comercializa el curso online «De cero a vídeos que parecen profesionales», creado e impartido
        por el filmmaker {site.name}. La compra y el acceso al curso se realizan a través de la plataforma Hotmart, que
        actúa como intermediaria del pago y aloja el contenido, con sus propias condiciones.
      </p>

      <h2>Propiedad intelectual</h2>
      <p>
        Los textos, diseño, marca y materiales del curso pertenecen a su titular o se usan con permiso. Los videoclips
        enlazados pertenecen a sus respectivos artistas y productoras y se muestran como muestra del trabajo realizado.
      </p>

      <h2>Responsabilidad</h2>
      <p>
        El titular no se hace responsable del uso que terceros hagan de la información publicada ni de los contenidos
        de las webs externas enlazadas.
      </p>

      <h2>Ley aplicable</h2>
      <p>
        Si utilizas esta web o compras el curso como consumidor residente en la Unión Europea, conservas en todo caso la
        protección que te dan las normas de consumo y de protección de datos de tu país de residencia.
      </p>
    </LegalPage>
  )
}
