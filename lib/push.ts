import webpush from 'web-push';
import { supabasePublic } from './data';

// Notificaciones al móvil/ordenador de los administradores (panel instalado como app).
// Nunca lanza errores: si algo falla, solo se registra y la web sigue.
export async function notifyAdmins(msg: { title: string; body: string; url?: string; tag?: string }) {
  try {
    const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY; const priv = process.env.VAPID_PRIVATE_KEY; const secret = process.env.ORDER_SECRET;
    if (!pub || !priv || !secret || !supabasePublic) return 0;
    webpush.setVapidDetails(`mailto:${process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'info@glowfit.group'}`, pub, priv);
    const { data } = await supabasePublic.rpc('push_targets', { p_secret: secret });
    const payload = JSON.stringify({ ...msg, url: msg.url || '/panel-7565gaii/' });
    let sent = 0;
    await Promise.all(((data ?? []) as { endpoint: string; keys: { p256dh: string; auth: string } }[]).map(async (s) => {
      try { await webpush.sendNotification({ endpoint: s.endpoint, keys: s.keys }, payload, { TTL: 86400, timeout: 5000 }); sent++; }
      catch (e) {
        const code = (e as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) await supabasePublic!.rpc('push_disable', { p_secret: secret, p_endpoint: s.endpoint });
        else console.error('push', code, (e as Error).message);
      }
    }));
    return sent;
  } catch (e) { console.error('notifyAdmins', (e as Error).message); return 0; }
}
