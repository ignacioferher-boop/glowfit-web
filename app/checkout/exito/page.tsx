import ClearCart from './ClearCart';
export const metadata = { title: 'Pedido confirmado', robots: { index: false } };
export default function Exito() {
  return (
    <section className="page-section narrow center">
      <ClearCart />
      <p className="script big-script">¡Gracias!</p>
      <h1 className="section-title">TU PEDIDO ESTÁ CONFIRMADO</h1>
      <p>Te hemos enviado un email con el recibo de tu compra. En cuanto lo enviemos te avisaremos.</p>
      <a className="btn" href="/">Volver al inicio</a>
    </section>
  );
}
