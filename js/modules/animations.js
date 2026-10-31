import { $, $$, formatNumber, splitWords } from './utils.js';

const nextTask = () => new Promise((resolve) => setTimeout(resolve, 0));

/** Усі скрол-анімації. Викликається лише коли анімації дозволені. Розбито на дрібні задачі. */
export async function initScrollAnimations() {
  const { gsap, ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger);

  // Заголовки — поява по словах
  $$('[data-split]').forEach((el) => {
    const words = splitWords(el);
    gsap.set(words, { yPercent: 110, y: 0 });
    gsap.to(words, {
      yPercent: 0,
      duration: 1.3,
      ease: 'expo.out',
      stagger: 0.08,
      scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none none' },
    });
  });
  await nextTask();

  // Блоки — м'яка поява
  ScrollTrigger.batch('[data-reveal]', {
    start: 'top 90%',
    // без once: самознищувані тригери ламають refresh, коли сторінку відкрили посередині
    onEnter: (batch) =>
      gsap.to(batch, {
        opacity: 1,
        y: 0,
        duration: 1.2,
        ease: 'power3.out',
        stagger: 0.08,
        overwrite: true,
      }),
  });

  // Фото — розкриття шторкою
  $$('[data-clip]').forEach((el) => {
    gsap.fromTo(el,
      { clipPath: 'inset(100% 0% 0% 0%)' },
      {
        clipPath: 'inset(0% 0% 0% 0%)',
        duration: 1.6,
        ease: 'expo.inOut',
        scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none none' },
      });
  });
  await nextTask();

  // Паралакс фото
  $$('[data-parallax]').forEach((el) => {
    const speed = parseFloat(el.dataset.parallax) || 0.1;
    gsap.fromTo(el, { yPercent: -speed * 50 }, {
      yPercent: speed * 50,
      ease: 'none',
      scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  });

  // Галерея — колонки рухаються з різною швидкістю (лише десктоп)
  const mm = gsap.matchMedia();
  mm.add('(min-width: 768px)', () => {
    $$('.gallery__col').forEach((col) => {
      const speed = parseFloat(col.dataset.speed) || 0;
      if (!speed) return;
      gsap.fromTo(col, { y: () => -speed * window.innerHeight * 0.5 }, {
        y: () => speed * window.innerHeight * 0.5,
        ease: 'none',
        scrollTrigger: { trigger: '.gallery', start: 'top bottom', end: 'bottom top', scrub: true, invalidateOnRefresh: true },
      });
    });
  });

  await nextTask();
  initCounters();
  initMarquee();

  // Футер — велика назва виїжджає знизу
  gsap.from('.footer__wordmark', {
    yPercent: 45,
    ease: 'none',
    scrollTrigger: { trigger: '.footer__wordmark', start: 'top bottom', end: 'bottom bottom', scrub: true },
  });

  document.fonts?.ready.then(() => ScrollTrigger.refresh());
}

function initCounters() {
  const { gsap } = window;

  $$('[data-count]').forEach((el) => {
    const target = parseFloat(el.dataset.count);
    const decimals = parseInt(el.dataset.decimals || '0', 10);
    const state = { value: 0 };
    el.textContent = formatNumber(0, decimals);

    gsap.to(state, {
      value: target,
      duration: 2.2,
      ease: 'power3.out',
      onUpdate: () => {
        el.textContent = formatNumber(state.value, decimals);
      },
      scrollTrigger: { trigger: el, start: 'top 90%', toggleActions: 'play none none none' },
    });
  });
}

/** Бігучий рядок: нескінченна стрічка, що реагує на напрямок і швидкість скролу. */
function initMarquee() {
  const { gsap, ScrollTrigger } = window;
  const track = $('.marquee__track');
  if (!track) return;

  const group = $('.marquee__group', track);
  const copies = Math.max(2, Math.ceil((window.innerWidth * 2) / group.offsetWidth) + 1);
  for (let i = 1; i < copies; i += 1) track.appendChild(group.cloneNode(true));

  const loop = gsap.to(track, {
    x: () => -group.offsetWidth,
    duration: () => group.offsetWidth / 70,
    ease: 'none',
    repeat: -1,
  });
  ScrollTrigger.addEventListener('refreshInit', () => loop.invalidate());

  let direction = 1;
  ScrollTrigger.create({
    trigger: '.marquee',
    start: 'top bottom',
    end: 'bottom top',
    onUpdate: (self) => {
      direction = self.direction;
      const boost = 1 + Math.min(Math.abs(self.getVelocity()) / 600, 4);
      gsap.to(loop, { timeScale: direction * boost, duration: 0.2, overwrite: true });
      gsap.to(loop, { timeScale: direction, duration: 1.2, delay: 0.2, ease: 'power2.out' });
    },
    onToggle: (self) => (self.isActive ? loop.play() : loop.pause()),
  });
}
