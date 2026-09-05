'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import HairCanvas from './HairCanvas';
import s from './Scene.module.scss';

gsap.registerPlugin(ScrollTrigger);

/**
 * Choreografia scrolla (progress 0 -> 1 na wysokości sekcji):
 *   0.00–0.25  tytuł wchodzi i znika
 *   0.10–0.44  jabłko odrywa się od gałęzi i spada łukiem do dłoni
 *   0.44–0.50  odbicie / squash przy złapaniu
 *   0.46–1.00  kamera wjeżdża w scenę i przechodzi za krzaki
 *   0.50–0.92  drzewa kładą się do tyłu jak papierowa kulisa
 *
 * Pin robi CSS `position: sticky` – nie ScrollTrigger. Mniej DOM-u,
 * brak pin-spacera, brak skoków przy resize.
 */
export default function Scene() {
  const root = useRef<HTMLElement | null>(null);
  // 0 = dłoń otwarta, 1 = dłoń zaciśnięta na jabłku. Czytane przez shader co klatkę.
  const handMix = useRef(0);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduce) return;

      // Stan startowy ustawiamy POZA timeline'em. Zero-duration `set()`
      // dokładnie w pozycji 0 scrubowanego timeline'a potrafi się nie
      // wyrenderować, zanim użytkownik ruszy scrollem – jabłko zostawało
      // wtedy w dłoni od pierwszej klatki.
      // Jabłko spada pionowo z góry kadru. Lekki offset w bok (7%) jest po to,
      // żeby tor nie był idealnie prosty – ale to dryf, nie lot po skosie.
      const fig = root.current?.querySelector(`.${s.figure}`) as HTMLElement | null;
      const startX = (fig?.clientWidth ?? 400) * 0.07;
      const startY = (fig?.clientHeight ?? 700) * -0.72;

      gsap.set(`.${s.apple}`, { autoAlpha: 0, x: startX, y: startY, scale: 0.75, rotation: 0 });

      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: root.current,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.6,
          invalidateOnRefresh: true,
        },
      });

      // --- tytuł: widoczny od razu, znika przy scrollu --------------------
      gsap.fromTo(
        `.${s.title}`,
        { autoAlpha: 0, y: 30 },
        { autoAlpha: 1, y: 0, duration: 1.1, ease: 'power2.out', delay: 0.2 }
      );
      tl.to(`.${s.title}`, { autoAlpha: 0, y: -40, duration: 0.14 }, 0.06);

      // --- jabłko: spadek łukiem do dłoni --------------------------------
      tl.fromTo(`.${s.apple}`, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.03 }, 0.1)
        // boczny dryf wygasa wcześnie, pion przyspiesza do końca – grawitacja
        .fromTo(`.${s.apple}`, { x: startX }, { x: 0, duration: 0.26, ease: 'sine.out' }, 0.1)
        .fromTo(`.${s.apple}`, { y: startY }, { y: 0, duration: 0.34, ease: 'power2.in' }, 0.1)
        .fromTo(
          `.${s.apple}`,
          { rotation: 0, scale: 0.75 },
          { rotation: 380, scale: 1, duration: 0.34 },
          0.1
        )
        // złapanie: krótkie ściśnięcie
        .to(`.${s.apple}`, { scaleY: 0.86, scaleX: 1.12, duration: 0.02, ease: 'power2.out' }, 0.44)
        .to(`.${s.apple}`, { scaleY: 1, scaleX: 1, duration: 0.04, ease: 'elastic.out(1, 0.4)' }, 0.46);

      // drobne drgnięcie ręki w momencie złapania
      tl.to(`.${s.figure}`, { y: 6, duration: 0.02, ease: 'power2.out' }, 0.44)
        .to(`.${s.figure}`, { y: 0, duration: 0.05, ease: 'elastic.out(1, 0.5)' }, 0.46);

      // Podmiana musi być krótka: przy wolnym scrollu dłuższe przenikanie
      // pokazuje obie dłonie naraz. Wypada dokładnie wtedy, gdy jabłko
      // dolatuje i zasłania środek dłoni, więc cięcia praktycznie nie widać.
      // Spadające jabłko (to z liściem) zostaje na wierzchu. Namalowane jabłko
      // w grafice leży pod nim i wypełnia ewentualną szparę – dlatego nic nie
      // trzeba wycinać i nie da się odsłonić dziury. Na samej górze dłoń.
      handMix.current = 0;
      tl.to(handMix, { current: 1, duration: 0.02, ease: 'power3.inOut' }, 0.432)
        .fromTo(
          `.${s.handFront}`,
          { autoAlpha: 0 },
          { autoAlpha: 1, duration: 0.02, ease: 'power3.inOut' },
          0.432
        );

      // --- kamera: wjazd w scenę, wyjście za krzaki ----------------------
      const push = 0.46;
      const dur = 0.54;

      tl.to(`.${s.sky}`, { scale: 1.28, duration: dur }, push)
        .to(`.${s.trees}`, { scale: 2.3, yPercent: 12, duration: dur }, push)
        .to(`.${s.figureWrap}`, { scale: 1.85, yPercent: 8, duration: dur }, push)
        .to(`.${s.figureWrap}`, { autoAlpha: 0, duration: 0.14 }, push + dur * 0.62)
        // krzaki rosną i podnoszą się – kamera wchodzi W nie, nie nad nie
        .to(
          `.${s.foliage}`,
          { scale: 6.5, yPercent: -14, filter: 'blur(11px)', duration: dur, ease: 'power1.in' },
          push
        )
        .to(`.${s.vignette}`, { opacity: 1, duration: dur * 0.8 }, push + dur * 0.2)
        .to(`.${s.scrim}`, { opacity: 0, duration: 0.12 }, push);

      // --- drzewa kładą się do tyłu, jak papierowa kulisa ---------------
      // Zawias przy dolnej krawędzi i perspektywa są w SCSS – tu zostaje sam kąt.
      // Start po złapaniu jabłka: wcześniej ruch konkurowałby ze spadkiem.
      // power1.in: papier stoi na krawędzi i przyspiesza za punktem równowagi,
      // ale łagodniej niż power2 – ta przy foldDur 0.42 dawała 9° na 70% odcinka
      // i całe przewrócenie upchane w ostatnie 15% scrolla.
      const fold = 0.5;
      const foldDur = 0.42;

      tl.to(`.${s.trees} img`, { rotationX: 88, duration: foldDur, ease: 'power1.in' }, fold)
        // odwraca się od światła – filtr trzeba podać w całości, bo GSAP
        // nadpisuje inline'em cały `filter` z CSS-a
        .fromTo(
          `.${s.trees} img`,
          { filter: 'brightness(0.82) saturate(0.95)' },
          {
            filter: 'brightness(0.3) saturate(0.95)',
            duration: foldDur * 0.8,
            ease: 'power1.in',
          },
          fold
        )
        // przy ~88° zostaje kreska szerokości piksela; gasimy ją zamiast
        // czekać, aż dojedzie do pełnych 90°
        .to(`.${s.trees} img`, { autoAlpha: 0, duration: foldDur * 0.22 }, fold + foldDur * 0.78);

      // bliższe krzewy wjeżdżają od dołu i zamykają kadr
      tl.fromTo(
        `.${s.foliageNear}`,
        { opacity: 0, scale: 1.2, yPercent: 40 },
        { opacity: 1, duration: 0.1 },
        push + dur * 0.28
      ).to(
        `.${s.foliageNear}`,
        { scale: 4.4, yPercent: -34, duration: dur * 0.72, ease: 'power2.in' },
        push + dur * 0.28
      );
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <section className={s.hero} ref={root}>
      <div className={s.stage}>
        <div className={`${s.layer} ${s.sky}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/scene/sky.webp" alt="" aria-hidden="true" />
        </div>

        <div className={`${s.layer} ${s.trees}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/scene/trees.webp" alt="" aria-hidden="true" />
        </div>

        <div className={s.figureWrap}>
          <div className={s.figure}>
            <HairCanvas
              src="/scene/eve-open.webp"
              src2="/scene/eve-hold.webp"
              mask="/scene/hairmask.png"
              alt="Postać z rozwianymi włosami"
              className={s.figureImg}
              width={1024}
              height={1536}
              mixRef={handMix}
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className={s.apple} src="/scene/apple.webp" alt="" aria-hidden="true" />
            {/* Dłoń wycięta z oryginału, rysowana NAD jabłkiem – palce je obejmują.
                Pojawia się dopiero przy chwycie, bo do tego czasu dłoń jest otwarta. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className={s.handFront} src="/scene/hand-front.webp" alt="" aria-hidden="true" />
          </div>
        </div>

        <div className={`${s.layer} ${s.foliage}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/scene/foliage.webp" alt="" aria-hidden="true" />
        </div>

        <div className={`${s.layer} ${s.foliageNear}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/scene/foliage.webp" alt="" aria-hidden="true" />
        </div>

        <div className={s.vignette} aria-hidden="true" />
        <div className={s.scrim} aria-hidden="true" />

        <div className={s.title}>
          <p className={s.kicker}>Lorem ipsum dolor</p>
          <h1>
            Consectetur
            <br />
            adipiscing elit
          </h1>
          <p className={s.lede}>
            Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
          </p>
        </div>
      </div>
    </section>
  );
}
