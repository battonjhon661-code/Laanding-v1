// @ts-nocheck
'use client';

import { useEffect, useRef } from 'react';

const CATS = [
  { label:'Душевые', dot:'#0d9488', cover:'/assets/boxes/1_shower_box-Photoroom.webp', subs:[
    { title:'Дверная',            img:'/assets/examples/showers/1_dver.webp' },
    { title:'Прямая (2 стекла)',  img:'/assets/examples/showers/2_pryamaya_2.webp' },
    { title:'Прямая (3 стекла)',  img:'/assets/examples/showers/3_pryamaya_3.webp' },
    { title:'Трапеция',           img:'/assets/examples/showers/4_trapeciya.webp' },
    { title:'Т-образная',         img:'/assets/examples/showers/5_t_obraz.webp' },
    { title:'Складная',           img:'/assets/examples/showers/6_skladnaya.webp' },
    { title:'Угловая (3 стекла)', img:'/assets/examples/showers/7_uglovaya_3.webp' },
    { title:'Угловая (2 стекла)', img:'/assets/examples/showers/8_uglovaya_2.webp' },
  ]},
  { label:'Зеркала', dot:'#a855f7', cover:'/assets/boxes/2_mirror_box-Photoroom.webp', subs:[
    { title:'Круглое',        img:'/assets/examples/mirrors/1_cicrle.webp' },
    { title:'Г-образное',     img:'/assets/examples/mirrors/2_R_type.webp' },
    { title:'Овальное',       img:'/assets/examples/mirrors/3_oval.webp' },
    { title:'Эллипс',         img:'/assets/examples/mirrors/4_elipse.webp' },
    { title:'Прямоугольное',  img:'/assets/examples/mirrors/5_square.webp' },
    { title:'Арочное',        img:'/assets/examples/mirrors/6_arka.webp' },
  ]},
  { label:'Ограждения', dot:'#d97706', cover:'/assets/boxes/3_stairs_box-Photoroom.webp', subs:[
    { title:'На точечных фитингах', img:'/assets/examples/stairs/1_tochki.webp' },
    { title:'На стойках',           img:'/assets/examples/stairs/2_stoyki.webp' },
    { title:'В профиле',            img:'/assets/examples/stairs/3_profil.webp' },
  ]},
  { label:'Перегородки', dot:'#3b82f6', cover:'/assets/boxes/4_partition-Photoroom.webp', subs:[
    { title:'Цельностеклянная', img:'/assets/examples/partitions/1_cs.webp' },
    { title:'На каркасе',       img:'/assets/examples/partitions/2_karkas.webp' },
    { title:'Раздвижная',       img:'/assets/examples/partitions/3_razdvizhnaya.webp' },
  ]},
  { label:'Лофт', dot:'#ef4444', cover:'/assets/boxes/5_loft-Photoroom.webp', subs:[
    { title:'Арочная',    img:'/assets/examples/lofts/1_arochnaya.webp' },
    { title:'Складная',   img:'/assets/examples/lofts/2_skladnaya.webp' },
    { title:'Угловая',    img:'/assets/examples/lofts/3_uglovaya.webp' },
    { title:'Прямая',     img:'/assets/examples/lofts/4_pryamaya.webp' },
    { title:'Раздвижная', img:'/assets/examples/lofts/5_razdvizhnaya.webp' },
  ]},
  { label:'Панели', dot:'#10b981', cover:'/assets/boxes/8_panels-Photoroom.webp', subs:[
    { title:'Прихожая',    img:'/assets/examples/panels/1_prihojaya.webp' },
    { title:'Прикроватная', img:'/assets/examples/panels/2_prikrovatnaya.webp' },
  ]},
  { label:'Козырьки', dot:'#f59e0b', cover:'/assets/boxes/9_visors-Photoroom.webp', subs:[
    { title:'Навесная', img:'/assets/examples/visors/1_navesnaya.webp' },
    { title:'В профиле', img:'/assets/examples/visors/2_profil.webp' },
  ]},
  { label:'Полки', dot:'#8b5cf6', cover:'/assets/boxes/12_shelves-Photoroom.webp', subs:[
    { title:'Встроенные с подсветкой', img:'/assets/examples/shelves/1_vstroennie_s_podsvetkoy.webp' },
    { title:'Полки в нише',            img:'/assets/examples/shelves/2_polki_v_nishe.webp' },
    { title:'На больших держателях',   img:'/assets/examples/shelves/3_bolshie_derjateli.webp' },
  ]},
];

