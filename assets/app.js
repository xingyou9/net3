/* ============================================================
   app.js —— 渲染与交互
   ============================================================ */
(function () {
  "use strict";

  const D = window.APP;
  const $ = (s) => document.querySelector(s);
  const el = (t, c, h) => {
    const e = document.createElement(t);
    if (c) e.className = c;
    if (h != null) e.innerHTML = h;
    return e;
  };

  /* ---------- 导航 ---------- */
  const NAV = [
    { id: "s-overview", i: "◎", t: "总览" },
    { id: "s-intel", i: "📊", t: "行业" },
    { id: "s-timeline", i: "🗓", t: "时间轴" },
    { id: "s-cert", i: "🎖", t: "证书" },
    { id: "s-calendar", i: "📅", t: "日历" },
    { id: "s-skills", i: "🌳", t: "技能" },
    { id: "s-tradeoff", i: "⚖️", t: "取舍" },
    { id: "s-year3", i: "🚦", t: "大三" },
    { id: "s-job", i: "💼", t: "就业" },
    { id: "s-pitfall", i: "⚠️", t: "避坑" },
    { id: "s-toolbox", i: "🧰", t: "自检" },
    { id: "s-res", i: "🔗", t: "资源" }
  ];

  function buildNav() {
    const ul = $("#navlist");
    NAV.forEach((n) => {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = "#" + n.id;
      a.textContent = n.t;
      a.dataset.id = n.id;
      li.appendChild(a);
      ul.appendChild(li);
    });
    const mn = $("#mnav");
    NAV.forEach((n) => {
      const a = document.createElement("a");
      a.href = "#" + n.id;
      a.dataset.id = n.id;
      a.innerHTML = "<i>" + n.i + "</i>" + n.t;
      mn.appendChild(a);
    });
  }

  /* ---------- 滚动高亮 ---------- */
  function initScroll() {
    const secs = NAV.map((n) => document.getElementById(n.id)).filter(Boolean);
    const links = Array.prototype.slice.call(document.querySelectorAll("[data-id]"));
    const top = $("#totop");

    function update() {
      const y = window.scrollY || document.documentElement.scrollTop;
      let cur = secs[0];
      for (const s of secs) {
        if (s.getBoundingClientRect().top <= 120) cur = s;
      }
      links.forEach((a) => a.classList.toggle("on", a.dataset.id === (cur && cur.id)));
      top.classList.toggle("show", y > 500);
    }
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    top.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
    update();
  }

  /* ---------- KPI ---------- */
  function renderKpis() {
    const box = $("#kpis");
    D.KPIS.forEach((k) => {
      const c = el("div", "kpi");
      c.innerHTML =
        '<div class="k-label">' + k.label + '</div>' +
        '<div class="k-val">' + k.val + (k.unit ? '<small>' + k.unit + '</small>' : '') + '</div>' +
        '<div class="k-sub">' + k.sub + '</div>';
      box.appendChild(c);
    });
  }

  /* ---------- 条形图 ---------- */
  function renderBars(sel, arr, suffix) {
    const box = $(sel);
    arr.forEach((b) => {
      const row = el("div", "bar-row");
      const pct = Math.max(4, Math.round((b.v / (b.max || 100)) * 100));
      row.innerHTML =
        '<div class="b-name">' + b.name + '</div>' +
        '<div class="bar-track"><span class="bar-fill" style="width:0%;background:' + b.color + '"></span></div>' +
        '<div class="b-val">' + b.txt + (suffix || '') + '</div>';
      box.appendChild(row);
      const fill = row.querySelector(".bar-fill");
      requestAnimationFrame(() => setTimeout(() => { fill.style.width = pct + "%"; }, 60));
    });
  }

  /* ---------- 趋势 ---------- */
  function renderTrends() {
    const box = $("#trends");
    D.INTEL.trends.forEach((t) => {
      const c = el("div");
      c.innerHTML =
        '<div style="margin-bottom:5px"><span class="pill ' + t.tag + '">' + t.tagTxt + '</span></div>' +
        '<div style="font-size:14.5px;font-weight:750;margin-bottom:4px">' + t.t + '</div>' +
        '<div style="font-size:13.5px;color:var(--muted);line-height:1.7">' + t.d + '</div>';
      box.appendChild(c);
    });
  }

  /* ---------- 时间轴（学期切换） ---------- */
  let curTerm = 0;
  function renderTerms() {
    const bar = $("#termbar");
    D.TERMS.forEach((t, i) => {
      const b = document.createElement("button");
      b.textContent = t.name + " · " + t.range.replace(/\s/g, "");
      b.className = i === 0 ? "on" : "";
      b.addEventListener("click", () => {
        curTerm = i;
        Array.prototype.forEach.call(bar.children, (x, j) => x.classList.toggle("on", j === i));
        renderTermBody();
      });
      bar.appendChild(b);
    });
    renderTermBody();
  }

  function renderTermBody() {
    const t = D.TERMS[curTerm];
    const head = $("#term-head");
    head.innerHTML =
      '<h3>' + t.name + '（' + t.range + '）</h3>' +
      '<span class="pill p-brand">' + t.theme + '</span>';

    const b = $("#term-body");
    b.innerHTML = "";

    const goal = el("div", "note");
    goal.innerHTML = '<b>本阶段目标：</b>' + t.goal;
    b.appendChild(goal);

    // KPI
    const kbox = el("div", "grid g4");
    kbox.style.marginTop = "14px";
    t.kpis.forEach((k) => {
      const c = el("div", "kpi");
      c.innerHTML = '<div class="k-label">验收标准</div><div style="font-size:13.5px;font-weight:650;line-height:1.6">' + k + '</div>';
      kbox.appendChild(c);
    });
    b.appendChild(kbox);

    // 时间线
    const tl = el("div", "tl");
    tl.style.marginTop = "18px";
    t.items.forEach((it) => {
      const li = el("div", "tl-item");
      li.innerHTML =
        '<div class="t-when">' + it.when + '</div>' +
        '<div class="t-title">' + it.title + '</div>' +
        '<p class="t-desc">' + it.desc + '</p>';
      tl.appendChild(li);
    });
    b.appendChild(tl);

    // 争取 / 舍弃
    const two = el("div", "grid g2");
    two.style.marginTop = "6px";
    const g = el("div", "card");
    g.innerHTML =
      '<div class="card-h"><span class="pill p-ok">✅ 本阶段要争取</span></div>' +
      '<div class="card-b"><ul class="plain v">' + t.grab.map((x) => "<li>" + x + "</li>").join("") + '</ul></div>';
    const d = el("div", "card");
    d.innerHTML =
      '<div class="card-h"><span class="pill p-danger">❌ 本阶段要舍弃</span></div>' +
      '<div class="card-b"><ul class="plain x">' + t.drop.map((x) => "<li>" + x + "</li>").join("") + '</ul></div>';
    two.appendChild(g);
    two.appendChild(d);
    b.appendChild(two);
  }

  /* ---------- 证书 ---------- */
  const CERT_FILTERS = [
    { k: "all", t: "全部" }, { k: "s", t: "S 级 · 必拿" }, { k: "a", t: "A 级 · 强烈建议" },
    { k: "b", t: "B 级 · 顺手/方向性" }, { k: "c", t: "C 级 · 毕业后/备选" }
  ];
  let certF = "all";

  function renderCerts() {
    const fbox = $("#cert-filter");
    CERT_FILTERS.forEach((f) => {
      const c = el("button", "chip" + (f.k === certF ? " on" : ""), f.t);
      c.addEventListener("click", () => {
        certF = f.k;
        Array.prototype.forEach.call(fbox.children, (x) => x.classList.remove("on"));
        c.classList.add("on");
        drawCerts();
      });
      fbox.appendChild(c);
    });
    drawCerts();
  }

  function drawCerts() {
    const box = $("#certs");
    box.innerHTML = "";
    D.CERTS.filter((c) => certF === "all" || c.level === certF).forEach((c) => {
      const card = el("div", "cert " + c.level);
      card.innerHTML =
        '<div class="cert-top"><h4>' + c.name + '</h4><span class="pill p-' + (c.level === "s" ? "danger" : c.level === "a" ? "brand" : c.level === "b" ? "teal" : "gray") + '">' + c.lvlTxt + '</span></div>' +
        '<dl class="cert-meta">' +
        '<dt>建议时间</dt><dd>' + c.term + '</dd>' +
        '<dt>考试窗口</dt><dd>' + c.when + '</dd>' +
        '<dt>费用</dt><dd>' + c.fee + '</dd>' +
        '<dt>难度</dt><dd>' + c.hard + '</dd>' +
        '<dt>发证方</dt><dd>' + c.org + '</dd>' +
        '</dl>' +
        '<div class="cert-why">' + c.why + '</div>' +
        '<div style="font-size:12.5px;color:var(--muted)"><b style="color:var(--ink)">行动：</b>' + c.act + '</div>' +
        '<div style="font-size:12px;color:var(--muted-2)">查询：' + c.src + '</div>';
      box.appendChild(card);
    });
  }

  function renderCertPath() {
    const box = $("#cert-path");
    const seq = [
      { w: "大一上", t: "NCRE 二级（顺手，跟着学校报）", d: "成本低，不额外投入时间。重点是别占用专业课与实训时间。" },
      { w: "大一下", t: "1+X 网络系统建设与运维（中级）", d: "约 490 元，学校组织。实操占 800 分，必须动手练，不能背题。" },
      { w: "大二上", t: "华为 HCIA-Datacom", d: "优先走 1+X 中级 → Upgrade → HCIA 的省钱通道；不行再直考（约 1400 元）。" },
      { w: "大二下", t: "软考《网络工程师》（中级职称）", d: "百元成本换中级职称，零门槛终身有效。上半年 5 月考，3-4 月报名（窗口 7-10 天）。" },
      { w: "大二下—大三上", t: "华为 HCIP-Datacom（分两门报）", d: "先攻 H12-821，过后再报进阶科目。补考全额重缴，切勿一次报两门。" },
      { w: "大二暑假前", t: "驾驶证 C1 + 低压电工证", d: "现场型岗位的隐性门槛，大学假期是唯一低成本时间窗口。" },
      { w: "大三（就业派）", t: "视方向补 Linux 或信创相关", d: "RHCSA 需经济允许再考；信创国产化 OS 能力可自学，不一定要认证。" },
      { w: "工作 3-5 年后", t: "HCIE-Datacom / CISP-PTE", d: "由公司出资最划算。学生阶段自费考这两个 = 高风险沉没成本。" }
    ];
    seq.forEach((s) => {
      const li = el("div", "tl-item");
      li.innerHTML =
        '<div class="t-when">' + s.w + '</div>' +
        '<div class="t-title">' + s.t + '</div>' +
        '<p class="t-desc">' + s.d + '</p>';
      box.appendChild(li);
    });
  }

  /* ---------- 日历 ---------- */
  function renderCal() {
    const tb = $("#cal-body");
    D.CALENDAR.forEach((c) => {
      const tr = document.createElement("tr");
      tr.innerHTML =
        '<td class="num" style="font-weight:800;color:var(--brand)">' + c.m + '</td>' +
        '<td><ul class="plain" style="margin:0">' + c.ev.map((e) => '<li style="margin:2px 0">' + e + '</li>').join("") + '</ul></td>' +
        '<td class="num">' + c.who + '</td>';
      tb.appendChild(tr);
    });
  }

  /* ---------- 技能树 ---------- */
  const SK_KEY = "rzvcst_skills_v1";
  let skState = {};

  function loadSk() {
    try { skState = JSON.parse(localStorage.getItem(SK_KEY) || "{}") || {}; }
    catch (e) { skState = {}; }
  }
  function saveSk() {
    try { localStorage.setItem(SK_KEY, JSON.stringify(skState)); } catch (e) {}
  }

  function renderSkills() {
    const box = $("#skills");
    box.innerHTML = "";
    let total = 0, done = 0;
    D.SKILLS.forEach((L) => {
      const wrap = el("div", "skill-layer");
      const h = el("div", "sl-h");
      h.innerHTML = '<span class="pill ' + L.color + '">' + L.layer + '</span>';
      wrap.appendChild(h);
      const chips = el("div", "chips");
      L.items.forEach((it) => {
        const key = L.layer + "|" + it.n;
        total++;
        if (skState[key]) done++;
        const c = el("button", "chip" + (it.core ? " core" : "") + (skState[key] ? " on" : ""), it.n + (it.core ? " ★" : ""));
        c.addEventListener("click", () => {
          skState[key] = !skState[key];
          c.classList.toggle("on", !!skState[key]);
          saveSk();
          updateSkProg();
        });
        chips.appendChild(c);
      });
      wrap.appendChild(chips);
      box.appendChild(wrap);
    });
    box.dataset.total = total;
    updateSkProg();
  }

  function updateSkProg() {
    let total = 0, done = 0;
    D.SKILLS.forEach((L) => L.items.forEach((it) => {
      total++;
      if (skState[L.layer + "|" + it.n]) done++;
    }));
    const p = total ? Math.round((done / total) * 100) : 0;
    $("#sk-prog").style.width = p + "%";
    $("#sk-prog-t").textContent = p + "%（" + done + "/" + total + "）";
  }

  /* ---------- 取舍 ---------- */
  function renderTradeoff() {
    const mk = (arr, cls) => arr.map((x) =>
      '<div class="ck" style="cursor:default;align-items:flex-start">' +
      '<span class="pill ' + cls + '" style="flex:none;margin-top:2px">' + x.w + '</span>' +
      '<div><div class="ck-t" style="font-weight:700">' + x.t + '</div>' +
      '<div style="font-size:13px;color:var(--muted);line-height:1.65">' + x.d + '</div></div></div>'
    ).join("");
    $("#grab-list").innerHTML = '<div class="checklist">' + mk(D.TRADEOFF.grab, "p-ok") + '</div>';
    $("#drop-list").innerHTML = '<div class="checklist">' + mk(D.TRADEOFF.drop, "p-danger") + '</div>';
  }

  /* ---------- 大三路径 ---------- */
  function renderPaths() {
    const box = $("#paths");
    D.PATHS.forEach((p) => {
      const c = el("div", "path " + p.cls);
      c.innerHTML =
        '<div class="p-h"><h4>' + p.name + '</h4><span>' + p.sub + '</span></div>' +
        '<div class="p-b">' +
        '<dl class="kv">' +
        '<dt>适合谁</dt><dd>' + p.fit + '</dd>' +
        '<dt>时间线</dt><dd>' + p.timeline + '</dd>' +
        '</dl>' +
        '<div style="margin-bottom:8px;font-size:12.5px;font-weight:800;color:var(--ok)">优势</div>' +
        '<ul class="plain v" style="font-size:13px">' + p.pros.map((x) => "<li>" + x + "</li>").join("") + '</ul>' +
        '<div style="margin:10px 0 8px;font-size:12.5px;font-weight:800;color:var(--danger)">代价</div>' +
        '<ul class="plain x" style="font-size:13px">' + p.cons.map((x) => "<li>" + x + "</li>").join("") + '</ul>' +
        '<div style="margin:10px 0 8px;font-size:12.5px;font-weight:800;color:var(--brand)">关键动作</div>' +
        '<ul class="plain" style="font-size:13px">' + p.key.map((x) => "<li>" + x + "</li>").join("") + '</ul>' +
        '<div class="note warn" style="margin-top:12px;font-size:12.5px"><b>失败预案：</b>' + p.fail + '</div>' +
        '</div>';
      box.appendChild(c);
    });
  }

  /* ---------- 就业 ---------- */
  function renderJob() {
    $("#job-pos").innerHTML = D.JOB.positions.map((p) =>
      '<tr><td><b>' + p.p + '</b></td><td class="num">' + p.pay + '</td><td>' + p.req + '</td><td class="num" style="color:var(--warn)">' + p.hot + '</td></tr>'
    ).join("");
    $("#job-resume").innerHTML = D.JOB.resume.map((r) => "<li>" + r + "</li>").join("");
    $("#job-ch").innerHTML = D.JOB.channels.map((c) => "<li><b>" + c.n + "</b> — " + c.d + "</li>").join("");
    $("#job-local").innerHTML = D.JOB.local.map((c) =>
      '<tr><td><b>' + c.n + '</b></td><td class="num">' + c.t + '</td><td>' + c.d + '</td></tr>'
    ).join("");
  }

  /* ---------- 面试抽题 ---------- */
  let qi = -1;
  function initQuiz() {
    const list = D.JOB.interview;
    const q = $("#quiz-q"), a = $("#quiz-a");
    function next() {
      let n = qi;
      while (n === qi && list.length > 1) n = Math.floor(Math.random() * list.length);
      qi = n;
      q.textContent = list[n].q;
      a.textContent = list[n].a;
      a.classList.remove("show");
      $("#quiz-show").textContent = "显示参考答案";
    }
    $("#quiz-next").addEventListener("click", next);
    $("#quiz-show").addEventListener("click", function () {
      const on = a.classList.toggle("show");
      this.textContent = on ? "收起答案" : "显示参考答案";
    });
    next();
  }

  /* ---------- 避坑 ---------- */
  function renderPitfalls() {
    const box = $("#pitfalls");
    D.PITFALLS.forEach((p) => {
      const c = el("div", "card");
      c.innerHTML =
        '<div class="card-b">' +
        '<div style="margin-bottom:6px"><span class="pill p-' + (p.lv === "danger" ? "danger" : "warn") + '">' + (p.lv === "danger" ? "高危" : "注意") + '</span></div>' +
        '<div style="font-size:14.5px;font-weight:750;margin-bottom:4px">' + p.t + '</div>' +
        '<div style="font-size:13.5px;color:var(--muted);line-height:1.7">' + p.d + '</div>' +
        '</div>';
      box.appendChild(c);
    });
  }

  /* ---------- 倒计时 ---------- */
  function renderCountdown() {
    const box = $("#countdown");
    const now = new Date();
    const today = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0") + "-" + String(now.getDate()).padStart(2, "0");
    $("#today-txt").textContent = "今天 " + today;

    D.ANCHORS.forEach((a) => {
      const target = new Date(a.date + "T00:00:00");
      let diff = Math.ceil((target - now) / 86400000);
      let label = "还剩", num = diff;
      if (diff < 0) { label = "已过去"; num = -diff; }
      const c = el("div", "cd");
      c.innerHTML =
        '<div class="cd-l">' + a.label + '</div>' +
        '<div class="cd-n">' + (label === "已过去" ? "+" : "") + num + '<small> 天</small></div>' +
        '<div class="cd-d">' + a.note + '</div>';
      box.appendChild(c);
    });
  }

  /* ---------- 自检清单 ---------- */
  const CK_KEY = "rzvcst_checks_v1";
  let ckState = {};
  function loadCk() {
    try { ckState = JSON.parse(localStorage.getItem(CK_KEY) || "{}") || {}; }
    catch (e) { ckState = {}; }
  }
  function saveCk() {
    try { localStorage.setItem(CK_KEY, JSON.stringify(ckState)); } catch (e) {}
  }

  function renderChecks() {
    const box = $("#checks");
    box.innerHTML = "";
    D.CHECKS.forEach((g) => {
      const sec = el("div");
      sec.style.marginBottom = "16px";
      const h = el("div");
      h.innerHTML = '<div style="font-size:13px;font-weight:800;color:var(--brand);margin-bottom:7px">' + g.g + '</div>';
      sec.appendChild(h);
      const list = el("div", "checklist");
      g.items.forEach((it) => {
        const key = g.g + "|" + it;
        const lab = el("label", "ck" + (ckState[key] ? " on" : ""));
        const cb = document.createElement("input");
        cb.type = "checkbox";
        cb.checked = !!ckState[key];
        cb.addEventListener("change", () => {
          ckState[key] = cb.checked;
          lab.classList.toggle("on", cb.checked);
          saveCk();
          updateCkProg();
        });
        const t = el("span", "ck-t", it);
        lab.appendChild(cb);
        lab.appendChild(t);
        list.appendChild(lab);
      });
      sec.appendChild(list);
      box.appendChild(sec);
    });
    updateCkProg();
  }

  function updateCkProg() {
    let total = 0, done = 0;
    D.CHECKS.forEach((g) => g.items.forEach((it) => {
      total++;
      if (ckState[g.g + "|" + it]) done++;
    }));
    const p = total ? Math.round((done / total) * 100) : 0;
    $("#ck-prog").style.width = p + "%";
    $("#ck-prog-t").textContent = p + "%（" + done + "/" + total + "）";
  }

  /* ---------- 资源 ---------- */
  function renderRes() {
    $("#res-list").innerHTML = D.RES.map((r) =>
      '<a class="res" href="' + r.u + '" target="_blank" rel="noopener"><b>' + r.n + ' ↗</b><span>' + r.d + '</span></a>'
    ).join("");
    $("#tool-list").innerHTML = D.TOOLS.map((t) =>
      '<div class="res" style="cursor:default"><b>' + t.n + '</b><span>' + t.d + '</span></div>'
    ).join("");
  }

  /* ---------- 启动 ---------- */
  function boot() {
    buildNav();
    renderKpis();
    renderBars("#bars-gap", D.INTEL.gap);
    renderBars("#bars-salary", D.INTEL.salary);
    renderTrends();
    renderTerms();
    renderCerts();
    renderCertPath();
    renderCal();
    loadSk(); renderSkills();
    renderTradeoff();
    renderPaths();
    renderJob();
    initQuiz();
    renderPitfalls();
    renderCountdown();
    loadCk(); renderChecks();
    renderRes();
    initScroll();

    $("#sk-reset").addEventListener("click", () => {
      skState = {}; saveSk(); renderSkills();
    });
    $("#ck-reset").addEventListener("click", () => {
      ckState = {}; saveCk(); renderChecks();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
