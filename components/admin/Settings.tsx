'use client';
import { useState } from 'react';
import { sb } from '@/lib/supabase-browser';
import { SHIPPING } from '@/lib/config';
import { Icon, eur, useToast } from './ui';

export default function Settings({ email }: { email: string }) {
  const toast = useToast();
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  async function change(e: React.FormEvent) {
    e.preventDefault(); setErr('');
    if (pw.length < 8) return setErr('Usa al menos 8 caracteres.');
    if (pw !== pw2) return setErr('Las dos contraseñas no coinciden.');
    setBusy(true);
    const { error } = await sb().auth.updateUser({ password: pw });
    setBusy(false);
    if (error) return setErr('No se pudo cambiar. Prueba con otra contraseña.');
    setPw(''); setPw2(''); toast('Contraseña cambiada');
  }
  return (
    <div className="ad-settings">
      <section className="ad-card ad-rise">
        <h3><Icon name="lock" />Tu cuenta</h3>
        <p className="ad-muted">Has entrado como <strong>{email}</strong>.</p>
        <form onSubmit={change} className="ad-form-narrow">
          <label className="ad-field"><span>Nueva contraseña</span><input type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} /></label>
          <label className="ad-field"><span>Repite la contraseña</span><input type="password" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} /></label>
          {err && <p className="ad-error" role="alert">{err}</p>}
          <button className="ad-btn primary" disabled={busy || !pw}>Cambiar contraseña</button>
        </form>
      </section>
      <section className="ad-card ad-rise" style={{ animationDelay: '60ms' }}>
        <h3><Icon name="truck" />Envíos y pagos</h3>
        <dl className="ad-dl">
          <dt>Envío estándar</dt><dd>{eur(SHIPPING.standardCents)}</dd>
          <dt>Envío gratis desde</dt><dd>{SHIPPING.freeFromCents ? eur(SHIPPING.freeFromCents) : 'Nunca'}</dd>
          <dt>Plazo de entrega</dt><dd>{SHIPPING.minDays}–{SHIPPING.maxDays} días laborables</dd>
          <dt>Cobros</dt><dd>Stripe (tarjeta, Apple Pay, Google Pay, PayPal)</dd>
        </dl>
        <p className="ad-muted sm">Para cambiar tarifas o activar los emails automáticos, pídeselo a tu equipo técnico.</p>
      </section>
    </div>
  );
}
