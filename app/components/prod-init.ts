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
      var GAP = 14;
      var DUR = 550;

      document.querySelectorAll('.mat-row').forEach(function(row) {
        var track    = row.querySelector('.mat-track');
        var viewport = row.querySelector('.mat-track-viewport');
        var prev     = row.querySelector('.mat-row-arrow.prev');
        var next     = row.querySelector('.mat-row-arrow.next');
        if (!track || !viewport || !prev || !next) return;
        var busy = false;

        // Step by exactly one cell's actual rendered width, not a count
        // assumed to fit the viewport — keeps prev/next correct whether 5
        // cells are visible (desktop) or ~2 (mobile, see prod-page.css).
        function step() {
          var cell = track.querySelector('.mat-cell');
          return cell ? cell.getBoundingClientRect().width + GAP : 0;
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

    // Mat block: progressive image loading
    // Первые 5 ячеек каждой строки уже загружены глазами (eager).
    // Остальные подгружаются батчами по BATCH_PER_ROW штук из каждой
    // строки за раз (а не строка за строкой целиком), пока не закончатся.
    (function () {
      var BATCH_PER_ROW = 2;

      var queues = Array.from(document.querySelectorAll('.mat-row')).map(function (row) {
        return Array.from(row.querySelectorAll('.mat-cell img[data-src]'));
      });

      function loadImg(img) {
        img.src = img.getAttribute('data-src');
        img.removeAttribute('data-src');
      }

      function schedule(fn) {
        if ('requestIdleCallback' in window) {
          requestIdleCallback(fn, { timeout: 1000 });
        } else {
          setTimeout(fn, 200);
        }
      }

      function loadNextBatch() {
        var any = false;
        queues.forEach(function (queue) {
          for (var i = 0; i < BATCH_PER_ROW && queue.length; i++) {
            loadImg(queue.shift());
            any = true;
          }
        });
        if (any) schedule(loadNextBatch);
      }

      schedule(loadNextBatch);
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


    // Materials block scale-to-fit — desktop only. Below 768px the block
    // switches to its own natural-flow mobile layout (see CSS), so the
    // 1920px-canvas zoom must be cleared rather than shrinking that layout
    // down to a tiny scaled copy of the desktop one.
    (function(){
      const stage = document.getElementById('mat-stage');
      if (!stage) return;
      function fitMat(){
        if (window.innerWidth <= 768) {
          stage.style.transform = '';
          stage.parentElement.style.height = '';
          return;
        }
        // transform (GPU-composited), not zoom — zoom forces raster <img>
        // content through a layout-level rescale that looks visibly
        // blockier than the compositor scaling video already gets, even
        // at identical effective size. transform doesn't affect layout
        // size, so the parent's height is set to match explicitly.
        const s = stage.parentElement.offsetWidth / 1920;
        stage.style.transform = 'scale(' + s + ')';
        stage.parentElement.style.height = (1080 * s) + 'px';
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

    // ── Nav: mobile sheet-menu toggle ────────────────────────────
    // Nav stays a full strip always (never collapses to a circle, see
    // CLAUDE.md) — hide-on-scroll-down/show-on-scroll-up and the dark
    // backdrop past the hero both live in ProdScripts.tsx instead, since
    // that file isn't regenerated from index-prod.html and knows about
    // ScrollVideoHero's height. This block only wires up the mobile
    // hamburger (.nav__burger, visible ≤900px) to open/close #navSheet,
    // the only way to reach nav links once .nav__links is display:none.
    (function () {
      var navWrap = document.getElementById('navWrap');
      var burger  = document.querySelector('.nav__burger');
      var sheet   = document.getElementById('navSheet');
      if (!navWrap || !burger || !sheet) return;

      function openSheet() {
        navWrap.classList.add('nav-open');
        sheet.classList.add('show');
      }
      function closeSheet() {
        navWrap.classList.remove('nav-open');
        sheet.classList.remove('show');
      }

      burger.addEventListener('click', function () {
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

    // mat-cell hover video — only for cells with data-hover-video. All clips
    // together are only a few MB now (re-encoded, see wardrobe animations),
    // so every cell's <video> is created and preloaded as soon as the
    // Materials section nears the viewport, instead of on first hover —
    // hovering then just plays an already-buffered element, no wait.
    (function () {
      var probe = document.createElement('video');
      var webmOk = probe.canPlayType('video/webm; codecs="vp9"') !== '';
      var cells = document.querySelectorAll('.mat-cell[data-hover-video]');
      if (!cells.length) return;

      function ensureVideo(cell, bg, src) {
        var vid = cell._hoverVid;
        if (!vid) {
          vid = document.createElement('video');
          vid.muted = true; vid.loop = true; vid.playsInline = true;
          vid.preload = 'auto';
          vid.src = src;
          bg.appendChild(vid);
          cell._hoverVid = vid;
        }
        return vid;
      }

      cells.forEach(function (cell) {
        var base = cell.dataset.hoverVideo;
        var bg = cell.querySelector('.mat-cell-bg');
        if (!bg || !base) return;
        var src = base + (webmOk ? '.webm' : '.mp4');
        var playProm = null;
        cell.addEventListener('mouseenter', function () {
          var vid = ensureVideo(cell, bg, src);
          playProm = vid.play();
          if (playProm) playProm.catch(function () {});
        });
        cell.addEventListener('mouseleave', function () {
          var vid = cell._hoverVid;
          if (!vid) return;
          if (playProm) {
            playProm.then(function () { vid.pause(); vid.currentTime = 0; }).catch(function () {});
            playProm = null;
          } else {
            vid.pause(); vid.currentTime = 0;
          }
        });
      });

      var section = document.getElementById('materials');
      var preloaded = false;
      function preloadAll() {
        if (preloaded) return;
        preloaded = true;
        cells.forEach(function (cell) {
          var base = cell.dataset.hoverVideo;
          var bg = cell.querySelector('.mat-cell-bg');
          if (!bg || !base) return;
          ensureVideo(cell, bg, base + (webmOk ? '.webm' : '.mp4'));
        });
      }
      if (section && 'IntersectionObserver' in window) {
        var io = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) { preloadAll(); io.disconnect(); }
          });
        }, { rootMargin: '800px 0px' });
        io.observe(section);
      } else {
        preloadAll();
      }
    })();

  // Examples section — Виды работ (Catalog Slider)
  (function() {
    var CATS = [
      { label:'Душевые', dot:'#0d9488', cover:'assets/boxes/1_shower_box-Photoroom.png', subs:[
        { title:'Дверная',             img:'assets/examples/showers/1_dver.webp' },
        { title:'Прямая (2 стекла)',   img:'assets/examples/showers/2_pryamaya_2.webp' },
        { title:'Прямая (3 стекла)',   img:'assets/examples/showers/3_pryamaya_3.webp' },
        { title:'Трапеция',            img:'assets/examples/showers/4_trapeciya.webp' },
        { title:'Т-образная',          img:'assets/examples/showers/5_t_obraz.webp' },
        { title:'Складная',            img:'assets/examples/showers/6_skladnaya.webp' },
        { title:'Угловая (3 стекла)',  img:'assets/examples/showers/7_uglovaya_3.webp' },
        { title:'Угловая (2 стекла)',  img:'assets/examples/showers/8_uglovaya_2.webp' },
      ]},
      { label:'Зеркала', dot:'#a855f7', cover:'assets/boxes/2_mirror_box-Photoroom.png', subs:[
        { title:'Круглое',             img:'assets/examples/mirrors/1_cicrle.webp' },
        { title:'Г-образное',          img:'assets/examples/mirrors/2_R_type.webp' },
        { title:'Овальное',            img:'assets/examples/mirrors/3_oval.webp' },
        { title:'Эллипс',              img:'assets/examples/mirrors/4_elipse.webp' },
        { title:'Прямоугольное',       img:'assets/examples/mirrors/5_square.webp' },
        { title:'Арочное',             img:'assets/examples/mirrors/6_arka.webp' },
      ]},
      { label:'Ограждения', dot:'#d97706', cover:'assets/boxes/3_stairs_box-Photoroom.png', subs:[
        { title:'На точечных фитингах',img:'assets/examples/stairs/1_tochki.webp' },
        { title:'На стойках',          img:'assets/examples/stairs/2_stoyki.webp' },
        { title:'В профиле',           img:'assets/examples/stairs/3_profil.webp' },
      ]},
      { label:'Перегородки', dot:'#3b82f6', cover:'assets/boxes/4_partition-Photoroom.png', subs:[
        { title:'Цельностеклянная',    img:'assets/examples/partitions/1_cs.webp' },
        { title:'На каркасе',          img:'assets/examples/partitions/2_karkas.webp' },
        { title:'Раздвижная',          img:'assets/examples/partitions/3_razdvizhnaya.webp' },
      ]},
      { label:'Лофт', dot:'#ef4444', cover:'assets/boxes/5_loft-Photoroom.png', subs:[
        { title:'Арочная',             img:'assets/examples/lofts/1_arochnaya.webp' },
        { title:'Складная',            img:'assets/examples/lofts/2_skladnaya.webp' },
        { title:'Угловая',             img:'assets/examples/lofts/3_uglovaya.webp' },
        { title:'Прямая',              img:'assets/examples/lofts/4_pryamaya.webp' },
        { title:'Раздвижная',          img:'assets/examples/lofts/5_razdvizhnaya.webp' },
      ]},
      { label:'Панели', dot:'#10b981', cover:'assets/boxes/8_panels-Photoroom.png', subs:[
        { title:'Прихожая',            img:'assets/examples/panels/1_prihojaya.webp' },
        { title:'Прикроватная',        img:'assets/examples/panels/2_prikrovatnaya.webp' },
      ]},
      { label:'Козырьки', dot:'#f59e0b', cover:'assets/boxes/9_visors-Photoroom.png', subs:[
        { title:'Навесная',            img:'assets/examples/visors/1_navesnaya.webp' },
        { title:'В профиле',           img:'assets/examples/visors/2_profil.webp' },
      ]},
      { label:'Полки', dot:'#8b5cf6', cover:'assets/boxes/12_shelves-Photoroom.png', subs:[
        { title:'Встроенные с подсветкой', img:'assets/examples/shelves/1_vstroennie_s_podsvetkoy.webp' },
        { title:'Полки в нише',            img:'assets/examples/shelves/2_polki_v_nishe.webp' },
        { title:'На больших держателях',   img:'assets/examples/shelves/3_bolshie_derjateli.webp' },
      ]},
    ];
    if (window.innerWidth <= 768) { renderMobile(); return; }
    initDesktop();

    function renderMobile() {
      var el = document.getElementById('exs-mobile');
      if (!el) return;
      var h = '<div style="text-align:center;margin-bottom:14px"><h2 style="font-size:18px;font-weight:500;text-transform:uppercase;letter-spacing:.04em;margin-bottom:5px">Виды работ</h2>'
            + '<p style="font-size:12px;line-height:1.5;color:rgba(0,0,0,.5)">Зеркала, душевые перегородки, стеклянные ограждения</p></div>';
      h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">';
      CATS.forEach(function(cat, ci) {
        h += '<div style="border-radius:10px;overflow:hidden;background:#0d0d0d">'
           + '<div style="position:relative;aspect-ratio:292/404;overflow:hidden" id="exsm-vp-'+ci+'">';
        cat.subs.forEach(function(su, pi) {
          h += '<div class="exs-photo-item '+(pi===0?'state-current':'state-below')+'" style="background-image:url(\''+su.img+'\')"></div>';
        });
        if (cat.subs.length > 1) {
          h += '<div style="position:absolute;bottom:5px;right:5px;display:flex;flex-direction:column;gap:3px;z-index:5">'
             + '<button onclick="exsMStep('+ci+',-1)" style="width:22px;height:22px;border-radius:50%;background:rgba(0,0,0,.5);border:1px solid rgba(255,255,255,.18);color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer">'
             + '<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="18 15 12 9 6 15"/></svg></button>'
             + '<button onclick="exsMStep('+ci+',1)" style="width:22px;height:22px;border-radius:50%;background:rgba(0,0,0,.5);border:1px solid rgba(255,255,255,.18);color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer">'
             + '<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="6 9 12 15 18 9"/></svg></button>'
             + '</div>';
        }
        h += '</div>'
           + '<div style="padding:6px 9px;color:rgba(255,255,255,.6);font-size:10px;letter-spacing:.18em;text-transform:uppercase;font-family:Manrope,sans-serif" id="exsm-lbl-'+ci+'">'+cat.label+'</div>'
           + '</div>';
      });
      h += '</div>';
      el.innerHTML = h;
    }
    var exsMIdx = CATS.map(function(){ return 0; });
    window.exsMStep = function(ci, dir) {
      var n = CATS[ci].subs.length;
      exsMIdx[ci] = ((exsMIdx[ci]+dir)+n)%n;
      var vp = document.getElementById('exsm-vp-'+ci);
      if (!vp) return;
      var cur = exsMIdx[ci];
      vp.querySelectorAll('.exs-photo-item').forEach(function(el,i){
        el.className='exs-photo-item '+(i===cur?'state-current':i<cur?'state-above':'state-below');
      });
    };

    function initDesktop() {
      var STEP = 540, VSTEP = 310, WIN = 2, BUCKET = 5;
      var N = CATS.length;
      var state = { active: 0, sub: 0 };
      var locked = false;
      var TR = 'opacity .42s ease, transform .5s cubic-bezier(.2,.8,.2,1)';

      function mod(a, b) { return ((a % b) + b) % b; }
      function win(pos) {
        var arr = new Array(BUCKET);
        for (var v = pos - WIN; v <= pos + WIN; v++) arr[mod(v, BUCKET)] = v;
        return arr;
      }
      function ce(tag) { return document.createElement(tag); }
      function css(el, styles) { for (var k in styles) el.style[k] = styles[k]; }

      var stage = document.getElementById('exs-stage');

      var rowEl = ce('div');
      css(rowEl, { position:'absolute', left:'50%', top:0, height:'100%', width:0 });
      stage.appendChild(rowEl);

      var slots = [];
      for (var si = 0; si < BUCKET; si++) {
        var slotEl = ce('div');
        css(slotEl, { position:'absolute', top:0, height:'100%', width: STEP+'px' });
        var innerEl = ce('div');
        css(innerEl, { position:'absolute', left:'50%', top:'50%', transform:'translate(-50%,-50%)', width:'600px', height:'100%', display:'flex', alignItems:'center', justifyContent:'center' });
        slotEl.appendChild(innerEl);

        var compactEl = ce('div');
        css(compactEl, { position:'absolute', width:'292px', height:'404px', borderRadius:'20px', overflow:'hidden', boxShadow:'0 22px 55px rgba(0,0,0,.14)', backgroundSize:'cover', backgroundPosition:'center', cursor:'pointer' });
        var scrimEl = ce('div');
        css(scrimEl, { position:'absolute', top:0, left:0, right:0, bottom:0, background:'linear-gradient(to top, rgba(0,0,0,.5) 0%, transparent 55%)', pointerEvents:'none' });
        compactEl.appendChild(scrimEl);
        var compactLbl = ce('span');
        css(compactLbl, { position:'absolute', bottom:'18px', left:0, right:0, textAlign:'center', fontFamily:'Manrope,sans-serif', fontSize:'11px', letterSpacing:'.24em', textTransform:'uppercase', fontWeight:400, color:'rgba(255,255,255,.85)', textShadow:'0 1px 4px rgba(0,0,0,.6)', pointerEvents:'none' });
        compactEl.appendChild(compactLbl);
        innerEl.appendChild(compactEl);

        var stripEl = ce('div');
        css(stripEl, { position:'absolute', width:'640px', height:'100%', transformOrigin:'center' });
        var pillEl = ce('div');
        css(pillEl, { position:'absolute', top:'36px', bottom:'36px', left:0, right:0, background:'#f4f4f3', borderRadius:'34px' });
        stripEl.appendChild(pillEl);
        var colEl = ce('div');
        css(colEl, { position:'absolute', left:0, right:0, top:'50%', height:0, transition:'transform .5s cubic-bezier(.2,.8,.2,1)' });
        stripEl.appendChild(colEl);
        innerEl.appendChild(stripEl);
        rowEl.appendChild(slotEl);

        var cells = [];
        for (var ci = 0; ci < BUCKET; ci++) {
          var cellEl = ce('div');
          css(cellEl, { position:'absolute', left:'50%', width:0, height:0 });

          var miniEl = ce('div');
          css(miniEl, { position:'absolute', left:0, top:0, width:'452px', height:'112px', background:'#fff', borderRadius:'20px', boxShadow:'0 16px 38px rgba(0,0,0,.10)', display:'flex', alignItems:'center', gap:'18px', padding:'16px', transition:TR, zIndex:1, cursor:'pointer' });
          var miniImgEl = ce('div');
          css(miniImgEl, { width:'96px', height:'80px', borderRadius:'13px', flexShrink:0, backgroundSize:'cover', backgroundPosition:'center' });
          var miniTextEl = ce('div');
          css(miniTextEl, { flex:1, minWidth:0, display:'flex', flexDirection:'column', gap:'7px' });
          var miniTopEl = ce('div');
          css(miniTopEl, { display:'flex', alignItems:'center', gap:'8px' });
          var miniDotEl = ce('span');
          css(miniDotEl, { width:'7px', height:'7px', borderRadius:'50%', flexShrink:0 });
          var miniLabelEl = ce('span');
          css(miniLabelEl, { fontSize:'12px', color:'#9a9a9a', fontWeight:600, letterSpacing:'.2px', fontFamily:'Manrope,sans-serif' });
          miniTopEl.appendChild(miniDotEl); miniTopEl.appendChild(miniLabelEl);
          var miniTitleEl = ce('span');
          css(miniTitleEl, { fontSize:'15px', fontWeight:600, color:'#222', lineHeight:1.28, letterSpacing:'-.1px', fontFamily:'Manrope,sans-serif' });
          miniTextEl.appendChild(miniTopEl); miniTextEl.appendChild(miniTitleEl);
          miniEl.appendChild(miniImgEl); miniEl.appendChild(miniTextEl);

          var bigEl = ce('div');
          css(bigEl, { position:'absolute', left:0, top:0, width:'600px', height:'432px', background:'#fff', borderRadius:'24px', boxShadow:'0 34px 74px rgba(0,0,0,.16)', display:'flex', overflow:'hidden', transition:TR });
          var bigImgEl = ce('div');
          css(bigImgEl, { width:'396px', height:'100%', flexShrink:0, backgroundSize:'cover', backgroundPosition:'center' });
          var bigBadgeEl = ce('div');
          css(bigBadgeEl, { position:'absolute', top:'18px', right:'18px', background:'#141414', color:'#fff', fontSize:'14px', fontWeight:600, letterSpacing:'.2px', padding:'9px 15px', borderRadius:'11px', zIndex:2, fontFamily:'Manrope,sans-serif' });
          var bigInfoEl = ce('div');
          css(bigInfoEl, { flex:1, background:'#fff', padding:'26px', display:'flex', flexDirection:'column', justifyContent:'flex-end' });
          var bigMetaEl = ce('div');
          css(bigMetaEl, { display:'flex', alignItems:'center', gap:'9px', marginBottom:'12px' });
          var bigDotEl = ce('span');
          css(bigDotEl, { width:'7px', height:'7px', borderRadius:'50%', flexShrink:0 });
          var bigCatEl = ce('span');
          css(bigCatEl, { fontSize:'14px', color:'#8a8a8a', fontFamily:'Manrope,sans-serif' });
          bigMetaEl.appendChild(bigDotEl); bigMetaEl.appendChild(bigCatEl);
          var bigTitleEl = ce('div');
          css(bigTitleEl, { fontSize:'22px', fontWeight:700, lineHeight:1.24, letterSpacing:'-.2px', color:'#161616', fontFamily:'Manrope,sans-serif' });
          bigInfoEl.appendChild(bigMetaEl); bigInfoEl.appendChild(bigTitleEl);
          bigEl.appendChild(bigImgEl); bigEl.appendChild(bigBadgeEl); bigEl.appendChild(bigInfoEl);

          cellEl.appendChild(miniEl); cellEl.appendChild(bigEl);
          colEl.appendChild(cellEl);
          cells.push({ el:cellEl, miniEl:miniEl, miniImgEl:miniImgEl, miniDotEl:miniDotEl, miniLabelEl:miniLabelEl, miniTitleEl:miniTitleEl, bigEl:bigEl, bigImgEl:bigImgEl, bigDotEl:bigDotEl, bigCatEl:bigCatEl, bigTitleEl:bigTitleEl, bigBadgeEl:bigBadgeEl });
        }
        slots.push({ el:slotEl, compactEl:compactEl, compactLbl:compactLbl, stripEl:stripEl, colEl:colEl, cells:cells });
      }

      function makeArrow(svgStr, styles) {
        var btn = ce('button');
        css(btn, { position:'absolute', background:'#fff', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', zIndex:30, border:'none', padding:0 });
        css(btn, styles);
        btn.innerHTML = svgStr;
        stage.appendChild(btn);
        return btn;
      }
      var L = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#222" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 5 8 12 15 19"/></svg>';
      var R = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#222" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 5 16 12 9 19"/></svg>';
      var U = '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#222" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="5 15 12 8 19 15"/></svg>';
      var D = '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#222" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="5 9 12 16 19 9"/></svg>';
      makeArrow(L, { bottom:'22px', left:'calc(50% - 360px)', transform:'translateX(-50%)', width:'56px', height:'56px', boxShadow:'0 10px 30px rgba(0,0,0,.13)' }).addEventListener('click', function(){ go(-1); });
      makeArrow(R, { bottom:'22px', left:'calc(50% + 360px)', transform:'translateX(-50%)', width:'56px', height:'56px', boxShadow:'0 10px 30px rgba(0,0,0,.13)' }).addEventListener('click', function(){ go(1); });

      function render() {
        var active = state.active, sub = state.sub;
        rowEl.style.transform = 'translateX(' + (-(active * STEP + STEP/2)) + 'px)';
        win(active).forEach(function(vp) {
          var si2 = mod(vp, BUCKET);
          var sd = slots[si2];
          var cat = CATS[mod(vp, N)];
          var open = (vp === active);
          var m = cat.subs.length;
          var vpos = open ? sub : 0;
          sd.el.style.left = (vp * STEP) + 'px';
          sd.compactEl.style.backgroundImage = 'url(' + (cat.subs.length ? cat.subs[0].img : cat.cover) + ')';
          sd.compactEl.style.opacity = open ? 0 : 1;
          sd.compactEl.style.transform = 'scale(' + (open ? 1.06 : 1) + ')';
          sd.compactEl.style.transition = 'opacity .46s ease, transform .5s cubic-bezier(.2,.8,.2,1)';
          sd.compactEl.style.pointerEvents = open ? 'none' : 'auto';
          sd.compactLbl.textContent = cat.label;
          sd.stripEl.style.opacity = open ? 1 : 0;
          sd.stripEl.style.transform = 'scaleY(' + (open ? 1 : 0.86) + ')';
          sd.stripEl.style.transition = 'opacity .42s ease, transform .5s cubic-bezier(.2,.8,.2,1)';
          sd.stripEl.style.pointerEvents = open ? 'auto' : 'none';
          sd.colEl.style.transform = 'translateY(' + (-(vpos * VSTEP)) + 'px)';
          win(vpos).forEach(function(svp) {
            var ci2 = mod(svp, BUCKET);
            var cell = sd.cells[ci2];
            var su = cat.subs[mod(svp, m)];
            var isA = (svp === vpos);
            cell.el.style.top = (svp * VSTEP) + 'px';
            cell.miniEl.style.transform = 'translate(-50%,-50%) scale(' + (isA ? 0.9 : 1) + ')';
            cell.miniEl.style.opacity = isA ? 0 : 1;
            cell.miniEl.style.pointerEvents = isA ? 'none' : 'auto';
            cell.miniImgEl.style.backgroundImage = 'url(' + su.img + ')';
            cell.miniDotEl.style.background = cat.dot;
            cell.miniLabelEl.textContent = cat.label;
            cell.miniTitleEl.textContent = su.title;
            cell.bigEl.style.transform = 'translate(-50%,-50%) scale(' + (isA ? 1 : 0.66) + ')';
            cell.bigEl.style.opacity = isA ? 1 : 0;
            cell.bigEl.style.pointerEvents = isA ? 'auto' : 'none';
            cell.bigEl.style.zIndex = isA ? 3 : 2;
            cell.bigImgEl.style.backgroundImage = 'url(' + su.img + ')';
            cell.bigDotEl.style.background = cat.dot;
            cell.bigCatEl.textContent = cat.label;
            cell.bigTitleEl.textContent = su.title;
            cell.bigBadgeEl.textContent = 'Модель ' + String(mod(svp, m) + 1).padStart(2, '0');
          });
        });
      }

      function go(delta) {
        if (locked) return; locked = true;
        state.active += delta; state.sub = 0;
        render();
        setTimeout(function() { locked = false; }, 600);
      }
      function vstep(dir) {
        if (locked) return; locked = true;
        state.sub += dir;
        render();
        setTimeout(function() { locked = false; }, 550);
      }

      slots.forEach(function(sd, si2) {
        sd.compactEl.addEventListener('click', function() {
          var vps = win(state.active);
          for (var i = 0; i < vps.length; i++) {
            if (mod(vps[i], BUCKET) === si2) {
              var delta = vps[i] - state.active;
              if (delta !== 0) go(delta > 0 ? 1 : -1);
              break;
            }
          }
        });
        sd.cells.forEach(function(cell, ci3) {
          cell.miniEl.addEventListener('click', function() {
            var svps = win(state.sub);
            for (var j = 0; j < svps.length; j++) {
              if (mod(svps[j], BUCKET) === ci3) {
                var d = svps[j] - state.sub;
                if (d !== 0) vstep(d > 0 ? 1 : -1);
                break;
              }
            }
          });
        });
      });

      window.addEventListener('keydown', function(e) {
        var rect = document.getElementById('exs-section').getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > window.innerHeight) return;
        if (e.key === 'ArrowLeft')       { e.preventDefault(); go(-1); }
        else if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
        else if (e.key === 'ArrowUp')    { e.preventDefault(); vstep(-1); }
        else if (e.key === 'ArrowDown')  { e.preventDefault(); vstep(1); }
      });

      var ha = 0, ht = 0, va = 0, vt = 0;
      stage.addEventListener('wheel', function(e) {
        if (Math.abs(e.clientX - window.innerWidth / 2) > 380) return;
        var ax = Math.abs(e.deltaX), ay = Math.abs(e.deltaY), now = performance.now();
        if (ax > ay) {
          e.preventDefault();
          ha = (now - ht < 200) ? ha + e.deltaX : e.deltaX; ht = now;
          if (Math.abs(ha) > 80) { go(ha > 0 ? 1 : -1); ha = 0; }
        } else {
          e.preventDefault();
          va = (now - vt < 200) ? va + e.deltaY : e.deltaY; vt = now;
          if (Math.abs(va) > 50) { vstep(va > 0 ? 1 : -1); va = 0; }
        }
      }, { passive: false });

      var tsx = 0, tsy = 0;
      stage.addEventListener('touchstart', function(e) { tsx = e.touches[0].clientX; tsy = e.touches[0].clientY; }, { passive: true });
      stage.addEventListener('touchend', function(e) {
        var dx = e.changedTouches[0].clientX - tsx, dy = e.changedTouches[0].clientY - tsy, TH = 48;
        if (Math.max(Math.abs(dx), Math.abs(dy)) < TH) return;
        if (Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
        else vstep(dy < 0 ? 1 : -1);
      }, { passive: true });

      rowEl.style.transition = 'none';
      render();
      requestAnimationFrame(function() { rowEl.style.transition = 'transform .55s cubic-bezier(.2,.8,.2,1)'; });
    }
  })();

  /* Scroll to footer + flash messenger buttons */
  (function () {
    function scrollToFooterAndFlash() {
      var footer = document.querySelector('.site-footer');
      if (!footer) return;
      footer.scrollIntoView({ behavior: 'smooth' });
      setTimeout(function () {
        var btns = document.querySelectorAll('.footer-msg-btn');
        btns.forEach(function (btn) {
          btn.classList.remove('footer-msg-btn--flash');
          void btn.offsetWidth;
          btn.classList.add('footer-msg-btn--flash');
        });
        setTimeout(function () {
          btns.forEach(function (btn) { btn.classList.remove('footer-msg-btn--flash'); });
        }, 2300);
      }, 850);
    }

    (window as any).scrollToFooterAndFlash = scrollToFooterAndFlash;

    var mirrorCta = document.querySelector('.mirror-cta');
    if (mirrorCta) mirrorCta.addEventListener('click', scrollToFooterAndFlash);
  })();
}