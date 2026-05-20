"""
Dadybox Brand Configuration — fuente única de verdad para todos los generadores.
"""

COLORS = {
    "primary":      "#0B1829",   # Navy oscuro — fondo marca Dadybox
    "accent":       "#3EE89A",   # Verde Dadybox — logo, CTAs, highlights
    "accent_dark":  "#1A9B60",   # Verde oscuro — cara oscura del cubo
    "accent_mid":   "#2DC080",   # Verde medio — cara lateral del cubo
    "coral":        "#EE5F5A",   # Coral/salmón — color alternativo de marca
    "light":        "#F4F7FA",   # Gris muy suave — fondos de sección
    "text":         "#0B1829",   # Texto principal
    "text_muted":   "#6B7A99",   # Texto secundario
    "border":       "#E2E8EF",   # Bordes suaves
    "white":        "#FFFFFF",
    "tip_bg":       "#F0FFF8",   # Fondo tip box (verde muy suave)
    "stat_bg":      "#F0FFF8",
    "check_bg":     "#F0FFF8",
    "green_border": "#A7F3D0",
}

# ── EQUIPO ────────────────────────────────────────────────────────
TEAM = [
    {
        "name":     "Noel Aldea Ruiz de la Hermosa",
        "role":     "CEO",
        "initials": "NO",
    },
    {
        "name":     "Natalia Aldea Ruiz de la Hermosa",
        "role":     "Marketing Manager & Innovation",
        "initials": "NA",
    },
    {
        "name":     "Usoa Azcona Fernández",
        "role":     "IT Clientes & Back Office Comercial",
        "initials": "UA",
    },
    {
        "name":     "Lidia Gutierrez",
        "role":     "Customer Service Manager",
        "initials": "LG",
    },
]

# Firmante por defecto de playbooks
AUTHOR = {
    "name":     "Natalia Aldea",
    "role":     "Marketing Manager, Dadybox",
    "initials": "NA",
}

# ── EMPRESA ───────────────────────────────────────────────────────
COMPANY = {
    "name":        "Dadybox",
    "tagline":     "Tu logística, nuestra magia.",
    "tagline_alt": "Envíos sin dramas.",
    "headline":    "La externalización logística que hace crecer tu e-commerce",
    "subheadline": "Orden, control y capacidad real para escalar con la tranquilidad de una estructura experta",
    "website":     "dadybox.com",
    "website_url": "https://www.dadybox.com",
    "contact_url": "https://dadybox.com/contacto",
    "cta_label":   "Reserva tu llamada",
    "email":       "hello@dadybox.com",
    "phone":       "+34 913 758 204",
    "address":     "Albasanz, 14 Bis · 28037 Madrid",
    "onboarding":  "48–72 horas desde la firma del contrato",
    "services": [
        "Fulfillment 3PL",
        "Envíos 24h y Premium",
        "Gestión de devoluciones",
        "Sistema de gestión de almacén (SGA)",
        "Integraciones omnicanal",
    ],
}

# ── ESTADÍSTICAS REALES ────────────────────────────────────────────
STATS = {
    "experience_years":  "36",
    "clients":           "+300",
    "shipments_year":    "+400.000",
    "on_time_delivery":  "97%",
    "sla":               "94,5%",
    "carriers":          "+100",
    "parcel_shops":      "+12.000",
    "lockers":           "+650",
}

# ── TRES DIVISIONES DEL GRUPO ─────────────────────────────────────
DIVISIONS = [
    {
        "name":  "GLS Ciudad Lineal",
        "desc":  "Línea principal de envíos para medianas y grandes empresas.",
    },
    {
        "name":  "Dadybox",
        "desc":  "La división especializada en e-commerce y pequeñas y medianas marcas.",
    },
    {
        "name":  "GTD Albasanz",
        "desc":  "Licitaciones y sector público.",
    },
]

# ── SERVICIOS DE ENVÍO ────────────────────────────────────────────
SHIPPING_SERVICES = [
    {
        "name":    "Económico",
        "time":    "1–3 días",
        "tagline": "La opción más rentable para pedidos no urgentes.",
        "bullets": [
            "Mejor coste por envío",
            "Ideal para operativa estándar",
            "Posibilidad de Parcel Shop en primera incidencia",
        ],
        "experience": "Estándar, fiable",
    },
    {
        "name":    "24H",
        "time":    "Entrega al día siguiente",
        "tagline": "El equilibrio entre precio y velocidad.",
        "bullets": [
            "Entrega garantizada en 24 horas",
            "Ideal para operativa diaria y campañas",
            "Parcel Shop a la segunda incidencia",
        ],
        "experience": "Rápida, competitiva",
    },
    {
        "name":    "Premium",
        "time":    "8:30H · 10:30H · 14:30H",
        "tagline": "La opción para promesas más exigentes.",
        "bullets": [
            "Franjas horarias garantizadas",
            "Mejora la experiencia de entrega",
            "Pensado para pedidos de mayor valor",
        ],
        "experience": "VIP, diferenciadora",
    },
]

