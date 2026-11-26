'use client';
import { useState } from 'react';

export type Msg = { author: 'auto' | 'cliente' | 'glowfit'; body: string; created_at: string };
const fmt = (d: string) => new Date(d).toLocaleString('es-ES', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' });

export default function FollowupChat({ o, t, initial, paused: initialPaused, askStop }: { o: string; t: string; initial: Msg[]; paused: boolean; askStop: boolean }) {
  const [msgs, setMsgs] = useState(initial);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [sent, setSent] = useState(false);
  const [paused, setPaused] = useState(initialPaused);
  async function call(body: Record<string, unknown>) {
    const r = await fetch('/api/followup/', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ o, t, ...body }) }).catch(() => null);
    const d = r ? await r.json().catch(() => ({})) : {};
    return { ok: !!r?.ok, d };
  }
  async function send(e: React.FormEvent) {
    e.preventDefault(); setErr('');
    if (text.trim().length < 2) return setErr('Escribe tu mensaje.');
    setBusy(true);
    const { ok, d } = await call({ body: text });
    setBusy(false);
    if (!ok) return setErr(d.error || 'No se pudo enviar. Inténtalo de nuevo.');
    setMsgs([...msgs, { author: 'cliente', body: text.trim(), created_at: new Date().toISOString() }]);
    setText(''); setSent(true);
  }
  async function stop(v: boolean) {
    setBusy(true);
    const { ok } = await call({ stop: v });
    setBusy(false);
    if (ok) setPaused(v);
  }
  return (
    <div className="fu-wrap">
      {askStop && (
        <div className="fu-stop">
          {paused
            ? <p>Hecho: no te enviaremos más mensajes de seguimiento de este pedido. <button className="btn-link" disabled={busy} onClick={() => stop(false)}>Volver a activarlos</button></p>
            : <><p>¿Prefieres no recibir más mensajes de seguimiento de este pedido?</p><button className="btn" disabled={busy} onClick={() => stop(true)}>Sí, no enviarme más</button></>}
        </div>
      )}
      <ol className="fu-thread">
        {msgs.map((m, i) => (
          <li key={i} className={m.author === 'cliente' ? 'me' : 'them'}>
            <span className="fu-who">{m.author === 'cliente' ? 'Tú' : 'Glowfit'} · {fmt(m.created_at)}</span>
            <div className="fu-bubble">{m.body}</div>
          </li>
        ))}
      </ol>
      <form className="checkout-form review-form" onSubmit={send} noValidate>
        <label>{msgs.some((m) => m.author === 'cliente') ? 'Escríbenos de nuevo' : 'Tu respuesta'}
          <textarea rows={5} value={text} onChange={(e) => { setText(e.target.value); setSent(false); }} maxLength={3000} placeholder="Cuéntanos qué tal te va, lo que quieras. Te leemos." />
        </label>
        {err && <p className="form-error" role="alert">{err}</p>}
        {sent && <p className="form-note" role="status">¡Recibido! 💚 Te contestaremos por email lo antes posible.</p>}
        <button className="btn full" disabled={busy}>{busy ? 'Enviando…' : 'Enviar mensaje'}</button>
        <p className="form-note">Solo el equipo de Glowfit lee estos mensajes. No se publican en ningún sitio.</p>
      </form>
    </div>
  );
}
