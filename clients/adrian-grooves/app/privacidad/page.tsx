import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo'
import { site } from '@/lib/site'
import { Dato, LegalPage } from '@/components/legal/LegalPage'

export const metadata: Metadata = buildMetadata({ title: 'Política de privacidad', path: '/privacidad', noindex: true })

/**
 * Describe lo que la web hace DE VERDAD con los datos (ver app/api/lista y
 * components/PixelConsent). Si cambia el tratamiento —otra herramienta de
 * email, otro píxel— esta página se actualiza a la vez; una política que no
 * cuadra con el código es peor que ninguna.
 */
export default function Privacidad() {
  const l = site.legal
  return (
    <LegalPage titulo="Política de privacidad" actualizado="21 de septiembre de 2026">
      <h2>Quién es el responsable</h2>
      <ul>
        <li>Responsable: <Dato v={l.titular} que="razón social" />, sociedad constituida en Wyoming (EE. UU.)</li>
        <li>Registro: <Dato v={l.registro} que="registro y número" /></li>
        <li>Domicilio: <Dato v={l.domicilio} que="domicilio" /></li>
        <li>Contacto: <Dato v={l.email} que="correo de contacto" /></li>
      </ul>

      <p>
        Aunque el responsable está establecido en Estados Unidos, esta web se dirige a personas en la Unión Europea, así
        que el tratamiento se rige por el Reglamento General de Protección de Datos (RGPD) y te da todos los derechos que
        se describen abajo.
      </p>

      <h2>Qué datos se recogen</h2>
      <ul>
        <li>Tu correo electrónico, cuando te apuntas al aviso de apertura o a las novedades del curso.</li>
        <li>
          Si llegas desde un anuncio o un enlace de campaña: los parámetros de esa campaña (origen, medio, nombre) y la
          web desde la que llegas. Sirven para saber qué anuncios funcionan.
        </li>
        <li>
          Solo si aceptas las cookies de medición: los datos que recoge el píxel de Meta sobre tu visita (páginas vistas
          y si te apuntas o inicias una compra).
        </li>
      </ul>

      <h2>Para qué y con qué base legal</h2>
      <p>
        Para avisarte de la apertura del curso y enviarte novedades sobre él, y para medir qué campañas funcionan. La base
        legal es tu consentimiento (art. 6.1.a del RGPD), que das al apuntarte o al aceptar las cookies, y que puedes
        retirar en cualquier momento sin que afecte a lo tratado antes.
      </p>

      <h2>Cuánto tiempo se guardan</h2>
      <p>Hasta que te des de baja o retires tu consentimiento.</p>

      <h2>Quién más los trata</h2>
      <p>
        Proveedores que prestan el servicio técnico por cuenta del responsable: el alojamiento de la web, la base de datos
        donde se guarda la lista, el servicio de envío de correo y, si aceptas las cookies, Meta. Como el responsable está
        en Estados Unidos, tus datos se tratan fuera del Espacio Económico Europeo; tanto el responsable como esos
        proveedores lo hacen con las garantías que exige el RGPD (cláusulas contractuales tipo o el Marco de Privacidad de
        Datos UE-EE. UU.). No se ceden datos a nadie más.
      </p>
      <p>
        Las compras del curso se hacen en Hotmart, que trata los datos de pago y de acceso al curso como responsable
        propio, con su política de privacidad.
      </p>

      <h2>Tus derechos</h2>
      <p>
        Puedes pedir acceso, rectificación, supresión, oposición, limitación del tratamiento y portabilidad de tus datos
        escribiendo a <Dato v={l.email} que="correo de contacto" />. Si crees que no se han atendido bien, puedes
        reclamar ante la Agencia Española de Protección de Datos (<a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer">aepd.es</a>).
      </p>

      <h2>Cookies</h2>
      <p>
        La web no pone cookies de seguimiento por defecto. Las de medición y publicidad (píxel de Meta) solo se activan si
        las aceptas en el aviso que aparece al entrar. Puedes cambiar de opinión borrando los datos de este sitio en tu
        navegador; el aviso volverá a aparecer.
      </p>
    </LegalPage>
  )
}
