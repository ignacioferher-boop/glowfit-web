import { SHIPPING } from '@/lib/config';
import { Price } from './currency';

const I = {
  truck: <path d="M3 6h11v9H3zM14 9h4l3 3v3h-7M7 18.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM17 18.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z" />,
  clock: <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2" />,
  lock: <path d="M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3" />,
  back: <path d="M4 10h11a5 5 0 0 1 0 10h-3M4 10l4-4M4 10l4 4" />,
};
const Icon = ({ d }: { d: React.ReactNode }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>
);

export default function TrustBar({ variant = 'row' }: { variant?: 'row' | 'list' }) {
  const items: { i: React.ReactNode; t: React.ReactNode; s: string }[] = [
    { i: I.truck, t: SHIPPING.freeFromCents > 0 ? <>Envío gratis desde <Price cents={SHIPPING.freeFromCents} /></> : 'Envío a toda España', s: 'Pedidos a toda España' },
    { i: I.clock, t: `Entrega en ${SHIPPING.minDays}–${SHIPPING.maxDays} días`, s: 'Días laborables' },
    { i: I.lock, t: 'Pago 100% seguro', s: 'Tarjeta, Apple Pay, Google Pay, PayPal' },
    { i: I.back, t: '14 días para devolver', s: 'Productos sin abrir' },
  ];
  return (
    <ul className={`trust trust-${variant}`}>
      {items.map((x) => (
        <li key={x.s}><span className="trust-icon"><Icon d={x.i} /></span><span><strong>{x.t}</strong><small>{x.s}</small></span></li>
      ))}
    </ul>
  );
}
