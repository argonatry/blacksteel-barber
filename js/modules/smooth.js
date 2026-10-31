import { motionEnabled, prefersReducedMotion } from './utils.js';

let lenis = null;

export const getLenis = () => lenis;

/** Плавний скрол Lenis, синхронізований з GSAP ScrollTrigger. */
export function initSmoothScroll() {
  if (motionEnabled() && window.Lenis) {
    lenis = new window.Lenis({
      lerp: 0.1,
      smoothWheel: true,
      wheelMultiplier: 1,
    });

    lenis.on('scroll', window.ScrollTrigger.update);
    window.gsap.ticker.add((time) => lenis.raf(time * 1000));
    window.gsap.ticker.lagSmoothing(0);
  }

  initAnchors();
  return lenis;
}

export function stopScroll() {
  lenis?.stop();
  document.body.classList.add('is-locked');
}

export function startScroll() {
  lenis?.start();
  document.body.classList.remove('is-locked');
}

const easeInOutExpo = (t) =>
  t === 0 ? 0 : t === 1 ? 1 : t < 0.5 ? 2 ** (20 * t - 10) / 2 : (2 - 2 ** (-20 * t + 10)) / 2;

function initAnchors() {
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href^="#"]');
    if (!link) return;

    const hash = link.getAttribute('href');
    if (hash.length < 2) return;

    const target = document.querySelector(hash);
    if (!target) return;

    event.preventDefault();

    if (lenis) {
      lenis.scrollTo(hash === '#top' ? 0 : target, { duration: 1.6, easing: easeInOutExpo });
    } else {
      target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    }

    // Переносимо фокус для клавіатури та скрінрідерів
    if (hash !== '#top') {
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    }
  });
}
