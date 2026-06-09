// @ts-nocheck
export function initProdScripts(): void {
/* Footer FAQ — fixed-height exclusive accordion */
    (function () {
      var faq   = document.querySelector('.footer-faq');
      var items = document.querySelectorAll('.footer-faq__item');
      if (!faq || !items.length) return;

      function open(item) {
        items.forEach(function (i) { i.classList.remove('is-open'); });
        item.classList.add('is-open');
      }

      // Open first item, then lock container height so layout never shifts
      open(items[0]);
      var lockedH = faq.offsetHeight;
      faq.style.height = lockedH + 'px';

      items.forEach(function (item) {
        item.querySelector('.footer-faq__q').addEventListener('click', function () {
          open(item);
        });
      });
    })();

    /* Hero callout connector */
    (function () {
      const overlay  = document.getElementById('hero-overlay');
      const path     = document.getElementById('hero-connector-path');
      const dot      = document.getElementById('hero-connector-dot');
      const callout  = document.getElementById('hero-callout');
      if (!callout || !path || !dot) return;

      const calloutImgs  = callout.querySelectorAll('.hero__callout-img');
      const calloutNames = callout.querySelectorAll('.hero__callout-name');
      const calloutDescs = callout.querySelectorAll('.hero__callout-desc');
      const btns         = document.querySelectorAll('.hero__hotspot');
      const CALLOUT_W    = 460;
      const labels = [
        ['Гостиная',  'Современный интерьер'],
        ['Спальня',   'Минималистичный стиль'],
        ['Кухня',     'Функциональное пространство'],
      ];
      let activeBtn  = null;
      let closeTimer = null;

      function close() {
        callout.classList.remove('visible');
        dot.style.opacity = '0';
        path.style.transition = 'opacity 0.2s ease';
        path.style.opacity    = '0';
        const prev = activeBtn;
        activeBtn = null;
        if (prev) prev.classList.remove('active');
        clearTimeout(closeTimer);
        setTimeout(() => {
          path.setAttribute('d', '');
          path.style.transition = '';
          path.style.opacity    = '1';
        }, 220);
      }

      function open(btn) {
        const oRect = overlay.getBoundingClientRect();
        const bRect = btn.getBoundingClientRect();
        const x0 = bRect.left + bRect.width  / 2 - oRect.left;
        const y0 = bRect.top  + bRect.height / 2 - oRect.top;

        const MARGIN = 14, DIAG_DX = 52, HORIZ_LEN = 160;
        const availRight = oRect.width - (x0 + DIAG_DX + HORIZ_LEN + CALLOUT_W + MARGIN);
        const availLeft  = (x0 - DIAG_DX - HORIZ_LEN - CALLOUT_W) - MARGIN;
        const goRight    = availRight >= availLeft;

        const dx = goRight ? DIAG_DX : -DIAG_DX;
        const x1 = x0 + dx, y1 = y0 + 46;
        const x2 = goRight ? x1 + HORIZ_LEN : x1 - HORIZ_LEN, y2 = y1;

        dot.setAttribute('cx', x0);
        dot.setAttribute('cy', y0);
        dot.style.transition = 'opacity 0.15s ease';
        dot.style.opacity    = '1';

        path.setAttribute('d', `M ${x0} ${y0} L ${x1} ${y1} L ${x2} ${y2}`);
        const len = path.getTotalLength();
        path.style.transition       = 'none';
        path.style.strokeDasharray  = len;
        path.style.strokeDashoffset = len;
        path.style.opacity          = '1';
        path.getBoundingClientRect();
        path.style.transition       = 'stroke-dashoffset 0.38s cubic-bezier(0.4,0,0.2,1)';
        path.style.strokeDashoffset = '0';

        const folder = 'assets/works/' + btn.dataset.example;
        calloutImgs.forEach((img, i)  => { img.src = folder + '/side' + (i + 1) + '.jpg'; });
        calloutNames.forEach((el, i)  => { el.textContent = labels[i][0]; });
        calloutDescs.forEach((el, i)  => { el.textContent = labels[i][1]; });

        const calloutH = callout.offsetHeight || 320;
        let cx = goRight ? x2 + MARGIN : x2 - MARGIN - CALLOUT_W;
        cx = Math.max(MARGIN, Math.min(oRect.width - CALLOUT_W - MARGIN, cx));
        let cy = y2 - Math.round(calloutH / 3);
        cy = Math.max(MARGIN, Math.min(oRect.height - calloutH - MARGIN, cy));
        callout.style.left = cx + 'px';
        callout.style.top  = cy + 'px';

        const toX = goRight ? '0%' : '100%';
        const toY = Math.max(0, Math.round(y2 - cy)) + 'px';
        callout.style.transformOrigin = `${toX} ${toY}`;

        closeTimer = setTimeout(() => callout.classList.add('visible'), 340);
        btn.classList.add('active');
        activeBtn = btn;
      }

      btns.forEach(btn => {
        btn.addEventListener('click', e => {
          e.preventDefault();
          if (activeBtn === btn) { close(); return; }
          if (activeBtn) { close(); setTimeout(() => open(btn), 230); }
          else open(btn);
        });
      });

      document.getElementById('hero-callout-close').addEventListener('click', e => {
        e.stopPropagation();
        close();
      });

      document.addEventListener('click', e => {
        if (activeBtn && !callout.contains(e.target) && !e.target.closest('.hero__hotspot')) close();
      });

      window.addEventListener('scroll', () => {
        if (window.scrollY > 20 && activeBtn) close();
      }, { passive: true });
    })();

    /* Scroll fade-up */
    (function () {
      const io = new IntersectionObserver(entries => {
        entries.forEach(e => {
          if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
        });
      }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });
      document.querySelectorAll('.fade-up').forEach(el => io.observe(el));
    })();

    /* Hero overlay fade on scroll */
    (function () {
      const heroEl  = document.getElementById('hero');
      const overlay = document.getElementById('hero-overlay');
      const callout = document.getElementById('hero-callout');
      if (!heroEl || !overlay) return;

      function update() {
        const scrollY = window.scrollY;
        const heroH = heroEl.offsetHeight;
        const a = Math.max(0, Math.min(1, 1 - scrollY / (heroH * 0.3)));
        overlay.style.opacity       = a;
        overlay.style.pointerEvents = a < 0.05 ? 'none' : 'auto';
      }

      window.addEventListener('scroll', update, { passive: true });
      update();
    })();


    /* Before / After sliders */
    (function () {
      document.querySelectorAll('[data-slider]').forEach(viewer => {
        let dragging = false, pending = null;
        const handle = viewer.querySelector('.vs-card__handle');

        const setSplit = clientX => {
          const r = viewer.getBoundingClientRect();
          const pct = Math.max(2, Math.min(98, ((clientX - r.left) / r.width) * 100));
          viewer.style.setProperty('--split', pct + '%');
        };

        viewer.addEventListener('pointerdown', e => {
          if (e.target.closest('.vs-chev')) return;
          pending = { startX: e.clientX, pointerId: e.pointerId };
          try { viewer.setPointerCapture(e.pointerId); } catch (_) {}
          e.preventDefault();
        });
        viewer.addEventListener('pointermove', e => {
          if (!pending) return;
          if (!dragging && Math.abs(e.clientX - pending.startX) > 4) {
            dragging = true;
            viewer.classList.add('dragging');
          }
          if (dragging) setSplit(e.clientX);
        });
        const onUp = e => {
          if (!pending) return;
          try { viewer.releasePointerCapture(pending.pointerId); } catch (_) {}
          dragging = false; pending = null;
          viewer.classList.remove('dragging');
        };
        viewer.addEventListener('pointerup',     onUp);
        viewer.addEventListener('pointercancel', onUp);

        handle.addEventListener('click', e => {
          const chev = e.target.closest('.vs-chev');
          if (!chev) return;
          const cur  = parseFloat(viewer.style.getPropertyValue('--split')) || 50;
          const next = Math.max(2, Math.min(98, cur + parseFloat(chev.dataset.step)));
          viewer.style.setProperty('--split', next + '%');
        });
      });
    })();

    /* Full-width Before / After — three-zone sliders */
    (function () {
      const wrap = document.getElementById('ba-wrap');
      if (!wrap) return;

      const zones = [
        { sel: '[data-ba-zone="1"]', varName: '--s1', min: 15,    max: 38,    init: 26.5  },
        { sel: '[data-ba-zone="2"]', varName: '--s2', min: 37,    max: 63,    init: 50    },
        { sel: '[data-ba-zone="3"]', varName: '--s3', min: 62,    max: 90,    init: 76    },
      ];

      zones.forEach(z => wrap.style.setProperty(z.varName, z.init + '%'));

      zones.forEach(z => {
        const slider = wrap.querySelector(z.sel);
        if (!slider) return;
        let dragging = false, pending = null;

        slider.addEventListener('pointerdown', e => {
          pending = { startX: e.clientX, pointerId: e.pointerId };
          try { slider.setPointerCapture(e.pointerId); } catch (_) {}
          e.preventDefault();
        });

        slider.addEventListener('pointermove', e => {
          if (!pending) return;
          if (!dragging && Math.abs(e.clientX - pending.startX) > 3) {
            dragging = true;
            slider.classList.add('dragging');
          }
          if (!dragging) return;
          const r = wrap.getBoundingClientRect();
          const pct = ((e.clientX - r.left) / r.width) * 100;
          const clamped = Math.max(z.min + 1, Math.min(z.max - 1, pct));
          wrap.style.setProperty(z.varName, clamped + '%');
        });

        const onUp = () => {
          pending = null; dragging = false;
          slider.classList.remove('dragging');
        };
        slider.addEventListener('pointerup',     onUp);
        slider.addEventListener('pointercancel', onUp);
      });
    })();

    /* Projects: filter pills + card selection + dots + autoplay */
    (function () {
      const pills    = document.querySelectorAll('.ps-pill');
      const cards    = Array.from(document.querySelectorAll('.ps-card'));
      const bgImg    = document.getElementById('ps-bg-img');
      const hsGroups = Array.from(document.querySelectorAll('.ps-hs-group'));
      const dotsWrap = document.getElementById('ps-dots');
      const carousel = document.getElementById('ps-carousel');
      if (!cards.length) return;

      /* build dots */
      const dotEls = cards.map((_, i) => {
        const btn = document.createElement('button');
        btn.className = 'ps-dot';
        btn.setAttribute('aria-label', 'Слайд ' + (i + 1));
        btn.innerHTML = '<span class="ps-dot-fill"></span>';
        btn.addEventListener('click', () => { setActive(i); scrollToCard(i); });
        dotsWrap.appendChild(btn);
        return btn;
      });

      /* filter pills */
      pills.forEach(p => p.addEventListener('click', () => {
        pills.forEach(x => x.classList.remove('active'));
        p.classList.add('active');
        const f = p.dataset.pf;
        cards.forEach(c => {
          const show = f === 'all' || c.dataset.pcat === f;
          c.style.opacity = show ? '1' : '.25';
          c.style.filter  = show ? 'none' : 'grayscale(.8)';
        });
      }));

      let activeIdx = 0;

      function setActive(i) {
        activeIdx = i;

        /* cards */
        cards.forEach(c => c.classList.remove('ps-active'));
        cards[i].classList.add('ps-active');

        /* bg image */
        const img = cards[i].dataset.img;
        if (bgImg && img) {
          bgImg.classList.remove('visible');
          setTimeout(() => {
            bgImg.style.backgroundImage = 'url(' + img + ')';
            bgImg.classList.add('visible');
          }, 180);
        }
        hsGroups.forEach((g, gi) => g.classList.toggle('active', gi === i));

        /* dots: reset all, restart animation on active */
        dotEls.forEach(d => {
          d.classList.remove('active');
          const fill = d.querySelector('.ps-dot-fill');
          fill.style.animation = 'none';
          void fill.offsetWidth;
          fill.style.animation = '';
        });
        dotEls[i].classList.add('active');

        /* auto-advance on animation end */
        const capturedIdx = i;
        dotEls[i].querySelector('.ps-dot-fill').addEventListener('animationend', () => {
          if (activeIdx !== capturedIdx) return;
          const ni = (activeIdx + 1) % cards.length;
          const wrap = ni < activeIdx; /* last → first */
          if (wrap) { carousel.scrollLeft = 0; }
          setActive(ni);
          if (!wrap) scrollToCard(ni);
          else requestAnimationFrame(() => scrollToCard(ni));
        }, { once: true });
      }

      /* scroll so card i starts at ~half-card from left (showing peek of prev card) */
      function scrollToCard(i) {
        if (!carousel || !cards[i]) return;
        const cw  = cards[i].offsetWidth || 520;
        const gap = 20;
        const pl  = 56;
        const naturalLeft = pl + i * (cw + gap);
        const target = Math.max(0, naturalLeft - cw / 2);
        carousel.scrollTo({ left: target, behavior: 'smooth' });
      }

      cards.forEach((c, i) => c.addEventListener('click', () => {
        setActive(i);
        scrollToCard(i);
      }));

      /* init: card 1 active, card 0 half-visible on left */
      setActive(1);
      requestAnimationFrame(() => {
        const cw = (cards[0] && cards[0].offsetWidth) || 520;
        carousel.scrollLeft = 56 + cw / 2; /* = ~316px */
      });
    })();


    // Slide2 lights-on: двунаправленная анимация по скроллу
    (function () {
      const slide2 = document.getElementById('slide2');
      if (!slide2) return;
      function check() {
        const rect = slide2.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.3) {
          slide2.classList.add('lights-on');
        } else {
          slide2.classList.remove('lights-on');
        }
      }
      window.addEventListener('scroll', check, { passive: true });
      check();
    })();


    // Hero hotspot typewriter
    (function () {
      const overlay = document.getElementById('hero-overlay');
      if (!overlay) return;
      const hotspots = overlay.querySelectorAll('.hero__hotspot');
      hotspots.forEach(function (btn, i) {
        const tip = btn.querySelector('.tip');
        if (!tip) return;
        const fullText = tip.textContent.trim();
        tip.textContent = '';
        // start after the dot's pop animation finishes: 1.1s + i*0.2s + 0.45s duration
        const startMs = 1550 + i * 200;
        setTimeout(function () {
          var idx = 0;
          var t = setInterval(function () {
            tip.textContent = fullText.slice(0, ++idx);
            if (idx >= fullText.length) clearInterval(t);
          }, 42);
        }, startMs);
      });
    })();

    // Projects section entrance
    (function () {
      var section = document.getElementById('projects');
      if (!section) return;
      var cards = Array.from(section.querySelectorAll('.ps-card'));
      var triggered = false;

      // hide cards immediately
      cards.forEach(function (c) {
        c.style.opacity = '0';
        c.style.transform = 'scaleX(0.04)';
        c.style.transition = 'none';
      });

      function showCards() {
        // center-out order: 2, 1, 3, 0, 4
        var order = [2, 1, 3, 0, 4];
        order.forEach(function (idx, step) {
          var card = cards[idx];
          if (!card) return;
          setTimeout(function () {
            card.style.transition = 'transform 0.55s cubic-bezier(0.22,1,0.36,1), opacity 0.45s ease';
            card.style.opacity = '1';
            card.style.transform = 'scaleX(1)';
            setTimeout(function () {
              card.style.transition = '';
              card.style.transform = '';
              card.style.opacity = '';
            }, 600);
          }, 80 + step * 110);
        });
      }

      // текст — когда секция начинает входить в viewport
      var obsText = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting && !triggered) {
          triggered = true;
          section.classList.add('ps-visible');
          obsText.disconnect();
        }
      }, { threshold: 0.1 });
      obsText.observe(section);

      // карточки — только когда carousel действительно виден
      var cardsTriggered = false;
      var carouselWrap = section.querySelector('.ps-carousel-wrap');
      if (carouselWrap) {
        var obsCards = new IntersectionObserver(function (entries) {
          if (entries[0].isIntersecting && !cardsTriggered) {
            cardsTriggered = true;
            showCards();
            obsCards.disconnect();
          }
        }, { threshold: 0.35 });
        obsCards.observe(carouselWrap);
      }
    })();

    // Mirror section entrance — fires once
    (function () {
      var section = document.getElementById('mirror');
      if (!section) return;
      var obs = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) {
          section.classList.add('mirror-visible');
          obs.disconnect();
        }
      }, { threshold: 0.2 });
      obs.observe(section);
    })();

    // Mat block: row carousels
    (function(){
      var VISIBLE = 5;
      var GAP = 14;
      var DUR = 550;

      document.querySelectorAll('.mat-row').forEach(function(row) {
        var track    = row.querySelector('.mat-track');
        var viewport = row.querySelector('.mat-track-viewport');
        var prev     = row.querySelector('.mat-row-arrow.prev');
        var next     = row.querySelector('.mat-row-arrow.next');
        if (!track || !viewport || !prev || !next) return;
        var busy = false;

        function step() {
          var vw = viewport.clientWidth - 52;
          return (vw - GAP * (VISIBLE - 1)) / VISIBLE + GAP;
        }
        function lock() { busy = true; setTimeout(function(){ busy = false; }, DUR + 30); }

        next.addEventListener('click', function() {
          if (busy) return;
          lock();
          track.style.willChange = 'transform';
          var dx = step();
          track.style.transition = 'transform ' + DUR + 'ms cubic-bezier(.65,.05,.25,1)';
          track.style.transform  = 'translateX(' + (-dx) + 'px)';
          setTimeout(function() {
            track.style.transition = 'none';
            track.appendChild(track.firstElementChild);
            track.style.transform = 'translateX(0)';
            void track.offsetWidth;
            track.style.transition = '';
            track.style.willChange = '';
          }, DUR);
        });

        prev.addEventListener('click', function() {
          if (busy) return;
          lock();
          track.style.willChange = 'transform';
          var dx = step();
          track.style.transition = 'none';
          track.insertBefore(track.lastElementChild, track.firstElementChild);
          track.style.transform = 'translateX(' + (-dx) + 'px)';
          void track.offsetWidth;
          track.style.transition = 'transform ' + DUR + 'ms cubic-bezier(.65,.05,.25,1)';
          track.style.transform  = 'translateX(0)';
          setTimeout(function() { track.style.willChange = ''; }, DUR + 30);
        });
      });
    })();

    // Mat block: text entrance + cabinet light show on first scroll
    (function () {
      var block = document.getElementById('materials');
      if (!block) return;
      var cells = Array.from(block.querySelectorAll('.mat-cell'));
      var triggered = false;

      function setLit(indices) {
        cells.forEach(function (c) { c.classList.remove('mat-cell--lit'); });
        indices.forEach(function (i) { if (cells[i]) cells[i].classList.add('mat-cell--lit'); });
      }

      function runLightShow() {
        var g1 = [0, 3, 5, 10, 15];
        var g2 = [1, 4, 6, 9, 11, 14];
        var g3 = [2, 7, 8, 12, 13];
        var t = 950;
        setTimeout(function () { setLit(g1); }, t); t += 340;
        setTimeout(function () { setLit([]); }, t); t += 70;
        setTimeout(function () { setLit(g2); }, t); t += 300;
        setTimeout(function () { setLit([]); }, t); t += 70;
        setTimeout(function () { setLit(g3); }, t); t += 360;
        setTimeout(function () { setLit([]); }, t);
      }

      var obs = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting && !triggered) {
          triggered = true;
          block.classList.add('mat-visible');
          runLightShow();
          obs.disconnect();
        }
      }, { threshold: 0.12 });

      obs.observe(block);
    })();


    // Materials block scale-to-fit
    (function(){
      const stage = document.getElementById('mat-stage');
      if (!stage) return;
      function fitMat(){
        const s = stage.parentElement.offsetWidth / 1920;
        stage.style.zoom = s;
      }
      fitMat();
      window.addEventListener('resize', fitMat);
    })();

    // Hero heading word-flash reveal (lightning-style, word by word)
    (function () {
      var heading = document.querySelector('.hero__heading');
      if (!heading) return;
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          heading.classList.add('hero__heading--visible');
        });
      });
    })();

    // mat-h1 char slide-up (titangatequity-style)
    (function () {
      const heading = document.querySelector('.mat-h1');
      if (!heading) return;

      var charIndex = 0;

      function splitNode(node) {
        if (node.nodeType !== 3) return; // only text nodes; <br> left as-is
        var text = node.textContent;
        var parts = text.split(/(\s+)/);
        var frag  = document.createDocumentFragment();

        parts.forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) {
            frag.appendChild(document.createTextNode(part));
            return;
          }
          var wordEl = document.createElement('span');
          wordEl.className = 'mat-word';
          Array.from(part).forEach(function (ch) {
            var charEl = document.createElement('span');
            charEl.className = 'mat-char';
            charEl.textContent = ch;
            charEl.style.transitionDelay = (charIndex * 0.028) + 's';
            charIndex++;
            wordEl.appendChild(charEl);
          });
          frag.appendChild(wordEl);
        });

        node.parentNode.replaceChild(frag, node);
      }

      Array.from(heading.childNodes).forEach(splitNode);

      var block = document.querySelector('.mat-block');
      if (!block) return;

      var obs = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) {
          heading.classList.add('mat-h1--visible');
          obs.disconnect();
        }
      }, { threshold: 0.12 });
      obs.observe(block);
    })();

    // Nav sliding pill
    (function () {
      var pill     = document.getElementById('nav-pill');
      var navLinks = document.getElementById('nav-links');
      if (!pill || !navLinks) return;

      var links = Array.from(navLinks.querySelectorAll('a[data-section]'));

      // Sections in page order (matches DOM)
      var sections = links
        .map(function (a) { return document.getElementById(a.dataset.section); })
        .filter(Boolean);

      var currentId = null;

      function moveTo(link) {
        var parentRect = navLinks.getBoundingClientRect();
        var rect = link.getBoundingClientRect();
        pill.style.left  = (rect.left - parentRect.left) + 'px';
        pill.style.width = rect.width + 'px';
        pill.style.opacity = '1';
      }

      function setActive(id) {
        if (id === currentId) return;
        currentId = id;
        links.forEach(function (a) { a.classList.remove('active'); });
        var link = links.find(function (a) { return a.dataset.section === id; });
        if (link) { link.classList.add('active'); moveTo(link); }
        else { pill.style.opacity = '0'; }
      }

      // Scroll tracking: active = last section whose top passed 35% of viewport
      // getBoundingClientRect+scrollY handles sticky/negative-margin sections correctly
      function onScroll() {
        var threshold = window.scrollY + window.innerHeight * 0.35;
        var activeId = null;
        sections.forEach(function (s) {
          var docTop = s.getBoundingClientRect().top + window.scrollY;
          if (docTop <= threshold) activeId = s.id;
        });
        setActive(activeId);
      }

      // Click: move pill instantly then scroll
      links.forEach(function (link) {
        link.addEventListener('click', function (e) {
          var target = document.getElementById(link.dataset.section);
          if (target) {
            e.preventDefault();
            links.forEach(function (a) { a.classList.remove('active'); });
            link.classList.add('active');
            currentId = link.dataset.section;
            moveTo(link);
            target.scrollIntoView({ behavior: 'smooth' });
          }
        });
      });

      // Reposition pill on resize
      window.addEventListener('resize', function () {
        var active = navLinks.querySelector('a.active');
        if (active) moveTo(active);
      }, { passive: true });

      window.addEventListener('scroll', onScroll, { passive: true });

      // Init on load
      window.addEventListener('load', function () {
        onScroll();
        // if nothing matched yet, default to first section
        if (!currentId && links.length) {
          links[0].classList.add('active');
          currentId = links[0].dataset.section;
          moveTo(links[0]);
        }
      });
    })();

    /* ── Card Scatter: init stacked positions ── */
    (function () {
      var layer = document.getElementById('cstack-layer');
      if (!layer) return;
      var tiles = Array.from(layer.querySelectorAll('.cstack-tile'));
      tiles.forEach(function (t, i) {
        var ang = (i / tiles.length) * Math.PI * 2;
        var r   = 5 + (i % 3) * 3;
        t.style.setProperty('--ctx', (Math.cos(ang) * r).toFixed(1) + 'px');
        t.style.setProperty('--cty', (Math.sin(ang) * r).toFixed(1) + 'px');
        t.style.setProperty('--ctr', (((i * 37) % 14) - 7).toFixed(1) + 'deg');
        t.style.setProperty('--csc', '1');
        t.style.zIndex = String(10 + Number(t.dataset.z || 1));
      });
    })();

    /* ── Card scatter trigger (IntersectionObserver) ── */
    (function () {
      var stage   = document.getElementById('cstack-stage');
      var layer   = document.getElementById('cstack-layer');
      if (!stage || !layer) return;

      var tiles     = Array.from(layer.querySelectorAll('.cstack-tile'));
      var scattered = false;

      function stack() {
        if (!scattered) return;
        scattered = false;
        tiles.forEach(function (t, i) {
          var ang = (i / tiles.length) * Math.PI * 2;
          var r   = 5 + (i % 3) * 3;
          t.style.setProperty('--ctx', (Math.cos(ang) * r).toFixed(1) + 'px');
          t.style.setProperty('--cty', (Math.sin(ang) * r).toFixed(1) + 'px');
          t.style.setProperty('--ctr', (((i * 37) % 14) - 7).toFixed(1) + 'deg');
          t.style.setProperty('--csc', '1');
        });
      }

      function scatter() {
        if (scattered) return;
        scattered = true;
        var vw = window.innerWidth;
        var vh = window.innerHeight;
        var maxX = vw * 0.68;
        var maxY = vh * 0.38;
        tiles.forEach(function (t) {
          var tx  = parseFloat(t.dataset.tx)  / 100 * maxX;
          var ty  = parseFloat(t.dataset.ty)  / 100 * maxY;
          var rot = parseFloat(t.dataset.rot);
          t.style.setProperty('--ctx', tx.toFixed(2)  + 'px');
          t.style.setProperty('--cty', ty.toFixed(2)  + 'px');
          t.style.setProperty('--ctr', rot.toFixed(2) + 'deg');
          t.style.setProperty('--csc', '0.95');
        });
      }

      new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) scatter(); else stack();
        });
      }, { threshold: 0.35 }).observe(stage);
    })();

    // ── Nav morph: full bar → circle in corner ──────────────────
    (function () {
      var navWrap = document.getElementById('navWrap');
      var nav     = document.getElementById('nav');
      var sheet   = document.getElementById('navSheet');
      var hero    = document.getElementById('hero');
      if (!navWrap || !nav || !sheet || !hero) return;

      var CIRCLE = 60, MARGIN = 28;

      function recomputeTarget() {
        var halfW  = window.innerWidth / 2;
        var tx     = halfW - MARGIN - CIRCLE / 2;
        var ty     = window.innerHeight - MARGIN - CIRCLE;
        document.documentElement.style.setProperty('--tx', tx + 'px');
        document.documentElement.style.setProperty('--ty', ty + 'px');
      }
      recomputeTarget();
      window.addEventListener('resize', recomputeTarget, { passive: true });

      var wasCollapsed = false;
      var lastScrollY  = window.scrollY;

      function onScroll() {
        var y          = window.scrollY;
        var trigger    = 1;
        var collapsed  = y > trigger;
        if (collapsed !== wasCollapsed) {
          wasCollapsed = collapsed;
          navWrap.classList.toggle('collapsed', collapsed);
          if (collapsed) {
            navWrap.classList.add('just-collapsed');
            setTimeout(function () { navWrap.classList.remove('just-collapsed'); }, 1700);
          } else {
            closeSheet();
          }
        }
        if (y < 40) {
          navWrap.classList.remove('hidden');
        } else if (y > lastScrollY) {
          navWrap.classList.add('hidden');
        } else {
          navWrap.classList.remove('hidden');
        }
        lastScrollY = y;
      }
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();

      function openSheet() {
        navWrap.classList.add('nav-open');
        sheet.classList.add('show');
      }
      function closeSheet() {
        navWrap.classList.remove('nav-open');
        sheet.classList.remove('show');
      }

      nav.addEventListener('click', function (e) {
        if (!navWrap.classList.contains('collapsed')) return;
        if (e.target.closest('a')) return;
        if (navWrap.classList.contains('nav-open')) closeSheet();
        else openSheet();
      });

      sheet.addEventListener('click', function (e) {
        if (e.target === sheet) closeSheet();
      });

      // Close sheet when clicking a nav link inside it
      sheet.querySelectorAll('a').forEach(function (a) {
        a.addEventListener('click', function () { closeSheet(); });
      });

      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeSheet();
      });
    })();

    // mat-cell hover video — only for cells with data-hover-video
    (function () {
      document.querySelectorAll('.mat-cell[data-hover-video]').forEach(function (cell) {
        var src = cell.dataset.hoverVideo;
        var bg = cell.querySelector('.mat-cell-bg');
        if (!bg || !src) return;
        var vid = null;
        var playProm = null;
        cell.addEventListener('mouseenter', function () {
          if (!vid) {
            vid = document.createElement('video');
            vid.muted = true; vid.loop = true; vid.playsInline = true;
            vid.src = src;
            bg.appendChild(vid);
          }
          playProm = vid.play();
          if (playProm) playProm.catch(function () {});
        });
        cell.addEventListener('mouseleave', function () {
          if (!vid) return;
          if (playProm) {
            playProm.then(function () { vid.pause(); vid.currentTime = 0; }).catch(function () {});
            playProm = null;
          } else {
            vid.pause(); vid.currentTime = 0;
          }
        });
      });
    })();

  // Block examples iframe vertical interaction until fully in view,
  // but always forward horizontal scroll/swipe so categories can be browsed mid-scroll
  (function() {
    var section = document.querySelector('.examples-section');
    var iframe = section && section.querySelector('iframe');
    if (!iframe) return;
    iframe.style.pointerEvents = 'none';

    var ratio = 0;
    var observer = new IntersectionObserver(function(entries) {
      ratio = entries[0].intersectionRatio;
      iframe.style.pointerEvents = ratio >= 0.80 ? 'auto' : 'none';
      fwd({ type: 'visibility', ratio: ratio });
    }, { threshold: [0, 0.25, 0.5, 0.75, 0.80, 1.0] });
    observer.observe(section);

    function fwd(msg) {
      try { iframe.contentWindow.postMessage(msg, '*'); } catch(e) {}
    }

    // Forward horizontal wheel to iframe even when section is only partially visible
    window.addEventListener('wheel', function(e) {
      if (ratio < 0.08 || ratio >= 0.80) return;
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault();
      fwd({ type: 'wheelX', delta: e.deltaX });
    }, { passive: false });

    // Forward horizontal touch swipe to iframe when section is partially visible
    var tx = 0, ty = 0;
    window.addEventListener('touchstart', function(e) {
      tx = e.touches[0].clientX; ty = e.touches[0].clientY;
    }, { passive: true });
    window.addEventListener('touchend', function(e) {
      if (ratio >= 0.95) return;
      var dx = e.changedTouches[0].clientX - tx;
      var dy = e.changedTouches[0].clientY - ty;
      if (Math.abs(dx) > Math.abs(dy) * 1.1 && Math.abs(dx) > 30) {
        fwd({ type: 'swipeX', dir: dx < 0 ? 1 : -1 });
      }
    }, { passive: true });
  })();
}