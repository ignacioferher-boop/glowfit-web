// Validaciones compartidas entre el carrito y el servidor.

// Teléfono español: 9 cifras empezando por 6, 7, 8 o 9 (acepta +34 / 0034 delante).
export function normPhoneES(v: string) {
  let d = String(v || '').replace(/[^0-9+]/g, '');
  d = d.replace(/^(\+34|0034)/, '').replace(/\D/g, '');
  return /^[6-9]\d{8}$/.test(d) ? `+34 ${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}` : null;
}

// Nombre y al menos un apellido, solo letras.
export const validFullName = (v: string) => /^[\p{L}][\p{L}'’.-]*(\s+[\p{L}][\p{L}'’.-]*)+$/u.test(String(v || '').trim().replace(/\s+/g, ' '));

export const validEmailAddr = (v: string) => /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(String(v || '').trim());

// Detecta errores típicos al escribir el email (gmial.com, hotmal.com…)
const FIX: Record<string, string> = {
  'gmial.com': 'gmail.com', 'gmai.com': 'gmail.com', 'gmal.com': 'gmail.com', 'gmail.co': 'gmail.com', 'gmail.es': 'gmail.com', 'gnail.com': 'gmail.com', 'gamil.com': 'gmail.com',
  'hotmal.com': 'hotmail.com', 'hotmial.com': 'hotmail.com', 'hotmail.co': 'hotmail.com', 'hotmai.com': 'hotmail.com', 'homail.com': 'hotmail.com',
  'outlok.com': 'outlook.com', 'outlook.co': 'outlook.com', 'yaho.com': 'yahoo.com', 'yahoo.co': 'yahoo.com', 'iclod.com': 'icloud.com', 'icloud.co': 'icloud.com',
};
export function emailSuggestion(v: string) {
  const [u, d] = String(v || '').trim().toLowerCase().split('@');
  return u && d && FIX[d] ? `${u}@${FIX[d]}` : null;
}
