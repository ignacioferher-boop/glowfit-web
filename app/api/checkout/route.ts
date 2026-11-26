import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getProducts, supabasePublic } from '@/lib/data';
import { LEGAL } from '@/lib/legal';
import { SHIPPING } from '@/lib/config';
import { checkStock } from '@/lib/stock';
import { getInventorySettings } from '@/lib/settings';
import { allow, clientIp, tooMany } from '@/lib/ratelimit';
import { normPhoneES, validEmailAddr, validFullName } from '@/lib/validate';
import { allDigital, isDigital, isFreeShipping } from '@/lib/digital';

type CustomerIn = { name?: string; email?: string; phone?: string; accepts_marketing?: boolean; accepted_terms?: boolean };

export async function POST(req: Request) {
  let body: { items?: { slug: string; qty: number }[]; customer?: CustomerIn };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Petición no válida' }, { status: 400 }); }
  const requested = (body.items || []).filter((i) => typeof i.slug === 'string' && Number.isInteger(i.qty) && i.qty > 0 && i.qty <= 20);
  if (!requested.length) return NextResponse.json({ error: 'El carrito está vacío' }, { status: 400 });

  // Datos del cliente: obligatorios para comprar
  const c = body.customer || {};
  const name = String(c.name || '').trim().slice(0, 200);
  const email = String(c.email || '').trim().toLowerCase().slice(0, 200);
  const phone = normPhoneES(String(c.phone || '')) ?? '';
  if (!validFullName(name) || !validEmailAddr(email) || !phone)
    return NextResponse.json({ error: 'Revisa tu nombre, email y teléfono' }, { status: 400 });
  if (c.accepted_terms !== true) return NextResponse.json({ error: 'Debes aceptar las condiciones de contratación' }, { status: 400 });

  // Frena a quien intente bloquear el stock abriendo pagos sin parar
  const ip = clientIp(req);
  if (!(await allow(`checkout:ip:${ip}`, 8, 600)) || !(await allow(`checkout:email:${email}`, 5, 600)))
    return tooMany('Has iniciado demasiados pagos seguidos. Espera unos minutos y vuelve a intentarlo.');

  const stockError = await checkStock(requested);
  if (stockError) return NextResponse.json({ error: stockError }, { status: 409 });

  const customer = { name, email, phone, accepts_marketing: c.accepts_marketing !== false, terms_version: LEGAL.termsVersion, cart: requested };
  let { error: custErr } = await supabasePublic!.rpc('save_customer', { p_secret: process.env.ORDER_SECRET, p_row: customer });
  if (custErr?.code === 'PGRST202') ({ error: custErr } = await supabasePublic!.from('customers').insert(customer));
  if (custErr) console.error('Error guardando cliente', custErr.message);

  const secret = (process.env.STRIPE_SECRET_KEY || '').trim();
  if (!secret) console.error('checkout: falta STRIPE_SECRET_KEY');
  if (!secret) return NextResponse.json({ error: 'El pago online se activará en breve. Hemos guardado tus datos y te contactaremos para completar tu pedido.' }, { status: 503 });
  const stripe = new Stripe(secret);

  // Precios siempre desde la base de datos, nunca desde el navegador
  const catalog = await getProducts();
  const lines = requested.flatMap((r) => {
    const p = catalog.find((c) => c.slug === r.slug);
    return p ? [{ p, qty: r.qty }] : [];
  });
  if (!lines.length) return NextResponse.json({ error: 'Los productos ya no están disponibles' }, { status: 400 });
  // Si algo del carrito ya no se vende, avisamos en vez de cobrar el resto sin decir nada
  const missing = requested.filter((r) => !catalog.some((p) => p.slug === r.slug));
  if (missing.length) return NextResponse.json({ error: 'Uno de los productos de tu carrito ya no está disponible. Quítalo del carrito para continuar.', unavailable: missing.map((m) => m.slug) }, { status: 409 });

  const subtotal = lines.reduce((n, l) => n + l.p.price_cents * l.qty, 0);
  const free = (SHIPPING.freeFromCents > 0 && subtotal >= SHIPPING.freeFromCents) || lines.every((l) => isFreeShipping(l.p.slug));
  const site = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;
  // Solo productos digitales (la guía): sin envío ni dirección
  const digitalOnly = allDigital(lines.map((l) => l.p.slug));
  const hasDigital = lines.some((l) => isDigital(l.p.slug));

  // Reserva los botes durante el pago para que nadie más se los lleve.
  // Si el cliente no paga a tiempo, la reserva caduca sola y el stock vuelve a estar disponible.
  const orderSecret = process.env.ORDER_SECRET;
  const inv = await getInventorySettings();
  // Reserva del stock: lo que diga el panel (mínimo 5 min). La página de pago de Stripe exige al menos 30 min de vida.
  const minutes = Math.max(5, Math.min(1440, inv.reserve_minutes || 10));
  const sessionMinutes = Math.max(30, minutes);
  let reservation: string | null = null;
  if (orderSecret) {
    const { data: r, error: rErr } = await supabasePublic!.rpc('reserve_stock', { p_secret: orderSecret, p_items: lines.map(({ p, qty }) => ({ slug: p.slug, qty })), p_minutes: minutes });
    if (rErr) console.error('reserve_stock', rErr);
    const res = r as { ok: boolean; reservation?: string; product?: string; left?: number; error?: string } | null;
    if (res && !res.ok) {
      const msg = res.error || (res.left === 0
        ? `Se nos ha agotado ${res.product}. Quítalo del carrito para continuar.`
        : `Solo nos quedan ${res.left} ${res.left === 1 ? 'bote' : 'botes'} de ${res.product}. Baja la cantidad para continuar.`);
      return NextResponse.json({ error: msg }, { status: 409 });
    }
    reservation = res?.reservation ?? null;
  }
  const release = () => reservation && orderSecret ? supabasePublic!.rpc('attach_reservation', { p_secret: orderSecret, p_reservation: reservation, p_session: null, p_release: true }) : null;

  let session: Stripe.Checkout.Session;
  try {
  session = await stripe.checkout.sessions.create({
    mode: 'payment',
    expires_at: Math.floor(Date.now() / 1000) + sessionMinutes * 60,
    locale: 'es',
    line_items: lines.map(({ p, qty }) => ({
      quantity: qty,
      price_data: {
        currency: 'eur',
        unit_amount: p.price_cents,
        product_data: { name: p.name, images: p.images.slice(0, 1), metadata: { slug: p.slug } },
      },
    })),
    ...(digitalOnly ? {} : { shipping_address_collection: { allowed_countries: ['ES'] as Stripe.Checkout.SessionCreateParams.ShippingAddressCollection.AllowedCountry[] } }),
    // Contenido digital: aviso legal de entrega inmediata (art. 103 m LGDCU)
    ...(hasDigital ? { custom_text: { submit: { message: 'La guía se entrega al momento dentro de la app Glowfit (te enviamos tu código por email). Al pagar aceptas su entrega inmediata y que, por ser contenido digital, no se puede devolver una vez enviada.' } } } : {}),
    // Opción "Comprar como empresa": Stripe pide y valida el NIF/CIF para la factura
    tax_id_collection: { enabled: true },
    customer_creation: 'always',
    // Factura en PDF automática (Stripe la envía y la guarda)
    invoice_creation: { enabled: true, invoice_data: { description: 'Pedido en glowfit.group', footer: `${LEGAL.owner} · ${LEGAL.email}`, metadata: { site: 'glowfit' } } },
    // Campo "Código promocional" en el pago
    allow_promotion_codes: true,
    // Si no paga a tiempo, Stripe guarda un enlace para retomar la compra (lo usamos en el email de carrito abandonado)
    after_expiration: { recovery: { enabled: true, allow_promotion_codes: true } },
    billing_address_collection: 'auto',
    customer_email: email,
    ...(digitalOnly ? {} : {
      shipping_options: [{
      shipping_rate_data: {
        type: 'fixed_amount',
        display_name: free ? 'Envío gratis' : 'Envío estándar',
        fixed_amount: { amount: free ? 0 : SHIPPING.standardCents, currency: 'eur' },
        delivery_estimate: { minimum: { unit: 'business_day', value: SHIPPING.minDays }, maximum: { unit: 'business_day', value: SHIPPING.maxDays } },
      },
    }],
    }),
    metadata: { reservation: reservation ?? '', items: JSON.stringify(lines.map(({ p, qty }) => ({ slug: p.slug, qty }))), name, phone, accepts_marketing: String(c.accepts_marketing !== false), terms_version: LEGAL.termsVersion },
    success_url: `${site}/checkout/exito/?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${site}/carrito/`,
  });
  } catch (e) {
    console.error('Stripe checkout', e);
    await release();
    return NextResponse.json({ error: 'No se pudo iniciar el pago. Inténtalo de nuevo en un momento.' }, { status: 502 });
  }
  if (reservation && orderSecret) await supabasePublic!.rpc('attach_reservation', { p_secret: orderSecret, p_reservation: reservation, p_session: session.id });

  return NextResponse.json({ url: session.url });
}
