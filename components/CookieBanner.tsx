'use client';
import { useEffect, useState } from 'react';
export default function CookieBanner() {
  const [show, setShow] = useState(false);
  useEffect(() => { try { setShow(!localStorage.getItem('glowfit-cookies')); } catch {} }, []);
  if (!show) return null;
  const close = () => { try { localStorage.setItem('glowfit-cookies', 'ok'); } catch {} setShow(false); };
  return (
    <div className="cookie-banner" role="dialog" aria-label="Aviso de cookies">
      <p>Usamos solo cookies técnicas necesarias para que la tienda funcione (carrito y pago). <a href="/politica-de-cookies/">Más información</a></p>
      <button className="btn btn-small" onClick={close}>Entendido</button>
    </div>
  );
}
