import { $, $$ } from './utils.js';

/** Плаваюча кнопка запису на мобільному: з'являється після першого екрану. */
export function initMobileCta() {
  const bar = $('.mobile-cta');
  const hero = $('.hero');
  if (!bar || !hero) return;

  const hidden = new Set();
  let pastHero = false;

  const update = () => {
    const visible = pastHero && hidden.size === 0 && !document.documentElement.classList.contains('menu-open');
    bar.classList.toggle('is-visible', visible);
    bar.setAttribute('aria-hidden', String(!visible));
    $$('a', bar).forEach((a) => (visible ? a.removeAttribute('tabindex') : a.setAttribute('tabindex', '-1')));
  };

  new IntersectionObserver(([entry]) => {
    pastHero = !entry.isIntersecting && entry.boundingClientRect.top < 0;
    update();
  }, { threshold: 0.15 }).observe(hero);

  // Ховаємо там, де кнопка лише заважає: форма запису і футер
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) hidden.add(entry.target);
      else hidden.delete(entry.target);
    });
    update();
  });
  ['#booking', '.footer'].forEach((sel) => {
    const el = $(sel);
    if (el) io.observe(el);
  });

  new MutationObserver(update).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
}
