import { clsx } from 'clsx'

/**
 * El nombre de una marca, a prueba de traductores.
 *
 * Un nombre comercial no se traduce nunca (regla de Carlos, 10-sep-2026), pero
 * el traductor del navegador no lo sabe: cuando Chrome ofrece «Traducir esta
 * página» trata el nombre como vocabulario y lo destroza — «Dadybox» apareció
 * como «caja de papá» en el selector de marca. En un portal de marca blanca eso
 * es de lo peor que puede pasar: el cliente ve SU nombre alterado.
 *
 * `translate="no"` es el atributo estándar y `notranslate` es la clase que mira
 * Google Translate; se ponen los dos porque cada navegador respeta uno.
 * Úsalo en cualquier sitio donde se pinte el nombre de un cliente.
 */
export default function BrandName({
  children,
  className,
  style,
}: {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <span translate="no" className={clsx('notranslate', className)} style={style}>
      {children}
    </span>
  )
}

/**
 * Frase de i18n con `{name}` dentro, protegiendo el nombre. Sustituye al
 * `.replace('{name}', activeClient.name)` de siempre, que devolvía un string
 * plano donde el traductor del navegador ya no distingue la marca del resto.
 *
 *   {withBrandName(t('calendar.subtitle', locale), activeClient?.name)}
 */
export function withBrandName(template: string, name: string | null | undefined): React.ReactNode {
  if (!name) return template.replace(/\{name\}/g, '')
  return template.split('{name}').flatMap((part, i) =>
    i === 0 ? [part] : [<BrandName key={i}>{name}</BrandName>, part]
  )
}
