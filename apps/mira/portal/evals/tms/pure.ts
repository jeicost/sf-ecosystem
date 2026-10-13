/**
 * Pruebas puras del volcado a Direcline: direcciones, mapeo del parte, XML,
 * parseo de respuestas y errores.
 *   npx tsx evals/tms/pure.ts
 */
import { partirDireccion, expedicionDesdeParte, faltanParaGrabar, construirXmlExpedicion, extraerResultado, errorDe, parseGuid, parseGrabacion, parseEstado, namespaceDeWsdl, normalizarConfig, tipoServicioPara, hashXml } from '../../lib/tms/direcline'

let failures = 0
function check(name: string, cond: boolean, detail?: unknown) {
  if (cond) console.log(`✅ ${name}`)
  else { failures++; console.log(`❌ ${name}`, detail !== undefined ? JSON.stringify(detail) : '') }
}

// ── direcciones ──────────────────────────────────────────────────────────
const d1 = partirDireccion('Museoteca, c/ José Echegaray 12, Nave 2-3, PAE Casa Blanca, 28100 Alcobendas (Madrid)')
check('dirección con empresa, nave y CP+población', d1.tipo === 'c/' && d1.direccion === 'José Echegaray' && d1.numero === '12' && d1.cp === '28100' && d1.poblacion === 'Alcobendas' && d1.piso === 'Nave 2-3' && /Museoteca/.test(d1.resto) && /PAE Casa Blanca/.test(d1.resto), d1)
const d2 = partirDireccion('Bravo Murillo, 38 3ºB, 28015 Madrid')
check('número con coma y piso pegado', d2.direccion === 'Bravo Murillo' && d2.numero === '38' && d2.piso === '3ºB' && d2.cp === '28015' && d2.poblacion === 'Madrid', d2)
const d3 = partirDireccion('Avda. de América 45, Madrid 28002')
check('avenida y población antes del CP', d3.tipo === 'Avd.' && d3.direccion === 'de América' && d3.numero === '45' && d3.cp === '28002' && d3.poblacion === 'Madrid', d3)
const d4 = partirDireccion('Hospital Ramón y Cajal, Ctra. de Colmenar Viejo km 9,100, 28034 Madrid')
check('carretera con km: no se rompe', d4.cp === '28034' && d4.poblacion === 'Madrid' && d4.tipo === 'Ctra.' && /Hospital/.test(d4.resto), d4)
const d5 = partirDireccion('')
check('vacía → todo vacío', d5.direccion === '' && d5.cp === '')
const d6 = partirDireccion('Plaza Mayor 1, 28012 Madrid')
check('plaza', d6.tipo === 'Pl.' && d6.direccion === 'Mayor' && d6.numero === '1', d6)

// ── mapeo ────────────────────────────────────────────────────────────────
const config = normalizarConfig({ codigo_cliente: '0121', tipo_servicio: { local: 'LOC', nacional: 'NAC', 'moto': 'MOTO' }, contenido_bulto: 'PAQ', metodo: 'solicitud' })
check('normalizarConfig: defaults y claves en minúsculas', config.pais === 'ESPAÑA' && config.forzar_pendiente_validar && config.tipo_servicio.local === 'LOC' && config.hora_inicio_defecto === '09:00')
const ticket = {
  id: '9e15e1e0-8892-4127-aee5-c35b6900a50f', original_sender: 'Sergio Aguilar <saguilar@museothyssen.org>', from_address: 'saguilar@museothyssen.org',
  fields: { fecha: '2026-10-08', tipo_entrega: 'local', tipo_vehiculo: 'moto', recogida_hora_inicio: '08:30', recogida_hora_fin: '18:30', bultos: 2, peso_kg: 1.4, medidas: '30x20x10', recogida_direccion: 'Museoteca, c/ José Echegaray 12, Nave 2-3, 28100 Alcobendas (Madrid)', entrega_direccion: 'Calle Elda 5, 03600 Elda (Alicante)', remitente: 'Museo Thyssen', destinatario: 'Juan Pérez', observaciones: 'Frágil', portes: 'pagados' },
}
const e = expedicionDesdeParte(ticket, config)
check('tipo de servicio: el vehículo manda sobre el tipo de entrega', tipoServicioPara(ticket.fields, config) === 'MOTO' && e.tipoServicio === 'MOTO')
check('horas a HH:MM:SS y fecha', e.horaInicial === '08:30:00' && e.horaFinal === '18:30:00' && e.fecha === '2026-10-08')
check('bultos, peso, observaciones compuestas', e.bultos === 2 && e.pesoKg === 1.4 && e.observaciones.includes('Frágil') && e.observaciones.includes('Medidas: 30x20x10') && e.observaciones.includes('Portes pagados'))
check('email de recogida del remitente original', e.recogida.email === 'saguilar@museothyssen.org')
check('nada falta con la config completa', faltanParaGrabar(e).length === 0, faltanParaGrabar(e))
const sinCodigo = expedicionDesdeParte({ ...ticket, fields: { ...ticket.fields, tipo_vehiculo: 'camión', tipo_entrega: 'internacional', entrega_direccion: '' } }, config)
const faltan = faltanParaGrabar(sinCodigo).map((f) => f.campo)
check('faltan: tipo de servicio sin mapeo y dirección de entrega', faltan.includes('tipoServicio') && faltan.includes('entrega.direccion') && faltan.includes('entrega.cp'), faltan)
const conOverride = expedicionDesdeParte(ticket, config, { tipoServicio: 'URG', entrega: { ...e.entrega, telefono: '600000000' } })
check('overrides se aplican sin perder el resto', conOverride.tipoServicio === 'URG' && conOverride.entrega.telefono === '600000000' && conOverride.entrega.cp === '03600')

