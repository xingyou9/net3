/* ============================================================================
   app4.js —— 企业级移动外壳 + 交互增强（依赖 data.js / app3.js 的 DOM 产物）
   职责：
     1) 重建移动端应用外壳：App Bar 副标题 / 菜单键 / 章节胶囊轨 / 底部标签栏 / 目录抽屉
     2) 表格卡片化（小屏把宽表拆成信息卡，读取 thead 自动生成字段名）
     3) Hero 网络星图（内联 SVG，纯矢量，无外部图片）
     4) 数字滚动、章节头部图标砖、滚动锚点补偿、主题色同步
   约束：全部为增量增强，任何一步失败都不影响原有页面可用。
   ============================================================================ */
(function () {
  "use strict";

  var MOBILE = "(max-width: 860px)";
  var mq = window.matchMedia ? window.matchMedia(MOBILE) : null;
  var REDUCED = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
  function raf(fn) {
    if (window.requestAnimationFrame) return window.requestAnimationFrame(fn);
    return setTimeout(fn, 16);
  }

  /* 图标集（内联 SVG，不依赖 emoji 字体） */
  var ICON = {
    menu: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h10M4 17h13"/></svg>',
    grid: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.2" y="3.2" width="7" height="7" rx="1.8"/><rect x="13.8" y="3.2" width="7" height="7" rx="1.8"/><rect x="3.2" y="13.8" width="7" height="7" rx="1.8"/><rect x="13.8" y="13.8" width="7" height="7" rx="1.8"/></svg>',
    book: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.2A2.2 2.2 0 0 1 6.2 3H11v16.5H6.2A2.2 2.2 0 0 0 4 21.7z"/><path d="M20 5.2A2.2 2.2 0 0 0 17.8 3H13v16.5h4.8A2.2 2.2 0 0 1 20 21.7z"/></svg>',
    award: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="9" r="5.2"/><path d="M8.6 13.4 7 21l5-2.6L17 21l-1.6-7.6"/></svg>',
    job: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="7.2" width="18" height="12.8" rx="2.6"/><path d="M9 7.2V5.6A1.6 1.6 0 0 1 10.6 4h2.8A1.6 1.6 0 0 1 15 5.6v1.6"/><path d="M3 12.4h18"/></svg>',
    more: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h.01M12 12h.01M19 12h.01" stroke-width="2.6"/></svg>'
  };

  var state = {
    groups: [],      // [{ name, gi, items:[{id,title,icon}] }]
    sections: [],    // 扁平化
    curId: "",
    railHide: false
  };

  /* ======================================================================
     0. 从桌面导航反推章节结构（保证与 app3 的分组永远一致）
     ====================================================================== */
  function collect() {
    var groups = [];
    $$("#navlist .navgrp").forEach(function (g) {
      var name = g.getAttribute("data-g") || "目录";
      var items = $$(".navdrop a", g).map(function (a) {
        var i = a.querySelector("i");
        var icon = i ? (i.textContent || "").trim() : "•";
        var title = (a.textContent || "").replace(icon, "").trim() || a.getAttribute("data-id");
        return { id: a.getAttribute("data-id"), title: title, icon: icon };
      }).filter(function (x) { return x.id; });
      if (items.length) groups.push({ name: name, items: items });
    });

    // 兜底：导航没建出来时，退化为直接读页面 section
    if (!groups.length) {
      var items2 = $$("main section.blk").map(function (s) {
        var h = s.querySelector("h2");
        return { id: s.id, title: h ? h.textContent.trim() : s.id, icon: "•" };
      });
      if (items2.length) groups.push({ name: "目录", items: items2 });
    }

    state.groups = groups;
    state.sections = [];
    groups.forEach(function (g, gi) {
      g.gi = gi + 1;
      g.items.forEach(function (it) {
        it.g = g.name; it.gi = gi + 1;
        state.sections.push(it);
      });
    });
    return state.sections.length > 0;
  }

  function sectionById(id) {
    for (var i = 0; i < state.sections.length; i++) {
      if (state.sections[i].id === id) return state.sections[i];
    }
    return null;
  }

  /* ======================================================================
     1. App Bar
     ====================================================================== */
  function buildAppBar() {
    var app = $(".topbar-in") || $(".topbar");
    if (!app) return;

    // 副标题
    var txt = $(".brandmark .txt");
    if (txt && !$(".bm-sub", txt)) {
      var sub = document.createElement("small");
      sub.className = "bm-sub";
      sub.textContent = "三年规划 · " + state.sections.length + " 节可执行方案";
      txt.appendChild(sub);
    }

    // 菜单键
    if (!$("#m4-menu")) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.id = "m4-menu";
      btn.className = "topact";
      btn.setAttribute("aria-label", "打开章节目录");
      btn.setAttribute("aria-expanded", "false");
      btn.innerHTML = ICON.menu;
      app.appendChild(btn);
    }

    // 章节胶囊轨
    if (!$("#m4-rail")) {
      var rail = document.createElement("div");
      rail.className = "mrail";
      rail.id = "m4-rail";
      var inner = document.createElement("div");
      inner.className = "mrail-in";
      inner.id = "m4-rail-in";
      inner.innerHTML = state.sections.map(function (s) {
        return '<a class="mchip" href="#' + esc(s.id) + '" data-id="' + esc(s.id) + '" data-gi="' + s.gi + '">' +
          '<span class="mch-i">' + esc(s.icon) + '</span>' + esc(s.title) + '</a>';
      }).join("");
      rail.appendChild(inner);
      var bar = $(".topbar");
      if (bar) bar.appendChild(rail);
    }
  }

  /* ======================================================================
     2. 底部标签栏
     ====================================================================== */
  var TABS = [
    { k: "规划", label: "总览", icon: ICON.grid },
    { k: "学习", label: "学习", icon: ICON.book },
    { k: "考证", label: "考证", icon: ICON.award },
    { k: "就业", label: "就业", icon: ICON.job },
    { k: "sheet", label: "目录", icon: ICON.more }
  ];

  function buildTabs() {
    var mn = $("#mnav");
    if (!mn) return;
    mn.innerHTML = TABS.map(function (t) {
      if (t.k === "sheet") {
        return '<button class="mtab" type="button" data-tab="sheet" aria-label="打开全部章节">' +
          t.icon + '<span>' + t.label + '</span></button>';
      }
      var g = state.groups.filter(function (x) { return x.name === t.k; })[0];
      var href = g && g.items.length ? "#" + g.items[0].id : "#s-overview";
      return '<a class="mtab" href="' + href + '" data-tab="' + esc(t.k) + '">' +
        t.icon + '<span>' + t.label + '</span></a>';
    }).join("");
  }

  /* ======================================================================
     3. 目录抽屉
     ====================================================================== */
  var sheetEls = { wrap: null, sheet: null, x: null, lastFocus: null };

  function buildSheet() {
    if ($("#m4-sheet")) return;
    var total = state.sections.length;
    var idx = 0;

    var body = state.groups.map(function (g) {
      return '<div class="msheet-g">' +
        '<div class="msheet-gt mgx-' + g.gi + '"><i></i>' + esc(g.name) +
        '<span class="mg-n">' + g.items.length + ' 节</span></div>' +
        g.items.map(function (it) {
          idx++;
          return '<a class="msheet-it" href="#' + esc(it.id) + '" data-id="' + esc(it.id) + '">' +
            '<span class="si-ico">' + esc(it.icon) + '</span>' +
            '<span class="si-t">' + esc(it.title) + '</span>' +
            '<span class="si-n">' + (idx < 10 ? "0" + idx : idx) + '</span></a>';
        }).join("") +
        '</div>';
    }).join("");

    var wrap = document.createElement("div");
    wrap.className = "msheet-wrap";
    wrap.id = "m4-sheet";
    wrap.setAttribute("aria-hidden", "true");
    wrap.innerHTML =
      '<div class="msheet-bd" data-m4-close="1"></div>' +
      '<div class="msheet" role="dialog" aria-modal="true" aria-label="全部章节" tabindex="-1">' +
      '<div class="msheet-grab" id="m4-grab"><i></i></div>' +
      '<div class="msheet-h"><b>全部章节</b><span>' + total + ' 节 · ' + state.groups.length + ' 个模块</span>' +
      '<button class="msheet-x" type="button" aria-label="关闭">✕</button></div>' +
      '<div class="msheet-b">' + body + '</div>' +
      '</div>';
    document.body.appendChild(wrap);

    sheetEls.wrap = wrap;
    sheetEls.sheet = $(".msheet", wrap);
    sheetEls.x = $(".msheet-x", wrap);

    wrap.addEventListener("click", function (e) {
      if (e.target.closest("[data-m4-close]")) closeSheet();
    });
    sheetEls.x.addEventListener("click", closeSheet);

    // 点章节 → 关闭抽屉，交给默认锚点滚动
    $$(".msheet-it", wrap).forEach(function (a) {
      a.addEventListener("click", function () { closeSheet(true); });
    });

    bindSheetDrag();
  }

  function openSheet() {
    if (!sheetEls.wrap) return;
    sheetEls.lastFocus = document.activeElement;
    sheetEls.wrap.classList.add("show");
    sheetEls.wrap.setAttribute("aria-hidden", "false");
    document.body.classList.add("sheet-open");
    var b = $("#m4-menu");
    if (b) b.setAttribute("aria-expanded", "true");
    setTimeout(function () {
      if (sheetEls.sheet && sheetEls.sheet.focus) {
        try { sheetEls.sheet.focus({ preventScroll: true }); } catch (e) {}
      }
    }, 240);
  }

  function closeSheet(instant) {
    if (!sheetEls.wrap || !sheetEls.wrap.classList.contains("show")) return;
    sheetEls.wrap.classList.remove("show");
    sheetEls.wrap.setAttribute("aria-hidden", "true");
    document.body.classList.remove("sheet-open");
    var b = $("#m4-menu");
    if (b) b.setAttribute("aria-expanded", "false");
    if (instant !== true && sheetEls.lastFocus && sheetEls.lastFocus.focus) {
      try { sheetEls.lastFocus.focus({ preventScroll: true }); } catch (e) {}
    }
  }

  function bindSheetDrag() {
    var sheet = sheetEls.sheet;
    if (!sheet || !window.PointerEvent) return;
    var startY = 0, dy = 0, on = false;

    function down(e) {
      if (e.target.closest(".msheet-x")) return;
      on = true; startY = e.clientY; dy = 0;
      sheet.classList.add("dragging");
      try { sheet.setPointerCapture(e.pointerId); } catch (err) {}
    }
    function move(e) {
      if (!on) return;
      dy = Math.max(0, e.clientY - startY);
      sheet.style.transform = "translateY(" + dy + "px)";
    }
    function up() {
      if (!on) return;
      on = false;
      sheet.classList.remove("dragging");
      if (dy > 96) {
        sheet.style.transition = "transform .22s cubic-bezier(.22,1,.36,1)";
        sheet.style.transform = "translateY(100%)";
        setTimeout(function () {
          closeSheet(true);
          sheet.style.transition = "";
          sheet.style.transform = "";
        }, 220);
      } else {
        sheet.style.transform = "";
      }
      dy = 0;
    }

    ["pointerdown", "pointermove", "pointerup", "pointercancel"].forEach(function (t) {
      var h = t === "pointerdown" ? down : t === "pointermove" ? move : up;
      $(".msheet-h").addEventListener(t, h);
      $("#m4-grab").addEventListener(t, h);
    });
  }

  /* ======================================================================
     4. 滚动引擎（单一 rAF 节流）
     ====================================================================== */
  var tickPending = false;
  var lastY = 0;

  function topOffset() {
    var bar = $(".topbar");
    return bar ? bar.getBoundingClientRect().height : 56;
  }

  function syncOffset() {
    var h = Math.round(topOffset());
    document.documentElement.style.setProperty("--m4-off", (h + 12) + "px");
  }

  function setRail(hide) {
    if (state.railHide === hide) return;
    state.railHide = hide;
    var bar = $(".topbar");
    if (bar) bar.classList.toggle("railhide", hide);
    syncOffset();
  }

  function tick() {
    tickPending = false;
    var y = window.pageYOffset || document.documentElement.scrollTop || 0;

    // 当前章节
    var probe = topOffset() + 16;
    var cur = state.sections.length ? state.sections[0].id : "";
    for (var i = 0; i < state.sections.length; i++) {
      var el = document.getElementById(state.sections[i].id);
      if (el && el.getBoundingClientRect().top <= probe) cur = state.sections[i].id;
    }

    if (cur && cur !== state.curId) {
      state.curId = cur;
      paint(cur);
    }

    // 胶囊轨收起/展开
    var d = y - lastY;
    if (y < 180) setRail(false);
    else if (d > 8) setRail(true);
    else if (d < -8) setRail(false);
    lastY = y;
  }

  function onScroll() {
    if (tickPending) return;
    tickPending = true;
    raf(tick);
  }

  function paint(id) {
    var s = sectionById(id);
    if (!s) return;

    // 底部标签栏
    var key = (s.g === "工具" || s.g === "问答") ? "sheet" : s.g;
    $$(".mtab").forEach(function (t) {
      t.classList.toggle("on", t.getAttribute("data-tab") === key);
    });

    // 胶囊轨居中
    var rail = $("#m4-rail-in");
    var chip = rail ? $('.mchip[data-id="' + id + '"]', rail) : null;
    if (rail && chip && !railTouching) {
      var left = chip.offsetLeft - (rail.clientWidth - chip.offsetWidth) / 2;
      left = Math.max(0, Math.min(left, rail.scrollWidth - rail.clientWidth));
      try {
        if (rail.scrollTo) rail.scrollTo({ left: left, behavior: REDUCED ? "auto" : "smooth" });
        else rail.scrollLeft = left;
      } catch (e) { rail.scrollLeft = left; }
    }

    // 抽屉高亮
    var items = $$(".msheet-it");
    if (items.length) {
      items.forEach(function (a) { a.classList.toggle("on", a.getAttribute("data-id") === id); });
    }
  }

  var railTouching = false;
  function bindRailTouch() {
    var rail = $("#m4-rail-in");
    if (!rail) return;
    rail.addEventListener("touchstart", function () { railTouching = true; }, { passive: true });
    rail.addEventListener("touchend", function () {
      setTimeout(function () { railTouching = false; }, 900);
    }, { passive: true });
  }

  /* ======================================================================
     5. 表格卡片化
     ====================================================================== */
  function enhanceTables() {
    $$("table").forEach(function (tb) {
      if (tb.classList.contains("tb-card")) return;
      var thead = tb.querySelector("thead tr");
      if (!thead) return;
      var labels = [];
      Array.prototype.forEach.call(thead.children, function (th) {
        var span = parseInt(th.getAttribute("colspan") || "1", 10) || 1;
        for (var k = 0; k < span; k++) labels.push((th.textContent || "").trim());
      });
      if (!labels.length) return;

      var rows = tb.querySelectorAll("tbody tr");
      if (!rows.length) return;

      Array.prototype.forEach.call(rows, function (tr) {
        var cells = tr.children, col = 0, tdCount = 0;
        for (var i = 0; i < cells.length; i++) {
          var c = cells[i];
          var span = parseInt(c.getAttribute("colspan") || "1", 10) || 1;
          if (c.tagName === "TD") {
            tdCount++;
            if (!c.hasAttribute("data-label")) {
              c.setAttribute("data-label", labels[col] || "");
            }
          }
          col += span;
        }
        if (tdCount === 1 && cells.length === 1 && col >= labels.length) {
          tr.classList.add("tb-span");
        }
      });

      tb.classList.add("tb-card");
      var box = tb.parentNode;
      if (box && box.classList && box.classList.contains("tbox")) box.classList.add("tbox-card");
    });
  }

  function watchTables() {
    var main = $("main");
    if (!main || !window.MutationObserver) return;
    var timer = 0;
    var mo = new MutationObserver(function () {
      if (timer) clearTimeout(timer);
      timer = setTimeout(enhanceTables, 220);
    });
    mo.observe(main, { childList: true, subtree: true });
  }

  /* ======================================================================
     6. Hero 网络星图（纯 SVG）
     ====================================================================== */
  var NET_NODES = [
    [318, 34], [392, 62], [268, 78], [344, 116], [420, 108], [236, 132],
    [300, 158], [376, 168], [196, 168], [132, 120], [164, 206], [252, 214],
    [332, 224], [408, 206], [92, 214], [300, 268], [392, 270]
  ];
  var NET_EDGES = [
    [0, 1], [0, 2], [1, 3], [2, 3], [3, 4], [2, 5], [5, 6], [3, 6], [6, 7],
    [4, 7], [5, 8], [8, 9], [9, 10], [10, 11], [8, 11], [6, 11], [7, 12],
    [12, 13], [11, 12], [10, 14], [14, 15], [15, 16], [13, 16], [12, 15], [15, 11]
  ];

  function buildHeroNet() {
    var hero = $(".hero");
    if (!hero || $(".hero-net", hero)) return;

    var edges = NET_EDGES.map(function (e) {
      var a = NET_NODES[e[0]], b = NET_NODES[e[1]];
      return '<line class="hn-edge" x1="' + a[0] + '" y1="' + a[1] + '" x2="' + b[0] + '" y2="' + b[1] + '"/>';
    }).join("");

    var nodes = NET_NODES.map(function (n, i) {
      var core = (i === 0 || i === 8 || i === 11 || i === 13);
      return '<circle class="hn-node' + (core ? " core" : "") + '" cx="' + n[0] + '" cy="' + n[1] + '" r="' + (core ? 3.4 : 2.2) + '"/>';
    }).join("");

    var pulses = [0, 8, 13].map(function (i, k) {
      return '<circle class="hn-pulse" cx="' + NET_NODES[i][0] + '" cy="' + NET_NODES[i][1] + '" r="4" ' +
        'style="animation-delay:' + (k * 1.6) + 's"/>';
    }).join("");

    var svg = '<svg class="hero-net" viewBox="0 0 460 300" aria-hidden="true" focusable="false" ' +
      'preserveAspectRatio="xMaxYMin meet">' + edges + nodes + pulses + '</svg>';

    hero.insertAdjacentHTML("afterbegin", svg);
  }

  /* ======================================================================
     7. 数字滚动
     ====================================================================== */
  function countUp(node) {
    var t = node.firstChild;
    if (!t || t.nodeType !== 3) return;
    var raw = t.nodeValue;
    var m = raw.match(/^(\D*?)(\d+(?:\.\d+)?)([\s\S]*)$/);
    if (!m) return;
    var pre = m[1], target = parseFloat(m[2]), post = m[3];
    if (!isFinite(target) || target <= 0) return;
    if (target < 20) return;        // 小数字动画无意义，且万一动画不执行会停在 0
    var dec = (m[2].split(".")[1] || "").length;
    var dur = target >= 60 ? 1100 : 760;
    var t0 = 0;

    function step(ts) {
      if (!t0) t0 = ts;
      var p = Math.min(1, (ts - t0) / dur);
      var e = 1 - Math.pow(1 - p, 3);
      var v = target * e;
      t.nodeValue = pre + (dec ? v.toFixed(dec) : Math.round(v)) + post;
      if (p < 1) raf(step);
      else t.nodeValue = pre + (dec ? target.toFixed(dec) : Math.round(target)) + post;
    }
    t.nodeValue = pre + (dec ? (0).toFixed(dec) : 0) + post;
    raf(step);
    setTimeout(function () {          // 兜底：动画被节流/中断时也能落到正确数值
      t.nodeValue = pre + (dec ? target.toFixed(dec) : Math.round(target)) + post;
    }, dur + 500);
  }

  function initCounters() {
    if (REDUCED || !window.IntersectionObserver) return;
    var nodes = $$(".kpi .k-val, .cd .cd-n");
    if (!nodes.length) return;
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) {
        if (en.isIntersecting) {
          io.unobserve(en.target);
          countUp(en.target);
        }
      });
    }, { threshold: 0.4 });
    nodes.forEach(function (n) { io.observe(n); });
  }

  /* ======================================================================
     8. 章节头部增强：图标砖 + 编号徽标
     ====================================================================== */
  function enhanceHeads() {
    state.sections.forEach(function (s) {
      var sec = document.getElementById(s.id);
      if (!sec) return;
      sec.classList.add("mg-" + s.gi);

      var head = sec.querySelector(".sec-head");
      if (!head || head.querySelector(".sec-meta")) return;

      var eb = head.querySelector(".eyebrow");
      if (eb && !eb.querySelector("b")) {
        var mm = (eb.textContent || "").match(/^\s*(\d+)\s*[\/｜]\s*(.+)$/);
        if (mm) eb.innerHTML = "<b>" + esc(mm[1]) + "</b><i>" + esc(mm[2].trim()) + "</i>";
      }

      var meta = document.createElement("div");
      meta.className = "sec-meta";
      var ico = document.createElement("span");
      ico.className = "sec-ico";
      ico.setAttribute("aria-hidden", "true");
      ico.textContent = s.icon;
      meta.appendChild(ico);
      if (eb && eb.parentNode === head) meta.appendChild(eb);
      head.insertBefore(meta, head.firstChild);
    });
  }

  /* ======================================================================
     9. 主题色 + Hero 入场
     ====================================================================== */
  function syncThemeColor() {
    var dark = document.documentElement.getAttribute("data-theme") === "dark";
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", dark ? "#0a1120" : "#f4f6fb");
  }

  function watchTheme() {
    syncThemeColor();
    if (!window.MutationObserver) return;
    new MutationObserver(syncThemeColor).observe(document.documentElement, {
      attributes: true, attributeFilter: ["data-theme"]
    });
  }

  function initHeroAnim() {
    var wrap = $(".hero > .wrap");
    if (!wrap || REDUCED) return;
    wrap.classList.add("hero-anim");
    // 动画跑完后摘掉类：即使动画被系统节流/跳过，内容也一定可见
    setTimeout(function () { wrap.classList.remove("hero-anim"); }, 1800);
  }

  /* ======================================================================
     10. 启动
     ====================================================================== */
  function wire() {
    // 菜单键
    var menu = $("#m4-menu");
    if (menu) menu.addEventListener("click", openSheet);

    // 标签栏「目录」
    var mn = $("#mnav");
    if (mn) {
      mn.addEventListener("click", function (e) {
        var b = e.target.closest('[data-tab="sheet"]');
        if (b) {
          e.preventDefault();
          openSheet();
        }
      });
    }

    // 全局：Esc 关闭
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" || e.keyCode === 27) closeSheet();
    });

    bindRailTouch();

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", function () {
      syncOffset();
      onScroll();
    });
    if (mq && mq.addEventListener) {
      mq.addEventListener("change", function () {
        closeSheet(true);
        setRail(false);
        syncOffset();
      });
    }
  }

  function boot() {
    if (!collect()) return;

    buildAppBar();
    buildTabs();
    buildSheet();
    enhanceHeads();
    buildHeroNet();
    enhanceTables();
    watchTables();
    initCounters();
    initHeroAnim();
    watchTheme();

    wire();
    syncOffset();
    onScroll();

    // 首屏若因字体/图片加载导致高度变化，补一次
    setTimeout(function () { syncOffset(); onScroll(); }, 320);
    window.addEventListener("load", function () { syncOffset(); onScroll(); }, { once: true });
  }

  /* 等 app3 把分组导航建好（最多约 12 帧） */
  function ready(n) {
    if (collect()) { boot(); return; }
    if (n > 12) { boot(); return; }
    raf(function () { ready(n + 1); });
  }

  function start() { ready(0); }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
