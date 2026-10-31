import { $$, hasFinePointer, motionEnabled } from './utils.js';

/** Магнітні кнопки — тягнуться за курсором (лише десктоп). */
export function initMagnetic() {
  if (!hasFinePointer || !motionEnabled()) return;
  const { gsap } = window;

  $$('[data-magnetic]').forEach((el) => {
    const label = el.querySelector('.btn__label');
    const xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3.out' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3.out' });
    const lxTo = label && gsap.quickTo(label, 'x', { duration: 0.6, ease: 'power3.out' });
    const lyTo = label && gsap.quickTo(label, 'y', { duration: 0.6, ease: 'power3.out' });

    el.addEventListener('pointermove', (event) => {
      const rect = el.getBoundingClientRect();
      const dx = event.clientX - (rect.left + rect.width / 2);
      const dy = event.clientY - (rect.top + rect.height / 2);
      xTo(dx * 0.28);
      yTo(dy * 0.38);
      lxTo?.(dx * 0.1);
      lyTo?.(dy * 0.12);
    });

    el.addEventListener('pointerleave', () => {
      gsap.to(el, { x: 0, y: 0, duration: 1.1, ease: 'elastic.out(1, 0.4)' });
      if (label) gsap.to(label, { x: 0, y: 0, duration: 1.1, ease: 'elastic.out(1, 0.4)' });
    });
  });
}
