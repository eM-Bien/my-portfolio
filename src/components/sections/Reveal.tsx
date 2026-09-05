'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

type Props = {
  children: React.ReactNode;
  /** opóźnienie w sekundach – do kaskadowania elementów obok siebie */
  delay?: number;
  /** kierunek wejścia */
  from?: 'up' | 'left' | 'right';
  className?: string;
};

export default function Reveal({ children, delay = 0, from = 'up', className }: Props) {
  const el = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const offset =
      from === 'left' ? { x: -48, y: 0 } : from === 'right' ? { x: 48, y: 0 } : { x: 0, y: 56 };

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el.current,
        { autoAlpha: 0, ...offset },
        {
          autoAlpha: 1,
          x: 0,
          y: 0,
          duration: 0.9,
          delay,
          ease: 'power3.out',
          scrollTrigger: { trigger: el.current, start: 'top 82%', once: true },
        }
      );
    }, el);

    return () => ctx.revert();
  }, [delay, from]);

  return (
    <div ref={el} className={className}>
      {children}
    </div>
  );
}
