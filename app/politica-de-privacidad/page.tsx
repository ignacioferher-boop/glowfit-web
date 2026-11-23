import LegalLayout from '@/components/legal/LegalLayout';
import { LEGAL } from '@/lib/legal';
export const metadata = { title: 'Política de privacidad' };

export default function Page() {
  return (
    <LegalLayout
      current="/politica-de-privacidad/"
      eyebrow="PROTECCIÓN DE DATOS"
      title="POLÍTICA DE PRIVACIDAD"
      intro={<p>En {LEGAL.brand} cuidamos tus datos tanto como tu bienestar. Aquí te explicamos qué datos recogemos, para qué y cuáles son tus derechos, conforme al Reglamento (UE) 2016/679 (RGPD) y la Ley Orgánica 3/2018 (LOPDGDD).</p>}
      sections={[
        { id: 'responsable', title: 'Responsable del tratamiento', body: <>
          <p><strong>{LEGAL.owner}</strong> · NIF {LEGAL.nif} · {LEGAL.address} · {LEGAL.email}</p>
        </> },
        { id: 'datos', title: 'Qué datos recogemos', body: <ul>
          <li><strong>Al comprar:</strong> nombre y apellidos, email, teléfono, dirección de envío y productos comprados. Los datos de pago los trata directamente Stripe; nosotros no los vemos.</li>
          <li><strong>Al contactarnos:</strong> nombre, email, teléfono y el mensaje que nos envías.</li>
        </ul> },
        { id: 'finalidades', title: 'Para qué los usamos y base legal', body: <>
          <div className="legal-table" role="table">
            <div role="row" className="head"><span role="columnheader">Finalidad</span><span role="columnheader">Base legal</span></div>
            <div role="row"><span role="cell">Gestionar tu pedido, el pago, el envío y la atención al cliente</span><span role="cell">Ejecución del contrato (art. 6.1.b RGPD)</span></div>
            <div role="row"><span role="cell">Emitir facturas y cumplir obligaciones fiscales</span><span role="cell">Obligación legal (art. 6.1.c RGPD)</span></div>
            <div role="row"><span role="cell">Enviarte por email comunicaciones comerciales de productos {LEGAL.brand} similares a los que compraste</span><span role="cell">Interés legítimo y art. 21.2 LSSI. Puedes oponerte al comprar y en cualquier momento</span></div>
            <div role="row"><span role="cell">Responder a tus consultas</span><span role="cell">Consentimiento (art. 6.1.a RGPD)</span></div>
          </div>
        </> },
        { id: 'conservacion', title: 'Cuánto tiempo los guardamos', body: <p>Los datos de compra se conservan durante la relación comercial y, después, durante los plazos legales (6 años para documentación mercantil y fiscal). Los datos para comunicaciones comerciales, hasta que te des de baja.</p> },
        { id: 'destinatarios', title: 'Con quién los compartimos', body: <>
          <p>Solo con los proveedores necesarios para prestar el servicio, con los que tenemos contrato de encargo de tratamiento:</p>
          <ul>
            <li><strong>Stripe</strong> (pagos).</li>
            <li><strong>Supabase</strong> (base de datos, servidores en la UE) y <strong>Vercel</strong> (alojamiento web).</li>
            <li>Empresa de transporte (solo nombre, dirección y teléfono para la entrega).</li>
          </ul>
          <p>Algunos de estos proveedores pueden tratar datos fuera del Espacio Económico Europeo con garantías adecuadas (cláusulas contractuales tipo de la Comisión Europea o Marco de Privacidad de Datos UE-EE. UU.). No vendemos tus datos.</p>
        </> },
        { id: 'derechos', title: 'Tus derechos', body: <>
          <p>Puedes ejercer tus derechos de <strong>acceso, rectificación, supresión, oposición, limitación y portabilidad</strong> escribiendo a {LEGAL.email} con una copia de tu documento de identidad.</p>
          <p>Si consideras que no hemos tratado bien tus datos, puedes reclamar ante la Agencia Española de Protección de Datos (<a href="https://www.aepd.es" target="_blank" rel="noopener">aepd.es</a>).</p>
        </> },
        { id: 'seguridad', title: 'Seguridad', body: <p>Aplicamos medidas técnicas y organizativas para proteger tus datos: conexión cifrada (HTTPS), acceso restringido a la base de datos y pagos procesados por un proveedor certificado PCI-DSS.</p> },
      ]}
    />
  );
}
