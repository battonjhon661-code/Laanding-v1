// @ts-nocheck
'use client';

import { useEffect, useRef } from 'react';
import { scrollToFooterAndPulse } from './scrollToFooter';

const CAT_ORDER = ['showers','mirrors','railings','partitions','loft','panels','canopies','shelves'];
const CATS = {
  showers: { title:'Душевые', cover:'/assets/boxes/1_shower_box-Photoroom.webp', works:[
    { name:'Дверь',            image:'/assets/examples/showers/1_dver.webp' },
    { name:'Прямая (2 стекла)',  image:'/assets/examples/showers/2_pryamaya_2.webp' },
    { name:'Прямая (3 стекла)',  image:'/assets/examples/showers/3_pryamaya_3.webp' },
    { name:'Трапеция',           image:'/assets/examples/showers/4_trapeciya.webp' },
    { name:'Т-образная',         image:'/assets/examples/showers/5_t_obraz.webp' },
    { name:'Складная',           image:'/assets/examples/showers/6_skladnaya.webp' },
    { name:'Угловая (3 стекла)', image:'/assets/examples/showers/7_uglovaya_3.webp' },
    { name:'Угловая (2 стекла)', image:'/assets/examples/showers/8_uglovaya_2.webp' },
  ]},
  mirrors: { title:'Зеркала с подсветкой', cover:'/assets/boxes/2_mirror_box-Photoroom.webp', works:[
    { name:'Круглое',       image:'/assets/examples/mirrors/1_cicrle.webp' },
    { name:'Г-образное',    image:'/assets/examples/mirrors/2_R_type.webp' },
    { name:'Овальное',      image:'/assets/examples/mirrors/3_oval.webp' },
    { name:'Эллипс',        image:'/assets/examples/mirrors/4_elipse.webp' },
    { name:'Прямоугольное', image:'/assets/examples/mirrors/5_square.webp' },
    { name:'Арочное',       image:'/assets/examples/mirrors/6_arka.webp' },
  ]},
  railings: { title:'Ограждения', cover:'/assets/boxes/3_stairs_box-Photoroom.webp', works:[
    { name:'На точечных фитингах', image:'/assets/examples/stairs/1_tochki.webp' },
    { name:'На стойках',           image:'/assets/examples/stairs/2_stoyki.webp' },
    { name:'В профиле',            image:'/assets/examples/stairs/3_profil.webp' },
  ]},
  partitions: { title:'Перегородки', cover:'/assets/boxes/4_partition-Photoroom.webp', works:[
    { name:'Цельностеклянная', image:'/assets/examples/partitions/1_cs.webp' },
    { name:'На каркасе',       image:'/assets/examples/partitions/2_karkas.webp' },
    { name:'Раздвижная',       image:'/assets/examples/partitions/3_razdvizhnaya.webp' },
  ]},
  loft: { title:'Лофт', cover:'/assets/boxes/5_loft-Photoroom.webp', works:[
    { name:'Арочная',    image:'/assets/examples/lofts/1_arochnaya.webp' },
    { name:'Складная',   image:'/assets/examples/lofts/2_skladnaya.webp' },
    { name:'Угловая',    image:'/assets/examples/lofts/3_uglovaya.webp' },
    { name:'Прямая',     image:'/assets/examples/lofts/4_pryamaya.webp' },
    { name:'Раздвижная', image:'/assets/examples/lofts/5_razdvizhnaya.webp' },
  ]},
  panels: { title:'Панели', cover:'/assets/boxes/8_panels-Photoroom.webp', works:[
    { name:'Прихожая',     image:'/assets/examples/panels/1_prihojaya.webp' },
    { name:'Прикроватная', image:'/assets/examples/panels/2_prikrovatnaya.webp' },
  ]},
  canopies: { title:'Козырьки', cover:'/assets/boxes/9_visors-Photoroom.webp', works:[
    { name:'Навесная',  image:'/assets/examples/visors/1_navesnaya.webp' },
    { name:'В профиле', image:'/assets/examples/visors/2_profil.webp' },
  ]},
  shelves: { title:'Полки', cover:'/assets/boxes/12_shelves-Photoroom.webp', works:[
    { name:'Встроенные с подсветкой', image:'/assets/examples/shelves/1_vstroennie_s_podsvetkoy.webp' },
    { name:'Полки в нише',            image:'/assets/examples/shelves/2_polki_v_nishe.webp' },
    { name:'На больших держателях',   image:'/assets/examples/shelves/3_bolshie_derjateli.webp' },
  ]},
};

