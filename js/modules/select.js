import { $, $$ } from './utils.js';

let uid = 0;
let openInstance = null;

/**
 * Кастомний випадний список у стилі сайту поверх нативного <select>.
 * Нативний select лишається в DOM як джерело значення (форма, валідація),
 * а користувач бачить і керує оформленим listbox — мишею, тачем і з клавіатури.
 */
export function initCustomSelects(root = document) {
  $$('.select', root).forEach((wrap) => enhance(wrap));

  document.addEventListener('pointerdown', (event) => {
    if (openInstance && !openInstance.wrap.contains(event.target)) openInstance.close();
  });
}

function enhance(wrap) {
  const select = $('select', wrap);
  if (!select || wrap.classList.contains('is-enhanced')) return;
  wrap.classList.add('is-enhanced');

  const id = `cs-${(uid += 1)}`;
  const label = document.querySelector(`label[for="${select.id}"]`);
  const placeholderOption = [...select.options].find((o) => o.value === '');
  const placeholder = select.required ? placeholderOption?.textContent : null;

  // Кнопка, яку бачить користувач
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'select__button';
  button.id = `${id}-btn`;
  button.setAttribute('aria-haspopup', 'listbox');
  button.setAttribute('aria-expanded', 'false');
  button.setAttribute('aria-controls', `${id}-list`);
  if (select.getAttribute('aria-describedby')) button.setAttribute('aria-describedby', select.getAttribute('aria-describedby'));
  button.innerHTML = '<span class="select__value"></span><span class="select__chevron" aria-hidden="true"></span>';
  if (label) {
    label.htmlFor = button.id;
    label.id ||= `${id}-label`;
  }

  // Список
  const list = document.createElement('ul');
  list.className = 'select__list';
  list.id = `${id}-list`;
  list.setAttribute('role', 'listbox');
  list.tabIndex = -1;
  list.setAttribute('data-lenis-prevent', ''); // колесо миші гортає список, а не сторінку
  if (label) list.setAttribute('aria-labelledby', label.id);

  const items = [];
  const addOption = (option) => {
    if (option.value === '' && placeholder) return;
    const li = document.createElement('li');
    li.className = 'select__option';
    li.id = `${id}-opt-${items.length}`;
    li.setAttribute('role', 'option');
    li.dataset.value = option.value;

    const [title, ...rest] = option.textContent.split(' — ');
    // ₴ — окремо, у Manrope (як у прайсі)
    const price = option.dataset.price ? `${Number(option.dataset.price).toLocaleString('uk-UA')}<small>₴</small>` : '';
    const sub = option.dataset.sub || (!price && rest.join(' — '));
    li.innerHTML = `
      <span class="select__check" aria-hidden="true"></span>
      <span class="select__text"><span class="select__title">${title}</span>${sub ? `<span class="select__sub">${sub}</span>` : ''}</span>
      ${price ? `<span class="select__price">${price}</span>` : ''}`;
    list.appendChild(li);
    items.push(li);
  };

  [...select.children].forEach((child) => {
    if (child.tagName === 'OPTGROUP') {
      const head = document.createElement('li');
      head.className = 'select__group';
      head.setAttribute('role', 'presentation');
      head.textContent = child.label;
      list.appendChild(head);
      [...child.children].forEach(addOption);
    } else {
      addOption(child);
    }
  });

  // Нативний select ховаємо від очей і від Tab, але залишаємо для форми
  select.tabIndex = -1;
  select.setAttribute('aria-hidden', 'true');
  select.classList.add('select__native');
  // Валідація фокусує select — переводимо фокус на кнопку
  select.addEventListener('focus', () => button.focus());

  wrap.append(button, list);

  let active = -1;

  const sync = () => {
    const option = select.selectedOptions[0];
    const valueEl = $('.select__value', button);
    const empty = !select.value && placeholder;
    valueEl.textContent = empty ? placeholder : option?.textContent.split(' — ')[0] ?? '';
    button.classList.toggle('is-placeholder', Boolean(empty));
    items.forEach((li) => li.setAttribute('aria-selected', String(li.dataset.value === select.value && !empty)));
  };

  const setActive = (index, scroll = true) => {
    items.forEach((li) => li.classList.remove('is-active'));
    active = Math.max(0, Math.min(items.length - 1, index));
    const li = items[active];
    li.classList.add('is-active');
    list.setAttribute('aria-activedescendant', li.id);
    if (!scroll) return;
    const { offsetTop, offsetHeight } = li;
    if (offsetTop < list.scrollTop) list.scrollTop = offsetTop - 8;
    else if (offsetTop + offsetHeight > list.scrollTop + list.clientHeight) {
      list.scrollTop = offsetTop + offsetHeight - list.clientHeight + 8;
    }
  };

  const instance = {
    wrap,
    open() {
      if (openInstance && openInstance !== instance) openInstance.close();
      openInstance = instance;
      // Якщо знизу мало місця — відкриваємося вгору
      const rect = button.getBoundingClientRect();
      const below = window.innerHeight - rect.bottom;
      wrap.classList.toggle('is-up', below < 320 && rect.top > below);
      wrap.classList.add('is-open');
      button.setAttribute('aria-expanded', 'true');
      const selected = items.findIndex((li) => li.getAttribute('aria-selected') === 'true');
      setActive(selected >= 0 ? selected : 0);
      list.focus({ preventScroll: true });
    },
    close(focusButton = false) {
      wrap.classList.remove('is-open');
      button.setAttribute('aria-expanded', 'false');
      list.removeAttribute('aria-activedescendant');
      if (openInstance === instance) openInstance = null;
      if (focusButton) button.focus({ preventScroll: true });
    },
  };

  const choose = (index) => {
    const li = items[index];
    if (!li) return;
    select.value = li.dataset.value;
    select.dispatchEvent(new Event('change', { bubbles: true }));
    instance.close(true);
  };

  button.addEventListener('click', () => (wrap.classList.contains('is-open') ? instance.close() : instance.open()));

  button.addEventListener('keydown', (event) => {
    if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
      event.preventDefault();
      instance.open();
    }
  });

  let typed = '';
  let typedTimer = null;
  list.addEventListener('keydown', (event) => {
    const keys = {
      ArrowDown: () => setActive(active + 1),
      ArrowUp: () => setActive(active - 1),
      Home: () => setActive(0),
      End: () => setActive(items.length - 1),
      Enter: () => choose(active),
      ' ': () => choose(active),
      Escape: () => instance.close(true),
      Tab: () => instance.close(),
    };
    if (keys[event.key]) {
      if (event.key !== 'Tab') event.preventDefault();
      keys[event.key]();
      return;
    }
    // Пошук за першими літерами
    if (event.key.length === 1) {
      typed += event.key.toLowerCase();
      clearTimeout(typedTimer);
      typedTimer = setTimeout(() => { typed = ''; }, 600);
      const found = items.findIndex((li) => $('.select__title', li).textContent.toLowerCase().startsWith(typed));
      if (found >= 0) setActive(found);
    }
  });

  list.addEventListener('pointermove', (event) => {
    const li = event.target.closest('.select__option');
    if (li) setActive(items.indexOf(li), false);
  });

  list.addEventListener('click', (event) => {
    const li = event.target.closest('.select__option');
    if (li) choose(items.indexOf(li));
  });

  list.addEventListener('focusout', (event) => {
    if (!wrap.contains(event.relatedTarget)) instance.close();
  });

  select.addEventListener('change', sync);
  select.form?.addEventListener('reset', () => setTimeout(sync, 0));
  sync();
}
