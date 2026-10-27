/* ============================================================
   app6.js —— 欧洲发展路线：渲染与交互
   依赖 data5.js（window.APP5）
   ============================================================ */
(function () {
  "use strict";

  var A5 = window.APP5;
  if (!A5) return;

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  var LS_KEY = "net3_eu_progress_v1";
  var state = { stage: 0, done: {} };
  var hasSavedStage = false;

  /* ================= 本地存储（失败不报错） ================= */
  function loadState() {
    try {
      var raw = window.localStorage.getItem(LS_KEY);
      if (!raw) return;
      var o = JSON.parse(raw);
      if (o && typeof o === "object") {
        if (o.done && typeof o.done === "object") state.done = o.done;
        if (typeof o.stage === "number" && o.stage >= 0 && o.stage < A5.STAGES.length) {
          state.stage = o.stage;
          hasSavedStage = true;
        }
      }
    } catch (e) { /* 隐私模式 / 配额满，静默降级 */ }
  }

  function saveState() {
    try {
      window.localStorage.setItem(LS_KEY, JSON.stringify({ done: state.done, stage: state.stage }));
    } catch (e) { /* 同上 */ }
  }

  /* ================= 1. 阶段指示器 ================= */
  function guessStage() {
    var d = new Date();
    var t = d.getFullYear() + d.getMonth() / 12;
    if (t < 2029.42) return 0;   // 2029.06 之前：在校
    if (t < 2031.67) return 1;   // 2029.07 — 2031.08：工作
    if (t < 2032.50) return 2;   // 2031.09 — 2032.06：投递
    return 3;                    // 2032.07 之后：落地
  }

  function renderSteps() {
    var bar = $("#eu-steps");
    if (!bar) return;

    bar.innerHTML = A5.STAGES.map(function (s, i) {
      var cls = i === state.stage ? " on" : (i < state.stage ? " done" : "");
      return '<button class="eu-st' + cls + '" type="button" data-eu-stage="' + i + '"' +
        ' aria-current="' + (i === state.stage ? "step" : "false") + '">' +
        '<span class="eu-dot">' + (i < state.stage ? "✓" : (i + 1)) + '</span>' +
        '<span class="eu-st-t">' + esc(s.t) + '</span>' +
        '<span class="eu-st-s">' + esc(s.sub) + '</span>' +
        '</button>';
    }).join("");

    $$("[data-eu-stage]", bar).forEach(function (b) {
      b.addEventListener("click", function () {
        state.stage = parseInt(b.getAttribute("data-eu-stage"), 10) || 0;
        renderSteps();
        renderStagePanel();
        saveState();
      });
    });
  }

  function renderStagePanel() {
    var box = $("#eu-stage");
    if (!box) return;
    var s = A5.STAGES[state.stage] || A5.STAGES[0];

    box.innerHTML =
      '<div class="eu-stage-h">' +
        '<b>' + esc(s.t) + ' · ' + esc(s.where) + '</b>' +
        '<small>' + esc(s.sub) + '</small>' +
      '</div>' +
      '<div class="eu-stage-b">' +
        '<div class="eu-stage-goal"><b>这一阶段只有一个目标：</b>' + esc(s.goal) + '</div>' +
        '<ul class="eu-stage-list">' +
          s.must.map(function (m) { return "<li>" + esc(m) + "</li>"; }).join("") +
        '</ul>' +
        '<div class="eu-stage-warn"><b>最容易踩的坑</b>' + esc(s.warn) + '</div>' +
      '</div>';
  }

  /* ================= 2. 准备清单 + 进度 ================= */
  function renderPrep() {
    var box = $("#eu-prep");
    if (!box) return;

    box.innerHTML = A5.PREP.map(function (p, i) {
      var on = !!state.done["p" + i];
      return '<div class="eu-check' + (on ? " done" : "") + '" data-eu-item="p' + i + '">' +
        '<label class="eu-check-l">' +
          '<input type="checkbox" data-eu-chk="p' + i + '"' + (on ? " checked" : "") + '>' +
          '<span class="eu-box" aria-hidden="true"></span>' +
          '<span class="eu-check-txt">' +
            '<b><span class="eu-gtag">' + esc(p.g) + '</span>' + esc(p.t) +
              (p.hard ? '<span class="eu-hard">有难度</span>' : '') + '</b>' +
            '<p>' + esc(p.d) + '</p>' +
            '<span class="eu-out">交付：' + esc(p.out) + '</span>' +
            '<span class="eu-when">' + esc(p.when) + '</span>' +
          '</span>' +
        '</label>' +
      '</div>';
    }).join("");

    $$("[data-eu-chk]", box).forEach(function (c) {
      c.addEventListener("change", function () {
        var k = c.getAttribute("data-eu-chk");
        if (c.checked) state.done[k] = 1; else delete state.done[k];
        var wrap = c.closest(".eu-check");
        if (wrap) wrap.classList.toggle("done", c.checked);
        updateProgress();
        saveState();
      });
    });

    updateProgress();
  }

  function updateProgress() {
    var total = A5.PREP.length;
    var n = 0;
    for (var k in state.done) {
      if (Object.prototype.hasOwnProperty.call(state.done, k) && state.done[k]) n++;
    }
    if (n > total) n = total;
    var pct = total ? Math.round((n / total) * 100) : 0;

    var ring = $("#eu-ring");
    if (ring) {
      ring.style.setProperty("--p", pct);
      var t = $("#eu-ring-t");
      if (t) t.textContent = pct + "%";
    }
    var txt = $("#eu-prog-txt");
    if (txt) {
      txt.innerHTML = "<b>" + n + " / " + total + " 项已交付</b>" +
        "<small>" +
        (pct === 100
          ? "准备清单全部完成。下一步是按「证书路线图」逐张拿下，同时开始投递。"
          : "勾选标准是「有可验证的产出」，不是「看完了教程」。没有交付物就不算完成。") +
        "</small>";
    }
  }

  function bindReset() {
    var btn = $("#eu-reset");
    if (!btn) return;
    btn.addEventListener("click", function () {
      state.done = {};
      saveState();
      renderPrep();
    });
  }

  /* ================= 3. 证书路线图 ================= */
  function tierCls(t) {
    if (t.indexOf("必考") === 0) return "must";
    if (t.indexOf("强烈建议") === 0) return "rec";
    if (t.indexOf("国内向") === 0) return "dom";
    return "opt";
  }

  function star(n) {
    var h = "";
    for (var i = 1; i <= 5; i++) h += '<i class="' + (i <= n ? "on" : "") + '">★</i>';
    return '<span class="eu-star" title="难度 ' + n + ' / 5" aria-label="难度 ' + n + ' 星">' + h + '</span>';
  }

  function euBars(n) {
    var h = "";
    for (var i = 1; i <= 5; i++) h += '<i class="' + (i <= n ? "on" : "") + '"></i>';
    return '<span class="eu-eu">欧洲认可<b class="eu-eu-bars">' + h + '</b></span>';
  }

  function renderCerts() {
    var box = $("#eu-certs");
    if (!box) return;

    box.innerHTML = A5.CERTS.map(function (c, i) {
      var cls = tierCls(c.tier);
      return '<div class="eu-cert ' + cls + '">' +
        '<div class="eu-c-h" tabindex="0" role="button" aria-expanded="false">' +
          '<div class="eu-c-main">' +
            '<div class="eu-c-n"><b>' + esc(c.n) + '</b>' +
              '<span class="eu-tier ' + cls + '">' + esc(c.tier) + '</span>' +
              (c.code && c.code !== "—" ? '<code>' + esc(c.code) + '</code>' : '') +
            '</div>' +
            '<div class="eu-c-full">' + esc(c.full) + '</div>' +
            '<div class="eu-c-meta">' +
              star(c.star) +
              '<span>备考 ' + esc(c.months) + '</span>' +
              '<span>' + esc(c.cost) + '</span>' +
              euBars(c.eu) +
            '</div>' +
          '</div>' +
          '<span class="eu-c-c" aria-hidden="true"></span>' +
        '</div>' +
        '<div class="eu-c-b">' +
          '<p class="eu-c-why">' + esc(c.why) + '</p>' +
          '<dl class="eu-c-dl">' +
            '<dt>考什么</dt><dd>' + esc(c.content) + '</dd>' +
            '<dt>有效期</dt><dd>' + esc(c.valid) + '</dd>' +
            '<dt class="w">注意</dt><dd class="w">' + esc(c.note) + '</dd>' +
          '</dl>' +
          '<div class="eu-c-ms"><b>过关标准（不是考试分数，是你能不能做出来）</b>' + esc(c.milestone) + '</div>' +
        '</div>' +
      '</div>';
    }).join("");

    $$(".eu-c-h", box).forEach(function (h) {
      function toggle() {
        var card = h.closest(".eu-cert");
        var on = card.classList.toggle("open");
        h.setAttribute("aria-expanded", on ? "true" : "false");
      }
      h.addEventListener("click", toggle);
      h.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " " || e.keyCode === 13 || e.keyCode === 32) {
          e.preventDefault(); toggle();
        }
      });
    });
  }

  /* ================= 4. 目标岗位 ================= */
  function renderRoles() {
    var box = $("#eu-roles");
    if (!box) return;
    box.innerHTML = A5.ROLES.map(function (r) {
      var cls = r.fit >= 5 ? "p-ok" : r.fit >= 4 ? "p-brand" : "p-warn";
      return '<div class="card"><div class="card-b">' +
        '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;flex-wrap:wrap">' +
          '<b style="font-size:14px;font-weight:820;color:var(--ink)">' + esc(r.n) + '</b>' +
          '<span class="pill ' + cls + '">契合度 ' + r.fit + '/5</span>' +
        '</div>' +
        '<div style="font-size:11.2px;color:var(--muted-2);margin-bottom:7px">' + esc(r.en) + '</div>' +
        '<div style="font-size:12.5px;line-height:1.7;color:var(--ink-2);margin-bottom:6px">' + esc(r.why) + '</div>' +
        '<div style="font-size:12px;line-height:1.65;color:var(--ok);margin-bottom:4px"><b>攒得到：</b>' + esc(r.gain) + '</div>' +
        '<div style="font-size:12px;line-height:1.65;color:var(--danger)"><b>要避开：</b>' + esc(r.risk) + '</div>' +
        '<div style="font-size:11.2px;color:var(--muted-2);margin-top:6px">搜索词：' + esc(r.kv) + '</div>' +
      '</div></div>';
    }).join("");

    var kw = $("#eu-kw");
    if (kw) {
      kw.innerHTML = A5.KEYWORDS.map(function (k) {
        return '<span class="eu-kw"><b>' + esc(k.de) + '</b>' +
          '<span>' + esc(k.en) + ' · ' + esc(k.cn) + '</span></span>';
      }).join("");
    }

    var ch = $("#eu-channels");
    if (ch) {
      ch.innerHTML = A5.CHANNELS.map(function (c) {
        return '<div class="eu-ch">' +
          '<b>' + esc(c.n) + '<small>' + esc(c.area) + '</small></b>' +
          '<p>' + esc(c.note) + '</p>' +
          '<span class="pill ' + (c.v >= 5 ? "p-ok" : c.v >= 4 ? "p-brand" : "p-gray") + '">' +
            (c.v >= 5 ? "必用" : c.v >= 4 ? "常用" : "补充") + '</span>' +
        '</div>';
      }).join("");
    }
  }

  /* ================= 5. 签证 / 国家 / 时间轴 ================= */
  function renderVisas() {
    var box = $("#eu-visas");
    if (!box) return;
    box.innerHTML = A5.VISAS.map(function (v) {
      return '<div class="eu-visa' + (v.best ? " best" : "") + '">' +
        '<div class="eu-visa-h">' +
          '<b>' + esc(v.n) + '</b>' +
          '<span class="eu-visa-flag">' + esc(v.country) + '</span>' +
          (v.best ? '<span class="eu-visa-best">推荐路径</span>' : '') +
        '</div>' +
        '<div class="eu-visa-grid">' +
          '<div class="eu-vg' + (v.best ? " key" : "") + '"><em>薪资门槛</em><span>' + esc(v.salary) + '</span></div>' +
          '<div class="eu-vg"><em>学历要求</em><span>' + esc(v.need) + '</span></div>' +
          '<div class="eu-vg"><em>经验要求</em><span>' + esc(v.exp) + '</span></div>' +
          '<div class="eu-vg"><em>合同 / 担保</em><span>' + esc(v.contract) + '</span></div>' +
          '<div class="eu-vg"><em>语言</em><span>' + esc(v.lang) + '</span></div>' +
        '</div>' +
        '<div class="eu-visa-note">' + esc(v.note) + '</div>' +
      '</div>';
    }).join("");
  }

  function renderCountries() {
    var box = $("#eu-countries");
    if (!box) return;
    box.innerHTML = A5.COUNTRIES.map(function (c) {
      return '<div class="eu-cty">' +
        '<div class="eu-cty-h">' +
          '<b>' + esc(c.n) + '</b>' +
          '<span class="eu-cty-f">' + esc(c.f) + '</span>' +
          '<span class="eu-cty-fit">' + esc(c.fit) + '</span>' +
        '</div>' +
        '<div class="eu-cty-row"><em>签证门槛</em>' + esc(c.money) + '</div>' +
        '<div class="eu-cty-row"><em>语言</em>' + esc(c.lang) + '</div>' +
        '<div class="eu-cty-row p"><em>优势</em>' + esc(c.pro) + '</div>' +
        '<div class="eu-cty-row c"><em>代价</em>' + esc(c.con) + '</div>' +
      '</div>';
    }).join("");
  }

  function renderTimeline() {
    var box = $("#eu-tl");
    if (!box) return;
    box.innerHTML = A5.TIMELINE.map(function (t) {
      return '<div class="tl-item">' +
        '<div class="t-when">' + esc(t.y) + '</div>' +
        '<div class="t-title">' + esc(t.t) + ' · <span style="color:var(--brand)">' + esc(t.k) + '</span></div>' +
        '<p class="t-desc">' + esc(t.d) + '</p>' +
        '<div style="margin-top:5px;font-size:11.5px;color:var(--ok);background:var(--ok-soft);display:inline-block;padding:3px 9px;border-radius:6px">' +
          '产出：' + esc(t.out) +
        '</div>' +
      '</div>';
    }).join("");
  }

  function renderCosts() {
    var body = $("#eu-costs");
    if (!body) return;
    body.innerHTML = A5.COSTS.map(function (c) {
      return '<tr><td>' + esc(c.n) + (c.must ? ' <span class="pill p-danger" style="font-size:9.5px">必花</span>' : '') + '</td>' +
        '<td style="font-variant-numeric:tabular-nums">' + esc(c.v) + '</td>' +
        '<td style="color:var(--muted);font-size:12px">' + esc(c.when) + '</td></tr>';
    }).join("");
  }

  function renderRisks() {
    var box = $("#eu-risks");
    if (!box) return;
    box.innerHTML = A5.RISKS.map(function (r) {
      var lv = r.lv === "高" ? "h" : r.lv === "中" ? "m" : "l";
      return '<div class="eu-risk">' +
        '<div class="eu-risk-h">' +
          '<span class="eu-risk-lv ' + lv + '">' + esc(r.lv) + '风险</span>' +
          '<b>' + esc(r.t) + '</b>' +
        '</div>' +
        '<p>' + esc(r.d) + '</p>' +
        '<div class="fix"><b>对策</b>' + esc(r.fix) + '</div>' +
      '</div>';
    }).join("");
  }

  function renderFactCheck() {
    var box = $("#eu-fc");
    if (!box) return;
    box.innerHTML = A5.FACTCHECK.map(function (f) {
      return '<div class="eu-fc ' + esc(f.tone) + '">' +
        '<div class="eu-fc-h">' +
          '<div class="eu-fc-q">' + esc(f.claim) + '</div>' +
          '<span class="eu-fc-v">' + esc(f.verdict) + '</span>' +
        '</div>' +
        '<div class="eu-fc-real">' + esc(f.real) + '</div>' +
        '<div class="eu-fc-fix">' + esc(f.fix) + '</div>' +
      '</div>';
    }).join("");

    var note = $("#eu-note");
    if (note) note.innerHTML = A5.NOTE;
  }

  /* ================= 启动 ================= */
  function boot() {
    loadState();
    if (!hasSavedStage) state.stage = guessStage();   // 首次访问：按当前日期推断所处阶段

    renderSteps();
    renderStagePanel();
    renderPrep();
    bindReset();
    renderCerts();
    renderRoles();
    renderVisas();
    renderCountries();
    renderTimeline();
    renderCosts();
    renderRisks();
    renderFactCheck();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
