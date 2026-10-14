import type { Expedicion, DireccionPartes } from './direcline'

// «Copiar para DL-Trans»: el mismo mapeo del parte que va al web service,
// pero en texto plano y en el orden de la pantalla de alta de DL-Trans, para
// que la persona lo pegue sin reescribir el correo. Nació el 13-oct-2026
// cuando GTD dudó de pagar la cuota del web service: con esto el ahorro de
// tiempo existe desde el primer día y MIRA cuenta cada copia (mira_activity,
// ruta email-ops/tms/copy) para decidir con datos. Sin dependencias de Node:
// lo importan también componentes de cliente.

/** Campos que son códigos del programa (los pone la persona en DL-Trans), no datos del parte. */
const CAMPOS_DE_CODIGO = new Set(['tipoServicio', 'codigoCliente', 'departamentoCliente', 'contenido', 'mensajeroRecogida', 'mensajeroEntrega'])

const ETIQUETAS = {
  es: { remitente: 'REMITENTE', recogida: 'RECOGIDA', destinatario: 'DESTINATARIO', entrega: 'ENTREGA', direccion: 'Dirección', cp: 'CP y población', masDatos: 'Más datos', telefono: 'Teléfono', email: 'Email', observacion: 'Observación', fecha: 'Fecha', horario: 'Horario', servicio: 'Servicio', bultos: 'Bultos', peso: 'Peso', contenido: 'Contenido', observaciones: 'OBSERVACIONES', referencia: 'REFERENCIA', retorno: 'Con retorno', sinDato: 'Sin dato en el correo' },
  en: { remitente: 'SENDER', recogida: 'PICKUP', destinatario: 'RECIPIENT', entrega: 'DELIVERY', direccion: 'Address', cp: 'Postcode and town', masDatos: 'More details', telefono: 'Phone', email: 'Email', observacion: 'Note', fecha: 'Date', horario: 'Time window', servicio: 'Service', bultos: 'Parcels', peso: 'Weight', contenido: 'Contents', observaciones: 'NOTES', referencia: 'REFERENCE', retorno: 'With return', sinDato: 'Not in the email' },
} as const

function direccionEnUnaLinea(d: DireccionPartes): string {
  const via = [d.tipo, d.direccion, d.numero].filter(Boolean).join(' ')
  return d.piso ? `${via}, ${d.piso}` : via
}

function fechaLegible(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso
}

const hora = (h: string) => h.slice(0, 5)

export function textoParaDlTrans(e: Expedicion, faltan: Array<{ campo: string; etiqueta: string }>, locale: 'es' | 'en' = 'es'): string {
  const L = ETIQUETAS[locale]
  const linea = (etiqueta: string, valor: string | number | null | undefined) => (valor === '' || valor === null || valor === undefined ? null : `  ${etiqueta}: ${valor}`)
  const bloqueDireccion = (titulo: string, d: Expedicion['recogida']) => [
    titulo,
    linea(L.direccion, direccionEnUnaLinea(d)),
    linea(L.cp, [d.cp, d.poblacion].filter(Boolean).join(' ')),
    linea(L.masDatos, d.resto),
    linea(L.telefono, d.telefono),
    linea(L.email, d.email),
    linea(L.observacion, d.observacion),
  ]
  const peso = e.pesoKg ? `${locale === 'es' ? String(e.pesoKg).replace('.', ',') : e.pesoKg} kg` : ''
  const bultos = [e.bultos ? `${L.bultos}: ${e.bultos}` : '', peso ? `${L.peso}: ${peso}` : '', e.contenido ? `${L.contenido}: ${e.contenido}` : ''].filter(Boolean).join(' · ')
  const horario = e.horaInicial || e.horaFinal ? `${hora(e.horaInicial)} - ${hora(e.horaFinal)}` : ''
  const sinDato = faltan.filter((f) => !CAMPOS_DE_CODIGO.has(f.campo)).map((f) => f.etiqueta)
  const lineas = [
    `${L.remitente}: ${e.remitente}`,
    ...bloqueDireccion(L.recogida, e.recogida),
    linea(L.fecha, fechaLegible(e.fecha)),
    linea(L.horario, horario),
    `${L.destinatario}: ${e.destinatario}`,
    ...bloqueDireccion(L.entrega, e.entrega),
    e.tipoServicio ? `${L.servicio}: ${e.tipoServicio}` : null,
    bultos || null,
    e.retorno ? L.retorno : null,
    e.observaciones ? `${L.observaciones}: ${e.observaciones}` : null,
    e.referenciaEntrega || e.recogidaReferencia ? `${L.referencia}: ${e.referenciaEntrega || e.recogidaReferencia}` : null,
    sinDato.length ? `--- ${L.sinDato}: ${sinDato.join(', ')}` : null,
  ]
  return lineas.filter((l): l is string => typeof l === 'string' && l.length > 0).join('\n')
}