function initMobile(section: HTMLElement) {
  section.style.height = 'auto';
  section.style.overflow = 'visible';
  section.style.touchAction = 'auto';
  section.style.width = '100%';

  const el = document.createElement('div');
  el.className = 'exs-mobile';
  el.style.display = 'block';
  section.appendChild(el);

  // Hide desktop elements
  const heading = section.querySelector('.exs-heading') as HTMLElement;
  const stageArea = section.querySelector('.exs-stage-area') as HTMLElement;
  if (heading) heading.style.display = 'none';
  if (stageArea) stageArea.style.display = 'none';

  let exmCat = 0, exmWork = 0;
  let dragStartX = 0, dragStartY = 0, dragActive = false;

  function circDiff(i: number, a: number, t: number) {
    let d = i - a;
    if (d > t / 2) d -= t;
    if (d < t / -2) d += t;
    return d;
  }
  function posClass(i: number) {
    const t = CATS[exmCat].subs.length;
    const d = circDiff(i, exmWork, t);
    if (d === 0) return 'exm-center';
    if (d === -1) return 'exm-left';
    if (d === 1) return 'exm-right';
    return d < 0 ? 'exm-far-left' : 'exm-far-right';
  }

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

  function renderCarousel() {
    const works = CATS[exmCat].subs;
    catTitleEl.textContent = CATS[exmCat].label;
    carouselEl.innerHTML = works.map((w, i) =>
      '<article class="exm-card ' + posClass(i) + '" data-index="' + i + '">'
      + '<div class="exm-card-img"><img src="' + w.img + '" alt=""></div>'
      + '<div class="exm-card-body"><h4 class="exm-card-title">' + w.title + '</h4>'
      + '<button class="exm-card-btn" type="button"><span>Хочу обсудить проект</span><span class="arrow"><svg width="20" height="8" viewBox="0 0 26 10" fill="none"><path d="M0 5h24M20 1l4 4-4 4" stroke="currentColor" stroke-width="1.2"/></svg></span></button></div>'
      + '</article>'
    ).join('');
    paginationEl.innerHTML = works.map((_, i) =>
      '<button type="button" class="' + (i === exmWork ? 'active' : '') + '"></button>'
    ).join('');
  }

  function renderCats() {
    catsListEl.innerHTML = CATS.map((cat, i) => {
      const img = cat.cover;
      return '<button class="exm-cat-item ' + (i === exmCat ? 'is-active' : '') + '" data-index="' + i + '">'
        + '<img src="' + img + '" alt="">'
        + '<span>' + cat.label + '</span>'
        + '</button>';
    }).join('');
  }

  function updatePositions() {
    const cards = carouselEl.querySelectorAll('.exm-card');
    for (let i = 0; i < cards.length; i++) {
      cards[i].className = 'exm-card ' + posClass(i);
    }
    const dots = paginationEl.querySelectorAll('button');
    for (let j = 0; j < dots.length; j++) {
      dots[j].className = j === exmWork ? 'active' : '';
    }
  }

  function showWork(i: number) {
    const t = CATS[exmCat].subs.length;
    exmWork = ((i % t) + t) % t;
    updatePositions();
  }

  function selectCat(i: number) {
    exmCat = i;
    exmWork = 0;
    renderCarousel();
    renderCats();
  }

  carouselEl.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest('.exm-card-btn');
    if (btn) {
      const footer = document.querySelector('.site-footer') || document.querySelector('footer');
      if (footer) footer.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    const card = (e.target as HTMLElement).closest('.exm-card');
    if (!card) return;
    if (card.classList.contains('exm-left')) showWork(exmWork - 1);
    if (card.classList.contains('exm-right')) showWork(exmWork + 1);
  });

  paginationEl.addEventListener('click', (e) => {
    const dot = (e.target as HTMLElement).closest('button');
    if (!dot) return;
    const dots = Array.from(paginationEl.children);
    showWork(dots.indexOf(dot));
  });

  catsListEl.addEventListener('click', (e) => {
    const item = (e.target as HTMLElement).closest('.exm-cat-item') as HTMLElement;
    if (!item) return;
    selectCat(Number(item.dataset.index));
  });

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
    if (dx < 0) showWork(exmWork + 1);
    else showWork(exmWork - 1);
  });

  renderCats();
  renderCarousel();

  return () => {
    if (el.parentNode) el.parentNode.removeChild(el);
    if (heading) heading.style.display = '';
    if (stageArea) stageArea.style.display = '';
  };
}

