import { $, hasGsap, motionEnabled } from './modules/utils.js';
import { initSmoothScroll } from './modules/smooth.js';
import { runPreloader } from './modules/preloader.js';
import { initHeader } from './modules/header.js';
import { initHeroVideo, playHeroIntro, prepareHeroIntro } from './modules/hero.js';
import { initScrollAnimations } from './modules/animations.js';
import { initMagnetic } from './modules/magnetic.js';
import { initGallery } from './modules/gallery.js';
import { initCompare } from './modules/compare.js';
import { initReviews } from './modules/reviews.js';
import { initBooking } from './modules/booking.js';
import { initCustomSelects } from './modules/select.js';
import { initOpenStatus } from './modules/status.js';
import { initMobileCta } from './modules/mobile-cta.js';

window.__bsReady = true;

// Спершу даємо браузеру намалювати перший кадр (заголовок під шторкою прелоадера),
// а вже потім виконуємо важку ініціалізацію — так перша відмальовка не чекає JS
await new Promise((resolve) => {
  requestAnimationFrame(() => setTimeout(resolve, 0));
  setTimeout(resolve, 150); // у фоновій вкладці rAF не спрацьовує — не чекаємо вічно
});

// Якщо CDN з GSAP недоступний — показуємо все статично, без анімацій
if (!hasGsap()) {
  document.documentElement.classList.remove('js');
  document.documentElement.classList.add('no-preloader');
}

const year = $('[data-year]');
if (year) year.textContent = new Date().getFullYear();

// Після прелоадера сторінка завжди стартує з першого екрану
if (motionEnabled()) window.scrollTo(0, 0);

const lenis = initSmoothScroll();
initHeader();
prepareHeroIntro();
const preloaderDone = runPreloader();

// Решту ініціалізуємо дрібними задачами, поки грає прелоадер, — без довгих блокувань потоку
const nextTask = () => new Promise((resolve) => setTimeout(resolve, 0));
const tasks = [initHeroVideo, initOpenStatus, initCustomSelects, initBooking, initGallery, initCompare, initReviews, initMobileCta];
if (motionEnabled()) tasks.push(initScrollAnimations, initMagnetic);

(async () => {
  for (const task of tasks) {
    await task();
    await nextTask();
  }

  await preloaderDone;
  playHeroIntro();
  window.ScrollTrigger?.refresh();

  // Посилання з якорем (наприклад, …/#booking) — доїжджаємо після інтро
  const target = window.location.hash && document.querySelector(window.location.hash);
  if (target && lenis) setTimeout(() => lenis.scrollTo(target, { duration: 1.6 }), 900);
})();
