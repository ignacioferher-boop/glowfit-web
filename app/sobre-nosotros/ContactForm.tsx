'use client';
import { useState } from 'react';
export default function ContactForm() {
  const [state, setState] = useState<'idle' | 'sending' | 'ok' | 'error'>('idle');
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState('sending');
    const data = Object.fromEntries(new FormData(e.currentTarget));
    const res = await fetch('/api/contact/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).catch(() => null);
    setState(res?.ok ? 'ok' : 'error');
  }
  if (state === 'ok') return <p className="success" role="status">¡Gracias! Hemos recibido tu mensaje y te responderemos pronto.</p>;
  return (
    <form className="contact-form" onSubmit={onSubmit}>
      <div className="row">
        <label>Nombre<input name="first_name" required autoComplete="given-name" /></label>
        <label>Apellidos<input name="last_name" autoComplete="family-name" /></label>
      </div>
      <label>Email<input name="email" type="email" required autoComplete="email" /></label>
      <label>Teléfono<input name="phone" type="tel" autoComplete="tel" /></label>
      <label>Mensaje<textarea name="message" rows={5} required /></label>
      <input name="website" className="hp" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <label className="accept"><input type="checkbox" required /> <span>Acepto la <a href="/politica-de-privacidad/">política de privacidad</a>.</span></label>
      {state === 'error' && <p className="error" role="alert">No hemos podido enviar tu mensaje. Inténtalo de nuevo o escríbenos por WhatsApp.</p>}
      <button className="btn" disabled={state === 'sending'}>{state === 'sending' ? 'Enviando…' : 'Enviar mensaje'}</button>
    </form>
  );
}
