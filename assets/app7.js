/* ============================================================
   app7.js —— 全球落点国家排行（渲染 + 可调权重 + 双时点）
   依赖 data6.js（window.APPGL）
   ============================================================ */
(function () {
  "use strict";

  var G = window.APPGL;
  if (!G) return;

  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  var KEY = "net3_gl_view_v1";
  var state = {
    mode: "now",           // now | after3
    preset: "now",
    w: { access: 35, jobs: 15, pay: 15, pr: 20, lang: 10, risk: 5 }
  };

  /* ---------- 持久化（隐私模式静默降级） ---------- */
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify({ mode: state.mode, preset: state.preset, w: state.w })); } catch (e) {}
  }
  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return;
      var o = JSON.parse(raw);
      if (o && o.w && typeof o.w.access === "number") {
        state.w = o.w;
        state.mode = o.mode === "after3" ? "after3" : "now";
        state.preset = o.preset || "custom";
      }
    } catch (e) {}
  }

  /* ---------- 算分 ---------- */
  function score(c, mode, w) {
    var s = mode === "now" ? c.s : c.s3;
    var sum = 0, tot = 0;
    for (var i = 0; i < G.DIMS.length; i++) {
      var k = G.DIMS[i].k;
      sum += s[k] * w[k];
      tot += w[k];
    }
    if (!tot) return 0;
    return Math.round((sum / tot) * 10 * 10) / 10;
  }
  function ranked(mode, w) {
    return G.C.map(function (c) {
      return { c: c, v: score(c, mode, w) };
    }).sort(function (a, b) { return b.v - a.v; });
  }

  /* ---------- 结论卡 ---------- */
  function renderHero() {
    var box = $("#gl-hero");
    if (!box) return;
    var now = ranked("now", { access: 35, jobs: 15, pay: 15, pr: 20, lang: 10, risk: 5 });
    var a3 = ranked("after3", { access: 35, jobs: 15, pay: 15, pr: 20, lang: 10, risk: 5 });
    var top = now[0], top3 = a3[0];
    var vnNow = now.filter(function (x) { return x.c.id === "vn"; })[0];
    var vn3 = a3.filter(function (x) { return x.c.id === "vn"; })[0];
    var vnRankNow = now.map(function (x) { return x.c.id; }).indexOf("vn") + 1;
    var vnRank3 = a3.map(function (x) { return x.c.id; }).indexOf("vn") + 1;

    box.innerHTML =
      '<div class="gl-hero-in">' +
        '<div class="gl-hero-h">先看结论，再看表格</div>' +
        '<div class="gl-hero-body">' +
          '<p><b>你现在（2026，在校、无经验）最优落点是 <em>' + esc(top.c.flag + " " + top.c.name) + '</em>，' + top.v.toFixed(1) + ' 分。</b>' +
          '元宝把越南排第一（86 分），但它漏了一条法规：越南工作许可要求「本科 + 3 年经验」或「1 年技术培训 + 3 年经验」，专科应届两个都不满足，' +
          '能去的只有商务签打黑工。所以在你的实际条件下，越南现在是第 ' + vnRankNow + ' 名（' + vnNow.v.toFixed(1) + ' 分）。</p>' +
          '<p>但三年之后，同一张表会翻过来：越南从第 ' + vnRankNow + ' 名升到第 ' + vnRank3 + ' 名（' + vnNow.v.toFixed(1) + ' → ' + vn3.v.toFixed(1) + ' 分），' +
          '因为那时候你已经有了它唯一缺的东西——3 年经验。<b>所以「哪个国家好」这个问题本身问错了，正确的问题是「我现在这个状态，哪条路走得通」。</b></p>' +
          '<p>另外两个被低估的：<em>日本</em>（元宝给 48 分）和<em>波兰</em>（元宝说「ICT 经验通道执行不稳」）。' +
          '日本有法务省 IT 告示，中国软考网络工程师直接免学历；波兰 2025 年 6 月修法后，ICT 职业组明文允许用 3 年经验顶替学位。这两条都是写在法条里的。</p>' +
        '</div>' +
        '<div class="gl-hero-kpi">' +
          '<div class="gl-kpi"><span>现在最优</span><b>' + esc(top.c.flag) + ' ' + esc(top.c.name) + '</b><i>' + top.v.toFixed(1) + '</i></div>' +
          '<div class="gl-kpi"><span>3 年后最优（还是它）</span><b>' + esc(top3.c.flag) + ' ' + esc(top3.c.name) + '</b><i>' + top3.v.toFixed(1) + '</i></div>' +
          '<div class="gl-kpi warn"><span>元宝排第 1 的越南</span><b>现在第 ' + vnRankNow + ' 名</b><i>' + vnNow.v.toFixed(1) + '</i></div>' +
        '</div>' +
      '</div>';
  }

  /* ---------- 权重面板 ---------- */
  function renderWeights() {
    var pbox = $("#gl-presets");
    var wbox = $("#gl-weights");
    var tbox = $("#gl-tabs");
    if (!pbox || !wbox || !tbox) return;

    pbox.innerHTML = G.PRESETS.map(function (p) {
      return '<button type="button" class="gl-pbtn' + (state.preset === p.id ? " on" : "") + '" data-p="' + p.id + '" title="' + esc(p.note) + '">' + esc(p.n) + '</button>';
    }).join("") + '<span class="gl-pnote" id="gl-pnote"></span>';

    wbox.innerHTML = G.DIMS.map(function (d) {
      return '<div class="gl-w">' +
        '<div class="gl-w-h"><b>' + esc(d.n) + '</b><span class="gl-w-v" data-v="' + d.k + '">' + state.w[d.k] + '%</span></div>' +
        '<input type="range" min="0" max="100" step="5" value="' + state.w[d.k] + '" data-k="' + d.k + '" aria-label="' + esc(d.n) + ' 权重">' +
        '<div class="gl-w-d">' + esc(d.d) + '</div>' +
        '</div>';
    }).join("");

    tbox.innerHTML =
      '<div class="gl-tabsw">' +
        '<button type="button" class="gl-tab' + (state.mode === "now" ? " on" : "") + '" data-m="now">现在（2026 在校）</button>' +
        '<button type="button" class="gl-tab' + (state.mode === "after3" ? " on" : "") + '" data-m="after3">2032（3 年经验后）</button>' +
      '</div>' +
      '<div class="gl-tabnote">同一批国家、同一套权重，只把你的「经验」这一项改掉，排名会明显不同。</div>';

    var note = $("#gl-pnote");
    if (note) {
      var p = G.PRESETS.filter(function (x) { return x.id === state.preset; })[0];
      note.textContent = p ? p.note : "自定义权重：你自己拖的，分数实时重算。";
    }
  }

  /* ---------- 小分条 ---------- */
  function bars(c, mode) {
    var s = mode === "now" ? c.s : c.s3;
    return '<div class="gl-bars">' + G.DIMS.map(function (d) {
      var v = s[d.k];
      return '<span class="gl-b" title="' + esc(d.n) + " " + v + '/10"><i style="height:' + Math.round(v * 10) + '%"></i></span>';
    }).join("") + '</div>';
  }

  /* ---------- 详情 ---------- */
  function detail(c, mode) {
    var s = mode === "now" ? c.s : c.s3;
    var stMap = { ok: ["✅ 官方已核", "ok"], est: ["⚠️ 区间估算", "warn"], todo: ["❓ 待核（执行前查官方）", "gray"] };

    var hard = c.hard.map(function (h) {
      var m = stMap[h.st] || stMap.est;
      return '<tr>' +
        '<td class="gl-hd-k">' + esc(h.k) + '<span class="gl-st ' + m[1] + '">' + m[0] + '</span></td>' +
        '<td class="gl-hd-v"><b>' + esc(h.v) + '</b></td>' +
        '<td class="gl-hd-n">' + esc(h.n) + '</td>' +
        '</tr>';
    }).join("");

    var dimRows = G.DIMS.map(function (d) {
      return '<div class="gl-dim"><span>' + esc(d.n) + '</span><i><b style="width:' + (s[d.k] * 10) + '%"></b></i><em>' + s[d.k] + '</em></div>';
    }).join("");

    return '<div class="gl-dt">' +
      '<div class="gl-dt-lead">' + esc(c.verdict) + '</div>' +

      '<div class="gl-dt-grid">' +
        '<div class="gl-dt-col">' +
          '<h5>① 法律依据</h5>' +
          '<div class="gl-law"><b>' + esc(c.law) + '</b><p>' + esc(c.lawNote) + '</p></div>' +
          '<h5>② 硬门槛（逐条）</h5>' +
          '<div class="tbox"><table class="tb gl-hd"><tbody>' + hard + '</tbody></table></div>' +
        '</div>' +
        '<div class="gl-dt-col">' +
          '<h5>③ 你需要拿到什么</h5>' +
          '<ul class="gl-req">' + c.reqs.map(function (r) { return "<li>" + esc(r) + "</li>"; }).join("") + '</ul>' +
          '<h5>④ 分几步走</h5>' +
          '<ol class="gl-steps">' + c.steps.map(function (r) { return "<li>" + esc(r) + "</li>"; }).join("") + '</ol>' +
        '</div>' +
      '</div>' +

      '<div class="gl-dt-foot">' +
        '<div class="gl-box"><b>💰 落地成本</b><span class="gl-big">' + esc(c.money.落地) + '</span><em>' + esc(c.money.明细) + '</em></div>' +
        '<div class="gl-box bad"><b>⚠️ 最大风险</b><p>' + esc(c.risk) + '</p></div>' +
        '<div class="gl-box good"><b>✅ 真正的优势</b><p>' + esc(c.good) + '</p></div>' +
      '</div>' +

      '<div class="gl-dt-3">' +
        '<h5>⑤ 六维得分（当前时点）</h5>' + dimRows +
        '<div class="gl-src">来源：' + esc(c.src) + '</div>' +
      '</div>' +
    '</div>';
  }

  /* ---------- 排行榜 ---------- */
  function renderRank() {
    var box = $("#gl-rank");
    if (!box) return;
    var list = ranked(state.mode, state.w);
    var base = ranked("now", { access: 35, jobs: 15, pay: 15, pr: 20, lang: 10, risk: 5 }).map(function (x) { return x.c.id; });
    var prevIds = ranked(state.mode === "now" ? "after3" : "now", state.w).map(function (x) { return x.c.id; });

    box.innerHTML = list.map(function (x, i) {
      var c = x.c;
      var rank = i + 1;
      var delta = prevIds.indexOf(c.id) - i;   // 正数=比另一时点靠前
      var dTag = "";
      if (state.mode === "now" && delta > 0) dTag = '<span class="gl-d up">3年后 ↑' + delta + '</span>';
      else if (state.mode === "now" && delta < 0) dTag = '<span class="gl-d down">3年后 ↓' + (-delta) + '</span>';
      else if (state.mode === "after3" && delta > 0) dTag = '<span class="gl-d up">现在 ↑' + delta + '</span>';
      else if (state.mode === "after3" && delta < 0) dTag = '<span class="gl-d down">现在 ↓' + (-delta) + '</span>';

      var medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : rank;
      var cls = rank <= 3 ? " top" : "";

      return '<div class="gl-row' + cls + '" data-id="' + c.id + '">' +
        '<button type="button" class="gl-head" aria-expanded="false">' +
          '<span class="gl-rk">' + medal + '</span>' +
          '<span class="gl-fl">' + esc(c.flag) + '</span>' +
          '<span class="gl-nm"><b>' + esc(c.name) + '</b><i>' + esc(c.en) + '</i></span>' +
          bars(c, state.mode) +
          '<span class="gl-tg">' + esc(c.tag) + dTag + '</span>' +
          '<span class="gl-sc">' + x.v.toFixed(1) + '</span>' +
          '<span class="gl-cv">▼</span>' +
        '</button>' +
        '<div class="gl-body" hidden>' + detail(c, state.mode) + '</div>' +
      '</div>';
    }).join("");

    /* 事件：展开 / 收起 */
    $$("#gl-rank .gl-head").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var row = btn.parentNode;
        var body = row.querySelector(".gl-body");
        var open = body.hidden ? false : true;
        body.hidden = open;
        btn.setAttribute("aria-expanded", open ? "false" : "true");
        row.classList.toggle("open", !open);
      });
    });
  }

  /* ---------- 汇总 ---------- */
  function renderSum() {
    var box = $("#gl-sum");
    if (!box) return;
    var list = ranked(state.mode, state.w);
    var a = list[0], b = list[1], last = list[list.length - 1];
    var gap = (a.v - b.v).toFixed(1);
    var tot = G.DIMS.reduce(function (n, d) { return n + state.w[d.k]; }, 0);
    box.innerHTML =
      '<div class="gl-sum-li"><span>权重合计</span><b>' + tot + '%</b><em>（已自动归一化，不必凑满 100）</em></div>' +
      '<div class="gl-sum-li"><span>第一名</span><b>' + esc(a.c.flag + " " + a.c.name) + " · " + a.v.toFixed(1) + '</b><em>领先第二名 ' + gap + ' 分</em></div>' +
      '<div class="gl-sum-li"><span>最后一名</span><b>' + esc(last.c.flag + " " + last.c.name) + " · " + last.v.toFixed(1) + '</b><em>和前一名差 ' + (list[list.length - 2].v - last.v).toFixed(1) + ' 分</em></div>';
  }

  /* ---------- 网络实施专用排行 ---------- */
  function roleBars(r) {
    return '<div class="gl-rb">' + G.ROLE_DIMS.map(function (d) {
      return '<span class="gl-rbi" title="' + esc(d.n) + " " + r.s[d.k] + '/10"><i style="width:' + Math.round(r.s[d.k] * 10) + '%"></i></span>';
    }).join("") + '</div>';
  }

  function renderRoleDims() {
    var box = $("#gl-roledims");
    if (!box) return;
    box.innerHTML = G.ROLE_DIMS.map(function (d) {
      return '<div class="gl-w" style="background:var(--panel)">' +
        '<div class="gl-w-h"><b>' + esc(d.n) + '</b><span class="gl-w-v">' + d.w + '%</span></div>' +
        '<div class="gl-w-d">' + esc(d.d) + '</div>' +
        '</div>';
    }).join("");
  }

  function renderFx() {
    var box = $("#gl-fx");
    if (box) box.textContent = G.FX + " 本页数据核对日期：" + G.UPDATED + "。签证类门槛每年调整，执行前请以官方原文为准。";
  }

  function renderRoles() {
    var box = $("#gl-roles");
    if (!box) return;
    var list = G.ROLES.slice().sort(function (a, b) { return b.score - a.score; });
    var stMap = { ok: ["✅ 官方已核", "ok"], est: ["⚠️ 区间估算", "warn"], todo: ["❓ 待核", "gray"] };

    box.innerHTML = list.map(function (r, i) {
      var rank = i + 1;
      var medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : rank;
      var m = stMap[r.st] || stMap.est;
      var open = rank <= 3 ? " open" : "";

      var cell = function (icon, k, v, n) {
        return '<div class="gl-rc"><span>' + icon + " " + esc(k) + '</span><b>' + esc(v) + '</b>' +
          (n ? '<p>' + esc(n) + '</p>' : '') + '</div>';
      };

      return '<details class="gl-role' + (rank <= 3 ? " top" : "") + '"' + open + '>' +
        '<summary class="gl-role-h">' +
          '<span class="gl-rkr">' + medal + '</span>' +
          '<span class="gl-rfl">' + esc(r.flag) + '</span>' +
          '<span class="gl-rnm"><b>' + esc(r.name) + '</b><i>' + esc(r.role) + '</i></span>' +
          roleBars(r) +
          '<span class="gl-rst ' + m[1] + '">' + m[0] + '</span>' +
          '<span class="gl-rsc">' + r.score.toFixed(1) + '</span>' +
        '</summary>' +
        '<div class="gl-role-b">' +
          '<div class="gl-role-en"><b>招聘关键词</b><code>' + esc(r.kw) + '</code>' +
            '<span class="gl-role-en2">' + esc(r.en) + '</span></div>' +

          '<div class="gl-role-grid">' +
            cell("💰", "工资", r.pay, r.payRMB + "。" + r.payNote) +
            cell("🛂", "签证能不能办", r.visa, r.visaNote) +
            cell("🗣", "外语要求", r.lang, "") +
            cell("🔧", "技术要求", r.tech, "") +
            cell("🚪", "入行门槛", r.tier, "") +
            cell("😮‍💨", "累不累", r.tired, "") +
            cell("🧯", "会不会被开", r.fire, "") +
            cell("📈", "进步空间", r.grow, "") +
          '</div>' +

          '<div class="gl-role-t">' +
            '<div class="gl-rt-fit"><b>和你这个背景的匹配度</b><p>' + esc(r.fit) + '</p></div>' +
            '<div class="gl-rt-warn"><b>最大的坑</b><p>' + esc(r.warn) + '</p></div>' +
          '</div>' +
        '</div>' +
      '</details>';
    }).join("");
  }

  /* ---------- 校园活动 ROI ---------- */
  function renderCampus() {
    var box = $("#gl-campus");
    if (!box) return;
    var list = G.CAMPUS.slice().sort(function (a, b) { return b.score - a.score; });

    box.innerHTML = list.map(function (c, i) {
      var rank = i + 1;
      var lvl = c.score >= 7 ? "ok" : c.score >= 4 ? "brand" : c.score >= 2 ? "gray" : "bad";
      var tag = c.score >= 7 ? "值得投入" : c.score >= 4 ? "有条件才做" : c.score >= 2 ? "顺手即可" : "别花时间";
      return '<details class="gl-cmp ' + lvl + '">' +
        '<summary class="gl-cmp-h">' +
          '<span class="gl-cmp-rk">' + (rank <= 3 ? ["🥇", "🥈", "🥉"][rank - 1] : rank) + '</span>' +
          '<span class="gl-cmp-n"><b>' + esc(c.n) + '</b><i>时间成本：' + esc(c.time) + '</i></span>' +
          '<span class="gl-cmp-bars">' +
            '<span title="对出国工签">' + c.v.visa + '</span>' +
            '<span title="对海外简历">' + c.v.cv + '</span>' +
            '<span title="对日本面试">' + c.v.jp + '</span>' +
          '</span>' +
          '<span class="gl-cmp-sc">' + c.score.toFixed(1) + '</span>' +
          '<span class="gl-cmp-t">' + tag + '</span>' +
        '</summary>' +
        '<div class="gl-cmp-b">' +
          '<div class="gl-cmp-why"><b>为什么是这个分</b><p>' + esc(c.why) + '</p></div>' +
          '<div class="gl-cmp-dt"><b>具体说清楚</b><p>' + esc(c.detail) + '</p></div>' +
          '<div class="gl-cmp-adv"><span>结论：' + esc(c.advice) + '</span>' +
            '<em>国内兜底价值 ' + c.cn + '/10（不计入总分）</em></div>' +
        '</div>' +
      '</details>';
    }).join("");
  }

  function renderCampusRoutes() {
    var box = $("#gl-camproutes");
    if (!box) return;
    box.innerHTML = G.CAMPUS_ROUTES.map(function (r) {
      return '<div class="gl-rt ' + esc(r.tone) + '">' +
        '<div class="gl-rt-h"><b>' + esc(r.n) + '</b></div>' +
        '<div class="gl-cr-row"><span class="must">必做</span><p>' + esc(r.must) + '</p></div>' +
        '<div class="gl-cr-row"><span class="ok2">可以</span><p>' + esc(r.ok) + '</p></div>' +
        '<div class="gl-cr-row"><span class="no">别做</span><p>' + esc(r.no) + '</p></div>' +
        '<p class="gl-rt-w">' + esc(r.note) + '</p>' +
      '</div>';
    }).join("");
  }

  /* ---------- 核对表 ---------- */
  function renderChecks() {
    var box = $("#gl-checks");
    if (!box) return;
    var map = { wrong: ["✗ 错", "bad"], half: ["△ 半对", "warn"], right: ["✓ 对", "ok"] };
    box.innerHTML = G.CHECKS.map(function (x, i) {
      var m = map[x.v] || map.half;
      return '<div class="gl-chk ' + m[1] + '">' +
        '<div class="gl-chk-h"><span class="gl-chk-n">' + (i + 1) + '</span>' +
        '<b>' + esc(x.q) + '</b><span class="gl-chk-t">' + m[0] + '</span></div>' +
        '<div class="gl-chk-a"><span>事实</span><p>' + esc(x.a) + '</p></div>' +
        '<div class="gl-chk-f"><span>本页怎么改</span><p>' + esc(x.fix) + '</p></div>' +
        '</div>';
    }).join("");
  }

  /* ---------- 路线 ---------- */
  function renderRoutes() {
    var box = $("#gl-routes");
    if (!box) return;
    box.innerHTML = G.ROUTES.map(function (r) {
      return '<div class="gl-rt ' + esc(r.tone) + '">' +
        '<div class="gl-rt-h"><b>' + esc(r.name) + '</b><span>' + esc(r.span) + '</span></div>' +
        '<div class="gl-rt-tag">' + esc(r.score) + '｜' + esc(r.for) + '</div>' +
        '<ol class="gl-rt-s">' + r.steps.map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("") + '</ol>' +
        '<div class="gl-rt-f"><span>成本 ' + esc(r.cost) + '</span><span>风险：' + esc(r.risk) + '</span></div>' +
        '<p class="gl-rt-w">' + esc(r.why) + '</p>' +
      '</div>';
    }).join("");
  }

  /* ---------- 决策树 ---------- */
  function renderTree() {
    var box = $("#gl-tree");
    if (!box) return;
    box.innerHTML = G.TREE.map(function (t) {
      return '<div class="gl-tre">' +
        '<div class="gl-tre-if"><span>如果</span><b>' + esc(t.cond) + '</b></div>' +
        '<div class="gl-tre-ar">→</div>' +
        '<div class="gl-tre-then"><b>' + esc(t.go) + '</b><p>' + esc(t.why) + '</p></div>' +
        '</div>';
    }).join("");
    /* 点击跳到对应国家 */
    $$("#gl-tree .gl-tre").forEach(function (el, i) {
      el.style.cursor = "pointer";
      el.addEventListener("click", function () {
        var id = G.TREE[i].to;
        var row = document.querySelector('#gl-rank .gl-row[data-id="' + id + '"]');
        if (!row) return;
        row.scrollIntoView({ behavior: "smooth", block: "center" });
        var body = row.querySelector(".gl-body");
        if (body && body.hidden) row.querySelector(".gl-head").click();
      });
    });
  }

  /* ---------- 成本表 ---------- */
  function renderCosts() {
    var tb = $("#gl-cost tbody");
    if (!tb) return;
    tb.innerHTML = G.COSTS.map(function (c) {
      return '<tr><td><b>' + esc(c.c) + '</b></td><td>' + esc(c.pre) + '</td><td>' + esc(c.preC) +
        '</td><td>' + esc(c.visa) + '</td><td>' + esc(c.fly) + '</td><td>' + esc(c.first) +
        '</td><td class="gl-tot">' + esc(c.total) + '</td><td>' + esc(c.time) + '</td></tr>';
    }).join("");
  }

  /* ---------- 事件 ---------- */
  function bind() {
    var pbox = $("#gl-presets");
    if (pbox) {
      pbox.addEventListener("click", function (e) {
        var b = e.target.closest(".gl-pbtn");
        if (!b) return;
        var p = G.PRESETS.filter(function (x) { return x.id === b.dataset.p; })[0];
        if (!p) return;
        state.preset = p.id;
        state.w = { access: p.w.access, jobs: p.w.jobs, pay: p.w.pay, pr: p.w.pr, lang: p.w.lang, risk: p.w.risk };
        save(); renderWeights(); renderRank(); renderSum();
      });
    }

    var wbox = $("#gl-weights");
    if (wbox) {
      wbox.addEventListener("input", function (e) {
        var t = e.target;
        if (!t.dataset || !t.dataset.k) return;
        var k = t.dataset.k;
        state.w[k] = Number(t.value);
        state.preset = "custom";
        var lbl = wbox.querySelector('.gl-w-v[data-v="' + k + '"]');
        if (lbl) lbl.textContent = t.value + "%";
        $$("#gl-presets .gl-pbtn").forEach(function (b) { b.classList.remove("on"); });
        var note = $("#gl-pnote");
        if (note) note.textContent = "自定义权重：你自己拖的，分数实时重算。";
        save(); renderRank(); renderSum();
      });
    }

    var tbox = $("#gl-tabs");
    if (tbox) {
      tbox.addEventListener("click", function (e) {
        var b = e.target.closest(".gl-tab");
        if (!b) return;
        state.mode = b.dataset.m === "after3" ? "after3" : "now";
        save();
        $$("#gl-tabs .gl-tab").forEach(function (x) { x.classList.remove("on"); });
        b.classList.add("on");
        renderRank(); renderSum();
      });
    }
  }

  function init() {
    if (!$("#gl-rank")) return;
    load();
    renderHero();
    renderWeights();
    renderRank();
    renderSum();
    renderRoleDims();
    renderRoles();
    renderCampus();
    renderCampusRoutes();
    renderFx();
    renderChecks();
    renderRoutes();
    renderTree();
    renderCosts();
    bind();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
