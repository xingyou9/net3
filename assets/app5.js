/* ============================================================
   app5.js —— 内容层 IV 渲染：岗位全景 + 校园三年攻略
   依赖 data4.js（window.APP4）
   ============================================================ */
(function () {
  "use strict";

  var A4 = window.APP4;
  if (!A4) return;

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function bindAcc(scope, headSel, wrapSel) {
    $$(headSel, scope).forEach(function (h) {
      h.addEventListener("click", function () {
        var w = h.closest(wrapSel);
        if (w) w.classList.toggle("open");
      });
    });
  }

  /* ================= 1. 岗位全景 ================= */
  var jobFilter = "all";

  function lvMeta(k) {
    for (var i = 0; i < A4.JOB_LEVELS.length; i++) {
      if (A4.JOB_LEVELS[i].k === k) return A4.JOB_LEVELS[i];
    }
    return A4.JOB_LEVELS[0];
  }

  /* 六维评级 → 点条
     颜色表示「对你是否有利」，而不是数值高低：
       强度 / AI 风险：低 = 绿，高 = 红
       求职 / 稳定 / 上升：高 = 绿，低 = 红
       上手难度：中性色（谈不上好坏，只有快慢） */
  function toneOf(key, rev, v) {
    if (key === "hard") return "neu";
    if (rev) return v >= 3 ? "bad" : "good";
    return v >= 3 ? "good" : "bad";
  }

  function dots(v, tone) {
    var s = "";
    for (var i = 1; i <= 5; i++) {
      s += '<i class="' + (i <= v ? "on " + tone : "") + '"></i>';
    }
    return '<span class="mm-dots">' + s + '</span>';
  }

  function metrics(mc) {
    if (!mc) return "";
    var meta = A4.METRIC_META || [];
    return '<div class="jm-metrics">' + meta.map(function (x) {
      var d = mc[x.k];
      if (!d) return "";
      var tn = toneOf(x.k, x.rev, d[0]);
      return '<div class="jm-m">' +
        '<span class="mm-l">' + esc(x.t) + '</span>' +
        dots(d[0], tn) +
        '<b class="mm-v ' + tn + '">' + esc(d[1]) + '</b>' +
        '</div>';
    }).join("") + '</div>';
  }

  function renderJobs() {
    var bar = $("#jobmap-filter");
    var list = $("#jobmap-list");
    if (!list) return;

    if (bar) {
      var opts = [{ k: "all", t: "全部" }].concat(A4.JOB_LEVELS.map(function (l) {
        return { k: l.k, t: l.t };
      }));
      bar.innerHTML = opts.map(function (o) {
        var n = o.k === "all" ? A4.JOBS.length : A4.JOBS.filter(function (j) { return j.lv === o.k; }).length;
        return '<button class="chip' + (jobFilter === o.k ? " on" : "") + '" data-jlv="' + esc(o.k) + '" type="button">' +
          esc(o.t) + ' ' + n + '</button>';
      }).join("");
      $$("[data-jlv]", bar).forEach(function (b) {
        b.addEventListener("click", function () {
          jobFilter = b.getAttribute("data-jlv");
          renderJobs();
        });
      });
    }

    var data = A4.JOBS.filter(function (j) { return jobFilter === "all" || j.lv === jobFilter; });

    var cnt = $("#jobmap-count");
    if (cnt) cnt.textContent = "共 " + A4.JOBS.length + " 个岗位，当前显示 " + data.length + " 个";

    list.innerHTML = data.map(function (j) {
      var lm = lvMeta(j.lv);
      var m = j.m || {};
      var t = function (k) { return m[k] ? esc(m[k][2]) : ""; };

      var rows =
        '<dt>入门门槛</dt><dd>' + esc(j.entry) + '</dd>' +
        '<dt>敲门证书</dt><dd class="jm-certs">' + j.cert.map(function (c) {
          return '<span class="jm-tag">' + esc(c) + '</span>';
        }).join("") + '</dd>' +
        '<dt>薪资估算</dt><dd><span class="jm-pay">' + j.pay.map(function (p) {
          return '<span><b>' + esc(p[0]) + '</b>' + esc(p[1]) + '</span>';
        }).join("") + '</span></dd>' +
        '<dt>每天在干什么</dt><dd>' + t("load") + '</dd>' +
        '<dt>好不好找工作</dt><dd>' + t("hire") + '</dd>' +
        '<dt class="w">AI 与失业风险</dt><dd class="w">' + t("ai") + '　' + t("stab") + '</dd>' +
        '<dt>晋升路径</dt><dd>' + esc(j.path) + '</dd>' +
        '<dt>上升空间与涨薪</dt><dd>' + t("promo") + ' ' + esc(j.raise || "") + '</dd>' +
        '<dt>未来发展</dt><dd>' + esc(j.future || "") + '</dd>' +
        '<dt>三年怎么准备</dt><dd>' + esc(j.prep) + '</dd>' +
        '<dt class="w">从业风险提示</dt><dd class="w">' + esc(j.risk) + '</dd>';

      return '<div class="jm-card" data-lv="' + esc(j.lv) + '">' +
        '<div class="jm-h" tabindex="0" role="button" aria-expanded="false">' +
          '<span class="pill p-' + lm.cls + ' jm-lv">' + esc(lm.t) + '</span>' +
          '<span class="jm-t"><b>' + esc(j.n) + '</b><small>' + esc(j.alias) + '</small></span>' +
          '<span class="jm-c" aria-hidden="true"></span>' +
        '</div>' +
        '<div class="jm-b">' +
          '<div class="jm-kind">' + esc(j.kind) + '</div>' +
          '<p class="jm-what">' + esc(j.what) + '</p>' +
          metrics(j.m) +
          '<dl class="jm-dl">' + rows + '</dl>' +
        '</div>' +
      '</div>';
    }).join("");

    // 手风琴 + 键盘可访问
    $$(".jm-h", list).forEach(function (h) {
      function toggle() {
        var card = h.closest(".jm-card");
        var on = card.classList.toggle("open");
        h.setAttribute("aria-expanded", on ? "true" : "false");
      }
      h.addEventListener("click", toggle);
      h.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " " || e.keyCode === 13 || e.keyCode === 32) {
          e.preventDefault();
          toggle();
        }
      });
    });
  }

  function renderCertMap() {
    var box = $("#jobmap-cert");
    if (!box) return;
    box.innerHTML = '<div class="tbox"><table class="tb"><thead><tr>' +
      '<th style="width:24%">证书 / 能力</th><th style="width:38%">能打开哪些岗位</th><th>说明</th>' +
      '</tr></thead><tbody>' +
      A4.CERT_MAP.map(function (r) {
        return '<tr><td><b>' + esc(r.c) + '</b></td><td>' + esc(r.open) + '</td>' +
          '<td style="color:var(--muted);font-size:12.5px">' + esc(r.note) + '</td></tr>';
      }).join("") + '</tbody></table></div>';
  }

  function renderChoose() {
    var box = $("#jobmap-choose");
    if (!box) return;
    box.innerHTML = A4.JOB_CHOOSE.map(function (x) {
      return '<div class="card"><div class="card-b">' +
        '<div class="jc-t">' + esc(x.t) + '</div>' +
        '<div class="jc-p"><span>建议方向</span>' + esc(x.pick) + '</div>' +
        '<div class="jc-w">' + esc(x.why) + '</div>' +
        '</div></div>';
    }).join("");
  }

  /* ================= 2. 校园三年攻略 ================= */
  function renderCampusTimeline() {
    var box = $("#campus-tl");
    if (!box) return;
    box.innerHTML = A4.CAMPUS_TIMELINE.map(function (t) {
      return '<div class="tl-item"><div class="t-when">' + esc(t.term) + '</div>' +
        '<div class="t-title">' + esc(t.key) + '</div>' +
        '<ul class="plain v" style="margin:6px 0 0;font-size:13px">' +
        t.items.map(function (i) { return "<li>" + esc(i) + "</li>"; }).join("") +
        '</ul></div>';
    }).join("");
  }

  function renderRoles() {
    var box = $("#campus-roles");
    if (!box) return;
    var order = { "最值": 0, "最值（如果能进）": 0, "很值": 1, "值": 2, "看情况": 3, "够用即可": 4, "不值（除非加分明显）": 5 };
    var list = A4.CAMPUS_ROLES.slice().sort(function (a, b) {
      var x = order[a.verdict] == null ? 3 : order[a.verdict];
      var y = order[b.verdict] == null ? 3 : order[b.verdict];
      return x - y;
    });
    box.innerHTML = list.map(function (r) {
      var top = (order[r.verdict] === 0);
      return '<div class="rl-card' + (top ? " top" : "") + '">' +
        '<div class="rl-h"><b>' + esc(r.n) + '</b>' +
        '<span class="rl-v' + (top ? " good" : "") + '">' + esc(r.verdict) + '</span></div>' +
        '<div class="rl-b">' +
          '<div class="rl-row"><span>能得到</span><p>' + esc(r.gain) + '</p></div>' +
          '<div class="rl-row"><span>要付出</span><p>' + esc(r.cost) + '</p></div>' +
          '<div class="rl-row"><span>怎么争取</span><p>' + esc(r.how) + '</p></div>' +
          '<div class="rl-tip">' + esc(r.tip) + '</div>' +
        '</div></div>';
    }).join("");
  }

  function renderParty() {
    var box = $("#campus-party");
    if (!box) return;
    box.innerHTML = A4.CAMPUS_PARTY.map(function (p) {
      return '<div class="tl-item"><div class="t-when">' + esc(p.when) + '</div>' +
        '<div class="t-title">' + esc(p.s) + '</div>' +
        '<p class="t-desc">' + esc(p.d) + '</p></div>';
    }).join("");
  }

  function renderEval() {
    var box = $("#campus-eval");
    if (!box) return;
    box.innerHTML = A4.CAMPUS_EVAL.map(function (e) {
      return '<div class="ev-item"><b>' + esc(e.t) + '</b><p>' + esc(e.d) + '</p></div>';
    }).join("");
  }

  function renderDosDonts() {
    var a = $("#campus-do"), b = $("#campus-dont");
    if (a) a.innerHTML = A4.CAMPUS_DOS.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("");
    if (b) b.innerHTML = A4.CAMPUS_DONTS.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("");
  }

  function renderScenes() {
    var box = $("#campus-scenes");
    if (!box) return;
    box.innerHTML = A4.CAMPUS_SCENES.map(function (s, i) {
      return '<div class="faq"><div class="faq-h" data-acc="' + i + '">' +
        '<span class="fq-t">' + esc(s.q) + '</span>' +
        '<span class="fq-i">+</span></div>' +
        '<div class="faq-b">' + esc(s.a) + '</div></div>';
    }).join("");
    bindAcc(box, ".faq-h", ".faq");
  }

  function renderNotes() {
    var jn = $("#jobmap-note");
    if (jn) jn.innerHTML = A4.JOB_NOTE;
    var cn = $("#campus-note");
    if (cn) cn.innerHTML = A4.CAMPUS_NOTE;
  }

  /* ================= 启动 ================= */
  function boot() {
    renderJobs();
    renderCertMap();
    renderChoose();
    renderNotes();

    renderCampusTimeline();
    renderRoles();
    renderParty();
    renderEval();
    renderDosDonts();
    renderScenes();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
