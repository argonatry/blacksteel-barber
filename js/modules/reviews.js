import { $, $$, motionEnabled, prefersReducedMotion } from './utils.js';

const AUTOPLAY_MS = 7000;

/** Карусель відгуків: автопрогравання з прогресом, стрілки, свайпи. */
export function initReviews() {
  const root = $('.carousel');
  if (!root) return;

  const slides = $$('.review', root);
  const progress = $('.carousel__progress', root);
  const current = $('.carousel__current', root);
  const viewport = $('.carousel__viewport', root);
  const animate = motionEnabled();
  const pad = (n) => String(n).padStart(2, '0');

  let index = 0;
  let timer = null;
  let inView = false;
  let hovered = false;

  root.style.setProperty('--autoplay', `${AUTOPLAY_MS}ms`);
  $('.carousel__total', root).textContent = pad(slides.length);

  const segs = slides.map(() => {
    const seg = document.createElement('span');
    seg.className = 'carousel__seg';
    seg.appendChild(document.createElement('i'));
    progress.appendChild(seg);
    return seg;
  });

  // Розбиваємо цитати на слова для анімації
  const words = slides.map((slide) => {
    if (!animate) return [];
    const text = $('.review__text', slide);
    const parts = text.textContent.trim().split(/\s+/);
    text.innerHTML = parts.map((w) => `<span class="word">${w}</span>`).join(' ');
    return [...$$('.word', text), $('.review__author', slide)];
  });

  const updateSegs = () => {
    segs.forEach((seg, i) => {
      seg.classList.remove('is-active');
      seg.classList.toggle('is-done', i < index);
    });
    // Перезапуск CSS-анімації активного сегмента
    void segs[index].offsetWidth;
    if (!prefersReducedMotion) segs[index].classList.add('is-active');
    else segs[index].classList.add('is-done');
  };

  const show = (next, dir = 1) => {
    if (next === index) return;
    const prev = slides[index];
    const incoming = slides[next];
    index = next;
    current.textContent = pad(index + 1);
    updateSegs();

    if (animate) {
      const { gsap } = window;
      gsap.killTweensOf(words.flat());
      gsap.to(words[slides.indexOf(prev)], {
        opacity: 0,
        y: -18 * dir,
        duration: 0.4,
        ease: 'power2.in',
        stagger: 0.006,
        onComplete: () => prev.classList.remove('is-active'),
      });
      incoming.classList.add('is-active');
      gsap.fromTo(words[index],
        { opacity: 0, y: 28 * dir },
        { opacity: 1, y: 0, duration: 0.9, ease: 'expo.out', stagger: 0.014, delay: 0.35 });
    } else {
      prev.classList.remove('is-active');
      incoming.classList.add('is-active');
    }

    schedule();
  };

  const go = (dir) => show((index + dir + slides.length) % slides.length, dir);

  const schedule = () => {
    clearTimeout(timer);
    if (prefersReducedMotion || !inView || hovered || document.hidden) return;
    timer = setTimeout(() => go(1), AUTOPLAY_MS);
  };

  const setPaused = (paused) => {
    root.classList.toggle('is-paused', paused);
    if (paused) clearTimeout(timer);
    else {
      updateSegs();
      schedule();
    }
  };

  $$('[data-dir]', root).forEach((btn) =>
    btn.addEventListener('click', () => go(parseInt(btn.dataset.dir, 10))),
  );

  root.addEventListener('pointerenter', (e) => {
    if (e.pointerType !== 'mouse') return;
    hovered = true;
    setPaused(true);
  });
  root.addEventListener('pointerleave', (e) => {
    if (e.pointerType !== 'mouse') return;
    hovered = false;
    setPaused(false);
  });
  root.addEventListener('focusin', () => {
    hovered = true;
    setPaused(true);
  });
  root.addEventListener('focusout', () => {
    hovered = false;
    setPaused(false);
  });

  document.addEventListener('visibilitychange', () => setPaused(document.hidden));

  new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    setPaused(!inView);
  }, { threshold: 0.3 }).observe(root);

  // Свайпи
  let startX = 0;
  let startY = 0;
  viewport.addEventListener('pointerdown', (e) => {
    startX = e.clientX;
    startY = e.clientY;
  });
  viewport.addEventListener('pointerup', (e) => {
    const dx = e.clientX - startX;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(e.clientY - startY)) go(dx < 0 ? 1 : -1);
  });

  updateSegs();
}
