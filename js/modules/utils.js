export const $ = (selector, root = document) => root.querySelector(selector);
export const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

export const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export const hasFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
export const hasGsap = () => Boolean(window.gsap && window.ScrollTrigger);

/** Анімації вмикаємо лише якщо GSAP завантажився і користувач не просив їх вимкнути. */
export const motionEnabled = () => hasGsap() && !prefersReducedMotion;

export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

/** Обгортає кожен символ тексту елемента в <span class="char">. */
export function splitChars(el) {
  const text = el.textContent;
  el.textContent = '';
  const chars = [...text].map((ch) => {
    const span = document.createElement('span');
    span.className = 'char';
    span.textContent = ch === ' ' ? ' ' : ch;
    el.appendChild(span);
    return span;
  });
  return chars;
}

/**
 * Розбиває текст на слова з маскою (для появи знизу).
 * Зберігає вкладені теги (<em>, <br>), щоб не ламати типографіку.
 */
export function splitWords(el) {
  const inners = [];

  const walk = (node) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        const parts = child.textContent.split(/(\s+)/);
        const frag = document.createDocumentFragment();
        parts.forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) {
            frag.appendChild(document.createTextNode(' '));
            return;
          }
          const word = document.createElement('span');
          word.className = 'split-word';
          const inner = document.createElement('span');
          inner.className = 'split-word__inner';
          inner.textContent = part;
          word.appendChild(inner);
          frag.appendChild(word);
          inners.push(inner);
        });
        child.replaceWith(frag);
      } else if (child.nodeType === Node.ELEMENT_NODE && child.tagName !== 'BR') {
        walk(child);
      }
    });
  };

  walk(el);
  return inners;
}

export const formatNumber = (value, decimals = 0) =>
  decimals
    ? value.toFixed(decimals).replace('.', ',')
    : Math.round(value).toLocaleString('uk-UA');
