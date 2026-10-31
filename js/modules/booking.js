import { $, $$ } from './utils.js';

const TELEGRAM = 'blacksteel_barber';
const DAYS_AHEAD = 14;
const FOUNDER = 'Артем Коваль';
const FOUNDER_EXTRA = 200;

const DOW = ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
const DOW_FULL = ['неділя', 'понеділок', 'вівторок', 'середа', 'четвер', 'пʼятниця', 'субота'];
const MONTHS_SHORT = ['січ', 'лют', 'бер', 'квіт', 'трав', 'черв', 'лип', 'серп', 'вер', 'жовт', 'лист', 'груд'];
const MONTHS_GEN = ['січня', 'лютого', 'березня', 'квітня', 'травня', 'червня', 'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня'];

/** Години роботи: [відкриття, закриття] за днем тижня (0 — неділя). */
export const HOURS = {
  0: [11, 18],
  1: [10, 21],
  2: [10, 21],
  3: [10, 21],
  4: [10, 21],
  5: [10, 21],
  6: [10, 20],
};

const toISO = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const fromISO = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
};
const formatPrice = (n) => `${n.toLocaleString('uk-UA')} ₴`;

/** Детермінований «псевдорандом», щоб зайняті слоти не стрибали при кожному кліку. */
function isBusy(seed, hour, ratio) {
  let h = 2166136261;
  const str = `${seed}|${hour}`;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 100) / 100 < ratio;
}

