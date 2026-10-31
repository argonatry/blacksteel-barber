import { $, motionEnabled, splitChars } from './utils.js';
import { getLenis, startScroll, stopScroll } from './smooth.js';

const VISITED_KEY = 'bs-visited';

function wasVisited() {
  try {
    return sessionStorage.getItem(VISITED_KEY) === '1';
  } catch {
    return false;
  }
}

function markVisited() {
  try {
    sessionStorage.setItem(VISITED_KEY, '1');
  } catch {
    /* приватний режим — не критично */
  }
}

const pageLoaded = () =>
  new Promise((resolve) => {
    if (document.readyState === 'complete') resolve();
    else window.addEventListener('load', resolve, { once: true });
  });

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Прелоадер з логотипом. Повертає Promise, який виконується,
 * коли можна запускати інтро першого екрану.
 */
export function runPreloader() {
  const el = $('.preloader');
  if (!el) return Promise.resolve();

  if (!motionEnabled()) {
    el.remove();
    return Promise.resolve();
  }

  const { gsap } = window;
  const quick = wasVisited();
  markVisited();
  stopScroll();

  const word = $('.preloader__word span', el);
  const chars = splitChars(word);
  const fill = $('.preloader__fill', el);
  const count = $('.preloader__count', el);
  const mark = $('.preloader__mark', el);
  const progress = { value: 0 };

  return new Promise((resolve) => {
    const intro = gsap.timeline();
    intro
      .fromTo(mark, { yPercent: 40, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.8, ease: 'power3.out' })
      .from(chars, { yPercent: 110, duration: 1, ease: 'expo.out', stagger: 0.04 }, 0.1)
      .to(progress, {
        value: 100,
        duration: quick ? 0.5 : 1.2,
        ease: 'power2.inOut',
        onUpdate: () => {
          count.textContent = Math.round(progress.value);
          fill.style.transform = `scaleX(${progress.value / 100})`;
        },
      }, 0.2);
    el.classList.add('is-ready');

    // Чекаємо і анімацію, і завантаження сторінки (але не довше 2.5 с)
    Promise.all([
      new Promise((r) => intro.eventCallback('onComplete', r)),
      Promise.race([pageLoaded(), wait(2500)]),
    ]).then(() => {
      // Поки екран закритий — повертаємо сторінку на початок (браузер міг відновити скрол)
      window.scrollTo(0, 0);
      getLenis()?.scrollTo(0, { immediate: true, force: true });

      const outro = gsap.timeline({
        onComplete: () => {
          el.remove();
          startScroll();
        },
      });

      outro
        .to(chars, { yPercent: -110, duration: 0.6, ease: 'power3.in', stagger: 0.02 })
        .to([mark, '.preloader__bar', '.preloader__meta'], { opacity: 0, duration: 0.4 }, 0)
        .to(el, { yPercent: -100, duration: 1.1, ease: 'expo.inOut' }, 0.35)
        .add(resolve, 0.6);
    });
  });
}