// ── XML ──────────────────────────────────────────────────────────────────
const xml = construirXmlExpedicion(e, 'solicitud', 'GUID123')
check('XML solicitud: cabecera, GUID y nodos clave', xml.startsWith('<?xml version="1.0" encoding="iso-8859-1"?><RAIZ><GUID>GUID123</GUID>') && xml.includes('<codigoCliente>0121</codigoCliente>') && xml.includes('<recogidaCodigoTipoServicio>MOTO</recogidaCodigoTipoServicio>') && xml.includes('<bultoTotal>2</bultoTotal>') && xml.includes('<forzarPendienteValidar>true</forzarPendienteValidar>'))
check('XML: un solo bulto con el peso total y contenido', (xml.match(/<bulto>/g) || []).length === 1 && xml.includes('<peso>1.4</peso>') && xml.includes('<codigoContenido>PAQ</codigoContenido>'))
check('XML: sin nodos duplicados de recogidaReferencia', (xml.match(/<recogidaReferencia>/g) || []).length === 1)
check('XML: escapado de & y <', construirXmlExpedicion({ ...e, remitente: 'A & B <SL>' }, 'solicitud').includes('<remitente>A &amp; B &lt;SL&gt;</remitente>'))
const xmlExp = construirXmlExpedicion(e, 'expedicion', 'G')
check('XML expedición: nodo <expedicion> y referenciaVia', xmlExp.includes('<expedicion>') && xmlExp.includes('<referenciaVia></referenciaVia>') && xmlExp.includes('<entregaCodigoTipoServicio>MOTO</entregaCodigoTipoServicio>'))
check('hashXml ignora el GUID', hashXml(construirXmlExpedicion(e, 'solicitud', 'A')) === hashXml(construirXmlExpedicion(e, 'solicitud', 'B')))

// ── respuestas ───────────────────────────────────────────────────────────
const soapOk = `<?xml version="1.0"?><soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body><ValidarUsuarioResponse xmlns="http://tempuri.org/"><ValidarUsuarioResult>&lt;?xml version="1.0" encoding="iso-8859-1"?&gt;&lt;ValidarUsuarioOficina&gt;&lt;GUID&gt;abc==&lt;/GUID&gt;&lt;/ValidarUsuarioOficina&gt;</ValidarUsuarioResult></ValidarUsuarioResponse></soap:Body></soap:Envelope>`
check('extraerResultado + parseGuid', parseGuid(extraerResultado(soapOk, 'ValidarUsuario')) === 'abc==')
const soapErr = `<soap:Envelope xmlns:soap="x"><soap:Body><GuardarExpedicionResponse><GuardarExpedicionResult>&lt;GuardarExpedicion&gt;&lt;ERROR&gt;&lt;CODIGO&gt;900&lt;/CODIGO&gt;&lt;MENSAJE&gt;No se encuentra la población 'Elda' para el país 'ESPAÑA'&lt;/MENSAJE&gt;&lt;/ERROR&gt;&lt;/GuardarExpedicion&gt;</GuardarExpedicionResult></GuardarExpedicionResponse></soap:Body></soap:Envelope>`
const err = errorDe(extraerResultado(soapErr, 'GuardarExpedicion'))
check('errorDe: código y mensaje del programa', err?.codigo === '900' && /Elda/.test(err?.mensaje || ''), err)
const fault = extraerResultado('<soap:Envelope><soap:Body><soap:Fault><faultstring>Server was unable to process request.</faultstring></soap:Fault></soap:Body></soap:Envelope>', 'GuardarExpedicion')
check('fault SOAP → error FAULT', errorDe(fault)?.codigo === 'FAULT')
const grab = parseGrabacion(`<?xml version="1.0"?><GuardarExpedicion><ORDENSERVICIO><ID>100121026</ID><ORDENPEDIDO>01121026</ORDENPEDIDO><OFICINAORIGEN>1</OFICINAORIGEN></ORDENSERVICIO><EXPEDICION><NUMERO>100121026000001</NUMERO><REFERENCIAENTREGA>011210260001</REFERENCIAENTREGA><VIA>2 DHL</VIA></EXPEDICION></GuardarExpedicion>`)
check('parseGrabacion: orden, expedición y vía', grab.ordenServicio === '100121026' && grab.ordenPedido === '01121026' && grab.expedicion === '100121026000001' && grab.referenciaEntrega === '011210260001' && grab.via === '2 DHL')
const est = parseEstado(`<ObtenerExpedicionPorNumero><EXPEDICION><NUMERO>1</NUMERO><ESTADO>En reparto</ESTADO><FECHA>13/10/2026</FECHA><HORA>10:02</HORA><FIRMA></FIRMA><DNI></DNI><CODIGOMENSAJERO>0010</CODIGOMENSAJERO><TEXTOINCIDENCIA></TEXTOINCIDENCIA></EXPEDICION></ObtenerExpedicionPorNumero>`)
check('parseEstado', est.estado === 'En reparto' && est.mensajero === '0010' && est.hora === '10:02')
check('namespaceDeWsdl', namespaceDeWsdl('<wsdl:definitions targetNamespace="http://direcline.com/ws" />') === 'http://direcline.com/ws' && namespaceDeWsdl('') === 'http://tempuri.org/')

console.log(failures ? `\n❌ ${failures} fallos` : '\n✅ todo en verde')
process.exit(failures ? 1 : 0)
