# Modelo de costes · primera tirada de 1.000 botellas

> ⚠️ **REHECHO EL 19-SEP AL CERRAR LA BOTELLA.** El modelo anterior estaba
> calculado sobre una borgoña de 750 ml y 500 g. La botella elegida es una
> **magnum de 150 cl y 900 g** (Estal SM BG MG Essentia): el doble de vino y
> casi el doble de vidrio. Todo lo de abajo son **rangos de mercado, no
> presupuestos** — siguen sin pedirse. Lo que sí es firme es la dirección: el
> coste sube en todas las líneas y **el pricing actual ya no cuadra**.

## Producto A · La botella vacía — PVP 22 €

| Concepto | Antes (75 cl) | Ahora (magnum) |
|---|---|---|
| Vidrio | 0,55 | **1,80 – 2,80** |
| Serigrafía 1 tinta, 1.000 uds | 1,70 | **1,90 – 2,50** |
| Tapón de corcho, cabeza de zamak | 1,00 | 1,00 |
| Cajita individual impresa | 1,20 | **1,80 – 2,40** |
| Colgante de cuello | 0,15 | 0,15 |
| **Coste** | **4,60** | **6,65 – 8,85** |

PVP 22 € con IVA → 18,18 € sin IVA → **margen bruto 9,33 – 11,53 €, el 51-63 %**

**El 75 % se ha ido.** Para recuperarlo el PVP tendría que ser **27 – 36 €**.

## Producto B · El vino — PVP 69 € el pack de 3

| Concepto | Antes (75 cl) | Ahora (magnum) |
|---|---|---|
| Botella + serigrafía | 2,25 | **3,70 – 5,30** |
| Vino private label DO Vinos de Madrid | 3,00 | **5,50 – 7,00** |
| Embotellado a façon | 0,35 | **0,50 – 0,80** |
| Corcho | 0,25 | 0,25 |
| Cápsula negra mate (larga, de magnum) | 0,12 | **0,20 – 0,35** |
| Contraetiqueta legal 80 × 58 mm | 0,15 | 0,15 |
| **Coste botella** | **6,12** | **10,30 – 13,85** |

Pack de 3 → 30,90 – 41,55 € + estuche de magnum 6 – 9 € + embalaje 3 € =
**39,90 – 53,55 €**

PVP 69 € → 57,02 € sin IVA → **margen bruto 3,47 – 17,12 €, el 6-30 %**

> **El pack de 3 magnums a 69 € no se sostiene.** En el escenario malo deja
> tres euros y medio por pack, que se los come el primer paquete que se rompa
> en tránsito. Son 4,5 litros de vino y 2,7 kg de vidrio: es un producto
> distinto del que se tarifó.

## Lo que esto obliga a decidir — es tuyo

Tres salidas, y no son excluyentes:

1. **Subir precios.** Es lo natural: una magnum no es una botella, es un
   regalo grande. La vacía a **29 €** vuelve al 70 % de margen; el pack de 3 a
   **119 €** vuelve al 55 %. Una magnum serigrafiada a 29 € sigue siendo barata
   para lo que es — en la estantería compite con objeto de regalo, no con vino.
2. **Bajar el pack de 3 a un pack de 2.** 3 magnums pesan 8 kg con embalaje y
   valen casi 120 €: es mucho ticket y mucho porte. Dos magnums a **85 €** es
   más vendible y más fácil de enviar.
3. **Dejar el pack de 3 solo para recogida o para hostelería**, donde el porte
   no lo pagas tú.

El estuche completo (1 vino + 1 vacía) aguanta mejor que el pack de 3 y sigue
siendo el que mejor explica el concepto. Con los costes nuevos pide subir de
39 € a **49 – 55 €**.

## Producto C · El estuche completo — PVP 39 €
1 vino + 1 botella vacía. Coste estimado **17 – 23 €** con estuche y embalaje.
A 39 € deja **32-47 %**. Es el que mejor explica el concepto y el que debería
ganar en ticket medio, así que es el último al que se le debe subir el precio.

## Inversión inicial
| Partida | Antes | Ahora |
|---|---|---|
| Vino y embotellado | 3.000 | **6.000 – 7.800** |
| Vidrio y serigrafía | ~2.250 | **3.700 – 5.300** |
| Cierres y cápsulas | ~700 | ~900 |
| Estuches y embalaje | 2.200 | **3.000 – 4.000** |
| Ilustración de las 57 piezas | 1.500 – 3.000 | 1.500 – 3.000 |
| Registro de marca OEPM | 125 | 125 |
| Revisión legal del pack | 600 – 1.500 | 600 – 1.500 |
| **Total** | **11.000 – 15.000** | **15.800 – 22.600** |

El primer lote sigue sin dar beneficio: **es la inversión en el arte y en
validar**. Pero la entrada ha subido unos 5.000 – 7.000 €, y eso sí es una
decisión de caja que hay que tomar antes de pedir el vidrio.

## El porte, que ahora pesa

| | Peso con embalaje |
|---|---|
| Botella vacía | ~1,4 kg |
| Estuche completo | ~4,1 kg |
| Pack de 3 vinos | ~8,2 kg |

Casi todo sube de tramo en la tabla de mensajería, y el pack de 3 se sale del
tramo barato en toda Europa. Los pesos ya están corregidos en
`web/lib/catalogo.ts`, que es lo que calcula el porte en el checkout.

**Pero el porte que se cobra sigue siendo el de antes**: 4,90 € en península,
plano, sin mirar el peso (`web/lib/envio.ts`). Un paquete de **8,2 kg no se
envía por 4,90 €** en ninguna mensajería: el pack de 3 pierde dinero en el
porte *antes* de contar el producto. Otra decisión de precio que es tuya —
subir el porte, o incluirlo en un PVP mayor, que suele vender mejor.

## La conclusión que manda — no ha cambiado
La botella vacía sigue teniendo **más margen** que el vino y **ninguna carga
regulatoria**. La vacía es el negocio; el vino es la prensa. El cambio a magnum
estrecha la diferencia en puntos, pero no la invierte.

## Comparativa que decidió la arquitectura
| | Vino | Botella vacía |
|---|---|---|
| Impuestos especiales, CAE, EMCS | Sí | No |
| Representante fiscal en IE, SE, DK | Sí | No |
| Verificación de edad en la web | Sí | No |
| Venta a EE. UU. | Solo vía importador con permiso TTB | Directa |
| Marketplaces | Restringido | Abierto |
| Publicidad pagada | Cerrada | Parcialmente abierta |
| Margen bruto | 6-30 % (pack actual) | 51-63 % |
