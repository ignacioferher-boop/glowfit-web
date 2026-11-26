'use client';
import { useState } from 'react';
import CartIcon from './CartIcon';
import { CurrencySelect } from './currency';
import { media } from '@/lib/config';

const NAV = [
  { href: '/', label: 'INICIO' },
  { href: '/productos/', label: 'PRODUCTOS' },
  { href: '/blog/', label: 'BLOG' },
  { href: '/sobre-nosotros/', label: 'CONTACTO' },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="site-header">
      <div className="header-inner">
        <a href="/" className="logo" aria-label="Glowfit, inicio"><img src={media('2026/05/LOGO-GLOWFIT.png')} alt="Glowfit" /></a>
        <nav className={`main-nav ${open ? 'open' : ''}`} aria-label="Principal">
          {NAV.map((n) => <a key={n.href} href={n.href} onClick={() => setOpen(false)}>{n.label}</a>)}
        </nav>
        <div className="header-actions">
          <CurrencySelect />
          <a href="/mi-cuenta/" className="account-link" aria-label="Mi cuenta" title="Mi cuenta"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg><span>Mi cuenta</span></a>
          <CartIcon />
          <button className="menu-toggle" aria-expanded={open} aria-label="Abrir menú" onClick={() => setOpen(!open)}>
            <span /><span />
          </button>
        </div>
      </div>
    </header>
  );
}
