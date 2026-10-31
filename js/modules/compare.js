import { $, clamp, motionEnabled } from './utils.js';

/** Слайдер «до / після» з перетягуванням, клавіатурою і підказкою-анімацією. */
export function initCompare() {
  const el = $('.compare');
  if (!el) return;

  const handle = $('.compare__handle', el);
  let pos = 50;
  let dragging = false;
  let touched = false;
  const state = { value: 50 };

  const set = (value) => {
    pos = clamp(value, 0, 100);
    el.style.setProperty('--pos', `${pos}%`);
    handle.setAttribute('aria-valuenow', String(Math.round(pos)));
    handle.setAttribute('aria-valuetext', `${Math.round(pos)}% — до`);
  };

  const fromEvent = (event) => {
    const rect = el.getBoundingClientRect();
    set(((event.clientX - rect.left) / rect.width) * 100);
  };

  el.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    dragging = true;
    touched = true;
    window.gsap?.killTweensOf(state);
    el.classList.add('is-dragging');
    el.setPointerCapture(event.pointerId);
    fromEvent(event);
  });

  el.addEventListener('pointermove', (event) => {
    if (dragging) fromEvent(event);
  });

  const stop = () => {
    dragging = false;
    el.classList.remove('is-dragging');
  };
  el.addEventListener('pointerup', stop);
  el.addEventListener('pointercancel', stop);

  handle.addEventListener('keydown', (event) => {
    const step = event.shiftKey ? 10 : 5;
    const keys = {
      ArrowLeft: pos - step,
      ArrowDown: pos - step,
      ArrowRight: pos + step,
      ArrowUp: pos + step,
      Home: 0,
      End: 100,
    };
    if (event.key in keys) {
      event.preventDefault();
      touched = true;
      set(keys[event.key]);
    }
  });

  // Підказка: повзунок сам «показує» різницю при першій появі
  if (motionEnabled()) {
    const { gsap } = window;
    gsap.timeline({
      scrollTrigger: { trigger: el, start: 'top 70%', toggleActions: 'play none none none' },
      onUpdate: () => !touched && set(state.value),
    })
      .to(state, { value: 22, duration: 1.1, ease: 'power3.inOut' })
      .to(state, { value: 72, duration: 1.3, ease: 'power3.inOut' })
      .to(state, { value: 50, duration: 1, ease: 'power3.inOut' });
  }

  set(50);
}
