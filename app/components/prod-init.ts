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

    // Slide2 lights-on: двунаправленная анимация по скроллу
    (function () {
      const slide2 = document.getElementById('slide2');
      if (!slide2) return;
      function check() {
        const rect = slide2.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.15) {
          slide2.classList.add('lights-on');
        } else {
          slide2.classList.remove('lights-on');
        }
      }
      window.addEventListener('scroll', check, { passive: true });
      check();
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

    // ── Nav: mobile sheet-menu toggle ────────────────────────────
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

    // Slide2 CTA: scroll to footer + flash messenger buttons
    (function() {
      var btn = document.getElementById('s2-cta-btn');
      if (!btn) return;
      // After entrance animation — restore normal hover/transform behaviour
      btn.addEventListener('animationend', function(e) {
        if (e.animationName === 's2CtaAppear') {
          btn.style.opacity = '1';
          btn.style.animation = '';
        }
      });
      btn.addEventListener('click', function() {
        var footer = document.querySelector('.site-footer') || document.querySelector('footer');
        if (footer) footer.scrollIntoView({ behavior: 'smooth' });
        setTimeout(function() {
          var btns = document.querySelectorAll('.footer-msg-btn');
          btns.forEach(function(b) {
            b.classList.remove('msg-pulse');
            void b.offsetWidth;
            b.classList.add('msg-pulse');
            b.addEventListener('animationend', function() { b.classList.remove('msg-pulse'); }, { once: true });
          });
        }, 650);
      });
    })();
}
