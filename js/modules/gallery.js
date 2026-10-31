import { $, $$, motionEnabled } from './utils.js';
import { startScroll, stopScroll } from './smooth.js';

/** Галерея робіт: лайтбокс з гортанням, клавіатурою і свайпами. */
export function initGallery() {
  const items = $$('.work');
  const box = $('.lightbox');
  if (!items.length || !box) return;

  const img = $('.lightbox__img', box);
  const counter = $('.lightbox__count', box);
  const caption = $('.lightbox__text', box);
  const closeBtn = $('.lightbox__close', box);
  const figure = $('.lightbox__figure', box);
  const total = items.length;
  const pad = (n) => String(n).padStart(2, '0');
  const animate = motionEnabled();

  let index = 0;
  let lastFocus = null;

  const preload = (i) => {
    const pre = new Image();
    pre.src = items[(i + total) % total].dataset.full;
  };

  const render = (dir = 0) => {
    const item = items[index];
    const apply = () => {
      img.src = item.dataset.full;
      img.alt = $('img', item).alt;
      counter.textContent = `${pad(index + 1)} / ${pad(total)}`;
      caption.textContent = item.dataset.caption || '';
    };

    if (animate && dir) {
      const { gsap } = window;
      gsap.to(img, {
        opacity: 0,
        x: -40 * dir,
        duration: 0.25,
        ease: 'power2.in',
        onComplete: () => {
          apply();
          const show = () => gsap.fromTo(img, { opacity: 0, x: 40 * dir }, { opacity: 1, x: 0, duration: 0.6, ease: 'expo.out' });
          if (img.complete) show();
          else img.addEventListener('load', show, { once: true });
        },
      });
    } else {
      apply();
    }

    preload(index + 1);
    preload(index - 1);
  };

  const go = (dir) => {
    index = (index + dir + total) % total;
    render(dir);
  };

  const onKey = (event) => {
    if (event.key === 'Escape') close();
    else if (event.key === 'ArrowRight') go(1);
    else if (event.key === 'ArrowLeft') go(-1);
    else if (event.key === 'Tab') trapFocus(event);
  };

  const trapFocus = (event) => {
    const focusables = $$('button', box);
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const open = (i) => {
    index = i;
    lastFocus = document.activeElement;
    render();
    box.hidden = false;
    stopScroll();
    document.addEventListener('keydown', onKey);
    closeBtn.focus();

    if (animate) {
      const { gsap } = window;
      gsap.fromTo('.lightbox__backdrop', { opacity: 0 }, { opacity: 1, duration: 0.5, ease: 'power2.out' });
      gsap.fromTo(figure, { opacity: 0, scale: 0.96, y: 20 }, { opacity: 1, scale: 1, y: 0, duration: 0.8, ease: 'expo.out' });
      gsap.fromTo($$('.circle-btn', box), { opacity: 0 }, { opacity: 1, duration: 0.5, delay: 0.2 });
    }
  };

  const close = () => {
    document.removeEventListener('keydown', onKey);
    const finish = () => {
      box.hidden = true;
      startScroll();
      lastFocus?.focus();
    };

    if (animate) {
      window.gsap.to(box, {
        opacity: 0,
        duration: 0.35,
        ease: 'power2.in',
        onComplete: () => {
          window.gsap.set(box, { clearProps: 'opacity' });
          finish();
        },
      });
    } else {
      finish();
    }
  };

  items.forEach((item, i) => item.addEventListener('click', () => open(i)));
  $$('[data-lb-close]', box).forEach((el) => el.addEventListener('click', close));
  $$('[data-lb-dir]', box).forEach((btn) =>
    btn.addEventListener('click', () => go(parseInt(btn.dataset.lbDir, 10))),
  );

  // Свайпи
  let startX = 0;
  let startY = 0;
  figure.addEventListener('pointerdown', (event) => {
    startX = event.clientX;
    startY = event.clientY;
  });
  figure.addEventListener('pointerup', (event) => {
    const dx = event.clientX - startX;
    const dy = event.clientY - startY;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
  });
}