const CATS_ARR = CAT_ORDER.map(id => ({ id, title: CATS[id].title, cover: CATS[id].cover, works: CATS[id].works }));

function scrollToFooter() {
  scrollToFooterAndPulse();
}

function circDiff(i: number, a: number, t: number) {
  let d = i - a;
  if (d > t / 2) d -= t;
  if (d < t / -2) d += t;
  return d;
}

function initCarousel(
  carouselEl: HTMLElement,
  paginationEl: HTMLElement,
  catIndex: { value: number },
  workIndex: { value: number },
  onCatChange?: () => void,
) {
  function posClass(i: number) {
    const t = CATS_ARR[catIndex.value].works.length;
    const d = circDiff(i, workIndex.value, t);
    if (d === 0) return 'exm-center';
    if (d === -1) return 'exm-left';
    if (d === 1) return 'exm-right';
    return d < 0 ? 'exm-far-left' : 'exm-far-right';
  }

  function renderCards() {
    const works = CATS_ARR[catIndex.value].works;
    carouselEl.innerHTML = works.map((w, i) =>
      '<article class="exm-card ' + posClass(i) + '" data-index="' + i + '">'
      + '<div class="exm-card-img"><img src="' + w.image + '" alt=""></div>'
      + '<div class="exm-card-body"><h4 class="exm-card-title">' + w.name + '</h4>'
      + '<button class="exm-card-btn" type="button"><span>Хочу обсудить проект</span><span class="arrow"><svg width="20" height="8" viewBox="0 0 26 10" fill="none"><path d="M0 5h24M20 1l4 4-4 4" stroke="currentColor" stroke-width="1.2"/></svg></span></button></div>'
      + '</article>'
    ).join('');
    renderPagination();
  }

  function renderPagination() {
    paginationEl.innerHTML = CATS_ARR[catIndex.value].works.map((_, i) =>
      '<button type="button" class="' + (i === workIndex.value ? 'active' : '') + '"></button>'
    ).join('');
  }

  function updatePositions() {
    const cards = carouselEl.querySelectorAll('.exm-card');
    for (let i = 0; i < cards.length; i++) {
      cards[i].className = 'exm-card ' + posClass(i);
    }
    renderPagination();
  }

  function showWork(i: number) {
    const t = CATS_ARR[catIndex.value].works.length;
    workIndex.value = ((i % t) + t) % t;
    updatePositions();
  }

  function selectCat(ci: number) {
    catIndex.value = ci;
    workIndex.value = 0;
    renderCards();
    if (onCatChange) onCatChange();
  }

  carouselEl.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest('.exm-card-btn');
    if (btn) { e.stopPropagation(); scrollToFooter(); return; }
    const card = (e.target as HTMLElement).closest('.exm-card') as HTMLElement;
    if (!card) return;
    if (card.classList.contains('exm-left')) showWork(workIndex.value - 1);
    if (card.classList.contains('exm-right')) showWork(workIndex.value + 1);
  });

  paginationEl.addEventListener('click', (e) => {
    const dot = (e.target as HTMLElement).closest('button');
    if (!dot) return;
    showWork(Array.from(paginationEl.children).indexOf(dot));
  });

  let dragStartX = 0, dragStartY = 0, dragActive = false;
  carouselEl.addEventListener('touchstart', (e) => {
    if (!e.touches.length) return;
    dragStartX = e.touches[0].clientX;
    dragStartY = e.touches[0].clientY;
    dragActive = true;
  }, { passive: true });
  carouselEl.addEventListener('touchend', (e) => {
    if (!dragActive || !e.changedTouches.length) return;
    dragActive = false;
    const dx = e.changedTouches[0].clientX - dragStartX;
    const dy = e.changedTouches[0].clientY - dragStartY;
    if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return;
    if (dx < 0) showWork(workIndex.value + 1);
    else showWork(workIndex.value - 1);
  });
  carouselEl.addEventListener('pointerdown', (e: PointerEvent) => {
    if (e.pointerType === 'touch') return;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    dragActive = true;
  });
  carouselEl.addEventListener('pointerup', (e: PointerEvent) => {
    if (e.pointerType === 'touch' || !dragActive) return;
    dragActive = false;
    const dx = e.clientX - dragStartX;
    const dy = e.clientY - dragStartY;
    if (Math.abs(dx) > 35 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) showWork(workIndex.value + 1);
      else showWork(workIndex.value - 1);
    }
  });

  renderCards();

  return { showWork, selectCat, renderCards };
}