# ── INTEGRACIONES ─────────────────────────────────────────────────
INTEGRATIONS = [
    "Shopify", "Shopify Plus", "WooCommerce",
    "PrestaShop", "BigCommerce", "Wix",
]

# ── REFERENCES / CLIENTES DESTACADOS ────────────────────────────
REFERENCES = [
    "Coca-Cola Fan Store",
    "Salesland",
    "Warner",
    "Ilunion",
    "GLS",
    "DHL",
    "FedEx",
]

# ── PROPUESTA DE VALOR (PAIN → SOLUTION) ─────────────────────────
PAIN_POINTS = [
    {
        "title": "Falta de control operativo",
        "desc":  "Stock desactualizado, procesos manuales y poca visibilidad sobre lo que entra, se prepara y se expide.",
    },
    {
        "title": "Estructura que se queda pequeña",
        "desc":  "El negocio crece, pero el almacén, los flujos y la organización interna ya no acompañan ese ritmo.",
    },
    {
        "title": "Campañas que tensionan toda la operación",
        "desc":  "Rebajas, lanzamientos o picos de demanda saturan picking, packing y salidas diarias.",
    },
    {
        "title": "La entrega empieza a afectar a la marca",
        "desc":  "Retrasos, incidencias o devoluciones impactan en la percepción, la confianza y la experiencia final del cliente.",
    },
]

VALUE_PROPS = [
    {
        "title": "Visibilidad operativa real",
        "desc":  "Cada pedido entra en un flujo más claro: stock, movimientos y salidas con mejor lectura para decidir mejor.",
    },
    {
        "title": "Control y trazabilidad de extremo a extremo",
        "desc":  "Tu operativa gana método, criterio y continuidad. Recepción, almacenaje, picking, packing, expedición y seguimiento bajo una misma lógica operativa.",
    },
    {
        "title": "Escalabilidad con base operativa",
        "desc":  "Más volumen, más campañas y más complejidad sin romper la calidad del servicio ni la experiencia del cliente.",
    },
]

PROCESS_STEPS = [
    {
        "title": "Integración",
        "desc":  "Conectamos nuestro SGA con tus canales de venta y nos integramos en tu proceso personalizado desde el principio.",
    },
    {
        "title": "Logística",
        "desc":  "Recibimos y digitalizamos todo tu stock, lo almacenamos y preparamos a diario cada pedido de tu tienda online & marketplaces.",
    },
    {
        "title": "Envíos & Devoluciones",
        "desc":  "Envíos eficientes, entregas flexibles y un proceso de devoluciones muy sencillo para tus clientes a través de nuestra red GLS.",
    },
    {
        "title": "SGA & Tracking",
        "desc":  "Gestión de almacén avanzada y acceso a nuestros sistemas para que puedas hacer seguimiento en tiempo real de todos tus pedidos.",
    },
]

DIFFERENTIATORS = [
    {
        "title": "Operativa adaptable",
        "desc":  "Rebajas, lanzamientos, Black Friday o picos puntuales: nuestra estructura se ajusta al ritmo real de tu negocio.",
    },
    {
        "title": "Tecnología + criterio humano",
        "desc":  "Integración de las mejores tecnologías de control y lectura operativa con una capa humana para supervisar cada proceso.",
    },
    {
        "title": "Atención al cliente personalizada",
        "desc":  "Onboarding en 48–72 horas y una lógica de trabajo pensada para dar respuestas rápidas y atención personalizada.",
    },
]

# ── PLANES ────────────────────────────────────────────────────────
PLANS = [
    {
        "name":     "Plan Despegue",
        "volume":   "Hasta 1200 envíos al año",
        "tagline":  "Perfecto para validar tu e-commerce sin complicarte con la logística.",
        "bullets": [
            "Para marcas que empiezan a externalizar su logística.",
            "Hasta ~100 envíos al mes sin compromisos de volumen.",
            "Almacenaje seguro y picking estándar por pedido.",
            "Acceso a tarifas de envío negociadas sin mínimos.",
            "Soporte por email y panel unificado para ver tus pedidos.",
        ],
        "featured": False,
    },
    {
        "name":     "Plan Turbo",
        "volume":   "De 1200 a 5000 envíos al año",
        "tagline":  "El equilibrio perfecto entre coste, velocidad y control operativo.",
        "bullets": [
            "Para e-commerce en plena fase de crecimiento.",
            "Capacidad para picos de campaña (rebajas, lanzamientos, Black Friday).",
            "Picking y packaging prioritario con opciones de personalización.",
            "Mejores condiciones de envío en servicios Económico, 24H y Premium.",
            "Integraciones avanzadas con tu e-commerce y SGA (vía API).",
            "Gestor de cuenta dedicado a partir de cierto volumen mensual.",
        ],
        "featured": True,
    },
    {
        "name":     "Plan Galaxia",
        "volume":   "Más de 5000 envíos al año",
        "tagline":  "Para operadores con volumen y necesidades específicas de escala.",
        "bullets": [
            "Para marcas con alta frecuencia de envíos.",
            "Condiciones de envío premium en todos los servicios.",
            "SLA garantizado y reporting avanzado.",
            "Gestor de cuenta dedicado y atención prioritaria.",
            "Personalización completa de packaging y flujos.",
        ],
        "featured": False,
    },
]

