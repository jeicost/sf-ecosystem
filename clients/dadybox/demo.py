#!/usr/bin/env python3
"""
demo.py — Genera un PDF de ejemplo sin API key para probar el diseño.
Usa contenido pre-escrito sobre devoluciones en ecommerce.
"""

from pathlib import Path
from datetime import datetime
from renderer import generate_pdf

OUTPUT_DIR = Path(__file__).parent / "output"
OUTPUT_DIR.mkdir(exist_ok=True)

DEMO_CONTENT = {
    "title": "Cómo Reducir tus Devoluciones y Aumentar la Rentabilidad",
    "subtitle": "La guía práctica para convertir uno de los mayores costes del ecommerce en una ventaja competitiva.",
    "date": "Mayo 2026",
    "introduction": {
        "letter_content": "Hola,\n\nSi tienes un ecommerce, las devoluciones son probablemente uno de los temas que más te quita el sueño. Y con razón: en España, casi 1 de cada 4 pedidos online acaba siendo devuelto. Eso es dinero que sale de tu bolsillo en logística inversa, tiempo de tu equipo y, en muchos casos, stock que ya no puedes volver a vender al mismo precio.\n\nEn Dadybox llevamos años gestionando la logística de cientos de marcas y hemos visto de primera mano qué hace que unas gestionen las devoluciones de forma rentable y otras no. Este playbook recoge las mejores prácticas, los datos más actualizados y los pasos concretos que puedes empezar a aplicar hoy mismo.\n\nNatalia",
        "key_points": [
            "Por qué tus devoluciones cuestan más de lo que crees",
            "Las 4 causas principales y cómo atacarlas",
            "Cómo diseñar una política de devoluciones que fidelice",
            "Herramientas y métricas para medir y reducir tu tasa",
            "Un checklist completo para implementar esta semana",
        ],
    },
    "context": {
        "title": "El coste real de las devoluciones en el ecommerce europeo",
        "intro": "Las devoluciones son el talón de Aquiles del comercio electrónico. En España, el problema es mayor de lo que parece.",
        "content": "El mercado del ecommerce en España facturó más de 82.000 millones de euros en 2024, pero una parte significativa de ese volumen nunca llega a ser rentable: las devoluciones se han convertido en uno de los mayores drenos de margen para las tiendas online.\n\nProcessar una devolución cuesta de media entre 15€ y 30€ entre logística inversa, revisión del producto, reempaquetado y pérdida de valor del stock. Y el problema no es solo financiero: cada devolución mal gestionada genera un cliente que probablemente no volverá a comprar.",
        "stats": [
            {"value": "23%", "label": "de los pedidos online en España acaba siendo devuelto", "source": "Statista 2025"},
            {"value": "€22", "label": "coste medio de procesar una devolución en logística inversa", "source": "Returnly Report 2024"},
            {"value": "67%", "label": "de compradores revisa la política de devoluciones antes de comprar", "source": "NRF 2024"},
        ],
    },
    "chapters": [
        {
            "number": 1,
            "title": "Por qué tus devoluciones cuestan más de lo que crees",
            "intro": "El coste visible de una devolución es solo la punta del iceberg. La mayoría de los ecommerce subestiman el impacto real en su cuenta de resultados.",
            "sections": [
                {
                    "title": "El coste visible: logística inversa",
                    "content": "El gasto más fácil de medir es el transporte de vuelta al almacén más la gestión del stock devuelto. Pero este coste, que oscila entre 8€ y 15€ por devolución, representa solo una parte del impacto total.",
                    "bullets": [
                        "Coste de recogida y transporte de vuelta al almacén",
                        "Tiempo de revisión y clasificación del producto",
                        "Coste de reempaquetado si el producto puede volver a venderse",
                        "Pérdida de valor por depreciación del stock",
                    ],
                },
                {
                    "title": "El coste oculto: el cliente que no vuelve",
                    "content": "Una mala experiencia de devolución tiene un impacto directo en el LTV del cliente. Los estudios muestran que un cliente insatisfecho con el proceso de devolución tiene 5 veces menos probabilidades de volver a comprar.",
                    "bullets": [
                        "Pérdida del cliente para futuras compras",
                        "Coste de adquisición que no se amortiza",
                        "Impacto en valoraciones y reseñas online",
                        "Efecto boca-oreja negativo en redes sociales",
                    ],
                },
            ],
            "tip_dadybox": "Con el sistema de gestión de devoluciones de Dadybox, cada artículo devuelto es clasificado, fotografiado y catalogado en menos de 24 horas, reduciendo el tiempo de reposición al stock vendible hasta en un 60%.",
            "key_stat": {
                "value": "5×",
                "label": "más caro cuesta adquirir un nuevo cliente que retener uno existente",
                "source": "Harvard Business Review 2024",
            },
        },
        {
            "number": 2,
            "title": "Las 4 causas principales y cómo atacarlas",
            "intro": "No todas las devoluciones son iguales ni tienen la misma causa. Identificar el origen de cada una es el primer paso para reducirlas de forma sistemática.",
            "sections": [
                {
                    "title": "1. Producto diferente a lo esperado",
                    "content": "La causa número uno de devoluciones en moda y electrónica es la discrepancia entre lo que el cliente esperaba recibir y lo que llegó. Imágenes de mala calidad, descripciones incompletas o tallas inconsistentes son los culpables habituales.",
                    "bullets": [
                        "Invierte en fotografía profesional con múltiples ángulos",
                        "Incluye vídeos del producto en uso siempre que sea posible",
                        "Añade guías de tallas con medidas reales de modelos",
                        "Usa IA para comparar reseñas de devoluciones con las fichas de producto",
                    ],
                },
                {
                    "title": "2. Errores en el picking y pedidos duplicados",
                    "content": "Los errores en el almacén y los pedidos duplicados representan entre el 8% y el 12% de las devoluciones. Son los más fáciles de eliminar con la tecnología adecuada.",
                    "bullets": [
                        "Implementa verificación por código de barras en el picking",
                        "Activa alertas de detección de pedidos duplicados",
                        "Revisa los procesos de confirmación de pago",
                    ],
                },
            ],
            "tip_dadybox": "El SGA de Dadybox integra verificación de picking por escáner, lo que ha permitido a nuestros clientes reducir los errores de envío hasta un 94%.",
            "key_stat": {
                "value": "78%",
                "label": "de las devoluciones se deben a causas que el ecommerce puede controlar directamente",
                "source": "Baymard Institute 2024",
            },
        },
        {
            "number": 3,
            "title": "Diseña una política de devoluciones que fidelice",
            "intro": "Tu política de devoluciones no es solo una obligación legal: es una herramienta de marketing y fidelización que puede marcar la diferencia en tu tasa de conversión.",
            "sections": [
                {
                    "title": "La paradoja de las devoluciones gratuitas",
                    "content": "Ofrecer devoluciones gratuitas incrementa las conversiones entre un 15% y un 25%, pero también puede disparar la tasa de devoluciones si no está bien diseñada. El truco está en hacer la devolución fácil sin hacerla tentadora.",
                    "bullets": [
                        "Define qué productos tienen devolución gratuita y cuáles no",
                        "Establece un plazo razonable (30 días es el estándar europeo)",
                        "Ofrece crédito en tienda como alternativa con un pequeño incentivo",
                        "Comunica la política en cada punto del funnel de compra",
                    ],
                },
                {
                    "title": "El poder del cambio en lugar de la devolución",
                    "content": "Incentivar el cambio por otro producto en lugar de la devolución directa puede reducir tu tasa de pérdida de ingresos en hasta un 40%. La clave es hacer el cambio tan simple como la devolución.",
                    "bullets": [
                        "Ofrece envío gratuito en el cambio aunque el original no lo fuera",
                        "Permite elegir el artículo de cambio antes de devolver el original",
                        "Proporciona un código de descuento para acompañar el cambio",
                    ],
                },
            ],
            "tip_dadybox": "Dadybox ofrece gestión de cambios express: el cliente recibe el nuevo producto en 24h sin necesidad de que el original haya llegado al almacén. Esto reduce la fricción del proceso y aumenta la satisfacción hasta en un 40%.",
            "key_stat": {
                "value": "92%",
                "label": "de compradores repetiría con un ecommerce si la experiencia de devolución fue buena",
                "source": "UPS Pulse of the Online Shopper 2024",
            },
        },
    ],
    "case_studies": [
        {
            "title": "Marca de moda reduce devoluciones un 31% en 6 meses",
            "industry": "Moda & Accesorios",
            "challenge": "Una marca española con 15.000 pedidos mensuales tenía una tasa del 38%. El motivo principal: talla incorrecta.",
            "solution": "Implementaron guía de tallas interactiva con medidas reales, vídeos con modelos de diferentes complexiones y recomendaciones de talla basadas en compras anteriores.",
            "result": "La tasa bajó al 26,2% en 6 meses. El ahorro en logística inversa superó los 45.000€ anuales.",
        },
        {
            "title": "Ecommerce de electrónica recupera el 80% del valor de sus devoluciones",
            "industry": "Electrónica & Tecnología",
            "challenge": "Gestionaban devoluciones internamente con 3 personas. El 60% del stock devuelto terminaba como merma.",
            "solution": "Externalizaron la logística inversa con Dadybox incluyendo revisión técnica, clasificación A/B/C y canal de venta de segunda mano integrado.",
            "result": "Stock recuperado: del 40% al 80%. Merma reducida un 65%. El equipo interno se enfocó en atención al cliente y ventas.",
        },
    ],
    "checklist": {
        "title": "Tu checklist para reducir devoluciones",
        "items": [
            {
                "category": "Ficha de producto",
                "tasks": [
                    "Fotografías profesionales desde múltiples ángulos",
                    "Vídeo del producto en uso (30-60 segundos)",
                    "Guía de tallas con medidas reales en centímetros",
                    "Sección de preguntas frecuentes en la ficha",
                ],
            },
            {
                "category": "Proceso de picking y envío",
                "tasks": [
                    "Verificación por código de barras en cada pedido",
                    "Control de calidad visual antes del empaquetado",
                    "Detección automática de pedidos duplicados",
                ],
            },
            {
                "category": "Política de devoluciones",
                "tasks": [
                    "Política visible en home, ficha de producto y checkout",
                    "Proceso de devolución en menos de 3 pasos",
                    "Opción de cambio como alternativa al reembolso",
                    "Confirmación de recepción en menos de 48 horas",
                ],
            },
            {
                "category": "Métricas y seguimiento",
                "tasks": [
                    "Tracking de tasa de devoluciones por producto y categoría",
                    "Análisis mensual de motivos de devolución",
                    "Dashboard de coste real de devoluciones vs. ingresos",
                ],
            },
        ],
    },
    "resources": [
        {
            "name": "Baymard Institute",
            "description": "Estudios y benchmarks de UX y checkout para ecommerce. Útil para entender los motivos de devolución.",
            "type": "Referencia",
        },
        {
            "name": "Loop Returns",
            "description": "Plataforma de gestión de devoluciones y cambios con integración directa en Shopify.",
            "type": "Herramienta",
        },
        {
            "name": "Return Magic",
            "description": "Automatización del proceso de devoluciones con portal self-service para el cliente final.",
            "type": "Herramienta",
        },
        {
            "name": "Statista — Ecommerce Returns",
            "description": "Datos actualizados sobre tasas de devolución por sector y país en Europa.",
            "type": "Datos",
        },
    ],
    "conclusion": {
        "text": "Las devoluciones no son el enemigo. Son información. Cada producto que vuelve a tu almacén te está diciendo algo sobre tu ficha de producto, tu proceso de picking o las expectativas de tus clientes. El objetivo no es eliminarlas —eso es imposible—, sino gestionarlas de forma eficiente y usarlas como fuente de mejora continua.\n\nCon los pasos que hemos visto en este playbook, tienes todo lo necesario para empezar a reducir tu tasa, recuperar más valor del stock devuelto y convertir una experiencia frustrante en una oportunidad de fidelización.",
        "takeaways": [
            "El coste real de una devolución es 2-3 veces el coste visible de logística inversa",
            "El 78% de las devoluciones tienen causas controlables: empieza por las fichas de producto",
            "Una buena política de devoluciones aumenta la conversión, no la reduce",
            "Externalizar la logística inversa puede recuperar hasta el 80% del valor del stock",
            "Mide, analiza y mejora: la tasa de devoluciones es un KPI clave de salud de tu ecommerce",
        ],
    },
    "cta": {
        "headline": "¿Listo para escalar sin que las devoluciones te frenen?",
        "description": "En Dadybox gestionamos tu logística de ida y vuelta para que tú te centres en vender. Fulfillment, envíos y devoluciones en un solo lugar.",
        "button_text": "Reserva tu llamada gratuita",
    },
}


if __name__ == "__main__":
    timestamp = datetime.now().strftime("%Y%m%d_%H%M")
    output_path = str(OUTPUT_DIR / f"demo_devoluciones_{timestamp}.pdf")

    print("\n" + "═" * 60)
    print("  DADYBOX PLAYBOOK — DEMO DE DISEÑO")
    print("  Generando PDF sin necesidad de API key...")
    print("═" * 60)

    try:
        generate_pdf(DEMO_CONTENT, output_path)
        print(f"\n  ✓ PDF generado: {output_path}")
        print(f"  Abre el archivo para revisar el diseño.\n")
    except Exception as e:
        print(f"\n  ERROR: {e}")
        print("  Asegúrate de tener Playwright instalado:")
        print("  pip install playwright && playwright install chromium\n")
        raise
