-- DADYBOX — Setup Completo en MIRA
-- Client ID: e664873b-034d-48cd-9a45-8631672ef375

-- 1. Actualizar o crear brand_profiles para Dadybox
INSERT INTO brand_profiles (client_id, name, mission, values, tone_of_voice, description, proposition)
VALUES (
  'e664873b-034d-48cd-9a45-8631672ef375',
  'Dadybox',
  'Revolucionar la logística de e-commerce en Latinoamérica con tecnología de IA y automatización.',
  '["Velocidad", "Precisión", "Innovación", "Transparencia", "Servicio al Cliente"]'::jsonb,
  'Profesional, confiable, directo. Nosotros resolvemos el problema, no lo complicamos. Enfoque en resultados medibles.',
  'Dadybox es una plataforma de logística inteligente para e-commerce que utiliza IA para optimizar rutas, predicción de demanda y automatización de operaciones.',
  'La logística es tu competencia, no tu burden. Dadybox la maneja.'
)
ON CONFLICT (client_id) DO UPDATE SET
  name = EXCLUDED.name,
  mission = EXCLUDED.mission,
  values = EXCLUDED.values,
  tone_of_voice = EXCLUDED.tone_of_voice,
  description = EXCLUDED.description,
  proposition = EXCLUDED.proposition,
  updated_at = NOW();

-- 2. Insertar Content Pillars para Dadybox (4 pilares con colecciones en JSONB)
-- PILAR 1: RADAR LOGÍSTICO
INSERT INTO content_pillars (client_id, pillar_name, description, themes, examples, created_at)
VALUES (
  'e664873b-034d-48cd-9a45-8631672ef375',
  'Radar Logístico',
  'Inteligencia de datos sobre flujos de logística, tendencias de envíos, y optimización de operaciones.',
  '[
    {
      "name": "Predicción de Demanda",
      "description": "Cómo la IA predice picos de envíos y prepara inventario",
      "examples": ["Black Friday predictions", "Seasonal trends", "Regional demand"]
    },
    {
      "name": "Optimización de Rutas",
      "description": "Algoritmos que reducen costos de transporte en tiempo real",
      "examples": ["Route clustering", "Real-time rerouting", "Last-mile optimization"]
    },
    {
      "name": "Análisis de Competencia",
      "description": "Benchmark contra otros operadores logísticos",
      "examples": ["Delivery speed comparison", "Cost per mile analysis", "Market positioning"]
    },
    {
      "name": "Métricas de Rendimiento",
      "description": "KPIs clave: tasa de entrega, tiempo promedio, satisfacción",
      "examples": ["On-time delivery %", "Average delivery time", "NPS trends"]
    }
  ]'::jsonb,
  '[
    "Predicción de demanda reduce 23% de costos operacionales",
    "Optimización de rutas con IA: caso de estudio",
    "Cómo prepararse para picos estacionales",
    "Dadybox vs competencia: benchmarks reales"
  ]'::jsonb,
  NOW()
);

-- PILAR 2: DADYBOX EN ACCIÓN
INSERT INTO content_pillars (client_id, pillar_name, description, themes, examples, created_at)
VALUES (
  'e664873b-034d-48cd-9a45-8631672ef375',
  'Dadybox en Acción',
  'Casos de uso reales, implementación, y resultados concretos de clientes.',
  '[
    {
      "name": "Case Studies",
      "description": "Clientes reales, su reto, solución, y impacto",
      "examples": ["E-commerce store +40% orders", "3PL reduced operations cost 30%", "Fulfillment center efficiency"]
    },
    {
      "name": "Implementación Paso a Paso",
      "description": "Cómo integrar Dadybox en tu operación logística",
      "examples": ["API integration guide", "Warehouse setup", "Team training"]
    },
    {
      "name": "Success Stories",
      "description": "Testimonios de empresas que escalaron con Dadybox",
      "examples": ["SME success stories", "Enterprise transformations", "Regional leaders"]
    },
    {
      "name": "Webinars y Demos",
      "description": "Sesiones en vivo mostrando features y mejores prácticas",
      "examples": ["Product demo", "Best practices webinar", "Industry expert interviews"]
    }
  ]'::jsonb,
  '[
    "Cómo la startup X pasó de 100 a 10K órdenes/día",
    "Integración en 48 horas: guía práctica",
    "Dadybox en acción: live demo",
    "Case study: Retailer X redujo costos 35% en 6 meses"
  ]'::jsonb,
  NOW()
);

