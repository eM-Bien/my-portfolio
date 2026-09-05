# my-portfolio

Portfolio jednostronicowe. Sekcja hero to warstwowa scena sterowana scrollem
(WebGL + GSAP ScrollTrigger); pod nią sekcje o mnie, wartość, realizacje, kontakt.

## Stack

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · SCSS modules · GSAP 3.15.

## Uruchomienie

```bash
npm install
npm run dev      # http://localhost:3000
npm run build
npm run start
npm run lint
```

## Struktura

```
src/
  app/          trasy i style globalne
  components/
    scene/      sekcja hero – scena WebGL + timeline GSAP
    sections/   sekcje pod hero
  content/      teksty i dane (typowany moduł TS, PL/EN)
  styles/       tokeny, miksiny
public/scene/   assety sceny (webp + maska png)
```

## Dokumentacja

`docs/` jest poza repo (lokalne notatki). `docs/scena.md` opisuje scenę hero:
tabelę choreografii, uzasadnienie liczb i listę podejść, które nie zadziałały.

Przed zmianą wartości w `.apple` w `Scene.module.scss` przeczytaj sekcję „Jabłko” —
te liczby są ze sobą powiązane i zmiana jednej odsłania dziurę w dłoni.
Po zmianach w scenie sam `npm run build` nie wystarcza: trzeba obejrzeć render,
bo testy typów nie wyłapią tego, że coś zniknęło z kadru.
