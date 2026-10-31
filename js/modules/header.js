import { $, $$ } from './utils.js';
import { startScroll, stopScroll } from './smooth.js';

/** Шапка: компактний режим при скролі, бургер-меню, активний пункт меню. */
export function initHeader() {
  const header = $('#header');
  const burger = $('.burger');
  const menu = $('#menu');
  if (!header) return;

  // Компактна шапка
  let ticking = false;
  const update = () => {
    header.classList.toggle('is-compact', window.scrollY > 40);
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  }, { passive: true });
  update();

  // Мобільне меню
  $$('.menu__list li', menu).forEach((li, i) => li.style.setProperty('--i', i));

  const setMenu = (open) => {
    menu.classList.toggle('is-open', open);
    menu.setAttribute('aria-hidden', String(!open));
    menu.inert = !open;
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Закрити меню' : 'Відкрити меню');
    document.documentElement.classList.toggle('menu-open', open);
    if (open) stopScroll();
    else startScroll();
  };

  burger?.addEventListener('click', () => setMenu(!menu.classList.contains('is-open')));

  // Закриваємо меню до того, як спрацює плавний скрол до якоря
  $$('a', menu).forEach((link) => link.addEventListener('click', () => setMenu(false)));

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menu.classList.contains('is-open')) {
      setMenu(false);
      burger.focus();
    }
  });

  window.matchMedia('(min-width: 1100px)').addEventListener('change', (e) => {
    if (e.matches && menu.classList.contains('is-open')) setMenu(false);
  });

  // Підсвічування активного розділу
  // Спостерігаємо за всіма секціями: у тих, яких немає в меню, підсвічування знімається
  const links = $$('.nav__link');
  const sections = $$('main section[id]');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      links.forEach((link) =>
        link.classList.toggle('is-active', link.getAttribute('href') === `#${entry.target.id}`),
      );
    });
  }, { rootMargin: '-45% 0px -50% 0px' });

  sections.forEach((section) => observer.observe(section));
}
