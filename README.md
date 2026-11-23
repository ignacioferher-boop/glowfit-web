# Glowfit · tienda online

Next.js + Supabase (proyecto `glowfit`) + Stripe Checkout. Se publica en Vercel (proyecto `glowfit`) con cada push a `main`.

## Variables de entorno (Vercel → Settings → Environment Variables)
Ver `.env.example`. Para activar pagos y contacto hacen falta:
`SUPABASE_SECRET_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_WHATSAPP`.
Opcionales: `SHIPPING_STANDARD_CENTS` (por defecto 495), `SHIPPING_FREE_FROM_CENTS` (por defecto 5000).

Webhook de Stripe: `https://<dominio>/api/stripe/webhook/` con el evento `checkout.session.completed`.

## Contenido
- Productos y precios: tabla `products` en Supabase.
- Textos legales y artículos del blog: tabla `pages`.
- Fotos y tipografías: bucket público `media`.
- Pedidos: tabla `orders`. Mensajes de contacto: `contact_messages`.
