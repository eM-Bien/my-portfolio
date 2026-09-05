import Reveal from './Reveal';
import s from './Sections.module.scss';

// Wszystkie teksty to placeholdery – do podmiany.
const SERVICES = [
  {
    n: '01',
    title: 'Lorem ipsum',
    body: 'Dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore.',
  },
  {
    n: '02',
    title: 'Dolor sit amet',
    body: 'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip.',
  },
  {
    n: '03',
    title: 'Consectetur',
    body: 'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat.',
  },
];

const PROJECTS = [
  { year: '2026', title: 'Aliquam Erat', body: 'Volutpat morbi tristique senectus et netus et malesuada fames.', tags: ['Next.js', 'GSAP'] },
  { year: '2025', title: 'Vestibulum Ante', body: 'Ipsum primis in faucibus orci luctus et ultrices posuere cubilia.', tags: ['React', 'SCSS'] },
  { year: '2025', title: 'Pellentesque Habitant', body: 'Morbi tristique senectus et netus et malesuada fames ac turpis.', tags: ['TypeScript', 'WebGL'] },
  { year: '2024', title: 'Curabitur Blandit', body: 'Tempus porttitor nulla vitae elit libero a pharetra augue.', tags: ['Next.js', 'CMS'] },
];

export function Intro() {
  return (
    <section className={s.section} id="o-mnie">
      <Reveal className={s.head}>
        <span className={s.eyebrow}>Lorem ipsum</span>
        <h2>Sed ut perspiciatis unde omnis iste natus error sit voluptatem.</h2>
        <p className={s.muted}>
          Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia
          consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro
          quisquam est, qui dolorem ipsum quia dolor sit amet.
        </p>
      </Reveal>
    </section>
  );
}

export function Services() {
  return (
    <section className={s.section} id="uslugi">
      <Reveal className={s.head}>
        <span className={s.eyebrow}>Dolor sit</span>
        <h2>At vero eos et accusamus</h2>
      </Reveal>

      <div className={s.cards}>
        {SERVICES.map((it, i) => (
          <Reveal key={it.n} delay={i * 0.12}>
            <article className={s.card}>
              <span className={s.num}>{it.n}</span>
              <h3>{it.title}</h3>
              <p>{it.body}</p>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

export function Work() {
  return (
    <section className={s.section} id="realizacje">
      <Reveal className={s.head}>
        <span className={s.eyebrow}>Consectetur</span>
        <h2>Et harum quidem rerum</h2>
      </Reveal>

      <div className={s.projects}>
        {PROJECTS.map((p, i) => (
          <Reveal key={p.title} delay={i * 0.08}>
            <article className={s.project}>
              <span className={s.year}>{p.year}</span>
              <div>
                <h3>{p.title}</h3>
                <p>{p.body}</p>
              </div>
              <div className={s.tags}>
                {p.tags.map((tg) => (
                  <span key={tg}>{tg}</span>
                ))}
              </div>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

export function Contact() {
  return (
    <section className={`${s.section} ${s.contact}`} id="kontakt">
      <Reveal>
        <span className={s.eyebrow}>Temporibus autem</span>
        <h2>Quis autem vel eum iure?</h2>
        <p className={s.muted}>
          Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit.
        </p>
        <a className={s.mail} href="mailto:lorem@ipsum.dev">
          lorem@ipsum.dev
        </a>
      </Reveal>
    </section>
  );
}

export function Footer() {
  return (
    <footer className={s.footer}>
      <span>© {new Date().getFullYear()} Lorem Ipsum</span>
      <span>Sed ut perspiciatis</span>
    </footer>
  );
}
