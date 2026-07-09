"""
Import the 100 e-commerce prospects from Dadybox's prospection PDF
(Dadybox_Prospeccion_Clientes.pdf) into crm_contacts.

Data transcribed row-by-row from the PDF (Tier, Marca, Sector, Pais,
Operador actual, Prioridad, Web, Encaje/angulo). Row-count cross-checked
against the PDF's own summary page: Alta=35, Media=47, Baja=18,
Bigblue=15, Amphora=4, Logisfashion=2, Huboo=8, Tier1=29, Tier2=71, Total=100.

Usage:
    python3 scripts/import_dadybox_prospects.py [--dry-run]
"""
import os
import sys
import json
import urllib.request
import urllib.error

SUPABASE_URL = "https://nnevhtfxuawexliwlbmh.supabase.co"
SUPABASE_SERVICE_KEY = os.environ.get(
    "SUPABASE_SERVICE_KEY", "sb_secret_Q6cPJkQL1SCWlSrrQ4o84Q_naXGD0_-"
)
WORKSPACE_ID = "ws-dadybox"

# tier, marca, sector, pais, operador (Tier1 only), prioridad, web, encaje, angulo
ROWS = [
    (1, "T1", "NIEVES Beauty", "Belleza / skincare", "España", "Bigblue", "Alta", None,
     "Skincare de Nieves Álvarez; prepara salto a retail. Muy sensible a la experiencia post-compra.",
     "Partner español cercano, no un número en una red paneuropea."),
    (2, "T1", "Endor Technologies", "Belleza / cosmética científica", "España", "Bigblue", "Alta", None,
     "Crece en pedidos online y reabastece centros de belleza (B2C+B2B).",
     "Agilidad y trato directo en Madrid."),
    (3, "T1", "Scuffers", "Moda / calzado urbano", "España", "Bigblue", "Alta", None,
     "Moda joven con comunidad; producto que luce en unboxing.",
     "Unboxing + flexibilidad sin permanencia."),
    (4, "T1", "Team Heretics", "Gaming / esports merch", "España", "Amphora Logistics", "Alta", None,
     "Merch de esports, fan-driven, picos por drops. Perfil idéntico al ICP de Dadybox.",
     "Experiencia premium + capacidad de pico."),
    (5, "T1", "TheGrefg", "Creador / merch", "España", "Amphora Logistics", "Alta", None,
     "Uno de los mayores creadores hispanos; drops masivos.",
     "Gestión de picos + unboxing de creador."),
    (6, "T1", "Nil Ojeda", "Creador / marca D2C", "España", "Amphora Logistics", "Alta", None,
     "Marca de creador con comunidad fuerte.", "Cercanía + branding del paquete."),
    (7, "T1", "Mar Lucas", "Creadora / merch", "España", "Amphora Logistics", "Alta", None,
     "Marca de creadora; volumen por campañas.", "Flexibilidad para campañas puntuales."),
    (8, "T1", "Castañer", "Calzado / alpargatas", "España", "Logisfashion", "Media", None,
     "Marca artesanal desde 1927; omnicanal. Producto premium.",
     "Agilidad/cercanía frente a operador gigante."),
    (9, "T1", "GANT", "Moda preppy", "Internacional", "Logisfashion", "Baja", None,
     "Moda; cuenta internacional gestionada desde España.",
     "Enterprise; baja prioridad salvo proyecto España concreto."),
    (10, "T1", "Baïa", "Moda / lifestyle", "Por confirmar", "Bigblue", "Media", None,
     "Citada por Bigblue. Confirmar país y volumen.", "Validar operación en España antes de priorizar."),
    (11, "T1", "CAVAL", "Calzado / moda", "Francia", "Bigblue", "Media", None,
     "Sneakers desparejados; fuerte en devoluciones/crédito.", "Atacar si refuerzan hub en España."),
    (12, "T1", "Rivedroite", "Bolsos / accesorios", "Francia", "Bigblue", "Media", None,
     "Bolsos en fuerte crecimiento; ideal unboxing.", "Hub España para mercado ibérico."),
    (13, "T1", "Cabaïa", "Accesorios / mochilas", "Francia", "Bigblue", "Media", None,
     "Mochilas modulares; identidad fuerte.", "Solo si buscan presencia logística en España."),
    (14, "T1", "Unbottled", "Cosmética sólida", "Francia", "Bigblue", "Media", None,
     "Cosmética sólida sostenible; muy orientada a UGC.", "Sostenibilidad + unboxing para España."),
    (15, "T1", "Novexpert", "Cosmética", "Francia", "Bigblue", "Baja", None,
     "Cosmética; reabastece puntos de belleza.", "Solo si plan de expansión a España."),
    (16, "T1", "Eric Flag", "Fitness / equipamiento", "Francia", "Bigblue", "Baja", None,
     "+100.000 clientes globales.", "Internacional."),
    (17, "T1", "SmartWorkout", "Fitness", "Francia", "Bigblue", "Baja", None,
     "Expansión europea.", "Internacional."),
    (18, "T1", "Believe Athletics", "Ropa deportiva", "Internacional", "Bigblue", "Baja", None,
     "Sportswear; fast-tags para conversión.", "Internacional."),
    (19, "T1", "Détective Box", "Juego / suscripción", "Francia", "Bigblue", "Baja", None,
     "Caja de misterio en suscripción; crecimiento explosivo.", "Modelo suscripción interesante de estudiar."),
    (20, "T1", "FROM FUTURE", "Moda", "Internacional", "Bigblue", "Baja", None,
     "Redujo tickets con tracking de marca.", "Internacional."),
    (21, "T1", "ROWSE", "Belleza / lifestyle", "Internacional", "Bigblue", "Baja", None,
     "Citada por Bigblue (poca info). Validar.", "Verificar sector/país."),
    (22, "T1", "ZOEVA", "Belleza (brochas)", "Alemania", "Huboo", "Media", None,
     "Alto volumen (~40k pedidos/mes). Producto pequeño de valor.", "Atacar si plantean hub en España/sur de Europa."),
    (23, "T1", "Cambridge Nutraceuticals", "Suplementos", "Reino Unido", "Huboo", "Baja", None,
     "Suplementos por suscripción; +40%.", "Internacional."),
    (24, "T1", "Days Brewing", "Bebidas (sin alcohol)", "Reino Unido", "Huboo", "Baja", None,
     "Bebida sin alcohol D2C en crecimiento.", "Internacional; bebida (peso/volumen)."),
    (25, "T1", "Just Wears", "Ropa interior", "Reino Unido", "Huboo", "Baja", None,
     "Underwear D2C.", "Internacional."),
    (26, "T1", "Dingbats", "Papelería / cuadernos", "Reino Unido", "Huboo", "Baja", None,
     "Pasó a 100% ecommerce.", "Internacional."),
    (27, "T1", "Azio Beauty", "Belleza", "Reino Unido", "Huboo", "Baja", None,
     "Belleza asequible; +120% en 2022.", "Internacional."),
    (28, "T1", "Flare Audio", "Audio / electrónica", "Reino Unido", "Huboo", "Baja", None,
     "Audio D2C.", "Fuera del core pyme de Dadybox."),
    (29, "T1", "JDE – L'Or / Tassimo", "Café (cápsulas)", "Global", "Huboo", "Baja", None,
     "Gran cuenta (grupo JDE); perfil enterprise.", "Enterprise; baja prioridad."),
    (30, "T2", "PdPaola", "Joyería", "España", None, "Alta", "pdpaola.com",
     "Joyería D2C premium; unboxing muy cuidado, producto pequeño.", "Producto pequeño de valor; encaje altísimo."),
    (31, "T2", "Singularu", "Joyería", "España", None, "Alta", "singularu.com",
     "Joyería D2C (Valencia); volumen alto, producto pequeño.", "Verificar operador; posible enterprise."),
    (32, "T2", "Laagam", "Moda", "España", None, "Alta", "laagam.com",
     "Moda D2C nativa digital con comunidad y lanzamientos.", "Verificar operador."),
    (33, "T2", "Pompeii", "Calzado", "España", None, "Alta", "pompeiibrand.com",
     "Calzado D2C (Madrid) con marca potente.", "Posible logística propia por tamaño; validar."),
    (34, "T2", "Sepiia", "Moda técnica", "España", None, "Alta", "sepiia.com",
     "Textil antimanchas/antiarrugas D2C (Madrid).", "Probable logística propia; validar."),
    (35, "T2", "NudeProject", "Streetwear", "España", None, "Alta", None,
     "Streetwear con comunidad enorme y drops; picos brutales.", "Gestión de picos estacionales."),
    (36, "T2", "Freshly Cosmetics", "Cosmética natural", "España", None, "Alta", "freshlycosmetics.com",
     "Cosmética natural D2C (Reus); sensibilidad alta a la marca.", "Verificar operador."),
    (37, "T2", "TwoJeys", "Joyería", "España", None, "Alta", "twojeys.com",
     "Joyería unisex (Barcelona) con comunidad brutal; +140 países.", "Verificar operador."),
    (38, "T2", "Cocunat", "Belleza / wellness", "España", None, "Alta", "cocunat.com",
     "Cosmética 'toxic free' D2C; fuerte en España y EE. UU.", "Probable almacén propio; validar."),
    (39, "T2", "Brava Fabrics", "Moda", "España", None, "Alta", "bravafabrics.com",
     "Moda D2C sostenible (Barcelona).", "Verificar operador."),
    (40, "T2", "Hawkers", "Gafas de sol", "España", None, "Media", "hawkersco.com",
     "D2C nativo de gran volumen; producto pequeño ideal.", "Validar peso de canal D2C vs B2B."),
    (41, "T2", "Aristocrazy", "Joyería", "España", None, "Media", None,
     "Joyería con fuerte componente retail/omnicanal.", "Probable logística propia; validar."),
    (42, "T2", "Bimani", "Moda / fiesta", "España", None, "Media", None,
     "Moda de evento D2C; estacionalidad marcada.", "OJO: picos estacionales fuertes."),
    (43, "T2", "Coolligan", "Calzado", "España", None, "Media", None,
     "Calzado D2C con comunidad.", "Volumen pequeño; plan Despegue."),
    (44, "T2", "Sepai", "Skincare", "España", None, "Media", None,
     "Skincare premium D2C.", "Verificar operador y tipo de producto."),
    (45, "T2", "HSN", "Nutrición deportiva", "España", None, "Media", None,
     "Suplementos deportivos D2C (Granada) de gran volumen.", "Encaje alto: producto que luce, comunidad."),
    (46, "T2", "Naturadika", "Suplementos / wellness", "España", None, "Media", None,
     "Suplementos naturales D2C.", "Picos por drops; ángulo unboxing."),
    (47, "T2", "Heura", "Alimentación plant-based", "España", None, "Media", None,
     "Plant-based; fuerte componente B2B retail.", "Verificar operador; perfil ideal."),
    (48, "T2", "Naturitas", "Productos naturales", "España", None, "Media", None,
     "Retailer natural de alto volumen.", "Internacionaliza: encaje con planes Turbo/Galaxia."),
    (49, "T2", "Dogfy Diet", "Pet food (fresca)", "España", None, "Media", None,
     "Comida fresca de perro por suscripción; crece muy rápido.", "Encaje alto para picking eficiente."),
    (50, "T2", "Wildust", "Accesorios moto (mujer)", "España", None, "Baja", None,
     "Nicho con comunidad; producto de marca.", "Producto pequeño; ideal 3PL."),
    (51, "T2", "Naku", "Pet food", "España", None, "Baja", None,
     "Comida para mascotas D2C.", "OJO: cadena de frío; confirmar si Dadybox puede operarlo."),
    (52, "T2", "ALOHAS", "Calzado / moda", "España", None, "Alta", "alohassandals.com",
     "Calzado D2C con modelo on-demand; marca aspiracional.", "Encaje alto."),
    (53, "T2", "Blue Banana Brand", "Ropa / aventura", "España", None, "Alta", "bluebananabrand.com",
     "Ropa lifestyle D2C con comunidad joven muy fiel.", "Producto con unboxing muy 'instagrameable'."),
    (54, "T2", "Tropicfeel", "Calzado / viaje", "España", None, "Alta", "tropicfeel.com",
     "Calzado y gear de viaje D2C; fuerte en crowdfunding.", "Producto pequeño; logística inversa relevante."),
    (55, "T2", "Muroexe", "Calzado", "España", None, "Alta", "eu.muroexe.com",
     "Calzado híbrido D2C; +250.000 pares en 51 países.", "Encaje alto."),
    (56, "T2", "Meller", "Gafas / complementos", "España", None, "Alta", "mellerbrand.com",
     "Gafas y relojes D2C; producto pequeño de valor.", "Verificar volumen."),
    (57, "T2", "Barner", "Gafas (luz azul)", "España", None, "Alta", "barnerbrand.com",
     "Gafas para pantallas D2C; nicho con buen margen.", "Verificar operador."),
    (58, "T2", "David Locco", "Joyería", "España", None, "Alta", "davidlocco.com",
     "Joyería D2C; producto premium de pequeño tamaño.", "Verificar volumen."),
    (59, "T2", "Northweek", "Gafas de sol", "España", None, "Alta", "northweek.com",
     "Gafas D2C (Barcelona) con personalización.", "Producto pequeño."),
    (60, "T2", "Paloma Wool", "Moda", "España", None, "Alta", "palomawool.com",
     "Moda de autor D2C con culto de marca.", "Logística inversa relevante."),
    (61, "T2", "Scotta 1985", "Moda masculina", "España", None, "Alta", "scotta1985.com",
     "Moda masculina D2C.", "Verificar volumen."),
    (62, "T2", "Silbon", "Moda masculina", "España", None, "Alta", "silbonshop.com",
     "Moda masculina D2C (Córdoba) en expansión.", "Verificar volumen."),
    (63, "T2", "Hemper", "Moda sostenible", "España", None, "Alta", "hemper.es",
     "Moda sostenible D2C con origen Nepal; storytelling fuerte.", "Producto pequeño de valor."),
    (64, "T2", "Siroko", "Gafas / ropa deporte", "España", None, "Alta", "siroko.com",
     "Equipamiento deportivo D2C de gran tracción.", "Producto pequeño."),
    (65, "T2", "Minimalism Brand", "Complementos / mochilas", "España", None, "Alta", "minimalismbrand.com",
     "Mochilas y complementos D2C minimalistas.", "Producto pequeño."),
    (66, "T2", "Morrison", "Calzado", "España", None, "Alta", "morrisonshoes.com",
     "Sneakers D2C con identidad de marca.", "Producto pequeño."),
    (67, "T2", "We Are Knitters", "Kits para tejer", "España", None, "Alta", "weareknitters.es",
     "Kits de lana D2C; muy internacional, packaging cuidado.", "Volumen alto de unidades pequeñas."),
    (68, "T2", "Lord Wilmore", "Gafas graduadas", "España", None, "Alta", "lordwilmore.es",
     "Gafas graduadas D2C; modelo home try-on.", "Verificar operador."),
    (69, "T2", "Project Lobster", "Gafas", "España", None, "Alta", "projectlobster.com",
     "Gafas D2C (Barcelona).", "Ángulo sostenibilidad."),
    (70, "T2", "The Brubaker", "Moda masculina", "España", None, "Media", "thebrubaker.com",
     "Moda masculina D2C.", "Verificar volumen."),
    (71, "T2", "Harper and Neyer", "Moda", "España", None, "Media", "harperandneyer.com",
     "Moda D2C.", "Verificar operador."),
    (72, "T2", "Lucía Be", "Moda / complementos", "España", None, "Media", "luciabe.com",
     "Moda y complementos D2C con marca personal.", "Verificar operador."),
    (73, "T2", "Messy Weekend", "Gafas de sol / ski", "España", None, "Media", "messyweekend.es",
     "Gafas D2C; nicho outdoor.", "Nicho con buen margen."),
    (74, "T2", "Miller & Marc", "Gafas graduadas", "España", None, "Media", "millerandmarc.com",
     "Gafas graduadas D2C.", "Producto pequeño de valor."),
    (75, "T2", "Greyhounders", "Gafas", "España", None, "Media", "greyhounders.com",
     "Gafas D2C.", "Producto pequeño."),
    (76, "T2", "Carmelas", "Gafas", "España", None, "Media", "carmelasvision.com",
     "Gafas de sol y graduadas D2C.", "Producto pequeño."),
    (77, "T2", "Mam Originals", "Relojes", "España", None, "Media", "mamoriginals.com",
     "Relojes de madera D2C; sostenibilidad.", "Producto pequeño."),
    (78, "T2", "Panapop", "Relojes", "España", None, "Media", "panapop.com",
     "Relojes D2C.", "Volumen alto de unidades pequeñas."),
    (79, "T2", "Havet", "Relojes", "España", None, "Media", "havet.com",
     "Relojes D2C.", "Verificar operador."),
    (80, "T2", "Wynot Watches", "Relojes", "España", None, "Media", "wynotwatches.com",
     "Relojes D2C.", "Ángulo sostenibilidad."),
    (81, "T2", "C21 Be Brave", "Relojes / accesorios", "España", None, "Media", "c21bebrave.com",
     "Relojes y accesorios D2C.", "Verificar volumen."),
    (82, "T2", "Sockaholic", "Calcetines", "España", None, "Media", "sockaholic.com",
     "Calcetines de diseño D2C; alta rotación.", "Verificar operador."),
    (83, "T2", "Walk in Pitas", "Calzado", "España", None, "Media", "walkinpitas.com",
     "Calzado D2C casual.", "Verificar operador."),
    (84, "T2", "Wado", "Calzado eco", "España", None, "Media", "wearewado.com",
     "Calzado sostenible D2C.", "Nicho con buen margen."),
    (85, "T2", "Mr. John's", "Calzado", "España", None, "Media", "mrjohnshoes.com",
     "Calzado masculino D2C.", "Producto pequeño de valor."),
    (86, "T2", "Diplomatic", "Calzado", "España", None, "Media", "diplomaticbrand.com",
     "Calzado D2C.", "Producto pequeño."),
    (87, "T2", "Neon Boots", "Calzado", "España", None, "Media", "neonboots.es",
     "Botas/calzado D2C.", "Producto pequeño."),
    (88, "T2", "Masaltos", "Calzado (con alzas)", "España", None, "Media", "masaltos.com",
     "Calzado D2C de nicho; muy internacional.", "Picking con personalización: encaje de servicio."),
    (89, "T2", "Lavani Jewels", "Joyería", "España", None, "Media", "lavanijewels.com",
     "Joyería D2C.", "Unboxing muy visual."),
    (90, "T2", "Jaadoo", "Joyas artesanales", "España", None, "Media", "jaadoo.es",
     "Joyas artesanales D2C.", "Volumen y rotación altos."),
    (91, "T2", "María Pascual", "Joyas", "España", None, "Media", "maria-pascual.com",
     "Joyería D2C.", "Ángulo: discreción + experiencia de paquete."),
    (92, "T2", "Tot-em", "Joyería personalizada", "España", None, "Media", "tot-em.com",
     "Joyería personalizada D2C; valor en personalización.", "Producto pequeño de valor."),
    (93, "T2", "Charuca", "Papelería / regalo", "España", None, "Media", "charucashop.com",
     "Papelería de diseño D2C con comunidad.", "Verificar peso/volumen del producto."),
    (94, "T2", "Flamingueo", "Accesorios / lifestyle", "España", None, "Media", "flamingueo.com",
     "Productos lifestyle/regalo D2C virales.", "Verificar operador."),
    (95, "T2", "Plátano Melón", "Wellness íntimo", "España", None, "Media", "platanomelon.com",
     "Bienestar sexual D2C; packaging discreto clave.", "Probable logística propia por tamaño; validar."),
    (96, "T2", "EOZ Audio", "Audio portátil", "España", None, "Media", "eozaudio.com",
     "Auriculares/audio D2C.", "Volumen bajo; producto de alto valor."),
    (97, "T2", "Velites", "Material crossfit", "España", None, "Media", "velitessport.com",
     "Equipamiento de crossfit D2C.", None),
    (98, "T2", "Aque Apparel", "Moda", "España", None, "Media", "aqueapparel.com",
     "Moda D2C.", None),
    (99, "T2", "Mr. Wonderful", "Regalos / papelería", "España", None, "Media", "mrwonderfulshop.es",
     "Regalo y papelería D2C; marca icónica.", None),
    (100, "T2", "Smach", "Gaming (consola portátil)", "España", None, "Baja", "smachz.com",
     "Hardware gaming D2C de nicho.", None),
]


