// @ts-nocheck
'use client';

import { useEffect, useRef } from 'react';

const CATS = [
  { label:'Душевые', dot:'#0d9488', cover:'/assets/boxes/1_shower_box-Photoroom.png', subs:[
    { title:'Дверная',            img:'/assets/examples/shower_room/1_door.png' },
    { title:'Угловая (2 стекла)', img:'/assets/examples/shower_room/2_angle_2.png' },
    { title:'Угловая (3 стекла)', img:'/assets/examples/shower_room/3_angle_3.png' },
    { title:'Складная',           img:'/assets/examples/shower_room/4_collapsible.png' },
    { title:'Трапеция',           img:'/assets/examples/shower_room/5_trapezoid.png' },
    { title:'Т-образная',         img:'/assets/examples/shower_room/6_T-type.png' },
  ]},
  { label:'Зеркала', dot:'#a855f7', cover:'/assets/boxes/2_mirror_box-Photoroom.png', subs:[
    { title:'Круглое',            img:'/assets/examples/mirrors_light/1_circle.png' },
    { title:'Г-образное',         img:'/assets/examples/mirrors_light/2_R-type.png' },
    { title:'Овальное',           img:'/assets/examples/mirrors_light/3_oval.png' },
    { title:'Эллипс',             img:'/assets/examples/mirrors_light/4_ellipse.png' },
    { title:'Прямоугольное',      img:'/assets/examples/mirrors_light/5_square.png' },
    { title:'Арочное',            img:'/assets/examples/mirrors_light/6_arch.png' },
  ]},
  { label:'Ограждения', dot:'#d97706', cover:'/assets/boxes/3_stairs_box-Photoroom.png', subs:[
    { title:'На точечных фитингах', img:'/assets/examples/stairs/1_points.png' },
    { title:'На стойках',           img:'/assets/examples/stairs/2_racks.png' },
    { title:'В профиле',            img:'/assets/examples/stairs/3_profile.png' },
  ]},
  { label:'Перегородки', dot:'#3b82f6', cover:'/assets/boxes/4_partition-Photoroom.png', subs:[
    { title:'Стеклянная перегородка', img:'/assets/boxes/4_partition-Photoroom.png' },
  ]},
  { label:'Лофт', dot:'#ef4444', cover:'/assets/boxes/5_loft-Photoroom.png', subs:[
    { title:'Лофт-перегородка',    img:'/assets/boxes/5_loft-Photoroom.png' },
  ]},
  { label:'Панели', dot:'#10b981', cover:'/assets/boxes/8_panels-Photoroom.png', subs:[
    { title:'Стеклянная панель',   img:'/assets/boxes/8_panels-Photoroom.png' },
  ]},
  { label:'Козырьки', dot:'#f59e0b', cover:'/assets/boxes/9_visors-Photoroom.png', subs:[
    { title:'Стеклянный козырёк',  img:'/assets/boxes/9_visors-Photoroom.png' },
  ]},
  { label:'Полки', dot:'#8b5cf6', cover:'/assets/boxes/12_shelves-Photoroom.png', subs:[
    { title:'Стеклянная полка',    img:'/assets/boxes/12_shelves-Photoroom.png' },
  ]},
];

