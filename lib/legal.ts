// Datos del titular para los textos legales. PENDIENTE CLIENTE: completar NIF, domicilio y email.
export const LEGAL = {
  owner: process.env.NEXT_PUBLIC_LEGAL_OWNER || 'Antonio José Pavón Galán',
  nif: process.env.NEXT_PUBLIC_LEGAL_NIF || '[NIF pendiente]',
  address: process.env.NEXT_PUBLIC_LEGAL_ADDRESS || '[domicilio fiscal pendiente]',
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || '[email de contacto pendiente]',
  brand: 'Glowfit',
  updated: '23 de noviembre de 2026',
  termsVersion: '2026-11-23',
};