function initDesktop(section: HTMLElement) {
  const wrap = section.querySelector('.exd-wrap') as HTMLElement;
  if (!wrap) return;

  const carouselEl = wrap.querySelector('.exd-carousel') as HTMLElement;
  const paginationEl = wrap.querySelector('.exd-pagination') as HTMLElement;
  const catsEl = wrap.querySelector('.exd-cats') as HTMLElement;
  const catTitleEl = wrap.querySelector('.exd-cat-title') as HTMLElement;

  if (!carouselEl || !paginationEl || !catsEl) return;

  const catIndex = { value: 0 };
  const workIndex = { value: 0 };

  function renderCats() {
    catsEl.innerHTML = CATS_ARR.map((cat, i) =>
      '<button class="exd-cat-item ' + (i === catIndex.value ? 'is-active' : '') + '" data-index="' + i + '">'
      + '<img src="' + cat.cover + '" alt="">'
      + '<span>' + cat.title + '</span>'
      + '</button>'
    ).join('');
    if (catTitleEl) catTitleEl.textContent = CATS_ARR[catIndex.value].title;
  }

  const carousel = initCarousel(carouselEl, paginationEl, catIndex, workIndex, renderCats);

  const prevBtn = wrap.querySelector('.exd-arrow--prev');
  const nextBtn = wrap.querySelector('.exd-arrow--next');
  if (prevBtn) prevBtn.addEventListener('click', () => carousel.showWork(workIndex.value - 1));
  if (nextBtn) nextBtn.addEventListener('click', () => carousel.showWork(workIndex.value + 1));

  catsEl.addEventListener('click', (e) => {
    const item = (e.target as HTMLElement).closest('.exd-cat-item') as HTMLElement;
    if (!item) return;
    carousel.selectCat(Number(item.dataset.index));
  });

  function onKey(e: KeyboardEvent) {
    const rect = section.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > window.innerHeight) return;
    if (e.key === 'ArrowLeft') carousel.showWork(workIndex.value - 1);
    if (e.key === 'ArrowRight') carousel.showWork(workIndex.value + 1);
  }
  renderCats();

  document.addEventListener('keydown', onKey);

  // Entrance animation — hide cards and force all to center
  const allCards = () => carouselEl.querySelectorAll('.exm-card') as NodeListOf<HTMLElement>;
  allCards().forEach(c => {
    c.style.transition = 'none';
    c.style.transform = 'translateX(-50%)';
    c.style.opacity = '0';
  });

  let entranceStarted = false;
  const entranceTimers: ReturnType<typeof setTimeout>[] = [];
  const savedVersion = window.localStorage.getItem('siteVersion');
  const waitsForTransitionReveal = savedVersion === '0' || section.closest('.cr-stage--fade') !== null;

  function startEntrance() {
    if (entranceStarted) return;
    entranceStarted = true;
    wrap.classList.add('exd-visible');

    // Step 1: center card fades in (at center position)
    entranceTimers.push(setTimeout(() => {
      allCards().forEach(c => {
        if (c.classList.contains('exm-center')) {
          c.style.transition = 'opacity 0.6s ease';
          c.style.opacity = '1';
        }
      });
    }, 700));

    // Step 2: side cards fly out from center to their positions
    entranceTimers.push(setTimeout(() => {
      allCards().forEach(c => {
        if (!c.classList.contains('exm-center')) {
          c.style.transition = 'opacity 0.5s ease, transform 0.7s cubic-bezier(.22,1,.36,1)';
          c.style.transform = '';
          c.style.opacity = '';
        }
      });
    }, 1200));

    // Cleanup — remove all inline overrides
    entranceTimers.push(setTimeout(() => {
      allCards().forEach(c => {
        c.style.transition = '';
        c.style.transform = '';
        c.style.opacity = '';
      });
      wrap.classList.add('exd-anim-done');
    }, 2600));
  }

  let obs: IntersectionObserver | null = null;
  const onManualReveal = () => startEntrance();

  if (waitsForTransitionReveal) {
    section.addEventListener('vg:examples-reveal', onManualReveal);
    if (wrap.dataset.vgRevealRequested === '1') {
      requestAnimationFrame(startEntrance);
    }
  } else {
    obs = new IntersectionObserver((entries) => {
      if (!entries[0].isIntersecting) return;
      obs?.disconnect();
      startEntrance();
    }, { threshold: 0.15 });
    obs.observe(section);
  }

  return () => {
    document.removeEventListener('keydown', onKey);
    section.removeEventListener('vg:examples-reveal', onManualReveal);
    obs?.disconnect();
    entranceTimers.forEach(clearTimeout);
  };
}

