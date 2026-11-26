'use client';
import { useEffect, useState } from 'react';
import { sb } from '@/lib/supabase-browser';
import { adminFetch } from '@/lib/admin-fetch';
import { Icon, useToast } from './ui';

const KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const b64ToBytes = (b: string) => { const p = '='.repeat((4 - (b.length % 4)) % 4); const s = atob((b + p).replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from(s, (c) => c.charCodeAt(0)); };

type State = 'loading' | 'unsupported' | 'ios-install' | 'off' | 'on' | 'denied';

// Activa las notificaciones del panel en este dispositivo (nuevos pedidos y mensajes de clientes).
export default function NotifyCard({ compact = false }: { compact?: boolean }) {
  const toast = useToast();
  const [state, setState] = useState<State>('loading');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      const standalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
      if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) { setState(ios && !standalone ? 'ios-install' : 'unsupported'); return; }
      if (Notification.permission === 'denied') { setState('denied'); return; }
      const reg = await navigator.serviceWorker.register('/panel-7565gaii/sw.js', { scope: '/panel-7565gaii/' });
      const sub = await reg.pushManager.getSubscription();
      setState(sub && Notification.permission === 'granted' ? 'on' : 'off');
    })().catch(() => setState('unsupported'));
  }, []);

  async function enable() {
    if (!KEY) return toast('Falta configurar las notificaciones en el servidor.', 'err');
    setBusy(true);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') { setState(perm === 'denied' ? 'denied' : 'off'); return; }
      const reg = await navigator.serviceWorker.register('/panel-7565gaii/sw.js', { scope: '/panel-7565gaii/' });
      await navigator.serviceWorker.ready;
      const sub = (await reg.pushManager.getSubscription()) || (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToBytes(KEY) }));
      const j = sub.toJSON();
      const { error } = await sb().rpc('admin_push_subscribe', { p_endpoint: j.endpoint, p_keys: j.keys, p_user_agent: navigator.userAgent });
      if (error) throw error;
      setState('on');
      await adminFetch('/api/push/test/', { method: 'POST' });
      toast('¡Listo! Te hemos enviado una notificación de prueba');
    } catch { toast('No se pudieron activar. Inténtalo de nuevo.', 'err'); }
    finally { setBusy(false); }
  }
  async function disable() {
    setBusy(true);
    const reg = await navigator.serviceWorker.getRegistration('/panel-7565gaii/');
    const sub = await reg?.pushManager.getSubscription();
    if (sub) { await sb().rpc('admin_push_unsubscribe', { p_endpoint: sub.endpoint }); await sub.unsubscribe(); }
    setState('off'); setBusy(false); toast('Notificaciones desactivadas en este dispositivo');
  }

  if (state === 'loading' || (compact && (state === 'on' || state === 'unsupported'))) return null;
  return (
    <section className="ad-card ad-rise ad-notify">
      <h3><Icon name="alert" />Notificaciones en este dispositivo</h3>
      {state === 'on' && <>
        <p className="ad-muted">Activadas. Te avisaremos de cada <strong>pedido nuevo</strong> y cuando un <strong>cliente conteste</strong> al seguimiento.</p>
        <button className="ad-btn sm" disabled={busy} onClick={disable}>Desactivar en este dispositivo</button>
      </>}
      {state === 'off' && <>
        <p className="ad-muted">Recibe un aviso en el móvil con cada pedido nuevo y cuando un cliente te escriba.</p>
        <button className="ad-btn primary" disabled={busy} onClick={enable}>{busy ? <span className="ad-spinner sm" /> : 'Activar notificaciones'}</button>
      </>}
      {state === 'ios-install' && <>
        <p className="ad-muted">En iPhone, primero añade el panel a tu pantalla de inicio:</p>
        <ol className="ad-steps-list">
          <li>Abre esta página en <strong>Safari</strong>.</li>
          <li>Pulsa el botón <strong>Compartir</strong> (el cuadrado con la flecha hacia arriba).</li>
          <li>Elige <strong>«Añadir a pantalla de inicio»</strong>.</li>
          <li>Abre el panel desde el nuevo icono y vuelve aquí para pulsar <strong>Activar notificaciones</strong>.</li>
        </ol>
      </>}
      {state === 'denied' && <p className="ad-muted">Las notificaciones están bloqueadas para el panel. Actívalas en los ajustes del móvil o del navegador (Notificaciones → Glowfit Panel) y recarga esta página.</p>}
      {state === 'unsupported' && <p className="ad-muted">Este navegador no admite notificaciones. Seguirás recibiendo los avisos por email.</p>}
    </section>
  );
}
