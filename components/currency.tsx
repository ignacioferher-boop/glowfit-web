'use client';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export const CURRENCIES = [
  { code: 'EUR', label: 'Euro', flag: '🇪🇸' },
  { code: 'USD', label: 'Dólar EE. UU.', flag: '🇺🇸' },
  { code: 'PEN', label: 'Sol peruano', flag: '🇵🇪' },
  { code: 'ARS', label: 'Peso argentino', flag: '🇦🇷' },
  { code: 'BOB', label: 'Boliviano', flag: '🇧🇴' },
  { code: 'MXN', label: 'Peso mexicano', flag: '🇲🇽' },
  { code: 'COP', label: 'Peso colombiano', flag: '🇨🇴' },
  { code: 'CLP', label: 'Peso chileno', flag: '🇨🇱' },
] as const;
const NO_DECIMALS = new Set(['ARS', 'COP', 'CLP']);
const KEY = 'glowfit-currency';

type Ctx = { currency: string; setCurrency: (c: string) => void; rates: Record<string, number>; updated: string | null; format: (eurCents: number) => string };
const C = createContext<Ctx | null>(null);

const SYMBOL: Record<string, [string, boolean]> = { USD: ['US$', false], PEN: ['S/', false], ARS: ['$', true], BOB: ['Bs', false], MXN: ['$', true], COP: ['$', true], CLP: ['$', true] };
const fmt = (amount: number, code: string) => {
  if (code === 'EUR') return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: Number.isInteger(amount) ? 0 : 2 }).format(amount);
  const d = NO_DECIMALS.has(code) ? 0 : 2;
  const n = new Intl.NumberFormat('es-ES', { minimumFractionDigits: d, maximumFractionDigits: d, useGrouping: 'always' } as Intl.NumberFormatOptions).format(amount);
  const [sym, suffix] = SYMBOL[code] ?? [code, false];
  return `${sym} ${n}${suffix ? ` ${code}` : ''}`;
};

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCur] = useState('EUR');
  const [rates, setRates] = useState<Record<string, number>>({ EUR: 1 });
  const [updated, setUpdated] = useState<string | null>(null);
  useEffect(() => {
    try { const c = localStorage.getItem(KEY); if (c) setCur(c); } catch {}
    fetch('/api/rates/').then((r) => r.json()).then((d) => { if (d?.rates) { setRates(d.rates); setUpdated(d.updated); } }).catch(() => {});
  }, []);
  const setCurrency = (c: string) => { setCur(c); try { localStorage.setItem(KEY, c); } catch {} };
  const active = rates[currency] ? currency : 'EUR';
  const format = (eurCents: number) => fmt((eurCents / 100) * (rates[active] ?? 1), active);
  return <C.Provider value={{ currency: active, setCurrency, rates, updated, format }}>{children}</C.Provider>;
}

export function useCurrency() {
  const c = useContext(C);
  if (!c) throw new Error('useCurrency fuera de CurrencyProvider');
  return c;
}

export function Price({ cents, className }: { cents: number; className?: string }) {
  const { format } = useCurrency();
  return <span className={className}>{format(cents)}</span>;
}

export function CurrencySelect() {
  const { currency, setCurrency, rates } = useCurrency();
  const list = CURRENCIES.filter((c) => rates[c.code]);
  if (list.length < 2) return null;
  return (
    <label className="currency-select">
      <span className="sr-only">Moneda</span>
      <select value={currency} onChange={(e) => setCurrency(e.target.value)} aria-label="Cambiar moneda">
        {list.map((c) => <option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}
      </select>
      <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true"><path d="M1 3l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.4" /></svg>
    </label>
  );
}

// Aviso cuando se muestran precios en otra moneda: el cobro siempre es en euros.
export function CurrencyNote({ eurCents }: { eurCents?: number }) {
  const { currency } = useCurrency();
  if (currency === 'EUR') return null;
  return (
    <p className="currency-note">
      Precios aproximados en {currency}, actualizados automáticamente. El pago se realiza en euros
      {eurCents !== undefined && <> ({new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(eurCents / 100)})</>}; tu banco aplicará su cambio.
    </p>
  );
}