function initMobile(section: HTMLElement) {
  const desktopWrap = section.querySelector('.exd-wrap') as HTMLElement;
  if (desktopWrap) desktopWrap.style.display = 'none';

  const el = section.querySelector('.exs-mobile') as HTMLElement;
  if (!el) return;
  el.style.display = 'block';
  section.style.height = 'auto';
  section.style.overflow = 'visible';

  const catIndex = { value: 0 };
  const workIndex = { value: 0 };

  el.innerHTML =
    '<h2 class="exm-main-title">ПРИМЕРЫ РАБОТ</h2>'
    + '<h3 class="exm-cat-title" id="exmCatTitle"></h3>'
    + '<p class="exm-cat-sub">Выберите категорию по вашему вкусу</p>'
    + '<div class="exm-carousel" id="exmCarousel"></div>'
    + '<div class="exm-pagination" id="exmPagination"></div>'
    + '<h3 class="exm-cats-title">Категории</h3>'
    + '<p class="exm-cats-sub">Выберите категорию по вашему вкусу</p>'
    + '<div class="exm-cats-list" id="exmCatsList"></div>';

  const carouselEl = document.getElementById('exmCarousel')!;
  const paginationEl = document.getElementById('exmPagination')!;
  const catTitleEl = document.getElementById('exmCatTitle')!;
  const catsListEl = document.getElementById('exmCatsList')!;

  function renderMobileCats() {
    catsListEl.innerHTML = CATS_ARR.map((cat, i) =>
      '<button class="exm-cat-item ' + (i === catIndex.value ? 'is-active' : '') + '" data-index="' + i + '">'
      + '<img src="' + cat.cover + '" alt="">'
      + '<span>' + cat.title + '</span>'
      + '</button>'
    ).join('');
    catTitleEl.textContent = CATS_ARR[catIndex.value].title;
  }

  const carousel = initCarousel(carouselEl, paginationEl, catIndex, workIndex, renderMobileCats);

  catsListEl.addEventListener('click', (e) => {
    const item = (e.target as HTMLElement).closest('.exm-cat-item') as HTMLElement;
    if (!item) return;
    carousel.selectCat(Number(item.dataset.index));
  });

  renderMobileCats();

  return () => {
    el.innerHTML = '';
    el.style.display = 'none';
    if (desktopWrap) desktopWrap.style.display = '';
  };
}

export default function ProductSlide() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const mob = window.innerWidth <= 768;
    if (mob) return initMobile(section);
    return initDesktop(section);
  }, []);

  return (
    <section
      ref={sectionRef}
      className="exs-prod-section"
      id="exs-section"
      style={{ position: 'relative', overflow: 'hidden' }}
    >
      <div className="exd-wrap">
        <div className="exd-header">
          <h2 className="exd-title">ПРИМЕРЫ РАБОТ</h2>
        </div>
        <div className="exd-body">
          <div className="exd-main">
            <h3 className="exd-cat-title"></h3>
            <div className="exm-carousel exd-carousel"></div>
            <div className="exm-pagination exd-pagination"></div>
            <button className="exd-arrow exd-arrow--prev" type="button" aria-label="Предыдущая работа">&#8249;</button>
            <button className="exd-arrow exd-arrow--next" type="button" aria-label="Следующая работа">&#8250;</button>
          </div>
          <aside className="exd-sidebar">
            <h3 className="exd-sidebar-title">Категории</h3>
            <p className="exd-sidebar-hint">Выберите категорию по вашему вкусу</p>
            <nav className="exd-cats"></nav>
          </aside>
        </div>
      </div>

      <div className="exs-mobile" style={{ display: 'none' }}></div>
    </section>
  );
}
