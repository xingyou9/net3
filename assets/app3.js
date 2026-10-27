/* ============================================================
   app3.js —— 实战层渲染 + UI 增强
   依赖 data3.js（window.APP3）
   负责：8 个新章节 / 深色模式 / 分组导航 / 浮动目录 / 阅读进度
        / 能力雷达图 / 折叠交互 / 入场动画
   ============================================================ */
(function () {
  "use strict";

  var A3 = window.APP3;
  if (!A3) return;

  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /* ================= 章节清单（顺序 = 页面顺序） ================= */
  var SECTIONS = [
    { id: "s-overview", t: "总览", i: "◎", g: "规划" },
    { id: "s-priority", t: "优先级", i: "⚡", g: "规划" },
    { id: "s-intel", t: "行业", i: "📊", g: "规划" },
    { id: "s-timeline", t: "时间轴", i: "🗓", g: "规划" },
    { id: "s-map", t: "学习地图", i: "🗺", g: "规划" },
    { id: "s-skills", t: "技能树", i: "🌳", g: "学习" },
    { id: "s-cap", t: "能力自评", i: "📈", g: "学习" },
    { id: "s-projects", t: "项目实战", i: "🧪", g: "学习" },
    { id: "s-env", t: "环境工具", i: "🖥", g: "学习" },
    { id: "s-sop", t: "排障手册", i: "🛠", g: "学习" },
    { id: "s-cert", t: "证书", i: "🎖", g: "考证" },
    { id: "s-calendar", t: "考试日历", i: "📅", g: "考证" },
    { id: "s-contest", t: "竞赛", i: "🏆", g: "考证" },
    { id: "s-tradeoff", t: "取舍", i: "⚖️", g: "规划" },
    { id: "s-year3", t: "大三分流", i: "🚦", g: "规划" },
    { id: "s-zsb", t: "专升本", i: "🎓", g: "规划" },
    { id: "s-campus", t: "校园攻略", i: "🎒", g: "规划" },
    { id: "s-job", t: "就业方案", i: "💼", g: "就业" },
    { id: "s-city", t: "城市进阶", i: "🗼", g: "就业" },
    { id: "s-europe", t: "欧洲路线", i: "✈️", g: "海外" },
    { id: "s-global", t: "国家排行", i: "🌍", g: "海外" },
    { id: "s-jobmap", t: "岗位全景", i: "🧭", g: "就业" },
    { id: "s-jobdata", t: "招聘样本", i: "🔍", g: "就业" },
    { id: "s-interview", t: "面试题库", i: "🎤", g: "就业" },
    { id: "s-resume", t: "简历谈薪", i: "📄", g: "就业" },
    { id: "s-week", t: "周复盘", i: "✅", g: "工具" },
    { id: "s-routine", t: "作息预算", i: "⏰", g: "工具" },
    { id: "s-toolbox", t: "自检清单", i: "🧰", g: "工具" },
    { id: "s-sources", t: "数据来源", i: "📋", g: "工具" },
    { id: "s-res", t: "资源库", i: "🔗", g: "工具" },
    { id: "s-pitfall", t: "避坑", i: "⚠️", g: "问答" },
    { id: "s-faq", t: "常见问题", i: "❓", g: "问答" }
  ];

  var GROUP_ORDER = ["规划", "学习", "考证", "就业", "海外", "工具", "问答"];

  /* ================= 1. 学习地图 ================= */
  function renderMap() {
    var box = $("#map-list");
    if (!box) return;
    box.innerHTML = A3.STUDY_MAP.map(function (c) {
      var cls = "w-" + String(c.w).toLowerCase();
      return '<div class="lm-card ' + cls + '">' +
        '<div class="lm-h"><b>' + esc(c.course) + '</b>' +
        '<span class="pill p-' + (c.w === "S" ? "danger" : c.w === "A" ? "brand" : c.w === "B" ? "teal" : "gray") + '">' + c.w + ' 级</span>' +
        '<span class="wgt">' + c.weight + '/12</span></div>' +
        '<div class="lm-bar" style="margin:0"><i style="width:' + Math.round((c.weight / 12) * 100) + '%"></i></div>' +
        '<div class="lm-b">' +
        '<div class="lm-row school"><dt>课内</dt><dd>' + esc(c.school) + '</dd></div>' +
        '<div class="lm-row job"><dt>岗位</dt><dd>' + esc(c.job) + '</dd></div>' +
        '<div class="lm-row gap"><dt>缺口</dt><dd>' + esc(c.gap) + '</dd></div>' +
        '<div class="lm-row self"><dt>自学</dt><dd>' + esc(c.self) + '</dd></div>' +
        '</div></div>';
    }).join("");

    var gap = $("#map-gap");
    if (gap) {
      gap.innerHTML = A3.STUDY_GAP.map(function (x) {
        return '<div class="citynote" style="border-left-color:var(--warn);background:var(--warn-soft)">' +
          '<b>' + esc(x.t) + '</b><p>' + esc(x.d) + '</p></div>';
      }).join("");
    }
  }

  /* ================= 2. 环境与工具 ================= */
  function renderEnv() {
    var box = $("#env-soft");
    if (box) {
      box.innerHTML = A3.ENV_SOFT.map(function (g) {
        return '<div class="envgrp"><div class="envgrp-h">' + esc(g.g) + '</div><div class="envgrp-b">' +
          g.items.map(function (it) {
            var paid = it.free.indexOf("免费") < 0;
            return '<div class="envitem' + (paid ? " is-paid" : "") + '">' +
              '<div class="en-n">' + esc(it.n) + '<small>' + esc(it.free) + '</small></div>' +
              '<div class="en-w">' + esc(it.why) + '<em>' + esc(it.note) + '</em></div>' +
              '</div>';
          }).join("") +
          '</div></div>';
      }).join("");
    }

    var hw = $("#env-hard");
    if (hw) {
      hw.innerHTML = A3.ENV_HARD.map(function (h) {
        return '<div class="hwitem"><b>' + esc(h.n) + '</b><p>' + esc(h.why) + '</p><span>' + esc(h.cost) + '</span></div>';
      }).join("");
    }
  }

  /* ================= 3. 排障 SOP ================= */
  function renderSop() {
    var st = $("#sop-steps");
    if (st) {
      st.innerHTML = A3.SOP_STEPS.map(function (s) {
        return '<div class="sopstep"><div class="ss-n">' + s.n + '</div>' +
          '<b>' + esc(s.t) + '</b><p>' + esc(s.d) + '</p></div>';
      }).join("");
    }

    var ly = $("#sop-layers");
    if (ly) {
      ly.innerHTML = '<div class="tbox"><table class="tb"><thead><tr>' +
        '<th style="min-width:96px;width:13%">层级</th>' +
        '<th style="width:45%">查什么</th>' +
        '<th style="min-width:220px;width:42%">用什么命令 / 手段</th>' +
        '</tr></thead><tbody>' +
        A3.SOP_LAYERS.map(function (l) {
          return '<tr><td><b>' + esc(l.l) + '</b></td><td>' + esc(l.chk) + '</td><td><code style="font-size:11.5px">' + esc(l.cmd) + '</code></td></tr>';
        }).join("") + '</tbody></table></div>';
    }

    var cs = $("#sop-cases");
    if (cs) {
      cs.innerHTML = A3.SOP_CASES.map(function (c, i) {
        return '<div class="sopcase"><div class="sopcase-h" data-acc="case-' + i + '">' +
          '<span class="sc-i">▶</span><span>' + esc(c.t) + '</span>' +
          '<span class="sc-s">｜' + esc(c.s) + '</span></div>' +
          '<div class="sopcase-b">' + esc(c.a) + '</div></div>';
      }).join("");
      bindAccordion(cs, ".sopcase-h", ".sopcase");
    }

    var cm = $("#sop-cmd");
    if (cm) {
      cm.innerHTML = A3.SOP_CMD.map(function (g) {
        return '<div class="cmdgrp"><h5>' + esc(g.g) + '</h5>' +
          g.items.map(function (it) {
            return '<div class="cmdrow"><div><code>' + esc(it.c) + '</code></div>' +
              '<div class="cm-u">' + esc(it.u) + '</div>' +
              '<div class="cm-n">' + esc(it.n) + '</div></div>';
          }).join("") + '</div>';
      }).join("");
    }
  }

  /* ================= 4. 面试题库 ================= */
  var iqFilter = "all";

  function renderInterview() {
    var bar = $("#iq-bar");
    var box = $("#iq-list");
    if (!box) return;

    if (bar) {
      var groups = ["all"].concat(A3.INTERVIEW.map(function (g) { return g.g; }));
      bar.innerHTML = groups.map(function (g) {
        var n = g === "all"
          ? A3.INTERVIEW.reduce(function (a, x) { return a + x.items.length; }, 0)
          : A3.INTERVIEW.filter(function (x) { return x.g === g; })[0].items.length;
        return '<button class="chip' + (iqFilter === g ? " on" : "") + '" data-iq="' + esc(g) + '" type="button">' +
          (g === "all" ? "全部" : esc(g)) + ' ' + n + '</button>';
      }).join("");
      Array.prototype.forEach.call(bar.querySelectorAll("[data-iq]"), function (b) {
        b.addEventListener("click", function () {
          iqFilter = b.getAttribute("data-iq");
          renderInterview();
        });
      });
    }

    var idx = 0;
    var html = "";
    A3.INTERVIEW.forEach(function (g) {
      if (iqFilter !== "all" && iqFilter !== g.g) return;
      html += '<div style="margin:16px 0 8px"><span class="pill p-brand">' + esc(g.g) + '</span></div>';
      g.items.forEach(function (it) {
        idx++;
        html += '<div class="iq"><div class="iq-h" data-acc="iq-' + idx + '">' +
          '<span class="iq-i">▶</span><span class="iq-t">' + idx + '. ' + esc(it.q) + '</span></div>' +
          '<div class="iq-b"><div class="iq-a">' + esc(it.a) + '</div>' +
          '<div class="iq-f"><b>可能被追问：</b>' + esc(it.f) + '</div></div></div>';
      });
    });
    box.innerHTML = html || '<div class="empty">没有匹配的题目</div>';
    bindAccordion(box, ".iq-h", ".iq");

    var tips = $("#iq-tips");
    if (tips) {
      tips.innerHTML = A3.INTERVIEW_TIPS.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("");
    }
  }

  /* ================= 5. 简历与谈薪 ================= */
  function renderResume() {
    var b = $("#resume-blocks");
    if (b) {
      b.innerHTML = A3.RESUME_BLOCKS.map(function (x, i) {
        return '<div class="rt-block"><div class="rt-h">' + (i + 1) + '. ' + esc(x.n) + '</div>' +
          '<div class="rt-row" style="grid-template-columns:1fr"><div class="d">' + esc(x.d) +
          '<div style="margin-top:5px;color:var(--brand);font-size:12.2px"><b>要点：</b>' + esc(x.tip) + '</div>' +
          '</div></div></div>';
      }).join("");
    }

    var bad = $("#resume-bad");
    if (bad) {
      bad.innerHTML = '<div class="tbox"><table class="cmp2"><thead><tr><th>别这样写</th><th>改成这样写</th></tr></thead><tbody>' +
        A3.RESUME_BAD.map(function (x) {
          return '<tr><td class="bad">' + esc(x.bad) + '</td><td class="good">' + esc(x.good) + '</td></tr>';
        }).join("") + '</tbody></table></div>';
    }

    var ng = $("#nego");
    if (ng) {
      ng.innerHTML = A3.NEGOTIATE.map(function (x) {
        return '<div class="nego"><div class="nq">' + esc(x.q) + '</div>' +
          '<div class="na">' + esc(x.a) + '</div>' +
          '<div class="nt"><b>要点：</b>' + esc(x.tip) + '</div></div>';
      }).join("");
    }

    var oc = $("#offer-check");
    if (oc) {
      oc.innerHTML = A3.OFFER_CHECK.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("");
    }
  }

  /* ================= 6. 竞赛 ================= */
  function renderContest() {
    var box = $("#contest-list");
    if (!box) return;
    box.innerHTML = A3.CONTEST.map(function (c) {
      return '<div class="ct-card"><h4>' + esc(c.n) + '</h4>' +
        '<div class="ct-meta"><span>' + esc(c.org) + '</span><span>' + esc(c.time) + '</span></div>' +
        '<div class="ct-items">' + c.items.map(function (s) { return '<span>' + esc(s) + '</span>'; }).join("") + '</div>' +
        '<p><b style="color:var(--ink)">价值：</b>' + esc(c.value) + '</p>' +
        '<p class="ct-tip"><b>建议：</b>' + esc(c.tip) + '</p></div>';
    }).join("");

    var rl = $("#contest-rules");
    if (rl) {
      rl.innerHTML = A3.CONTEST_RULES.map(function (r) { return "<li>" + esc(r) + "</li>"; }).join("");
    }
  }

  /* ================= 7. 作息与预算 ================= */
  function renderRoutine() {
    var box = $("#routine-list");
    if (box) {
      box.innerHTML = A3.ROUTINE.map(function (g) {
        return '<div class="rt-block"><div class="rt-h">' + esc(g.t) + '</div>' +
          g.items.map(function (it) {
            return '<div class="rt-row"><div class="t">' + esc(it.time) + '</div><div class="d">' + esc(it.d) + '</div></div>';
          }).join("") + '</div>';
      }).join("");
    }

    var pl = $("#routine-plan");
    if (pl) {
      pl.innerHTML = '<div class="rt-block"><div class="rt-h">学期内时间分配建议</div><div style="padding:12px 14px">' +
        A3.ROUTINE_PLAN.map(function (p) {
          return '<div style="margin-bottom:10px">' +
            '<div style="display:flex;justify-content:space-between;font-size:12.6px;margin-bottom:3px">' +
            '<span style="font-weight:700;color:var(--ink-2)">' + esc(p.item) + '</span>' +
            '<b style="color:var(--brand);font-variant-numeric:tabular-nums">' + p.pct + '%</b></div>' +
            '<div class="lm-bar" style="height:6px"><i style="width:' + p.pct + '%"></i></div>' +
            '<div style="font-size:11.5px;color:var(--muted);margin-top:3px">' + esc(p.note) + '</div></div>';
        }).join("") +
        '<div class="note warn" style="font-size:12.2px;margin-top:6px"><b>说明：</b>这不是理想化的时间表，是可持续的分配。真正需要警惕的不是「每天学几小时」，而是「有没有产出」。</div>' +
        '</div></div>';
    }

    var bg = $("#budget");
    if (bg) {
      var total = A3.BUDGET.filter(function (b) { return b.need === "必花"; }).length;
      bg.innerHTML = '<div class="tbox"><table class="tb"><thead><tr><th>项目</th><th>费用</th><th>时间</th><th>优先级</th><th>说明</th></tr></thead><tbody>' +
        A3.BUDGET.map(function (b) {
          var cls = b.need === "必花" ? "p-danger" : b.need === "谨慎" ? "p-warn" : b.need === "可选" ? "p-gray" : "p-brand";
          return '<tr><td><b>' + esc(b.item) + '</b></td><td class="num">' + esc(b.cost) + '</td>' +
            '<td class="num">' + esc(b.when) + '</td>' +
            '<td><span class="pill ' + cls + '">' + esc(b.need) + '</span></td>' +
            '<td style="font-size:12.5px;color:var(--muted)">' + esc(b.note) + '</td></tr>';
        }).join("") +
        '</tbody></table></div>' +
        '<div class="note" style="margin-top:12px;font-size:12.5px"><b>三年现金支出估算（不含笔记本与生活费）：</b>必花项约 660-770 元，加上建议项与一个 HCIA 后约 2200-2500 元；若再考 HCIP，总额升至 5500-6000 元。<b>' + total + ' 个必花项不要省，其余按目标取舍。</b></div>';
    }
  }

  /* ================= 8. FAQ ================= */
  var faqFilter = "all";

  function renderFaq() {
    var bar = $("#faq-bar");
    var box = $("#faq-list");
    if (!box) return;

    if (bar) {
      var tags = ["all"];
      A3.FAQ.forEach(function (f) { if (tags.indexOf(f.tag) < 0) tags.push(f.tag); });
      bar.innerHTML = tags.map(function (t) {
        var n = t === "all" ? A3.FAQ.length : A3.FAQ.filter(function (f) { return f.tag === t; }).length;
        return '<button class="chip' + (faqFilter === t ? " on" : "") + '" data-faq="' + esc(t) + '" type="button">' +
          (t === "all" ? "全部" : esc(t)) + ' ' + n + '</button>';
      }).join("");
      Array.prototype.forEach.call(bar.querySelectorAll("[data-faq]"), function (b) {
        b.addEventListener("click", function () {
          faqFilter = b.getAttribute("data-faq");
          renderFaq();
        });
      });
    }

    var list = A3.FAQ.filter(function (f) { return faqFilter === "all" || f.tag === faqFilter; });
    var idx = 0;
    box.innerHTML = list.map(function (f) {
      idx++;
      return '<div class="faq"><div class="faq-h" data-acc="faq-' + idx + '">' +
        '<span class="fq-t">' + esc(f.q) + '</span>' +
        '<span class="fq-tag">' + esc(f.tag) + '</span>' +
        '<span class="fq-i">+</span></div>' +
        '<div class="faq-b">' + esc(f.a) + '</div></div>';
    }).join("");
    bindAccordion(box, ".faq-h", ".faq");
  }

  /* ================= 折叠交互 ================= */
  function bindAccordion(scope, headSel, wrapSel) {
    Array.prototype.forEach.call(scope.querySelectorAll(headSel), function (h) {
      h.addEventListener("click", function () {
        var w = h.closest(wrapSel);
        if (w) w.classList.toggle("open");
      });
    });
  }

  /* ================= UI 1：主题切换 ================= */
  var THEME_KEY = "rzv3_theme";

  function applyTheme(t) {
    document.documentElement.setAttribute("data-theme", t);
    try { localStorage.setItem(THEME_KEY, t); } catch (e) {}
    var btn = $("#themebtn");
    if (btn) {
      btn.textContent = t === "dark" ? "☀️" : "🌙";
      btn.title = t === "dark" ? "切换到浅色" : "切换到深色";
    }
  }

  function initTheme() {
    var saved = null;
    try { saved = localStorage.getItem(THEME_KEY); } catch (e) {}
    var sysDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    applyTheme(saved || (sysDark ? "dark" : "light"));

    var btn = $("#themebtn");
    if (btn) {
      btn.addEventListener("click", function () {
        var cur = document.documentElement.getAttribute("data-theme");
        applyTheme(cur === "dark" ? "light" : "dark");
      });
    }
  }

  /* ================= UI 2：阅读进度 ================= */
  function initReadbar() {
    var bar = $("#readbar");
    if (!bar) return;
    function upd() {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      var p = h > 0 ? (window.scrollY / h) * 100 : 0;
      bar.style.width = Math.min(100, Math.max(0, p)) + "%";
    }
    window.addEventListener("scroll", upd, { passive: true });
    window.addEventListener("resize", upd);
    upd();
  }

  /* ================= UI 3：分组导航重建 ================= */
  function buildGroupedNav() {
    var ul = $("#navlist");
    var mn = $("#mnav");
    if (!ul) return;

    var groups = {};
    SECTIONS.forEach(function (s) {
      (groups[s.g] = groups[s.g] || []).push(s);
    });

    // 桌面
    ul.innerHTML = "";
    GROUP_ORDER.forEach(function (g) {
      if (!groups[g]) return;
      var li = document.createElement("li");
      li.className = "navgrp";
      li.setAttribute("data-g", g);

      var btn = document.createElement("button");
      btn.type = "button";
      btn.innerHTML = g + ' <span class="car">▼</span>';
      li.appendChild(btn);

      var drop = document.createElement("div");
      drop.className = "navdrop";
      groups[g].forEach(function (s) {
        var a = document.createElement("a");
        a.href = "#" + s.id;
        a.dataset.id = s.id;
        a.innerHTML = "<i>" + s.i + "</i>" + s.t;
        drop.appendChild(a);
      });
      li.appendChild(drop);

      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        var open = li.classList.contains("open");
        Array.prototype.forEach.call(ul.querySelectorAll(".navgrp"), function (x) { x.classList.remove("open"); });
        if (!open) li.classList.add("open");
      });
      drop.addEventListener("click", function () {
        li.classList.remove("open");
      });

      ul.appendChild(li);
    });

    document.addEventListener("click", function () {
      Array.prototype.forEach.call(ul.querySelectorAll(".navgrp"), function (x) { x.classList.remove("open"); });
    });

    // 移动端：直接生成分组下拉
    if (mn) {
      mn.innerHTML = "";
      GROUP_ORDER.forEach(function (g) {
        if (!groups[g]) return;
        var wrap = document.createElement("div");
        wrap.className = "navgrp";
        wrap.style.flex = "1 0 auto";

        var btn = document.createElement("button");
        btn.type = "button";
        btn.style.flexDirection = "column";
        btn.style.gap = "1px";
        btn.style.fontSize = "11px";
        btn.style.padding = "5px 7px";
        btn.innerHTML = '<span style="font-size:15px">' + (groups[g][0].i || "•") + '</span>' + g;

        var drop = document.createElement("div");
        drop.className = "navdrop";
        groups[g].forEach(function (s) {
          var a = document.createElement("a");
          a.href = "#" + s.id;
          a.dataset.id = s.id;
          a.innerHTML = "<i>" + s.i + "</i>" + s.t;
          drop.appendChild(a);
        });

        btn.addEventListener("click", function (e) {
          e.stopPropagation();
          var open = wrap.classList.contains("open");
          Array.prototype.forEach.call(mn.querySelectorAll(".navgrp"), function (x) { x.classList.remove("open"); });
          if (!open) wrap.classList.add("open");
        });
        drop.addEventListener("click", function () { wrap.classList.remove("open"); });

        wrap.appendChild(btn);
        wrap.appendChild(drop);
        mn.appendChild(wrap);
      });
      document.addEventListener("click", function () {
        Array.prototype.forEach.call(mn.querySelectorAll(".navgrp"), function (x) { x.classList.remove("open"); });
      });
    }

    syncGroupActive();
  }

  function syncGroupActive() {
    var links = $$(".navdrop a");
    var active = {};
    links.forEach(function (a) {
      if (a.classList.contains("on")) active[a.dataset.id] = true;
    });
    Array.prototype.forEach.call(document.querySelectorAll(".navgrp"), function (g) {
      var has = Array.prototype.some.call(g.querySelectorAll(".navdrop a"), function (a) {
        return a.classList.contains("on");
      });
      g.classList.toggle("active", has);
    });
  }

  /* ================= UI 4：浮动目录 ================= */
  function initToc() {
    var fab = $("#tocfab");
    var panel = $("#tocpanel");
    if (!fab || !panel) return;

    var groups = {};
    SECTIONS.forEach(function (s) { (groups[s.g] = groups[s.g] || []).push(s); });

    panel.innerHTML = GROUP_ORDER.map(function (g) {
      if (!groups[g]) return "";
      return '<div class="toc-g">' + g + '</div>' +
        groups[g].map(function (s) {
          return '<a href="#' + s.id + '" data-id="' + s.id + '">' + s.t + '</a>';
        }).join("");
    }).join("");

    fab.addEventListener("click", function (e) {
      e.stopPropagation();
      panel.classList.toggle("show");
    });
    panel.addEventListener("click", function () { panel.classList.remove("show"); });
    document.addEventListener("click", function (e) {
      if (!panel.contains(e.target) && e.target !== fab) panel.classList.remove("show");
    });

    function upd() {
      fab.classList.toggle("show", window.scrollY > 600);
      var curId = null;
      for (var i = 0; i < SECTIONS.length; i++) {
        var el = document.getElementById(SECTIONS[i].id);
        if (el && el.getBoundingClientRect().top <= 120) curId = SECTIONS[i].id;
      }
      Array.prototype.forEach.call(panel.querySelectorAll("a"), function (a) {
        a.classList.toggle("on", a.dataset.id === curId);
      });
    }
    window.addEventListener("scroll", upd, { passive: true });
    upd();
  }

  /* ================= UI 5：雷达图 ================= */
  function capScores() {
    var dims = (window.APP2 && window.APP2.CAP_DIMS) || null;
    var levels = (window.APP2 && window.APP2.LEVELS) || null;
    if (!dims || !levels) return null;
    var st = {};
    try { st = JSON.parse(localStorage.getItem("rzv2_cap") || "{}") || {}; } catch (e) { st = {}; }

    return dims.map(function (d) {
      var sum = 0;
      d.items.forEach(function (it, i) {
        var lv = typeof st[d.id + "|" + i] === "number" ? st[d.id + "|" + i] : 0;
        sum += (levels[lv] && levels[lv].score) || 0;
      });
      return { name: d.name, color: d.color, s: Math.round(sum / d.items.length) };
    });
  }

  function drawRadar() {
    var side = $("#cap-side");
    if (!side) return;
    var data = capScores();
    if (!data) return;

    var old = side.querySelector(".radarwrap");
    var R = 62, cx = 88, cy = 84;
    var n = data.length;
    var ang = function (i) { return (-90 + (360 / n) * i) * Math.PI / 180; };

    function pt(i, r) {
      return [cx + Math.cos(ang(i)) * r, cy + Math.sin(ang(i)) * r];
    }

    var rings = "";
    [0.25, 0.5, 0.75, 1].forEach(function (k) {
      var p = [];
      for (var i = 0; i < n; i++) p.push(pt(i, R * k).join(","));
      rings += '<polygon class="rg-line" points="' + p.join(" ") + '"/>';
    });

    var axes = "";
    for (var i = 0; i < n; i++) {
      var e = pt(i, R);
      axes += '<line class="rg-axis" x1="' + cx + '" y1="' + cy + '" x2="' + e[0].toFixed(1) + '" y2="' + e[1].toFixed(1) + '"/>';
    }

    var area = [], dots = "", labels = "";
    for (var j = 0; j < n; j++) {
      var rr = R * Math.max(0.04, data[j].s / 100);
      var q = pt(j, rr);
      area.push(q[0].toFixed(1) + "," + q[1].toFixed(1));
      dots += '<circle class="rg-dot" cx="' + q[0].toFixed(1) + '" cy="' + q[1].toFixed(1) + '" r="2.6"/>';
      var lp = pt(j, R + 15);
      var anchor = Math.abs(lp[0] - cx) < 4 ? "middle" : (lp[0] > cx ? "start" : "end");
      labels += '<text class="rg-lbl" x="' + lp[0].toFixed(1) + '" y="' + (lp[1] + 3).toFixed(1) + '" text-anchor="' + anchor + '">' + esc(data[j].name) + '</text>';
    }

    var svg = '<div class="radarwrap"><svg class="radar" viewBox="0 0 176 176" role="img" aria-label="能力雷达图">' +
      rings + axes +
      '<polygon class="rg-area" points="' + area.join(" ") + '"/>' +
      dots + labels + '</svg></div>';

    if (old) {
      old.outerHTML = svg;
    } else {
      side.insertAdjacentHTML("afterbegin", svg);
    }
  }

  function watchRadar() {
    var dims = $("#cap-dims");
    if (!dims) return;
    drawRadar();
    if (window.MutationObserver) {
      var mo = new MutationObserver(function () { drawRadar(); });
      mo.observe(dims, { childList: true, subtree: true });
    }
  }

  /* ================= UI 6：入场动画 ================= */
  function initReveal() {
    var secs = $$("main section.blk");
    if (!secs.length || !window.IntersectionObserver) return;
    secs.forEach(function (s) { s.classList.add("reveal"); });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add("in");
          io.unobserve(en.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.02 });
    secs.forEach(function (s) { io.observe(s); });
  }

  /* ================= 启动 ================= */
  function boot() {
    renderMap();
    renderEnv();
    renderSop();
    renderInterview();
    renderResume();
    renderContest();
    renderRoutine();
    renderFaq();

    initTheme();
    initReadbar();
    buildGroupedNav();
    initToc();
    watchRadar();
    initReveal();

    // 同步分组高亮（app.js 的滚动逻辑会切 a.on）
    window.addEventListener("scroll", function () { syncGroupActive(); }, { passive: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
