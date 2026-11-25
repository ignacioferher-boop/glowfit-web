'use client';
import { useState } from 'react';

export default function ReviewForm({ o, t, initial, name: initialName }: { o: string; t: string; initial: number; name: string }) {
  const [rating, setRating] = useState(initial >= 1 && initial <= 5 ? initial : 0);
  const [hover, setHover] = useState(0);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [name, setName] = useState(initialName);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [sent, setSent] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr('');
    if (!rating) return setErr('Elige de 1 a 5 estrellas.');
    setBusy(true);
    const r = await fetch('/api/reviews/', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ o, t, rating, title, body, name }) }).catch(() => null);
    const d = r ? await r.json().catch(() => ({})) : {};
    setBusy(false);
    if (!r?.ok) return setErr(d.error || 'No se pudo enviar. Inténtalo de nuevo.');
    setSent(true);
  }
  if (sent) return <div className="review-thanks"><p className="review-big">¡Gracias, {name || 'de verdad'}! 💚</p><p>Tu opinión nos ayuda muchísimo. La publicaremos en la web en cuanto la revisemos.</p><a className="btn" href="/productos/">Volver a la tienda</a></div>;
  const labels = ['', 'Mala', 'Regular', 'Bien', 'Muy bien', '¡Excelente!'];
  return (
    <form className="checkout-form review-form" onSubmit={submit} noValidate>
      <div className="stars-input" role="radiogroup" aria-label="Valoración" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button type="button" key={n} role="radio" aria-checked={rating === n} aria-label={`${n} ${n === 1 ? 'estrella' : 'estrellas'}`} className={(hover || rating) >= n ? 'on' : ''} onMouseEnter={() => setHover(n)} onClick={() => setRating(n)}>★</button>
        ))}
        <span className="stars-label">{labels[hover || rating] || 'Pulsa para valorar'}</span>
      </div>
      <label>Título (opcional)<input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} placeholder="Resume tu experiencia" /></label>
      <label>Tu opinión<textarea rows={5} value={body} onChange={(e) => setBody(e.target.value)} maxLength={2000} placeholder="¿Qué te ha gustado? ¿Cómo lo tomas? ¿Lo recomendarías?" /></label>
      <label>Nombre que se mostrará<input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} /></label>
      {err && <p className="form-error" role="alert">{err}</p>}
      <button className="btn full" disabled={busy}>{busy ? 'Enviando…' : 'Enviar mi opinión'}</button>
      <p className="form-note">Solo publicamos opiniones de clientes que han comprado. Se mostrará tu nombre y la fecha.</p>
    </form>
  );
}
