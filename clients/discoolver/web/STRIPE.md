# Stripe — checklist de activación (1 de septiembre)

El checkout está CONSTRUIDO Y DESPLEGADO pero dormido: sin las env de abajo,
los botones de compra no existen (las fichas siguen en "Avísame") y el API
responde 503 limpio. Activarlo NO es un deploy: son 3 env vars y un flip.

## 1. Cuenta y claves (Carlos, ~15 min)

1. Cuenta de Stripe de **Discoolver** (no la de SF — es facturación del cliente):
   https://dashboard.stripe.com/register
2. Developers → API keys → copiar la **Secret key** (`sk_live_…`).
   Para probar antes: la de test (`sk_test_…`) con tarjeta 4242 4242 4242 4242.

## 2. Webhook (2 min)

Developers → Webhooks → Add endpoint:
- URL: `https://discoolver-landing.vercel.app/api/stripe-webhook`
- Evento: `checkout.session.completed`
- Copiar el **Signing secret** (`whsec_…`).

## 3. Env en Vercel (proyecto discoolver-landing, Production)

```
STRIPE_SECRET_KEY      = sk_live_…
STRIPE_WEBHOOK_SECRET  = whsec_…
NEXT_PUBLIC_CHECKOUT   = 1        ← el flip del 1-sept (sin esto, todo sigue en "Avísame")
```

Redeploy (cualquier push o "Redeploy" en el dashboard) y la ficha de Madrid
enseña "Comprar digital · 14€ / Papel · 29€".

## Qué pasa con cada pedido

Stripe cobra → el webhook reenvía el pedido al buzón (`WAITLIST_FORWARD_EMAIL`,
hoy carlos@discoolver.com) con email del comprador, SKU, importe y dirección si
es papel. **El fulfillment de la digital es manual de momento**: responder al
pedido con el PDF del dg-editor. Automatizarlo (email con enlace de descarga al
completarse el pago) es el paso 2 — cuando el export del editor esté listo.

## Pendientes anotados

- **IVA**: hoy el precio va con impuestos incluidos sin desglose. Confirmar con
  el gestor el tratamiento (digital 21% / libro 4%) y activar Stripe Tax.
- Añadir ciudades: una línea en `SKUS` de `components/sections/Guides.tsx` +
  el producto en `lib/checkout.ts`. Precios se cambian ahí, no en el dashboard.
- Subir la digital a 19€ post-lanzamiento: `precio: 1900` en lib/checkout.ts.
