import { $$ } from './utils.js';
import { HOURS } from './booking.js';

const WEEKDAYS = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
const pad = (h) => `${String(h).padStart(2, '0')}:00`;

/** Поточний день і час у Києві — незалежно від часового поясу відвідувача. */
function kyivNow() {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Kyiv',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date());
  const get = (type) => parts.find((p) => p.type === type)?.value;
  return { day: WEEKDAYS[get('weekday')], hour: Number(get('hour')) % 24, minute: Number(get('minute')) };
}

/** Індикатор «відчинено / зачинено». */
export function initOpenStatus() {
  const nodes = $$('[data-open-status]');
  if (!nodes.length) return;

  const update = () => {
    const { day, hour, minute } = kyivNow();
    const [open, close] = HOURS[day];
    const time = hour + minute / 60;
    const isOpen = time >= open && time < close;

    let text;
    if (isOpen) text = `Відчинено · до ${pad(close)}`;
    else if (time < open) text = `Зачинено · відкриємось о ${pad(open)}`;
    else text = `Зачинено · завтра з ${pad(HOURS[(day + 1) % 7][0])}`;

    nodes.forEach((node) => {
      node.classList.toggle('is-open', isOpen);
      node.querySelector('.open-status__text').textContent = text;
    });
  };

  update();
  setInterval(update, 60 * 1000);
}