export default function ProductSlide() {
  const stageRef = useRef(null);
  const sectionRef = useRef(null);

  useEffect(() => {
    const stage = stageRef.current;
    const section = sectionRef.current;
    if (!stage || !section) return;
    while (stage.firstChild) stage.removeChild(stage.firstChild);

    const STEP = 540, VSTEP = 310, WIN = 2, BUCKET = 5;
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
      css(innerEl, { position:'absolute', left:'50%', top:'50%', transform:'translate(-50%,-50%)', width:'600px', height:'100%', display:'flex', alignItems:'center', justifyContent:'center' });
      slotEl.appendChild(innerEl);

      const compactEl = ce('div');
      css(compactEl, { position:'absolute', width:'340px', height:'440px', borderRadius:'20px', overflow:'hidden', background:'transparent', backgroundSize:'cover', backgroundPosition:'center', cursor:'pointer' });
      const compactLbl = ce('span');
      css(compactLbl, { position:'absolute', top:'50%', left:'0', right:'0', transform:'translateY(-50%)', textAlign:'center', fontFamily:'Manrope,sans-serif', fontSize:'12px', letterSpacing:'.22em', textTransform:'uppercase', fontWeight:'600', color:'#fff', textShadow:'0 1px 6px rgba(0,0,0,.5)', pointerEvents:'none' });
      compactEl.appendChild(compactLbl);
      innerEl.appendChild(compactEl);

      const stripEl = ce('div');
      css(stripEl, { position:'absolute', width:'640px', height:'100%', transformOrigin:'center' });
      const pillEl = ce('div');
      css(pillEl, { position:'absolute', top:'36px', bottom:'36px', left:'0', right:'0', background:'#f4f4f3', borderRadius:'34px' });
      stripEl.appendChild(pillEl);
      const colEl = ce('div');
      css(colEl, { position:'absolute', left:'0', right:'0', top:'50%', height:'0', transition:'transform .5s cubic-bezier(.2,.8,.2,1)' });
      stripEl.appendChild(colEl);
      innerEl.appendChild(stripEl);
      rowEl.appendChild(slotEl);

      const cells = [];
      for (let ci = 0; ci < BUCKET; ci++) {
        const cellEl = ce('div');
        css(cellEl, { position:'absolute', left:'50%', width:'0', height:'0' });

        const miniEl = ce('div');
        css(miniEl, { position:'absolute', left:'0', top:'0', width:'452px', height:'112px', background:'#fff', borderRadius:'20px', boxShadow:'0 16px 38px rgba(0,0,0,.10)', display:'flex', alignItems:'center', gap:'18px', padding:'16px', transition:TR, zIndex:'1', cursor:'pointer' });
        const miniImgEl = ce('div');
        css(miniImgEl, { width:'96px', height:'80px', borderRadius:'13px', flexShrink:'0', backgroundSize:'cover', backgroundPosition:'center' });
        const miniTextEl = ce('div');
        css(miniTextEl, { flex:'1', minWidth:'0', display:'flex', flexDirection:'column', gap:'7px' });
        const miniTopEl = ce('div');
        css(miniTopEl, { display:'flex', alignItems:'center', gap:'8px' });
        const miniDotEl = ce('span');
        css(miniDotEl, { width:'7px', height:'7px', borderRadius:'50%', flexShrink:'0' });
        const miniLabelEl = ce('span');
        css(miniLabelEl, { fontSize:'12px', color:'#9a9a9a', fontWeight:'600', letterSpacing:'.2px', fontFamily:'Manrope,sans-serif' });
        miniTopEl.appendChild(miniDotEl); miniTopEl.appendChild(miniLabelEl);
        const miniTitleEl = ce('span');
        css(miniTitleEl, { fontSize:'15px', fontWeight:'600', color:'#222', lineHeight:'1.28', letterSpacing:'-.1px', fontFamily:'Manrope,sans-serif' });
        miniTextEl.appendChild(miniTopEl); miniTextEl.appendChild(miniTitleEl);
        miniEl.appendChild(miniImgEl); miniEl.appendChild(miniTextEl);

        const bigEl = ce('div');
        css(bigEl, { position:'absolute', left:'0', top:'0', width:'600px', height:'432px', background:'#fff', borderRadius:'24px', boxShadow:'0 34px 74px rgba(0,0,0,.16)', display:'flex', overflow:'hidden', transition:TR });
        const bigImgEl = ce('div');
        css(bigImgEl, { width:'396px', height:'100%', flexShrink:'0', backgroundSize:'cover', backgroundPosition:'center' });
        const bigBadgeEl = ce('div');
        css(bigBadgeEl, { position:'absolute', top:'18px', right:'18px', background:'#141414', color:'#fff', fontSize:'14px', fontWeight:'600', letterSpacing:'.2px', padding:'9px 15px', borderRadius:'11px', zIndex:'2', fontFamily:'Manrope,sans-serif' });
        const bigInfoEl = ce('div');
        css(bigInfoEl, { flex:'1', background:'#fff', padding:'26px', display:'flex', flexDirection:'column', justifyContent:'flex-end' });
        const bigMetaEl = ce('div');
        css(bigMetaEl, { display:'flex', alignItems:'center', gap:'9px', marginBottom:'12px' });
        const bigDotEl = ce('span');
        css(bigDotEl, { width:'7px', height:'7px', borderRadius:'50%', flexShrink:'0' });
        const bigCatEl = ce('span');
        css(bigCatEl, { fontSize:'14px', color:'#8a8a8a', fontFamily:'Manrope,sans-serif' });
        bigMetaEl.appendChild(bigDotEl); bigMetaEl.appendChild(bigCatEl);
        const bigTitleEl = ce('div');
        css(bigTitleEl, { fontSize:'22px', fontWeight:'700', lineHeight:'1.24', letterSpacing:'-.2px', color:'#161616', fontFamily:'Manrope,sans-serif' });
        bigInfoEl.appendChild(bigMetaEl); bigInfoEl.appendChild(bigTitleEl);
        bigEl.appendChild(bigImgEl); bigEl.appendChild(bigBadgeEl); bigEl.appendChild(bigInfoEl);

        cellEl.appendChild(miniEl); cellEl.appendChild(bigEl);
        colEl.appendChild(cellEl);
        cells.push({ el:cellEl, miniEl, miniImgEl, miniDotEl, miniLabelEl, miniTitleEl, bigEl, bigImgEl, bigDotEl, bigCatEl, bigTitleEl, bigBadgeEl });
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
    const L = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#222" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 5 8 12 15 19"/></svg>';
    const R = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#222" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 5 16 12 9 19"/></svg>';
    const U = '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#222" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="5 15 12 8 19 15"/></svg>';
    const D = '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#222" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="5 9 12 16 19 9"/></svg>';
    makeArrow(L, { top:'50%', left:'calc(50% - 360px)', transform:'translate(-50%,-50%)', width:'56px', height:'56px', boxShadow:'0 10px 30px rgba(0,0,0,.13)' }).addEventListener('click', () => go(-1));
    makeArrow(R, { top:'50%', left:'calc(50% + 360px)', transform:'translate(-50%,-50%)', width:'56px', height:'56px', boxShadow:'0 10px 30px rgba(0,0,0,.13)' }).addEventListener('click', () => go(1));
    makeArrow(U, { top:'22px', left:'50%', transform:'translateX(-50%)', width:'48px', height:'48px', boxShadow:'0 8px 24px rgba(0,0,0,.12)' }).addEventListener('click', () => vstep(-1));
    makeArrow(D, { bottom:'22px', left:'50%', transform:'translateX(-50%)', width:'48px', height:'48px', boxShadow:'0 8px 24px rgba(0,0,0,.12)' }).addEventListener('click', () => vstep(1));

    function render() {
      const { active, sub } = state;
      rowEl.style.transform = `translateX(${-(active * STEP + STEP / 2)}px)`;
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
          cell.bigBadgeEl.textContent = `${cat.label} · ${String(mod(svp, m) + 1).padStart(2, '0')}`;
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

    let tsx = 0, tsy = 0;
    function onTouchStart(e) { tsx = e.touches[0].clientX; tsy = e.touches[0].clientY; }
    function onTouchEnd(e) {
      const dx = e.changedTouches[0].clientX - tsx, dy = e.changedTouches[0].clientY - tsy, TH = 48;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < TH) return;
      if (Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
      else vstep(dy < 0 ? 1 : -1);
    }

    window.addEventListener('keydown', onKey);
    window.addEventListener('wheel', onWheel, { passive: false });
    section.addEventListener('mousemove', onMouseMove);
    section.addEventListener('mouseleave', onMouseLeave);
    section.addEventListener('touchstart', onTouchStart, { passive: true });
    section.addEventListener('touchend', onTouchEnd, { passive: true });

    rowEl.style.transition = 'none';
    render();
    requestAnimationFrame(() => { rowEl.style.transition = 'transform .55s cubic-bezier(.2,.8,.2,1)'; });

    return () => {
      window.removeEventListener('keydown', onKey);
      section.removeEventListener('wheel', onWheel);
      section.removeEventListener('touchstart', onTouchStart);
      section.removeEventListener('touchend', onTouchEnd);
      while (stage.firstChild) stage.removeChild(stage.firstChild);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="exs-section"
      style={{ position: 'relative', width: '100vw', marginLeft: 'calc(50% - 50vw)', height: '100vh', overflow: 'hidden', background: '#fff' }}
    >
      <div ref={stageRef} style={{ position: 'absolute', inset: 0 }} />
    </section>
  );
}
