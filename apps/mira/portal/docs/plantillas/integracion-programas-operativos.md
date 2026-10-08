# Plantilla de correo — integración de Email Ops con los programas operativos (TMS, ERP…)

Correo estándar que Carlos (o la empresa de Aldea que corresponda) envía a cada proveedor de
software donde se graban los encargos, para saber qué hace falta para volcar desde Email Ops los
datos de cada encargo sin teclearlos. Pedido por Carlos el 8-oct-2026: «un correo sencillo y fácil
de activar para resolver esta parte lo antes posible». Regla: enseñarlo y esperar el OK antes de
enviar nada ([memoria](../../../../../.claude/projects/-Users-carlosjacoste/memory/feedback_correo_siempre_preguntar_y_mostrar_antes_de_enviar.md)).

Variables: `{{programa}}` nombre del programa · `{{empresa}}` marca de Aldea que lo usa (GTD
Mensajeros, Albasanz Express, GLS Ciudad Lineal) · `{{contacto}}` nombre del destinatario.

Los campos listados son los del esquema `courier_gls_v1` de Email Ops (`lib/email-ops/schema.ts`):
si el esquema cambia, actualizar la lista.

---

**Asunto:** Integración con {{programa}}: alta automática de encargos desde nuestro sistema

Hola, {{contacto}}:

Te escribo desde {{empresa}} (grupo Aldea). Estamos automatizando la entrada de encargos que nos
llegan por correo: un sistema los lee, extrae los datos y los deja listos para grabar. El siguiente
paso es que esos encargos entren directamente en {{programa}}, sin volver a teclearlos, y para eso
necesitamos saber qué nos ofrecéis. Son cuatro preguntas:

1. **Vía de entrada.** ¿Qué camino hay para crear un encargo desde fuera de {{programa}}? Por
   ejemplo: API (REST o SOAP), importación de fichero (CSV o Excel por SFTP o carpeta vigilada),
   correo con formato fijo o EDI. Si hay documentación, mándanosla.
2. **Datos y códigos.** ¿Qué campos son obligatorios para dar de alta un encargo y en qué formato?
   Nos vendría bien la tabla de códigos que usáis (tipos de servicio, tipos de vehículo, clientes o
   cuentas, zonas o tarifas). Abajo te paso lo que nosotros ya capturamos de cada encargo.
3. **Acceso.** ¿Cómo se habilita? Usuario técnico o clave de API, entorno de pruebas si existe,
   quién tiene que autorizarlo por vuestra parte y si tiene algún coste.
4. **Estado de vuelta.** ¿Hay forma de consultar desde fuera el estado o el seguimiento del encargo
   una vez grabado (aviso automático, consulta o exportación)?

Datos que capturamos hoy de cada encargo: fecha del servicio; tipo de entrega; tipo de vehículo;
franja de recogida (desde / hasta); franja de entrega (desde / hasta); número de bultos; peso;
medidas; dirección de recogida; dirección de entrega; remitente; destinatario; servicio; portes
(pagados o debidos); observaciones. Además guardamos el correo original y sus adjuntos.

Si os resulta más fácil, lo vemos en una llamada de 20 minutos con nuestro responsable técnico,
Carlos Jacoste (Startup Factory, carlos@startupsfactory.es, en copia). Dinos qué día os encaja.

Gracias,

{{firma}}
