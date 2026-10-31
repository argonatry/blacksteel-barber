import { $, $$, motionEnabled, prefersReducedMotion, splitChars } from './utils.js';

/** Підбирає відео під екран і запускає його. */
export function initHeroVideo() {
  const video = $('.hero__video');
  if (!video) return;

  // Та сама межа, що й для постера в CSS
  const isMobile = window.matchMedia('(max-width: 767px)').matches;

  const saveData = navigator.connection?.saveData;
  if (prefersReducedMotion || saveData) return; // лише постер

  const play = () => video.play().catch(() => {});
  const start = () => {
    video.src = isMobile ? video.dataset.srcMobile : video.dataset.srcDesktop;
    video.load();
    play();
  };

  // Відео не повинно забирати канал у шрифтів і постера — вантажимо після load
  if (document.readyState === 'complete') start();
  else window.addEventListener('load', start, { once: true });

  // Не тримаємо відео в роботі, коли перший екран поза кадром
  new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) play();
    else video.pause();
  }).observe(video);
}

let chars = [];

/**
 * Розбиває заголовок на літери ще під прелоадером.
 * Літери лишаються на місці (видимі під шторкою) — так браузер малює
 * головний заголовок одразу, і LCP не чекає кінця прелоадера.
 */
export function prepareHeroIntro() {
  if (!motionEnabled()) return;
  chars = splitChars($('.hero__title-inner'));
}

/** Інтро першого екрану: літери заголовка, відео, тексти. */
export function playHeroIntro() {
  if (!motionEnabled()) return;
  const { gsap } = window;

  const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
  tl.fromTo('.hero__video', { scale: 1.18 }, { scale: 1, duration: 2.6, ease: 'power3.out' }, 0)
    .fromTo(chars, { yPercent: 105 }, { yPercent: 0, duration: 1.5, stagger: 0.05, immediateRender: true }, 0.1)
    .fromTo($$('[data-hero-fade]'), { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 1.2, stagger: 0.1 }, 0.55)
    .from('.header__inner', { opacity: 0, y: -16, duration: 1 }, 0.6);

  // Легкий паралакс першого екрану при скролі
  gsap.to('.hero__content', {
    yPercent: 8,
    opacity: 0,
    ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
  });
}