export default function ProductSlide() {
  const stageRef = useRef(null);
  const sectionRef = useRef(null);

  useEffect(() => {
    const stage = stageRef.current;
    const section = sectionRef.current;
    if (!stage || !section) return;
    while (stage.firstChild) stage.removeChild(stage.firstChild);

    const mob = window.innerWidth <= 768;

    if (mob) return initMobile(section);

    const GCOLS = 4;
    const GROWS = 2; // 2 rows on both mobile and desktop → portrait intro cells
    // параметры карусели
    const W = stage.offsetWidth || window.innerWidth;
    const H = stage.offsetHeight || window.innerHeight;
    // 0.82 factor makes mobile compact cards slightly smaller than half-screen
    const compactCardW = mob ? Math.round(W / GCOLS * 0.82) : Math.min(Math.round(W / 4), 510);
    // Keep the same 292/404 portrait ratio as desktop compact cards
    const compactCardH = mob ? Math.round(compactCardW * 404 / 292) : Math.round(H / 2);
    const STEP  = mob ? compactCardW + 20 : 540;
    const VSTEP = mob ? 200 : 310;
    const WIN = 2, BUCKET = 5;
    const N = CATS.length;
    const state = { active: 0, sub: 0 };
    let locked = false;
    const TR = 'opacity .42s ease, transform .5s cubic-bezier(.2,.8,.2,1)';

    function mod(a, b) { return ((a % b) + b) % b; }
    function win(pos) {
      const arr = new Array(BUCKET);
      for (let v = pos - WIN; v <= pos + WIN; v++) arr[mod(v, BUCKET)] = v;
      return arr;
    }
    function ce(tag) { return document.createElement(tag); }
    function css(el, styles) { for (const k in styles) el.style[k] = styles[k]; }

    const rowEl = ce('div');
    css(rowEl, { position:'absolute', left:'50%', top:'0', height:'100%', width:'0' });
    stage.appendChild(rowEl);

    const slots = [];
    for (let si = 0; si < BUCKET; si++) {
      const slotEl = ce('div');
      css(slotEl, { position:'absolute', top:'0', height:'100%', width: STEP+'px' });

      const innerEl = ce('div');
      css(innerEl, {
        position:'absolute', left:'50%', top:'50%',
        transform:'translate(-50%,-50%)',
        width: mob ? `${STEP + 10}px` : '600px',
        height:'100%',
        display:'flex', alignItems:'center', justifyContent:'center',
      });
      slotEl.appendChild(innerEl);

      const compactEl = ce('div');
      css(compactEl, {
        position:'absolute',
        width: `${compactCardW}px`,
        height: `${compactCardH}px`,
        borderRadius: mob ? '14px' : '20px',
        overflow:'hidden', background:'transparent',
        backgroundSize:'cover', backgroundPosition:'center', cursor:'pointer',
      });
      const compactLbl = ce('span');
      css(compactLbl, {
        position:'absolute', top:'50%', left:'0', right:'0',
        transform:'translateY(-50%)', textAlign:'center',
        fontFamily:'Manrope,sans-serif',
        fontSize: mob ? '9px' : '12px',
        letterSpacing: mob ? '.18em' : '.22em',
        textTransform:'uppercase', fontWeight:'600', color:'#fff',
        textShadow:'0 1px 6px rgba(0,0,0,.5)', pointerEvents:'none',
      });
      compactEl.appendChild(compactLbl);
      innerEl.appendChild(compactEl);

      const stripEl = ce('div');
      css(stripEl, {
        position:'absolute',
        width: mob ? `${STEP}px` : '640px',
        height:'100%', transformOrigin:'center',
      });
      const pillEl = ce('div');
      css(pillEl, {
        position:'absolute',
        top: mob ? '10px' : '36px',
        bottom: mob ? '10px' : '36px',
        left:'0', right:'0',
        background:'transparent',
        borderRadius: mob ? '16px' : '34px',
      });
      stripEl.appendChild(pillEl);
      const colEl = ce('div');
      css(colEl, {
        position:'absolute', left:'0', right:'0', top:'50%', height:'0',
        transition:'transform .5s cubic-bezier(.2,.8,.2,1)',
      });
      stripEl.appendChild(colEl);
      innerEl.appendChild(stripEl);
      rowEl.appendChild(slotEl);

      const cells = [];
      for (let ci = 0; ci < BUCKET; ci++) {
        const cellEl = ce('div');
        css(cellEl, { position:'absolute', left:'50%', width:'0', height:'0' });

        const miniEl = ce('div');
        css(miniEl, {
          position:'absolute', left:'0', top:'0',
          width: mob ? `${STEP - 10}px` : '452px',
          height: mob ? '72px' : '112px',
          background:'#fff',
          borderRadius: mob ? '14px' : '20px',
          boxShadow:'0 16px 38px rgba(0,0,0,.10)',
          display:'flex', alignItems:'center',
          gap: mob ? '10px' : '18px',
          padding: mob ? '10px' : '16px',
          transition:TR, zIndex:'1', cursor:'pointer',
        });
        const miniImgEl = ce('div');
        css(miniImgEl, {
          width: mob ? '52px' : '96px',
          height: mob ? '46px' : '80px',
          borderRadius: mob ? '8px' : '13px',
          flexShrink:'0', backgroundSize:'cover', backgroundPosition:'center',
        });
        const miniTextEl = ce('div');
        css(miniTextEl, { flex:'1', minWidth:'0', display:'flex', flexDirection:'column', gap: mob ? '4px' : '7px' });
        const miniTopEl = ce('div');
        css(miniTopEl, { display:'flex', alignItems:'center', gap: mob ? '5px' : '8px' });
        const miniDotEl = ce('span');
        css(miniDotEl, { width: mob ? '5px' : '7px', height: mob ? '5px' : '7px', borderRadius:'50%', flexShrink:'0' });
        const miniLabelEl = ce('span');
        css(miniLabelEl, {
          fontSize: mob ? '9px' : '12px',
          color:'#9a9a9a', fontWeight:'600',
          letterSpacing:'.2px', fontFamily:'Manrope,sans-serif',
        });
        miniTopEl.appendChild(miniDotEl); miniTopEl.appendChild(miniLabelEl);
        const miniTitleEl = ce('span');
        css(miniTitleEl, {
          fontSize: mob ? '11px' : '15px',
          fontWeight:'600', color:'#222',
          lineHeight:'1.28', letterSpacing:'-.1px', fontFamily:'Manrope,sans-serif',
        });
        miniTextEl.appendChild(miniTopEl); miniTextEl.appendChild(miniTitleEl);
        miniEl.appendChild(miniImgEl); miniEl.appendChild(miniTextEl);

        const bigEl = ce('div');
        css(bigEl, {
          position:'absolute', left:'0', top:'0',
          width: mob ? `${STEP - 10}px` : '600px',
          height: mob ? '280px' : '432px',
          background:'#fff',
          borderRadius: mob ? '18px' : '24px',
          boxShadow:'0 34px 74px rgba(0,0,0,.16)',
          display:'flex',
          flexDirection: mob ? 'column' : 'row',
          overflow:'hidden', transition:TR,
        });
        const bigImgEl = ce('div');
        css(bigImgEl, {
          width: mob ? '100%' : '396px',
          height: mob ? '170px' : '100%',
          flexShrink:'0', backgroundSize:'cover', backgroundPosition:'center',
        });
        if (!document.getElementById('btn-sheen-style')) {
          const st = document.createElement('style');
          st.id = 'btn-sheen-style';
          st.textContent = `@keyframes btnSheen{0%{transform:translateX(-120%) skewX(-18deg);opacity:0}8%{opacity:1}92%{opacity:1}100%{transform:translateX(320%) skewX(-18deg);opacity:0}}`;
          document.head.appendChild(st);
        }
        const bigBadgeEl = ce('button');
        css(bigBadgeEl, {
          display:'inline-flex', alignItems:'center',
          gap: mob ? '8px' : '12px',
          padding: mob ? '0 12px' : '0 20px',
          height: mob ? '34px' : '44px',
          background:'#171717', color:'#fff',
          fontSize: mob ? '10px' : '11px',
          fontWeight:'650', letterSpacing:'.02em',
          whiteSpace:'nowrap',
          borderRadius:'8px',
          border:'1px solid #171717',
          cursor:'pointer',
          fontFamily:'Manrope,sans-serif',
          zIndex:'2', outline:'none',
          overflow:'hidden',
          boxShadow:'0 6px 16px rgba(0,0,0,.18)',
          transition:'background .16s ease, transform .16s ease, box-shadow .16s ease',
        });
        const sheenEl = ce('span');
        css(sheenEl, {
          position:'absolute', top:'0', bottom:'0', left:'0', width:'45%',
          background:'linear-gradient(to right, transparent, rgba(255,255,255,0.22), rgba(255,255,255,0.08), transparent)',
          animation:'btnSheen 2.8s cubic-bezier(.4,0,.6,1) infinite',
          pointerEvents:'none',
        });
        bigBadgeEl.appendChild(sheenEl);
        const labelEl = ce('span');
        labelEl.textContent = 'Заказать';
        bigBadgeEl.appendChild(labelEl);
        const arrowEl = ce('span');
        arrowEl.innerHTML = '<svg width="22" height="8" viewBox="0 0 26 10" fill="none" style="display:block;flex-shrink:0"><path d="M0 5h24M20 1l4 4-4 4" stroke="currentColor" stroke-width="1.4"/></svg>';
        bigBadgeEl.appendChild(arrowEl);
        bigBadgeEl.addEventListener('mouseenter', () => {
          css(bigBadgeEl, { background:'#292929', transform:'translateY(-2px)', boxShadow:'0 9px 22px rgba(0,0,0,.22)' });
          sheenEl.style.animationDuration = '1.6s';
        });
        bigBadgeEl.addEventListener('mouseleave', () => {
          css(bigBadgeEl, { background:'#171717', transform:'translateY(0)', boxShadow:'0 6px 16px rgba(0,0,0,.18)' });
          sheenEl.style.animationDuration = '2.8s';
        });
        bigBadgeEl.addEventListener('mousedown', () => {
          css(bigBadgeEl, { background:'#111', transform:'translateY(0)', boxShadow:'0 3px 8px rgba(0,0,0,.14)' });
        });
        bigBadgeEl.addEventListener('mouseup', () => {
          css(bigBadgeEl, { background:'#292929', transform:'translateY(-2px)', boxShadow:'0 9px 22px rgba(0,0,0,.22)' });
        });
        bigBadgeEl.addEventListener('click', () => {
          document.querySelector('.site-footer')?.scrollIntoView({ behavior:'smooth' });
          setTimeout(() => {
            document.querySelectorAll<HTMLElement>('.footer-msg-btn').forEach((b, idx) => {
              setTimeout(() => {
                b.animate(
                  [
                    { opacity:1, boxShadow:'none' },
                    { opacity:.5, boxShadow:'none', offset:.18 },
                    { opacity:1, boxShadow:'0 0 14px rgba(255,255,255,.55)', offset:.36 },
                    { opacity:.7, boxShadow:'none', offset:.55 },
                    { opacity:1, boxShadow:'0 0 20px rgba(255,255,255,.6)', offset:.72 },
                    { opacity:1, boxShadow:'none' },
                  ],
                  { duration: 1100, easing:'ease' }
                );
              }, idx * 180);
            });
          }, 650);
        });
        const bigInfoEl = ce('div');
        css(bigInfoEl, {
          flex:'1', background:'#fff',
          padding: mob ? '12px' : '26px',
          display:'flex', flexDirection:'column', justifyContent:'flex-start',
        });
        const bigMetaEl = ce('div');
        css(bigMetaEl, {
          display:'flex', alignItems:'center',
          gap: mob ? '6px' : '9px',
          marginTop:'auto',
          marginBottom: mob ? '4px' : '6px',
        });
        const bigDotEl = ce('span');
        css(bigDotEl, { width: mob ? '5px' : '7px', height: mob ? '5px' : '7px', borderRadius:'50%', flexShrink:'0' });
        const bigCatEl = ce('span');
        css(bigCatEl, { fontSize: mob ? '10px' : '14px', color:'#8a8a8a', fontFamily:'Manrope,sans-serif' });
        bigMetaEl.appendChild(bigDotEl); bigMetaEl.appendChild(bigCatEl);
        const bigModelEl = ce('div');
        if (mob) {
          css(bigModelEl, {
            color:'#8a8a8a',
            fontSize:'10px',
            fontWeight:'500', letterSpacing:'.15px',
            fontFamily:'Manrope,sans-serif',
            marginBottom:'2px',
          });
        } else {
          css(bigModelEl, {
            position:'absolute',
            top:'18px', right:'18px',
            color:'#161616',
            fontSize:'12px',
            fontWeight:'600', letterSpacing:'.15px',
            zIndex:'3', fontFamily:'Manrope,sans-serif',
          });
        }
        const bigTitleEl = ce('div');
        css(bigTitleEl, {
          fontSize: mob ? '13px' : '18px',
          fontWeight:'700', lineHeight:'1.24',
          letterSpacing:'-.1px', color:'#161616',
          fontFamily:'Manrope,sans-serif',
          marginBottom: mob ? '8px' : '14px',
        });
        if (mob) {
          bigInfoEl.appendChild(bigModelEl); bigInfoEl.appendChild(bigMetaEl); bigInfoEl.appendChild(bigTitleEl); bigInfoEl.appendChild(bigBadgeEl);
          bigEl.appendChild(bigImgEl); bigEl.appendChild(bigInfoEl);
        } else {
          bigInfoEl.appendChild(bigMetaEl); bigInfoEl.appendChild(bigTitleEl); bigInfoEl.appendChild(bigBadgeEl);
          bigEl.appendChild(bigImgEl); bigEl.appendChild(bigModelEl); bigEl.appendChild(bigInfoEl);
        }

        cellEl.appendChild(miniEl); cellEl.appendChild(bigEl);
        colEl.appendChild(cellEl);
        cells.push({ el:cellEl, miniEl, miniImgEl, miniDotEl, miniLabelEl, miniTitleEl, bigEl, bigImgEl, bigDotEl, bigCatEl, bigTitleEl, bigModelEl, bigBadgeEl });
      }
      slots.push({ el:slotEl, compactEl, compactLbl, stripEl, colEl, cells });
    }

    function makeArrow(svgStr, styles) {
      const btn = ce('button');
      css(btn, { position:'absolute', background:'#fff', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', zIndex:'30', border:'none', padding:'0' });
      css(btn, styles);
      btn.innerHTML = svgStr;
      stage.appendChild(btn);
      return btn;
    }

    const arrowSz  = mob ? '34px' : '56px';
    const arrowSzU = mob ? '30px' : '48px';
    const arrowOff = mob ? `calc(50% - 78px)` : `calc(50% - 115px)`;
    const arrowOffR = mob ? `calc(50% + 78px)` : `calc(50% + 115px)`;

    const L = `<svg width="${mob?14:20}" height="${mob?14:20}" viewBox="0 0 24 24" fill="none" stroke="#222" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 5 8 12 15 19"/></svg>`;
    const R = `<svg width="${mob?14:20}" height="${mob?14:20}" viewBox="0 0 24 24" fill="none" stroke="#222" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 5 16 12 9 19"/></svg>`;
    const U = `<svg width="${mob?13:19}" height="${mob?13:19}" viewBox="0 0 24 24" fill="none" stroke="#222" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="5 15 12 8 19 15"/></svg>`;
    const D = `<svg width="${mob?13:19}" height="${mob?13:19}" viewBox="0 0 24 24" fill="none" stroke="#222" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="5 9 12 16 19 9"/></svg>`;

    const arrowL = makeArrow(L, { bottom: mob ? '10px' : '22px', left:arrowOff,  transform:'translateX(-50%)', width:arrowSz, height:arrowSz, boxShadow:'0 10px 30px rgba(0,0,0,.13)' });
    arrowL.addEventListener('click', () => go(-1));
    const arrowR = makeArrow(R, { bottom: mob ? '10px' : '22px', left:arrowOffR, transform:'translateX(-50%)', width:arrowSz, height:arrowSz, boxShadow:'0 10px 30px rgba(0,0,0,.13)' });
    arrowR.addEventListener('click', () => go(1));

    const dotsEl = ce('div');
    css(dotsEl, {
      position: 'absolute',
      bottom: mob ? '10px' : '22px',
      left: '50%',
      transform: 'translateX(-50%)',
      height: mob ? '34px' : '56px',
      display: 'flex',
      gap: mob ? '5px' : '7px',
      alignItems: 'center',
      zIndex: '30',
      pointerEvents: 'none',
    });
    const dotEls = CATS.map(() => {
      const d = ce('span');
      css(d, {
        display: 'block',
        width: mob ? '5px' : '7px',
        height: mob ? '5px' : '7px',
        borderRadius: '50%',
        background: '#222',
        opacity: '0.2',
        transition: 'opacity .3s ease, transform .3s ease',
        flexShrink: '0',
      });
      dotsEl.appendChild(d);
      return d;
    });
    stage.appendChild(dotsEl);

    // ── Intro animation ──────────────────────────────────────────
    // introEl (z-index 40) визуально перекрывает карусель — rowEl трогать не нужно
    // Стрелки и точки скрываем — появятся после анимации
    arrowL.style.opacity = '0';
    arrowR.style.opacity = '0';
    dotsEl.style.opacity = '0';

    // Build 4×2 intro grid over the full stage
    const introEl = ce('div');
    css(introEl, { position:'absolute', inset:'0', zIndex:'40', pointerEvents:'auto' });

    const introBoxes = CATS.map((cat, i) => {
      const col = i % GCOLS;
      const row = Math.floor(i / GCOLS);
      const box = ce('div');
      css(box, {
        position:'absolute',
        left: `${col / GCOLS * 100}%`,
        top: `${row / GROWS * 100}%`,
        width: `${100 / GCOLS}%`,
        height: `${100 / GROWS}%`,
        backgroundImage: `url(${cat.cover})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        overflow: 'hidden',
        willChange: 'transform, opacity',
      });
      if (col < GCOLS - 1) box.style.borderRight = '1px solid rgba(255,255,255,.1)';
      if (row < GROWS - 1) box.style.borderBottom = '1px solid rgba(255,255,255,.1)';

      const lbl = ce('span');
      css(lbl, {
        position:'absolute', top:'50%', left:'0', right:'0',
        transform:'translateY(-50%)',
        textAlign:'center', fontFamily:'Manrope,sans-serif',
        fontSize: mob ? '9px' : '12px', letterSpacing: mob ? '.18em' : '.22em',
        textTransform:'uppercase', fontWeight:'600', color:'#fff',
        textShadow:'0 1px 6px rgba(0,0,0,.5)', pointerEvents:'none',
      });
      lbl.textContent = cat.label;
      box.appendChild(lbl);

      introEl.appendChild(box);
      return { el: box, col, row };
    });
    stage.appendChild(introEl);
    rowEl.style.opacity = '0';

    // cat index → slot virtual position for active=0 (null = off-screen)
    const CAT_VP = [0, 1, 2, null, null, null, -2, -1];

    let introPlayed = false;
    function playIntro() {
      if (introPlayed) return;
      introPlayed = true;

      introBoxes.forEach(({ el, col, row }, i) => {
        const gridCX = (col + 0.5) / GCOLS * W;
        const gridCY = (row + 0.5) / GROWS * H;
        const vp = CAT_VP[i];
        const delay = vp !== null ? Math.abs(vp) * 55 : 0;

        css(el, {
          transition: `transform .85s ${delay}ms cubic-bezier(.2,.8,.2,1), opacity .65s ${delay}ms ease`,
        });

        if (vp !== null) {
          const targetCX = W / 2 + vp * STEP;
          const sx = compactCardW / (W / GCOLS);
          const sy = compactCardH / (H / GROWS);
          el.style.transform = `translate(${targetCX - gridCX}px,${H / 2 - gridCY}px) scale(${sx}, ${sy})`;
        } else {
          // off-screen: scatter outward — top row up, bottom row down
          el.style.transform = `translateY(${row < GROWS / 2 ? '-55%' : '55%'}) scale(0.88)`;
          el.style.opacity = '0';
        }
      });

      const REVEAL = 900;
      setTimeout(() => {
        // Вырываем центральный бокс (cat 0) из introEl — ему нужен собственный плавный fade
        const centerBox = introBoxes[0].el;
        const br = centerBox.getBoundingClientRect();
        const sr = stage.getBoundingClientRect();
        css(centerBox, {
          position: 'absolute',
          left: (br.left - sr.left) + 'px',
          top: (br.top - sr.top) + 'px',
          width: br.width + 'px',
          height: br.height + 'px',
          transform: 'none',
          zIndex: '41',
          transition: 'none',
        });
        stage.appendChild(centerBox); // убирает из introEl, добавляет прямо в stage

        requestAnimationFrame(() => requestAnimationFrame(() => {
          introEl.style.pointerEvents = 'none';
          // Только центральная карточка исчезает, полоска появляется
          centerBox.style.transition = 'opacity .7s ease';
          centerBox.style.opacity = '0';
          activeStripEl.style.transition = 'opacity .7s ease';
          activeStripEl.style.opacity = '1';
        }));

        // После появления полоски: показываем карусель (compact-карточки совпадают с боковыми intro-боксами),
        // затем плавно убираем introEl — кросс-фейд незаметен т.к. позиции/размеры/картинки одинаковые
        setTimeout(() => {
          if (centerBox.parentNode) centerBox.parentNode.removeChild(centerBox);
          activeStripEl.style.zIndex = '';
          rowEl.style.opacity = '1';
          introEl.style.transition = 'opacity .5s ease';
          introEl.style.opacity = '0';
          arrowL.style.transition = 'opacity .35s ease';
          arrowR.style.transition = 'opacity .35s ease';
          dotsEl.style.transition = 'opacity .35s ease';
          arrowL.style.opacity = '1';
          arrowR.style.opacity = '1';
          dotsEl.style.opacity = '1';
          setTimeout(() => {
            if (introEl.parentNode) introEl.parentNode.removeChild(introEl);
          }, 500);
        }, 750);
      }, REVEAL);
    }

    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) { playIntro(); obs.disconnect(); }
    }, { threshold: 0.75 });
    obs.observe(section);
    // ── End intro ──────────────────────────────────────────────

    function render() {
      const { active, sub } = state;
      rowEl.style.transform = `translateX(${-(active * STEP + STEP / 2)}px)`;
      const activeCat = mod(active, N);
      dotEls.forEach((d, i) => {
        d.style.opacity = i === activeCat ? '1' : '0.22';
        d.style.transform = i === activeCat ? 'scale(1.5)' : 'scale(1)';
      });
      win(active).forEach(vp => {
        const si2 = mod(vp, BUCKET);
        const sd = slots[si2];
        const cat = CATS[mod(vp, N)];
        const open = vp === active;
        const m = cat.subs.length;
        const vpos = open ? sub : 0;

        sd.el.style.left = `${vp * STEP}px`;
        sd.compactEl.style.backgroundImage = `url(${cat.cover})`;
        sd.compactEl.style.opacity = open ? '0' : '1';
        sd.compactEl.style.transform = `scale(${open ? 1.06 : 1})`;
        sd.compactEl.style.transition = 'opacity .46s ease, transform .5s cubic-bezier(.2,.8,.2,1)';
        sd.compactEl.style.pointerEvents = open ? 'none' : 'auto';
        sd.compactLbl.textContent = cat.label;
        sd.stripEl.style.opacity = open ? '1' : '0';
        sd.stripEl.style.transform = `scaleY(${open ? 1 : 0.86})`;
        sd.stripEl.style.transition = 'opacity .42s ease, transform .5s cubic-bezier(.2,.8,.2,1)';
        sd.stripEl.style.pointerEvents = open ? 'auto' : 'none';
        sd.colEl.style.transition = open ? 'transform .5s cubic-bezier(.2,.8,.2,1)' : 'none';
        sd.colEl.style.transform = `translateY(${-(vpos * VSTEP)}px)`;

        win(vpos).forEach(svp => {
          const ci2 = mod(svp, BUCKET);
          const cell = sd.cells[ci2];
          const su = cat.subs[mod(svp, m)];
          const isA = svp === vpos;

          cell.el.style.top = `${svp * VSTEP}px`;
          cell.miniEl.style.transform = `translate(-50%,-50%) scale(${isA ? 0.9 : 1})`;
          cell.miniEl.style.opacity = isA ? '0' : '1';
          cell.miniEl.style.pointerEvents = (open && !isA) ? 'auto' : 'none';
          cell.miniImgEl.style.backgroundImage = `url(${su.img})`;
          cell.miniDotEl.style.background = cat.dot;
          cell.miniLabelEl.textContent = cat.label;
          cell.miniTitleEl.textContent = su.title;
          cell.bigEl.style.transform = `translate(-50%,-50%) scale(${isA ? 1 : 0.66})`;
          cell.bigEl.style.opacity = isA ? '1' : '0';
          cell.bigEl.style.pointerEvents = (open && isA) ? 'auto' : 'none';
          cell.bigEl.style.zIndex = isA ? '3' : '2';
          cell.bigImgEl.style.backgroundImage = `url(${su.img})`;
          cell.bigDotEl.style.background = cat.dot;
          cell.bigCatEl.textContent = cat.label;
          cell.bigTitleEl.textContent = su.title;
          cell.bigModelEl.textContent = `Модель ${String(mod(svp, m) + 1).padStart(2, '0')}`;
          /* текст кнопки задан при создании */
        });
      });
    }

    function go(delta) {
      if (locked) return; locked = true;
      state.active += delta; state.sub = 0;
      render();
      setTimeout(() => { locked = false; }, 600);
    }
    function vstep(dir) {
      if (locked) return; locked = true;
      state.sub += dir;
      render();
      setTimeout(() => { locked = false; }, 550);
    }

    slots.forEach((sd, si2) => {
      sd.compactEl.addEventListener('click', () => {
        const vps = win(state.active);
        for (let i = 0; i < vps.length; i++) {
          if (mod(vps[i], BUCKET) === si2) {
            const delta = vps[i] - state.active;
            if (delta !== 0) go(delta);
            break;
          }
        }
      });
      sd.cells.forEach((cell, ci3) => {
        cell.miniEl.addEventListener('click', () => {
          const svps = win(state.sub);
          for (let j = 0; j < svps.length; j++) {
            if (mod(svps[j], BUCKET) === ci3) {
              const d = svps[j] - state.sub;
              if (d !== 0) vstep(d > 0 ? 1 : -1);
              break;
            }
          }
        });
      });
    });

    function onKey(e) {
      const rect = stage.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) return;
      if (e.key === 'ArrowLeft')       { e.preventDefault(); go(-1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
      else if (e.key === 'ArrowUp')    { e.preventDefault(); vstep(-1); }
      else if (e.key === 'ArrowDown')  { e.preventDefault(); vstep(1); }
    }

    let cursorX = -9999;
    function onMouseMove(e) { cursorX = e.clientX; }
    function onMouseLeave() { cursorX = -9999; }

    let ha = 0, ht = 0, va = 0, vt = 0;
    function onWheel(e) {
      if (mob) return; // на мобилке скролл страницы не блокируем
      if (Math.abs(cursorX - window.innerWidth / 2) > 380) return;
      e.preventDefault();
      const ax = Math.abs(e.deltaX), ay = Math.abs(e.deltaY), now = performance.now();
      if (ax > ay) {
        ha = (now - ht < 200) ? ha + e.deltaX : e.deltaX; ht = now;
        if (Math.abs(ha) > 80) { go(ha > 0 ? 1 : -1); ha = 0; }
      } else {
        va = (now - vt < 200) ? va + e.deltaY : e.deltaY; vt = now;
        if (Math.abs(va) > 50) { vstep(va > 0 ? 1 : -1); va = 0; }
      }
    }

    if (mob) {
      section.style.touchAction = 'auto';
      stage.style.touchAction = 'auto';
    }

    const mobCenterHalf = 120;
    let psx = 0, psy = 0, tracking = false, capturedId = -1;
    function onTouchStart(e) {
      if (e.target.closest('button')) return;
      if (Math.abs(e.touches[0].clientX - window.innerWidth / 2) <= mobCenterHalf) {
        e.preventDefault();
      }
    }
    function onPointerDown(e) {
      if (e.pointerType === 'mouse') return;
      psx = e.clientX; psy = e.clientY; tracking = true; capturedId = e.pointerId;
    }
    function onPointerUp(e) {
      if (!tracking || e.pointerId !== capturedId) return;
      tracking = false; capturedId = -1;
      const dx = e.clientX - psx, dy = e.clientY - psy, TH = 20;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < TH) return;
      if (Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
      else vstep(dy < 0 ? 1 : -1);
    }
    function onPointerCancel(e) {
      if (e.pointerId === capturedId) { tracking = false; capturedId = -1; }
    }

    window.addEventListener('keydown', onKey);
    if (!mob) window.addEventListener('wheel', onWheel, { passive: false });
    if (mob) section.addEventListener('touchstart', onTouchStart, { passive: false });
    section.addEventListener('pointerdown', onPointerDown);
    section.addEventListener('pointerup', onPointerUp);
    section.addEventListener('pointercancel', onPointerCancel);
    section.addEventListener('mousemove', onMouseMove);
    section.addEventListener('mouseleave', onMouseLeave);

    rowEl.style.transition = 'none';
    render();
    requestAnimationFrame(() => { rowEl.style.transition = 'transform .55s cubic-bezier(.2,.8,.2,1)'; });

    // Для intro-анимации: активная полоска стартует скрытой и с высоким z-index —
    // будет проявляться ПОВЕРХ center box без белого просвета
    const activeStripEl = slots[mod(state.active, BUCKET)].stripEl;
    activeStripEl.style.opacity = '0';
    activeStripEl.style.zIndex = '45';

    return () => {
      obs.disconnect();
      window.removeEventListener('keydown', onKey);
      if (!mob) window.removeEventListener('wheel', onWheel);
      if (mob) section.removeEventListener('touchstart', onTouchStart);
      section.removeEventListener('pointerdown', onPointerDown);
      section.removeEventListener('pointerup', onPointerUp);
      section.removeEventListener('pointercancel', onPointerCancel);
      while (stage.firstChild) stage.removeChild(stage.firstChild);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="exs-prod-section"
      id="exs-section"
      style={{ position: 'relative', overflow: 'hidden', background: '#fff', touchAction: 'none' }}
    >
      <div className="exs-heading" style={{
        position: 'absolute',
        top: 'clamp(24px, 3.5vh, 48px)',
        left: 'clamp(24px, 5vw, 80px)',
        zIndex: 10,
        pointerEvents: 'none',
      }}>
        <div style={{
          fontFamily: 'Manrope, sans-serif',
          fontSize: '11px',
          fontWeight: 400,
          letterSpacing: '.28em',
          textTransform: 'uppercase',
          color: '#8a8782',
          marginBottom: '10px',
        }}>
          Каталог
        </div>
        <div style={{
          fontFamily: 'Manrope, sans-serif',
          fontWeight: 400,
          fontSize: 'clamp(22px, 2.2vw, 36px)',
          letterSpacing: '.01em',
          textTransform: 'uppercase',
          color: '#0c0c0d',
          lineHeight: 1.06,
        }}>
          Примеры работ
        </div>
      </div>
      <div ref={stageRef} className="exs-stage-area" style={{ position: 'absolute', inset: 0, touchAction: 'none' }} />
    </section>
  );
}
