import type { Review } from '@/lib/reviews';
import { avgRating } from '@/lib/reviews';

const stars = (n: number) => '★★★★★'.slice(0, Math.round(n)) + '☆☆☆☆☆'.slice(0, 5 - Math.round(n));
const fecha = (d: string) => new Date(d).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Madrid' });

export function RatingSummary({ reviews }: { reviews: Review[] }) {
  if (!reviews.length) return null;
  const avg = avgRating(reviews);
  return <a className="product-rating" href="#opiniones"><span className="stars" aria-hidden="true">{stars(avg)}</span>{avg.toFixed(1).replace('.', ',')} · {reviews.length} {reviews.length === 1 ? 'opinión' : 'opiniones'}</a>;
}

export default function Reviews({ reviews }: { reviews: Review[] }) {
  if (!reviews.length) return null;
  const avg = avgRating(reviews);
  return (
    <section className="reviews-block" id="opiniones" aria-label="Opiniones de clientes">
      <div className="reviews-head">
        <h2 className="section-title small" style={{ margin: 0 }}>OPINIONES</h2>
        <span className="stars" aria-label={`${avg} de 5`}>{stars(avg)}</span>
        <span>{avg.toFixed(1).replace('.', ',')} de 5 · {reviews.length} {reviews.length === 1 ? 'opinión' : 'opiniones'}</span>
      </div>
      <div className="reviews-list">
        {reviews.map((r) => (
          <article key={r.id} className="review-card">
            <div className="stars" aria-label={`${r.rating} de 5`}>{stars(r.rating)}</div>
            {r.title && <h4>{r.title}</h4>}
            {r.body && <p>{r.body}</p>}
            <div className="review-meta">{r.name} · {fecha(r.created_at)} · <span className="review-verified">Compra verificada</span></div>
            {r.reply && <div className="review-reply"><strong>Respuesta de Glowfit:</strong> {r.reply}</div>}
          </article>
        ))}
      </div>
    </section>
  );
}
