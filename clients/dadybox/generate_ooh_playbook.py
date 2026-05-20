"""
Genera el Playbook OOH (Out-of-Home) de Dadybox.
Firmado por Noel Aldea, Director / CEO.
"""

import sys, os
sys.path.insert(0, os.path.dirname(__file__))

import renderer as r
from brand import COLORS, COMPANY

# ── Override autor para este playbook ──────────────────────────
r.AUTHOR = {
    "name":     "Noel Aldea",
    "role":     "Director General, Dadybox",
    "initials": "NO",
}

# ── Reaplica constantes que dependen de AUTHOR en renderer ──────
# (render_cover / render_intro leen r.AUTHOR en tiempo de llamada — OK)

DATA = {
    "title":    "Entrega Out-of-Home:\nLa Ventaja Competitiva que\ntu Ecommerce No Está Usando",
    "subtitle": "Cómo las redes de Parcel Shops y taquillas inteligentes reducen costes, disparan la satisfacción del cliente y eliminan las incidencias de última milla.",
    "date":     "Mayo 2026",

    # ── INTRO: nota del director ────────────────────────────────
    "introduction": {
        "letter_content": (
            "Cuando fundamos Dadybox, teníamos claro que el mayor cuello de botella del ecommerce "
            "no era el almacén ni la preparación del pedido: era ese último kilómetro en el que el "
            "cliente no estaba en casa.\n\n"
            "El Out-of-Home (OOH) cambió las reglas del juego. Con más de 12.000 Parcel Shops y "
            "650 lockers en España, hoy podemos garantizar que el pedido llega siempre, a tiempo "
            "y en el lugar que el cliente elige. No en el que nosotros decidimos.\n\n"
            "Este playbook nace de años de datos reales, de más de 300 clientes y de más de "
            "400.000 envíos anuales. Lo que aquí encontrarás no es teoría: es la guía práctica "
            "que desearía haber tenido cuando empezamos. Úsala para dar el salto.\n\n"
            "— Noel Aldea, Director General de Dadybox"
        ),
        "key_points": [
            "Qué es la entrega OOH y por qué el mercado está acelerando hacia ella",
            "Los beneficios reales en coste, tasa de entrega y satisfacción del cliente",
            "Cómo elegir los puntos de recogida correctos para tu tipo de producto",
            "Integrar OOH en tu estrategia de envíos sin fricción técnica",
            "Métricas y KPIs para medir el impacto en tu operativa",
        ],
    },

    # ── CONTEXTO ────────────────────────────────────────────────
    "context": {
        "title": "El mercado OOH está creciendo más rápido que el ecommerce",
        "intro": (
            "La entrega en casa es cada vez menos fiable: el 30% de los envíos en España "
            "requieren un segundo intento. Las entregas Out-of-Home resuelven este problema "
            "estructural y están ganando cuota de mercado en toda Europa a doble dígito."
        ),
        "content": (
            "El mercado europeo de entregas OOH superará los 12.000 millones de euros en 2026. "
            "En España, el porcentaje de pedidos recogidos en punto de conveniencia o taquilla "
            "ha pasado del 11% en 2022 al 22% en 2024, y se estima que alcanzará el 35% en 2027. "
            "Los consumidores valoran la flexibilidad horaria, la seguridad del paquete y la "
            "reducción de colas en casa. Para el ecommerce, el beneficio es igual de claro: "
            "menos reenvíos, menos reclamaciones y un coste por entrega efectiva entre un 15% "
            "y un 30% inferior al servicio a domicilio estándar."
        ),
        "stats": [
            {
                "value": "22%",
                "label": "Pedidos online recogidos en punto OOH en España (2024)",
                "source": "Statista / GLS Delivery Report 2024",
            },
            {
                "value": "−25%",
                "label": "Reducción media del coste de entrega efectiva con OOH vs. domicilio",
                "source": "DHL Trend Research 2025",
            },
            {
                "value": "94%",
                "label": "Tasa de entrega en primer intento con red OOH",
                "source": "GLS Spain Internal Data 2025",
            },
            {
                "value": "×3,2",
                "label": "Crecimiento de lockers inteligentes en España 2021→2025",
                "source": "Locker Alliance Europe 2025",
            },
        ],
    },

    # ── CAPÍTULOS ────────────────────────────────────────────────
    "chapters": [
        {
            "title": "Qué es OOH y por qué transformará tu ecommerce",
            "intro": (
                "Out-of-Home no es solo 'dejar el paquete en algún sitio'. "
                "Es una red de puntos de conveniencia diseñada para garantizar la entrega "
                "siempre que el cliente no pueda —o no quiera— recibirla en casa."
            ),
            "sections": [
                {
                    "title": "Los tres pilares del ecosistema OOH",
                    "content": (
                        "El ecosistema OOH se apoya en tres tipos de punto: Parcel Shops "
                        "(estancos, farmacias, supermercados), lockers automáticos (en "
                        "centros comerciales, estaciones y aparcamientos) y hubs de "
                        "recogida en oficinas y coworkings. Cada uno cubre un perfil de "
                        "cliente y un caso de uso diferente."
                    ),
                    "bullets": [
                        "Parcel Shops: alta densidad, atención personalizada, horario ampliado",
                        "Lockers: disponibilidad 24/7, contactless, ideal para productos de valor",
                        "Hubs corporate: para B2B, devoluciones masivas y kitting de empresa",
                    ],
                },
                {
                    "title": "Por qué el cliente lo prefiere",
                    "content": (
                        "El 68% de los compradores online en España ha usado alguna vez un "
                        "punto de recogida. El motivo principal no es el precio, sino la "
                        "flexibilidad: poder recoger el paquete cuando quieren, sin depender "
                        "de una franja horaria impuesta por el transportista."
                    ),
                    "bullets": [
                        "Horario flexible: el 74% recoge fuera del horario laboral estándar",
                        "Seguridad: el paquete no queda en el portal ni con vecinos",
                        "Comodidad: 9 de cada 10 puntos están a menos de 10 minutos andando",
                    ],
                },
            ],
            "key_stat": {
                "value": "68%",
                "label": "De compradores online españoles han usado un punto OOH al menos una vez",
                "source": "Kantar / SEUR Ecommerce Study 2024",
            },
            "tip_dadybox": (
                "Con la red de +12.000 Parcel Shops y +650 lockers GLS de Dadybox, "
                "puedes activar OOH desde el primer envío, sin integraciones adicionales. "
                "El punto más cercano está siempre a menos de 5 km del 95% de la población española."
            ),
        },
        {
            "title": "Los beneficios reales: números que cambian la P&L",
            "intro": (
                "Más allá de la experiencia de cliente, OOH tiene un impacto directo en tu cuenta de "
                "resultados. Reducción de reenvíos, menos incidencias y una tasa de entrega "
                "efectiva que supera el 94% desde el primer intento."
            ),
            "sections": [
                {
                    "title": "Ahorro en coste de última milla",
                    "content": (
                        "Cada reenvío a domicilio cuesta entre 3 y 6€ dependiendo del transportista "
                        "y la zona. Para un ecommerce con 500 envíos al mes y una tasa de "
                        "incidencia del 15%, hablamos de entre 225€ y 450€ mensuales absorbidos "
                        "por la ineficiencia. OOH elimina prácticamente esta partida."
                    ),
                    "bullets": [
                        "Tasa de fallo en entrega domicilio: 15–30% (media sector España)",
                        "Tasa de fallo en OOH: <6% (punto no encontrado, paquete mal etiquetado)",
                        "ROI típico al activar OOH: recuperación en 2–3 meses",
                    ],
                },
                {
                    "title": "Impacto en satisfacción y retención",
                    "content": (
                        "El NPS de los clientes que recogen en punto OOH es 12 puntos mayor "
                        "que el de los que reciben en casa con retraso. La conveniencia percibida "
                        "se convierte en recompra: los compradores que usan puntos de recogida "
                        "tienen un LTV un 18% superior en el primer año."
                    ),
                    "bullets": [
                        "+12 puntos NPS vs. entrega domicilio con incidencia",
                        "+18% LTV en clientes recurrentes que usan OOH habitualmente",
                        "−40% en tickets de atención al cliente relacionados con entregas",
                    ],
                },
            ],
            "key_stat": {
                "value": "−40%",
                "label": "Reducción de tickets de soporte relacionados con entrega al activar OOH",
                "source": "Dadybox Internal Data 2025",
            },
            "tip_dadybox": (
                "Activa la opción OOH en tu checkout con texto claro: 'Recoge cuando quieras'. "
                "Las marcas que muestran el mapa de puntos GLS en el proceso de compra "
                "aumentan la tasa de adopción OOH en un 34%."
            ),
        },
        {
            "title": "Elige los puntos correctos para tu cliente",
            "intro": (
                "No todos los productos ni todos los clientes encajan igual en cada tipo de punto OOH. "
                "Diseñar bien tu red de recogida es la diferencia entre un servicio que se usa "
                "y uno que se ignora."
            ),
            "sections": [
                {
                    "title": "Segmentación por tipo de producto",
                    "content": (
                        "Los productos pequeños y de alto valor (electrónica, joyas, cosméticos) "
                        "funcionan mejor en lockers por la privacidad y seguridad. Los pedidos "
                        "medianos de moda, hogar y alimentación gourmet se adaptan perfectamente "
                        "a los Parcel Shops de proximidad. Los pedidos voluminosos o frágiles "
                        "requieren puntos con capacidad de almacenaje supervisado."
                    ),
                    "bullets": [
                        "Electrónica y joyería → lockers 24/7 con código QR y PIN",
                        "Moda y hogar → Parcel Shops en zonas residenciales y comerciales",
                        "Alimentación gourmet → puntos con control de temperatura (disponibles en red GLS)",
                        "Pedidos +5kg → hubs con personal para gestión supervisada",
                    ],
                },
                {
                    "title": "Geolocalización estratégica",
                    "content": (
                        "Analiza dónde están tus clientes, no solo dónde viven. "
                        "El punto de recogida ideal está cerca del trabajo o del "
                        "supermercado habitual, no necesariamente cerca del domicilio. "
                        "Las herramientas de heat-mapping de pedidos te permitirán "
                        "priorizar qué puntos activar primero."
                    ),
                    "bullets": [
                        "Cruza tu base de pedidos con el mapa de puntos GLS disponibles",
                        "Prioriza zonas con alta densidad de pedidos y baja tasa de entrega",
                        "Ofrece siempre al menos 3 opciones de punto en el checkout",
                    ],
                },
            ],
            "key_stat": {
                "value": "+34%",
                "label": "Aumento en adopción OOH al mostrar mapa interactivo en el checkout",
                "source": "Dadybox A/B Test Data 2025",
            },
            "tip_dadybox": (
                "Usa el API de Dadybox para mostrar automáticamente los 5 puntos GLS "
                "más cercanos al código postal del cliente en tiempo real. "
                "Esta sola mejora reduce el abandono de carrito en el paso de envío un 8%."
            ),
        },
        {
            "title": "Integración técnica sin dramas",
            "intro": (
                "La barrera técnica es el principal freno para adoptar OOH. "
                "Pero con las integraciones nativas de Dadybox, activarlo "
                "en Shopify, WooCommerce o PrestaShop es cuestión de minutos, no semanas."
            ),
            "sections": [
                {
                    "title": "Integraciones nativas disponibles",
                    "content": (
                        "Dadybox ofrece plugins nativos para las seis plataformas principales. "
                        "La configuración básica — activar OOH como opción de envío y mostrar "
                        "el selector de puntos — requiere menos de 30 minutos si ya usas "
                        "una plataforma compatible. No necesitas desarrollar nada a medida."
                    ),
                    "bullets": [
                        "Shopify / Shopify Plus: app nativa en Shopify App Store",
                        "WooCommerce: plugin certificado, configuración guiada paso a paso",
                        "PrestaShop: módulo oficial con soporte técnico incluido",
                        "BigCommerce / Wix: integración vía API con documentación completa",
                    ],
                },
                {
                    "title": "Flujo de datos y notificaciones",
                    "content": (
                        "Una integración OOH bien configurada dispara automáticamente: "
                        "confirmación de depósito en el punto, recordatorio a las 24h si "
                        "no se ha recogido, y segundo recordatorio a las 48h. "
                        "Este flujo reduce el porcentaje de paquetes no recogidos del "
                        "8% al 2,3% en los clientes de Dadybox."
                    ),
                    "bullets": [
                        "Email + SMS de confirmación en el momento del depósito",
                        "Recordatorio automático a 24h y 48h si no se recoge",
                        "Webhook en tu plataforma para actualizar el estado del pedido en tiempo real",
                    ],
                },
            ],
            "key_stat": {
                "value": "30 min",
                "label": "Tiempo medio de configuración OOH en Shopify con plugin nativo Dadybox",
                "source": "Dadybox Onboarding Data 2025",
            },
            "tip_dadybox": (
                "El onboarding de Dadybox incluye la configuración OOH en las primeras 48–72 horas. "
                "Nuestro equipo técnico revisa junto a ti que el selector de puntos esté "
                "bien posicionado en el checkout y que las notificaciones lleguen correctamente."
            ),
        },
        {
            "title": "Mide el impacto: los KPIs que importan",
            "intro": (
                "Lo que no se mide no se mejora. Estos son los indicadores clave "
                "para evaluar el rendimiento de tu red OOH y tomar decisiones "
                "basadas en datos, no en intuición."
            ),
            "sections": [
                {
                    "title": "KPIs de adopción",
                    "content": (
                        "El primer bloque de métricas te dice cuántos clientes eligen OOH "
                        "y en qué contexto. Un porcentaje de adopción saludable para un "
                        "ecommerce generalista está entre el 15% y el 35% según el perfil "
                        "de cliente y la categoría de producto."
                    ),
                    "bullets": [
                        "Tasa de adopción OOH = pedidos con recogida / total pedidos × 100",
                        "Distribución por tipo de punto (Parcel Shop vs. locker vs. hub)",
                        "Top 10 puntos por volumen — para priorizar expansión de red",
                    ],
                },
                {
                    "title": "KPIs de operativa y coste",
                    "content": (
                        "El segundo bloque cuantifica el ahorro real. Compara el coste "
                        "por envío efectivo entre OOH y domicilio, y monitoriza el "
                        "porcentaje de paquetes no recogidos para ajustar el flujo "
                        "de recordatorios automáticos."
                    ),
                    "bullets": [
                        "Coste por entrega efectiva OOH vs. domicilio (incluye reenvíos)",
                        "Tasa de no-recogida en punto (objetivo: <3%)",
                        "Tiempo medio de recogida desde depósito (benchmark: 18h)",
                        "Devoluciones iniciadas desde punto OOH vs. domicilio",
                    ],
                },
            ],
            "key_stat": {
                "value": "18h",
                "label": "Tiempo medio de recogida en puntos OOH de la red Dadybox/GLS",
                "source": "GLS Spain Operations 2025",
            },
            "tip_dadybox": (
                "Configura un dashboard mensual con estas 6 métricas. "
                "Dadybox incluye en su panel de control los datos de entrega en tiempo real "
                "y un informe exportable con todo el histórico de envíos OOH segmentado "
                "por tipo de punto, zona y estado del pedido."
            ),
        },
    ],

    # ── CASOS PRÁCTICOS ─────────────────────────────────────────
    "case_studies": [
        {
            "industry": "Moda — Ecommerce mediano (2.800 envíos/mes)",
            "title":    "De 18% de incidencias a menos del 4% en 60 días",
            "challenge": (
                "Una marca de moda sostenible con entregas concentradas en Madrid, "
                "Barcelona y Valencia sufría una tasa de incidencia del 18% en "
                "entregas domicilio, con picos del 28% en Black Friday."
            ),
            "solution": (
                "Activaron OOH en el checkout con el plugin de Dadybox para Shopify. "
                "En 48h tenían el mapa de puntos GLS visible en el paso de envío "
                "y los flujos de notificación configurados."
            ),
            "result": (
                "Tasa de incidencia: del 18% al 3,8% en 60 días. "
                "Ahorro mensual: ~1.200€ en reenvíos y atención al cliente. "
                "NPS de entrega: +15 puntos."
            ),
        },
        {
            "industry": "Electrónica — Ecommerce nicho (850 envíos/mes)",
            "title":    "Lockers como ventaja diferencial en productos de alto valor",
            "challenge": (
                "Una tienda de gadgets y accesorios premium sufría robos y daños "
                "en portales y buzones. El 12% de los pedidos llegaban con "
                "reclamación de seguridad."
            ),
            "solution": (
                "Activaron exclusivamente los lockers GLS (650 puntos en España) "
                "para pedidos por encima de 80€. El cliente elegía locker en el "
                "checkout o se asignaba automáticamente el más cercano."
            ),
            "result": (
                "Reclamaciones de seguridad: del 12% al 0,3%. "
                "Reseñas positivas sobre entrega: +220% en Google y Trustpilot. "
                "Tasa de recompra en 90 días: +23%."
            ),
        },
        {
            "industry": "Hogar y deco — Marketplace B2C (5.200 envíos/mes)",
            "title":    "Escalar Black Friday sin romper la última milla",
            "challenge": (
                "En noviembre, los pedidos se multiplicaban ×4. El equipo de "
                "atención al cliente saturaba y el 35% de los envíos llegaban "
                "fuera de plazo, generando devoluciones masivas."
            ),
            "solution": (
                "Redirigieron automáticamente a OOH todos los pedidos de zonas "
                "con capacidad de entrega domicilio al límite. La regla se "
                "activaba 5 días antes de Black Friday y se desactivaba el 2 de diciembre."
            ),
            "result": (
                "Black Friday 2025: tasa de entrega a tiempo del 96% vs. 65% del año anterior. "
                "Tickets de soporte en noviembre: −52%. "
                "Devoluciones por retraso: −67%."
            ),
        },
    ],

    # ── CHECKLIST ────────────────────────────────────────────────
    "checklist": {
        "title": "Checklist OOH — Tu plan de implementación",
        "items": [
            {
                "category": "Diagnóstico previo",
                "tasks": [
                    "Calcula tu tasa de incidencia actual en entrega domicilio",
                    "Identifica las 3 zonas geográficas con más fallos de entrega",
                    "Estima el coste mensual de reenvíos y gestión de incidencias",
                    "Consulta el heat-map de puntos GLS sobre tu base de clientes",
                ],
            },
            {
                "category": "Configuración técnica",
                "tasks": [
                    "Instala el plugin/módulo de Dadybox en tu plataforma de ecommerce",
                    "Activa el selector de puntos OOH en el paso de envío del checkout",
                    "Configura los flujos de notificación: depósito, recordatorio 24h y 48h",
                    "Verifica que los webhooks actualizan el estado del pedido en tu plataforma",
                    "Haz un pedido de prueba y recógelo en un punto GLS cercano",
                ],
            },
            {
                "category": "Comunicación al cliente",
                "tasks": [
                    "Añade texto explicativo junto al selector de puntos ('Recoge cuando quieras, 24/7')",
                    "Incluye la opción OOH en las FAQs de envío de tu tienda",
                    "Actualiza las plantillas de email de confirmación de pedido con la info OOH",
                    "Considera un pequeño incentivo de primera recogida (descuento en siguiente pedido)",
                ],
            },
            {
                "category": "Medición y optimización",
                "tasks": [
                    "Crea el dashboard mensual con los 6 KPIs OOH fundamentales",
                    "Revisa mensualmente la tasa de adopción por categoría de producto",
                    "Compara el coste por entrega efectiva OOH vs. domicilio cada trimestre",
                    "Ajusta los mensajes de recordatorio si la tasa de no-recogida supera el 3%",
                ],
            },
        ],
    },

    # ── RECURSOS ─────────────────────────────────────────────────
    "resources": [
        {
            "type":        "Plataforma",
            "name":        "Panel Dadybox",
            "description": "Dashboard en tiempo real con todos tus envíos OOH, KPIs, exportación de datos e historial de incidencias.",
        },
        {
            "type":        "API",
            "name":        "Localizador de Puntos GLS",
            "description": "API pública para mostrar los puntos GLS más cercanos según código postal. Documentación y playground disponibles en dadybox.com/dev.",
        },
        {
            "type":        "Informe",
            "name":        "GLS Delivery Report 2025",
            "description": "El informe anual de GLS con datos de entrega OOH en Europa. Referencia esencial para benchmarking.",
        },
        {
            "type":        "Estudio",
            "name":        "Kantar Ecommerce Logistics Spain 2024",
            "description": "Estadísticas de comportamiento del consumidor español respecto a OOH, preferencias y adopción por segmento.",
        },
        {
            "type":        "Guía",
            "name":        "Checklist de Integración Dadybox",
            "description": "Documento técnico paso a paso para activar OOH en las 6 plataformas soportadas. Disponible en el portal de clientes.",
        },
        {
            "type":        "Comunidad",
            "name":        "Foro GLS / Locker Alliance Europe",
            "description": "Red europea de operadores y marcas que comparten mejores prácticas en entrega OOH y sostenibilidad logística.",
        },
    ],

    # ── CONCLUSIÓN ───────────────────────────────────────────────
    "conclusion": {
        "text": (
            "La entrega Out-of-Home no es el futuro: es el presente. Las marcas que la "
            "activan hoy tienen menos incidencias, clientes más satisfechos y una cuenta "
            "de resultados más sana. La tecnología está disponible, la red existe y el "
            "cliente ya la usa. Solo falta que tu ecommerce se sume.\n\n"
            "El siguiente paso es simple: analiza tus datos actuales, activa OOH en el "
            "checkout y mide el impacto en 30 días. Los números hablarán solos."
        ),
        "takeaways": [
            "OOH reduce la tasa de incidencia de primera entrega del 15–30% al 4–6%",
            "El ahorro típico en reenvíos supera la inversión de activación en menos de 90 días",
            "El NPS de entrega sube entre 10 y 15 puntos cuando el cliente elige su punto",
            "La integración técnica con Dadybox tarda menos de 30 minutos en plataformas nativas",
            "Los clientes que usan OOH tienen un LTV un 18% superior en el primer año",
        ],
    },

    # ── CTA ──────────────────────────────────────────────────────
    "cta": {
        "headline":    "¿Listo para eliminar\nlas incidencias de última milla?",
        "description": (
            "Activa OOH con Dadybox en menos de 48 horas. "
            "Nuestro equipo configura todo contigo: integraciones, puntos de recogida "
            "y flujos de notificación desde el primer día."
        ),
        "button_text": "Reserva tu llamada con Noel",
    },
}

if __name__ == "__main__":
    import os
    from pathlib import Path

    out_dir = Path(__file__).parent / "output"
    out_dir.mkdir(exist_ok=True)
    out_path = str(out_dir / "dadybox_playbook_ooh.pdf")

    print("Generando HTML...")
    html = r.build_html(DATA)
    html_path = Path(out_path).with_suffix(".html")
    html_path.write_text(html, encoding="utf-8")
    print(f"HTML → {html_path}")

    print("Renderizando PDF con Playwright...")
    r.generate_pdf(DATA, out_path)
    print(f"\n✓ PDF generado: {out_path}")