def hot_score_for(tier, priority):
    if tier == "T1":
        return 80
    return {"Alta": 75, "Media": 60, "Baja": 40}[priority]


def classification_for(score):
    if score >= 75:
        return "hot"
    if score >= 50:
        return "warm"
    return "cold"


def build_payload():
    payload = []
    for (n, tier, marca, sector, pais, operador, prioridad, web, encaje, angulo) in ROWS:
        score = hot_score_for(tier, prioridad)
        notes_parts = [
            f"Tier {tier[1]}" + (f" - Cliente confirmado de {operador}" if operador else " - Prospecto ICP, operador no confirmado"),
            f"Prioridad: {prioridad}",
            encaje,
        ]
        if angulo:
            notes_parts.append(f"Ángulo: {angulo}")
        payload.append({
            "workspace_id": WORKSPACE_ID,
            "company_name": marca,
            "industry": sector,
            "geography": pais,
            "company_website": f"https://{web}" if web else None,
            "stage": "prospected",
            "hot_score": score,
            "classification": classification_for(score),
            "notes": " | ".join(notes_parts),
            "source": "dadybox_prospeccion_pdf_2026",
        })
    return payload


def main():
    dry_run = "--dry-run" in sys.argv
    payload = build_payload()

    assert len(payload) == 100, f"Expected 100 rows, got {len(payload)}"
    tier1 = sum(1 for r in ROWS if r[1] == "T1")
    assert tier1 == 29, f"Expected 29 Tier 1 rows, got {tier1}"

    print(f"Built {len(payload)} prospect rows for workspace '{WORKSPACE_ID}'.")

    if dry_run:
        print(json.dumps(payload[:3], indent=2, ensure_ascii=False))
        print("... (dry run, nothing sent)")
        return

    url = f"{SUPABASE_URL}/rest/v1/crm_contacts"
    body = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=body, method="POST")
    req.add_header("apikey", SUPABASE_SERVICE_KEY)
    req.add_header("Authorization", f"Bearer {SUPABASE_SERVICE_KEY}")
    req.add_header("Content-Type", "application/json")
    req.add_header("Prefer", "return=minimal")

    try:
        with urllib.request.urlopen(req) as resp:
            print(f"Insert response status: {resp.status}")
    except urllib.error.HTTPError as e:
        print(f"HTTP error {e.code}: {e.read().decode()}")
        sys.exit(1)

    print("Done. Verify with:")
    print(f"  curl '{SUPABASE_URL}/rest/v1/crm_contacts?workspace_id=eq.{WORKSPACE_ID}&select=count'")


if __name__ == "__main__":
    main()