-- PILAR 3: ENTREGAS MÁGICAS
INSERT INTO content_pillars (client_id, pillar_name, description, themes, examples, created_at)
VALUES (
  'e664873b-034d-48cd-9a45-8631672ef375',
  'Entregas Mágicas',
  'Experiencia del cliente final: tracking en tiempo real, comunicación, y satisfacción.',
  '[
    {
      "name": "Real-Time Tracking",
      "description": "Visibilidad total del paquete desde warehouse a puerta",
      "examples": ["GPS tracking", "Photo proof of delivery", "Delivery window notifications"]
    },
    {
      "name": "Experiencia del Cliente",
      "description": "Cómo la logística invisible crea delight",
      "examples": ["Unboxing experience", "On-time surprises", "Proactive notifications"]
    },
    {
      "name": "Resolución de Incidentes",
      "description": "Cómo manejamos problemas: pérdidas, demoras, daños",
      "examples": ["Damage claims process", "Rerouting on delays", "Customer service SLA"]
    },
    {
      "name": "Sustentabilidad",
      "description": "Entregas eco-friendly y responsabilidad ambiental",
      "examples": ["Carbon footprint reduction", "Green packaging", "Route efficiency impact"]
    }
  ]'::jsonb,
  '[
    "Tracking en tiempo real: cómo lo hacemos",
    "El customer journey de una entrega perfecta",
    "Resolución de daños: proceso y SLA",
    "Dadybox verde: logística sustentable"
  ]'::jsonb,
  NOW()
);

-- PILAR 4: E-COM PLAYBOOK
INSERT INTO content_pillars (client_id, pillar_name, description, themes, examples, created_at)
VALUES (
  'e664873b-034d-48cd-9a45-8631672ef375',
  'E-com Playbook',
  'Estrategias y tácticas para e-commerce: reducir devoluciones, aumentar conversiones, retención.',
  '[
    {
      "name": "Logística como Diferenciador Competitivo",
      "description": "Cómo convertir el envío en ventaja de marca",
      "examples": ["Free shipping strategy", "Same-day delivery as USP", "Packaging branding"]
    },
    {
      "name": "Reducción de Devoluciones",
      "description": "Tácticas logísticas que minimizan retornos",
      "examples": ["Accurate sizing", "Fragile item handling", "Quality assurance in packaging"]
    },
    {
      "name": "Post-Purchase Engagement",
      "description": "Cómo la logística puede generar loyalty",
      "examples": ["Personalized tracking", "Handwritten notes", "Post-delivery surveys"]
    },
    {
      "name": "Datos para Marketing",
      "description": "Usar logistics data para mejorar targeting y conversion",
      "examples": ["Geographic insights", "Delivery time feedback loops", "Customer behavior patterns"]
    }
  ]'::jsonb,
  '[
    "Logística como arma competitiva: benchmarks",
    "Reducir devoluciones con datos: guía",
    "Same-day delivery: modelo de negocio",
    "Post-purchase playbook: engagement tácticas"
  ]'::jsonb,
  NOW()
);

-- Verificación
SELECT '✅ DADYBOX brand_profiles' as status, COUNT(*) as count FROM brand_profiles WHERE client_id = 'e664873b-034d-48cd-9a45-8631672ef375';
SELECT '✅ DADYBOX content_pillars' as status, COUNT(*) as count FROM content_pillars WHERE client_id = 'e664873b-034d-48cd-9a45-8631672ef375';
