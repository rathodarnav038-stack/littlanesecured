/* ============================================================
   LitTix — Obsidian Glass — Animation Auto-Enhancer
   Scans existing markup and layers "next level" motion on top
   without needing any HTML rewrites per page.
   ============================================================ */
(function(){
  "use strict";
  if (window.__ltAnimInit) return; window.__ltAnimInit = true;

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function ready(fn){
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  /* ---------- 0. curtain intro ---------- */
  function injectCurtain(){
    if (reduceMotion) return;
    var c = document.createElement('div');
    c.className = 'lt-curtain';
    c.innerHTML = '<span class="lt-curtain-logo">LITTIX</span>';
    document.body.appendChild(c);
    setTimeout(function(){ c.remove(); }, 1300);
  }

  /* ---------- 1. aurora background ---------- */
  function injectAurora(){
    var a = document.createElement('div');
    a.className = 'lt-aurora';
    a.innerHTML = '<span></span><span></span><span></span>';
    document.body.insertBefore(a, document.body.firstChild);
  }

  /* ---------- 2. cursor spotlight ---------- */
  function injectSpotlight(){
    if (reduceMotion || matchMedia('(hover:none)').matches) return;
    var s = document.createElement('div');
    s.className = 'lt-spotlight';
    document.body.appendChild(s);
    window.addEventListener('pointermove', function(e){
      s.style.left = e.clientX + 'px';
      s.style.top = e.clientY + 'px';
    }, { passive:true });
  }

  /* ---------- 3. stagger-tag groups of siblings ---------- */
  function tagStagger(selectorList){
    selectorList.forEach(function(sel){
      document.querySelectorAll(sel).forEach(function(group){
        Array.prototype.forEach.call(group.children, function(child, i){
          if (child.nodeType === 1){
            child.style.setProperty('--lt-i', Math.min(i, 14));
            child.classList.add('lt-in');
          }
        });
      });
    });
  }

  /* ---------- 4. classify interactive elements ---------- */
  function enhanceInteractive(){
    // buttons -> ripple + shimmer + scale
    document.querySelectorAll('button, a.flex.items-center, [role="button"]').forEach(function(btn){
      if (btn.dataset.ltDone) return; btn.dataset.ltDone = '1';
      btn.classList.add('lt-hover-scale');
      var cls = btn.className;
      if (/bg-primary|bg-iris|bg-\[#|bg-secondary/.test(cls) || btn.matches('button')){
        btn.classList.add('lt-ripple');
      }
      btn.addEventListener('click', function(e){
        if (reduceMotion) return;
        var rect = btn.getBoundingClientRect();
        var size = Math.max(rect.width, rect.height);
        var dot = document.createElement('span');
        dot.className = 'lt-ripple-dot';
        var x = (e.clientX || rect.left + rect.width/2) - rect.left - size/2;
        var y = (e.clientY || rect.top + rect.height/2) - rect.top - size/2;
        dot.style.width = dot.style.height = size + 'px';
        dot.style.left = x + 'px';
        dot.style.top = y + 'px';
        btn.appendChild(dot);
        setTimeout(function(){ dot.remove(); }, 650);
      });
    });

    // primary CTA pulse (first prominent action button per page)
    var cta = document.querySelector('header button, header a.flex, .sticky button');
    if (cta) cta.classList.add('lt-pulse-ring');

    // cards / panels
    document.querySelectorAll('[class*="rounded-lg"][class*="border"], [class*="rounded-xl"][class*="border"], .rounded-2xl').forEach(function(card){
      card.classList.add('lt-hover-lift', 'lt-glass-sheen');
    });

    // table rows
    document.querySelectorAll('tbody tr').forEach(function(row){
      row.classList.add('lt-row');
    });

    // table body stagger
    document.querySelectorAll('tbody').forEach(function(body){
      Array.prototype.forEach.call(body.children, function(row, i){
        row.style.setProperty('--lt-i', Math.min(i, 12));
        row.classList.add('lt-in-left');
      });
    });

    // nav items
    document.querySelectorAll('nav a, aside a').forEach(function(a){
      a.classList.add('lt-nav-item');
    });

    // icons: material symbols
    document.querySelectorAll('.material-symbols-outlined').forEach(function(icon){
      if (/refresh|sync|autorenew|progress_activity/.test(icon.textContent.trim())){
        icon.classList.add('lt-icon-spin');
      } else if (icon.closest('button, a')){
        icon.classList.add('lt-icon-bounce');
      }
    });

    // inputs
    document.querySelectorAll('input, select, textarea').forEach(function(el){
      el.classList.add('lt-focus');
    });

    // status dots (small colored circles)
    document.querySelectorAll('span[class*="rounded-full"][class*="bg-"]').forEach(function(dot){
      var w = dot.className.match(/w-(1|1\.5|2)\b/);
      if (w) dot.classList.add('lt-live-dot');
    });

    // progress bars
    document.querySelectorAll('[class*="rounded-full"] > div[style*="width"], [class*="bg-primary"][style*="width"]').forEach(function(bar){
      bar.classList.add('lt-bar-fill');
    });

    // headings entrance
    document.querySelectorAll('h1, h2').forEach(function(h, i){
      h.style.setProperty('--lt-i', 0);
      h.classList.add('lt-in-left');
    });

    // scrollable containers get styled scrollbar
    document.querySelectorAll('main, [class*="overflow-y-auto"], [class*="overflow-auto"]').forEach(function(el){
      el.classList.add('lt-scroll');
    });
  }

  /* ---------- 5. animate number stats counting up ---------- */
  function animateCounters(){
    var candidates = document.querySelectorAll('p, span, div');
    candidates.forEach(function(el){
      if (el.children.length) return;
      var txt = el.textContent.trim();
      var m = txt.match(/^([₹$€]?)([\d,]+\.?\d*)([%kKmM]?)$/);
      if (!m) return;
      var prefix = m[1], numStr = m[2].replace(/,/g,''), suffix = m[3];
      var num = parseFloat(numStr);
      if (isNaN(num) || num === 0) return;
      // Only animate likely "stat" numbers (bold-ish, larger text)
      var fs = parseFloat(getComputedStyle(el).fontSize);
      if (fs < 18) return;
      el.classList.add('lt-ticker');
      if (reduceMotion) return;
      var duration = 1000, start = null;
      var decimals = (numStr.split('.')[1] || '').length;
      function frame(ts){
        if (!start) start = ts;
        var p = Math.min((ts - start) / duration, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        var cur = num * eased;
        var formatted = decimals ? cur.toFixed(decimals) : Math.round(cur).toLocaleString('en-IN');
        el.textContent = prefix + formatted + suffix;
        if (p < 1) requestAnimationFrame(frame);
        else el.textContent = prefix + (decimals ? num.toFixed(decimals) : num.toLocaleString('en-IN')) + suffix;
      }
      requestAnimationFrame(frame);
    });
  }

  /* ---------- 6. scroll reveal for sections beyond the fold ---------- */
  function scrollReveal(){
    var els = document.querySelectorAll('section, .grid > div, tbody tr');
    if (!('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if (entry.isIntersecting){
          entry.target.classList.add('lt-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    document.querySelectorAll('section').forEach(function(s){
      s.classList.add('lt-reveal');
      io.observe(s);
    });
  }

  /* ---------- 7. modal / dialog polish ---------- */
  function enhanceModals(){
    document.querySelectorAll('[class*="fixed"][class*="inset-0"]').forEach(function(backdrop){
      backdrop.classList.add('lt-modal-backdrop');
      var panel = backdrop.querySelector('[class*="rounded"]');
      if (panel) panel.classList.add('lt-modal-panel');
    });
  }

  ready(function(){
    injectCurtain();
    injectAurora();
    injectSpotlight();
    enhanceInteractive();
    enhanceModals();
    tagStagger(['.grid', 'main > div']);
    scrollReveal();
    setTimeout(animateCounters, 150);
  });
})();