/** Онлайн-запис: вибір послуги, майстра, дати й часу, валідація, екран успіху. */
export function initBooking() {
  const form = $('#booking-form');
  if (!form) return;

  const card = $('.booking__card');
  const success = $('.success', card);
  const service = $('#f-service', form);
  const master = $('#f-master', form);
  const name = $('#f-name', form);
  const phone = $('#f-phone', form);
  const datesEl = $('[data-dates]', form);
  const timesEl = $('[data-times]', form);
  const submit = $('.form__submit', form);
  const sum = (key) => $(`[data-sum="${key}"]`);

  const state = { date: '', time: '' };
  let submitted = false;

  /* ---------- Дати ---------- */
  const firstAvailableDay = () => {
    const now = new Date();
    const [, close] = HOURS[now.getDay()];
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    // Якщо сьогодні вже не встигаємо — починаємо з завтра
    if (now.getHours() + 1 >= close - 1) start.setDate(start.getDate() + 1);
    return start;
  };

  const renderDates = () => {
    const start = firstAvailableDay();
    datesEl.innerHTML = '';
    for (let i = 0; i < DAYS_AHEAD; i += 1) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const iso = toISO(d);
      const weekend = d.getDay() === 0 || d.getDay() === 6;
      const label = document.createElement('label');
      label.className = `chip${weekend ? ' chip--weekend' : ''}`;
      label.innerHTML = `
        <input type="radio" name="date" value="${iso}" aria-label="${DOW_FULL[d.getDay()]}, ${d.getDate()} ${MONTHS_GEN[d.getMonth()]}">
        <span class="chip__body">
          <span class="chip__dow">${DOW[d.getDay()]}</span>
          <span class="chip__day">${d.getDate()}</span>
          <span class="chip__mon">${MONTHS_SHORT[d.getMonth()]}</span>
        </span>`;
      datesEl.appendChild(label);
    }
  };

  /* ---------- Час ---------- */
  const renderTimes = () => {
    if (!state.date) return;
    const d = fromISO(state.date);
    const [open, close] = HOURS[d.getDay()];
    const now = new Date();
    const isToday = toISO(now) === state.date;
    const seed = `${state.date}|${master.value || 'any'}`;
    const ratio = master.value ? 0.38 : 0.16;

    timesEl.innerHTML = '';
    let keep = false;
    for (let h = open; h < close; h += 1) {
      const value = `${String(h).padStart(2, '0')}:00`;
      const past = isToday && h <= now.getHours() + 1;
      const busy = past || isBusy(seed, h, ratio);
      const label = document.createElement('label');
      label.className = 'chip';
      label.innerHTML = `
        <input type="radio" name="time" value="${value}" ${busy ? 'disabled' : ''} aria-label="${value}${busy ? ', зайнято' : ''}">
        <span class="chip__body">${value}</span>`;
      timesEl.appendChild(label);
      if (!busy && value === state.time) {
        label.querySelector('input').checked = true;
        keep = true;
      }
    }
    if (!keep) state.time = '';
  };

  /* ---------- Підсумок ---------- */
  const price = () => {
    const option = service.selectedOptions[0];
    if (!option?.dataset.price) return 0;
    return Number(option.dataset.price) + (master.value === FOUNDER ? FOUNDER_EXTRA : 0);
  };

  const dateText = (iso) => {
    const d = fromISO(iso);
    return `${DOW_FULL[d.getDay()]}, ${d.getDate()} ${MONTHS_GEN[d.getMonth()]}`;
  };

  const updateSummary = () => {
    sum('service').textContent = service.value || '—';
    sum('master').textContent = master.value || 'Будь-який вільний';
    sum('date').textContent = state.date ? dateText(state.date) : '—';
    sum('time').textContent = state.time || '—';
    sum('price').textContent = price() ? formatPrice(price()) : '';
  };

  /* ---------- Телефон ---------- */
  const phoneDigits = () => {
    let digits = phone.value.replace(/\D/g, '');
    if (digits.startsWith('0')) digits = `38${digits}`;
    else if (digits.startsWith('80')) digits = `3${digits}`;
    else if (digits && !digits.startsWith('380')) digits = `380${digits}`;
    // Після префікса «+380 » люди за звичкою набирають 0XX — прибираємо зайвий нуль
    if (digits.startsWith('3800')) digits = `380${digits.slice(4)}`;
    return digits.slice(0, 12);
  };

  const formatPhone = (digits) => {
    if (!digits) return '';
    const rest = digits.slice(3);
    const parts = [rest.slice(0, 2), rest.slice(2, 5), rest.slice(5, 7), rest.slice(7, 9)].filter(Boolean);
    return `+380 ${parts.join(' ')}`.trim();
  };

  phone.addEventListener('focus', () => {
    if (!phone.value) phone.value = '+380 ';
  });
  phone.addEventListener('blur', () => {
    if (phone.value.replace(/\D/g, '') === '380') phone.value = '';
  });
  phone.addEventListener('input', (event) => {
    if (event.inputType?.startsWith('delete')) return; // не заважаємо видаленню
    phone.value = formatPhone(phoneDigits());
  });

  /* ---------- Валідація ---------- */
  const setError = (field, errorId, message) => {
    const error = $(`#${errorId}`);
    error.textContent = message;
    if (field) field.setAttribute('aria-invalid', message ? 'true' : 'false');
    return !message;
  };

  const validate = () => {
    const nameOk = /^[\p{L}'ʼ’\- ]{2,40}$/u.test(name.value.trim());
    const results = [
      [service, setError(service, 'e-service', service.value ? '' : 'Оберіть послугу')],
      [datesEl.querySelector('input'), setError(null, 'e-date', state.date ? '' : 'Оберіть дату візиту')],
      [timesEl.querySelector('input:not(:disabled)'), setError(null, 'e-time', state.time ? '' : 'Оберіть зручний час')],
      [name, setError(name, 'e-name', nameOk ? '' : 'Вкажіть імʼя — щонайменше 2 літери')],
      [phone, setError(phone, 'e-phone', phoneDigits().length === 12 ? '' : 'Вкажіть номер у форматі +380 XX XXX XX XX')],
    ];
    const firstInvalid = results.find(([, ok]) => !ok);
    return { ok: !firstInvalid, focus: firstInvalid?.[0] };
  };

  /* ---------- Події ---------- */
  form.addEventListener('change', (event) => {
    const { target } = event;
    if (target.name === 'date') {
      state.date = target.value;
      renderTimes();
    }
    if (target.name === 'time') state.time = target.value;
    if (target === master) renderTimes();
    updateSummary();
    if (submitted) validate();
  });

  form.addEventListener('input', () => {
    if (submitted) validate();
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    submitted = true;
    const { ok, focus } = validate();
    if (!ok) {
      // Для кастомного списку фокусуємо його кнопку, а не прихований select
      (focus?.closest('.select')?.querySelector('.select__button') || focus)?.focus();
      return;
    }

    submit.disabled = true;
    $('.btn__label > span', submit).textContent = 'Надсилаємо…';

    // Бекенду немає — імітуємо відправку
    setTimeout(() => showSuccess(), 900);
  });

  const showSuccess = () => {
    const who = master.value ? ` · майстер ${master.value}` : '';
    $('[data-success="name"]', success).textContent = name.value.trim().split(' ')[0];
    $('[data-success="slot"]', success).textContent = `${dateText(state.date)} о ${state.time} — ${service.value}${who}`;

    const message = `Привіт! Щойно записався на сайті: ${service.value}, ${dateText(state.date)} о ${state.time}${master.value ? `, майстер ${master.value}` : ''}.`;
    $('[data-success-tg]', success).href = `https://t.me/${TELEGRAM}?text=${encodeURIComponent(message)}`;

    form.hidden = true;
    success.hidden = false;
    requestAnimationFrame(() => success.classList.add('is-shown'));
    $('.success__title', success).focus();

    if (window.gsap && !document.documentElement.classList.contains('reduced-motion')) {
      window.gsap.from($$('.success > *', card), { opacity: 0, y: 24, duration: 1, ease: 'expo.out', stagger: 0.07 });
    }
  };

  $('[data-success-reset]', success).addEventListener('click', () => {
    form.reset();
    state.date = '';
    state.time = '';
    submitted = false;
    submit.disabled = false;
    $('.btn__label > span', submit).textContent = 'Підтвердити запис';
    $$('[aria-invalid]', form).forEach((el) => el.removeAttribute('aria-invalid'));
    $$('.field__error', form).forEach((el) => { el.textContent = ''; });
    renderDates();
    timesEl.innerHTML = '<p class="chips__hint">Спершу оберіть дату</p>';
    updateSummary();
    success.classList.remove('is-shown');
    success.hidden = true;
    form.hidden = false;
    (service.closest('.select')?.querySelector('.select__button') || service).focus();
  });

  // Кнопки «Записатися» в прайсі та картках майстрів підставляють вибір у форму
  document.addEventListener('click', (event) => {
    const svc = event.target.closest('[data-service]');
    const mst = event.target.closest('[data-master]');
    // change з bubbles — щоб оновилися і підсумок, і кастомний список
    if (svc) {
      service.value = svc.dataset.service;
      service.dispatchEvent(new Event('change', { bubbles: true }));
    }
    if (mst) {
      master.value = mst.dataset.master;
      master.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });

  renderDates();
  updateSummary();
}