# ── SYSTEM PROMPT ─────────────────────────────────────────────────
SYSTEM_PROMPT = """Eres el agente de contenidos de Dadybox, empresa de logística para ecommerce con sede en Madrid.

SOBRE DADYBOX:
Dadybox nace dentro de un grupo logístico con 36 años de experiencia (GLS Ciudad Lineal + Dadybox + GTD Albasanz). Es la división especializada en e-commerce y pymes. Ofrece: fulfillment 3PL, envíos Económico/24H/Premium, SGA, gestión de devoluciones e integraciones con Shopify, WooCommerce, PrestaShop, BigCommerce, Wix. Onboarding en 48-72 horas. Red GLS de +12.000 Parcel Shops y +650 lockers en España.

DATOS CLAVE:
- +300 clientes activos
- +400.000 envíos al año
- 97% de entregas a tiempo
- 94,5% de SLA
- +100 transportistas
- 36 años de experiencia del grupo
- Referencias: Coca-Cola Fan Store, Salesland, Warner, Ilunion

EQUIPO:
- Noel Aldea (CEO), Natalia Aldea (Marketing & Innovation), Usoa Azcona (IT/Back Office), Lidia Gutierrez (Customer Service)

TU MISIÓN:
Crear contenido de alto valor que posicione a Dadybox como la referencia en logística para ecommerce en España.

FIRMANTE POR DEFECTO: Natalia Aldea, Marketing Manager de Dadybox.

AUDIENCIA:
Dueños y gestores de ecommerce — desde emprendedores que empiezan hasta operadores con equipos. Necesitan ayuda práctica para mejorar sus operaciones logísticas.

TONO: Cercano, directo y profesional. Como un experto hablando con un colega. Empático con los dolores del sector. Sin jerga innecesaria.

ESTRUCTURA PLAYBOOK (14-16 páginas):
1. Portada
2. Índice
3. Carta de Natalia (editorial personal, cálida)
4. El contexto / Por qué importa ahora (estadísticas del sector)
5-9. Capítulos del framework (3-5 capítulos con desarrollo, datos, tips)
10. Casos prácticos / Escenarios reales del sector
11. Checklist accionable
12. Recursos y herramientas recomendadas
13. Conclusión + CTA a Dadybox
14. Contraportada

SIEMPRE INCLUIR:
- Estadísticas reales del sector ecommerce/logística europeo (2024-2025) con fuente
- "Tips Dadybox" — cajas con consejos prácticos de la empresa
- Menciones naturales a servicios de Dadybox donde aporten valor al lector
- Ejemplos concretos del mundo ecommerce español/europeo
- CTA final claro hacia dadybox.com/contacto
"""

DECK_SYSTEM_PROMPT = """Eres el agente de presentaciones de Dadybox, empresa de logística para ecommerce con sede en Madrid.

SOBRE DADYBOX (datos verificados):
- Grupo logístico con 36 años de experiencia: GLS Ciudad Lineal + Dadybox + GTD Albasanz
- Dadybox: división especializada en e-commerce y pymes
- +300 clientes | +400.000 envíos/año | 97% entregas a tiempo | 94,5% SLA | +100 transportistas
- Onboarding en 48-72 horas desde la firma del contrato
- Red GLS: +12.000 Parcel Shops y +650 lockers en España
- Integraciones: Shopify, Shopify Plus, WooCommerce, PrestaShop, BigCommerce, Wix
- Servicios de envío: Económico (1-3 días), 24H, Premium (franjas horarias)
- Referencias: Coca-Cola Fan Store, Salesland, Warner, Ilunion
- Contacto: hello@dadybox.com | +34 913 758 204 | Albasanz 14 Bis, 28037 Madrid
- Equipo: Noel Aldea (CEO), Natalia Aldea (Marketing & Innovation), Usoa Azcona (IT), Lidia Gutierrez (CS)

TU MISIÓN:
Generar presentaciones profesionales (dossieres, propuestas comerciales, decks) para Dadybox.
Las presentaciones deben ser impactantes, concisas y alineadas con la identidad visual de Dadybox.

TONO: Profesional, directo, con autoridad. Enfocado en beneficios tangibles para el cliente.
Cada slide debe tener UN mensaje claro. Máximo 50 palabras de body copy por slide.
Los títulos deben ser declarativos y concisos (máximo 8 palabras).
"""
