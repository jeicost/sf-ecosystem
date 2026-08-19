import asyncio, base64, io, qrcode
from urllib.parse import urlencode
from playwright.async_api import async_playwright

def qr(u):
    q = qrcode.QRCode(box_size=4, border=1); q.add_data(u); q.make(fit=True)
    b = io.BytesIO(); q.make_image(fill_color="#111111", back_color="white").save(b, format="PNG")
    return "data:image/png;base64," + base64.b64encode(b.getvalue()).decode()

CATS = "Restaurantes y cafés · Vida nocturna · Arte y cultura · Experiencias y eventos"
# Paleta = la misma que ya usa cada ciudad en el bloque de producto
# (components/sections/Guides.tsx), con su contraste ya medido. Así las
# portadas de autor y la colección se leen como una sola familia.
P = [
 dict(slug="madrid", city="Madrid", name="Vera Alcaine", bg="#22578a", ink="#f2f0ea", accent="#f4b47a",
      quote="+MADRILEÑA que el último metro", kicker="Su Madrid, de las siete a las siete*",
      lbl="Dentro", tit="El día ideal", det="De la primera caña al bar que cierra el último.",
      numdet="Los diez sitios que no negocia.", nota="*De la mañana. Y de la madrugada.", offset="31"),
 dict(slug="barcelona", city="Barcelona", name="Bruno Miralles", bg="#c8006b", ink="#f2f0ea", accent="#c9ff3f",
      quote="+BARCELONÉS que bañarse en enero", kicker="La ciudad que hay detrás de la postal*",
      lbl="Dentro", tit="Mapa ilustrado", det="Los barrios por los que no pasa ningún tour.",
      numdet="Los diez sitios que no negocia.", nota="*Sin pisar las Ramblas.", offset="31"),
 dict(slug="malaga", city="Málaga", name="Candela Requena", bg="#c9ff3f", ink="#141414", accent="#c8006b",
      quote="+MALAGUEÑA que un espeto a las ocho", kicker="Del centro al último chiringuito*",
      lbl="Dentro", tit="El día ideal", det="Con las horas puestas, para no improvisar.",
      numdet="Los diez sitios que no negocia.", nota="*Andando. Se puede.", offset="31",
      claro="1", cmix="multiply", cop=".30"),
 dict(slug="valencia", city="Valencia", name="Nerea Bonet", bg="#6d2f5e", ink="#f2f0ea", accent="#f4b47a",
      quote="+VALENCIANA que discutir por el arroz", kicker="De la Albufera a Ruzafa, sin GPS*",
      lbl="Dentro", tit="Ensayo fotográfico", det="La huerta y el mar en la misma tarde.",
      numdet="Los diez sitios que no negocia.", nota="*Ni una cola en el mercado.", offset="31"),
 dict(slug="ibiza", city="Ibiza", name="Aleix Ferrer", bg="#f2f0ea", ink="#141414", accent="#c8006b",
      quote="+IBICENCO que la isla en octubre", kicker="La isla cuando se van todos*",
      lbl="Dentro", tit="Coollections", det="Calas, discos y sitios que no ponen cartel.",
      numdet="Los diez sitios que no negocia.", nota="*Octubre y mayo, sobre todo.", offset="31",
      claro="1", cmix="multiply", cop=".26"),
 dict(slug="bangkok", city="Bangkok", name="Ploy Ratana", bg="#8f004d", ink="#f2f0ea", accent="#f4b47a",
      quote="+TAILANDESA que cenar de pie", kicker="Bangkok a ras de acera*",
      lbl="Dentro", tit="El día ideal", det="Del mercado de las seis al último taburete.",
      numdet="Los diez sitios que no negocia.", nota="*Sin subir a ninguna azotea.", offset="31"),
 dict(slug="dubai", city="Dubái", name="Layla Nasser", bg="#2b3a6b", ink="#f2f0ea", accent="#e6c26a",
      quote="+DUBAITÍ que el desierto a las seis", kicker="La ciudad que no sale en los vídeos*",
      lbl="Dentro", tit="Mapa ilustrado", det="El zoco viejo, el barrio nuevo y lo de en medio.",
      numdet="Los diez sitios que no negocia.", nota="*Ni una sola foto desde arriba.", offset="31"),
]

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={"width": 794, "height": 1123}, device_scale_factor=2)
        for c in P:
            q = dict(photo=f"cut-{c['slug']}.png", ciudad=f"ciudad-{c['slug']}.jpg",
                     offset=c["offset"], alto="70", city=c["city"], name=c["name"], year="26",
                     quote=c["quote"], kicker=c["kicker"], cats=CATS,
                     lbl=c["lbl"], tit=c["tit"], det=c["det"],
                     num="10", numlbl="Saves", numdet=c["numdet"], nota=c["nota"],
                     bg=c["bg"], ink=c["ink"], accent=c["accent"], qr=qr("https://discoolver.com/guias"))
            for k in ("claro", "cmix", "cop"):
                if c.get(k): q[k] = c[k]
            await pg.goto("http://127.0.0.1:8799/plantilla-v5.html?" + urlencode(q), wait_until="load")
            await pg.wait_for_timeout(3200)
            await pg.locator(".cover").screenshot(path=f"v5-{c['slug']}.png")
            print(f"  ✓ v5-{c['slug']}.png")
        await b.close()
asyncio.run(main())
