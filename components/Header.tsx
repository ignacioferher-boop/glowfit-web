'use client';
import { useState } from 'react';
import CartIcon from './CartIcon';
import { media } from '@/lib/config';

const NAV = [
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
          <CartIcon />
          <button className="menu-toggle" aria-expanded={open} aria-label="Abrir menú" onClick={() => setOpen(!open)}>
            <span /><span />
          </button>
        </div>
      </div>
    </header>
  );
}
