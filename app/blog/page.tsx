import { media } from '@/lib/config';
export const metadata = { title: 'Glowfit Journal' };
const POSTS = [
  { slug: 'lifestyle', cat: 'LIFESTYLE', title: 'El autocuidado empieza por dedicarte tiempo', img: '2026/10/FOTO-LIFESTYLE-BLOG-scaled.jpeg' },
  { slug: 'wellness', cat: 'WELLNESS', title: 'El proceso detrás de nuestros productos', img: '2026/10/FOTO-WELLNESS-scaled.jpeg' },
  { slug: 'fitness', cat: 'FITNESS', title: 'Nuestra rutina para sentirnos bien por dentro y por fuera', img: '2026/10/FOTO-FITNESS-1-scaled.jpeg' },
  { slug: 'nutricion', cat: 'NUTRICIÓN', title: 'Cómo organizar una alimentación equilibrada', img: '2026/10/FOTO-NUTRITION-1-scaled.jpeg' },
  { slug: 'beauty-self-care', cat: 'BEAUTY & SELF CARE', title: 'El autocuidado empieza por dedicarte tiempo', img: '2026/10/FOTO-BEAUTY-SELF-CARE-1-scaled.jpeg' },
  { slug: 'the-glowfit-edit', cat: 'THE GLOWFIT EDIT', title: 'El proceso detrás de nuestros productos', img: '2026/10/FOTO-THE-GLOWFIT-EDIT-scaled.jpeg' },
];
export default function Blog() {
  return (
    <>
      <section className="page-section narrow center blog-intro">
        <img className="brillo center" src={media('2026/05/BRILLO-LINEA.png')} alt="" />
        <h1 className="section-title">BIENVENIDOS A GLOWFIT JOURNAL</h1>
        <p className="lead">Un espacio creado para inspirarte a cuidar de ti.</p>
        <p>En Glowfit creemos que el bienestar va mucho más allá de lo físico. Está en los pequeños hábitos, en cómo empezamos el día, en el tiempo que dedicamos a nosotros mismos y en encontrar nuestro propio equilibrio.</p>
        <p>En este espacio compartiremos nuestra pasión por el fitness, la nutrición, la belleza y el estilo de vida saludable. También descubrirás consejos, ideas y experiencias que forman parte de nuestro día a día.</p>
        <p>Queremos acompañarte e inspirarte a crear una rutina que te haga sentir bien, a tu manera y a tu propio ritmo. Porque sentirte bien también es una forma de brillar.</p>
        <p className="script mid-script">Bienvenid@s a GlowFit</p>
        <img className="brillo center" src={media('2026/05/BRILLO-LINEA.png')} alt="" />
      </section>
      <section className="blog-grid-wrap" style={{ backgroundImage: `url(${media('2026/05/FONDO-COLOR-scaled.png')})` }}>
        <ul className="blog-grid">
          {POSTS.map((p) => (
            <li key={p.slug}>
              <a href={`/${p.slug}/`}>
                <img src={media(p.img)} alt="" loading="lazy" />
                <span className="kiona blog-cat">{p.cat}</span>
                <span className="blog-title">{p.title}</span>
              </a>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
