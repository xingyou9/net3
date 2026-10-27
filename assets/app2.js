/* ============================================================
   app2.js —— 升级层渲染与交互
   依赖 data2.js（window.APP2）；不修改 app.js 的任何逻辑
   本地存储键统一前缀：rzv2_
   ============================================================ */
(function () {
  "use strict";

  var A2 = window.APP2;
  if (!A2) return;

  var $ = function (s) { return document.querySelector(s); };
  var NS = "rzv2_";

  function lsGet(k, def) {
    try {
      var v = localStorage.getItem(NS + k);
      return v == null ? def : JSON.parse(v);
    } catch (e) { return def; }
  }
  function lsSet(k, v) {
    try { localStorage.setItem(NS + k, JSON.stringify(v)); } catch (e) {}
  }
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
  function num(v, d) { var n = parseFloat(v); return isFinite(n) ? n : d; }
  function median(arr) {
    if (!arr.length) return null;
    var a = arr.slice().sort(function (x, y) { return x - y; });
    var m = Math.floor(a.length / 2);
    return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
  }

  /* ================= 0. 目标选择器 ================= */
  var GOAL_KEY = "goal";
  var curGoal = lsGet(GOAL_KEY, "");

  function goalObj(k) {
    for (var i = 0; i < A2.GOALS.length; i++) if (A2.GOALS[i].k === k) return A2.GOALS[i];
    return null;
  }

  function renderGoal() {
    var box = $("#goalopts");
    if (!box) return;
    box.innerHTML = A2.GOALS.map(function (g) {
      return '<button class="goalopt' + (g.k === curGoal ? " on" : "") + '" data-g="' + g.k + '" type="button">' +
        '<span class="g-n"><span class="g-k">' + g.k + '</span>' + esc(g.name) + '</span>' +
        '<span class="g-d">' + esc(g.desc) + '</span>' +
        '</button>';
    }).join("");

    Array.prototype.forEach.call(box.querySelectorAll(".goalopt"), function (b) {
      b.addEventListener("click", function () {
        var k = b.getAttribute("data-g");
        curGoal = (curGoal === k) ? "" : k;
        lsSet(GOAL_KEY, curGoal);
        renderGoal();
        renderGoalOut();
        renderProj();
        renderCap();
      });
    });
  }

  function renderGoalOut() {
    var box = $("#goal-out");
    var chip = $("#hero-goal-chip");
    if (!box) return;
    var g = goalObj(curGoal);

    if (!g) {
      box.innerHTML = '<div class="go"><b>当前未选择目标</b>本页默认按"最大化选择权"给出建议。选定目标后，证书策略、项目侧重与薪资口径会随目标调整。</div>';
      if (chip) { chip.className = "gchip gray"; chip.textContent = "目标未设定"; }
      return;
    }
    if (chip) { chip.className = "gchip"; chip.textContent = "当前目标：" + g.short; }
    box.innerHTML =
      '<div class="go"><b>本目标下的证书策略</b>' + esc(g.certAdvice) + '</div>' +
      '<div class="go"><b>项目侧重点</b>' + esc(g.projectFocus) + '</div>' +
      '<div class="go"><b>薪资口径</b>' + esc(g.salaryNote) + '</div>' +
      '<div class="go warn"><b>这个选择的主要风险</b>' + esc(g.risk) + '</div>';
  }

  /* ================= 1. 优先级矩阵 ================= */
  function renderPrio() {
    var box = $("#prio");
    if (!box) return;
    box.innerHTML = A2.PRIORITY.map(function (L) {
      var items = L.items.map(function (it) {
        return '<div class="prio-item">' +
          '<div class="pi-n">' + esc(it.n) + '<small>建议时间：' + esc(it.when) + '</small></div>' +
          '<div class="pi-std">' + esc(it.std) + '</div>' +
          '<div class="pi-chk"><b>验收：</b>' + esc(it.check) + '</div>' +
          (it.risk && it.risk !== "—" ? '<div class="pi-risk">' + esc(it.risk) + '</div>' : '') +
          '</div>';
      }).join("");
      return '<div class="prio-block pl-' + L.key + '">' +
        '<div class="prio-head"><span class="pl-badge">' + L.lv + '</span>' +
        '<h4>' + esc(L.title) + '</h4>' +
        '<p>' + esc(L.note) + '</p></div>' +
        '<div class="prio-body">' + items + '</div>' +
        '</div>';
    }).join("");
  }

  /* ================= 2. 项目实战中心 ================= */
  var DV_KEY = "deliv";

  function renderProj() {
    var box = $("#proj-list");
    if (!box) return;
    var dv = lsGet(DV_KEY, {});
    var g = goalObj(curGoal);

    box.innerHTML = A2.PROJECTS.map(function (p, pi) {
      var doneN = p.deliverables.filter(function (d) { return dv[d.id]; }).length;
      var pct = Math.round((doneN / p.deliverables.length) * 100);

      var tasks = p.tasks.map(function (t, i) {
        return '<div class="proj-task"><span class="pt-idx">' + (i + 1) + '</span>' +
          '<div><div class="pt-n">' + esc(t.n) + '</div><div class="pt-d">' + esc(t.d) + '</div></div></div>';
      }).join("");

      var dels = p.deliverables.map(function (d) {
        return '<label class="dv' + (dv[d.id] ? " on" : "") + '">' +
          '<input type="checkbox" data-dv="' + d.id + '"' + (dv[d.id] ? " checked" : "") + '>' +
          '<span class="dv-t">' + esc(d.n) + '</span></label>';
      }).join("");

      var hl = "";
      if (g) {
        var isKey = (curGoal === "A" && pi >= 1) || (curGoal === "B" && pi === 0) ||
          (curGoal === "C" && (pi === 1 || pi === 2)) || (curGoal === "D" && pi <= 1);
        if (isKey) hl = '<span class="pill p-brand">本目标优先</span>';
      }

      return '<div class="proj">' +
        '<div class="proj-h"><span class="pj-stage">' + esc(p.stage) + '</span>' +
        '<h4>' + esc(p.name) + '</h4>' +
        '<span class="pj-term">' + esc(p.term) + '</span><span class="grow"></span>' + hl +
        '<span class="pill p-gray">交付物 ' + doneN + '/' + p.deliverables.length + ' · ' + pct + '%</span></div>' +
        '<div class="proj-b">' +
        '<p class="proj-goal">' + esc(p.goal) + '</p>' +
        '<div class="proj-cols">' +
        '<div class="proj-col"><h5>任务分解</h5>' + tasks + '</div>' +
        '<div class="proj-col"><h5>必须交付的成果</h5>' + dels + '</div>' +
        '</div>' +
        '<div class="proj-foot">' +
        '<div class="proj-accept"><b>验收标准</b>' + esc(p.accept) + '</div>' +
        '<div class="proj-truth"><b>必须清醒的一点</b>' + esc(p.truth) + '</div>' +
        '</div></div></div>';
    }).join("");

    Array.prototype.forEach.call(box.querySelectorAll("input[data-dv]"), function (cb) {
      cb.addEventListener("change", function () {
        var st = lsGet(DV_KEY, {});
        st[cb.getAttribute("data-dv")] = cb.checked;
        lsSet(DV_KEY, st);
        var lab = cb.parentNode;
        if (lab) lab.classList.toggle("on", cb.checked);
        renderProj();
      });
    });
  }

  /* ================= 3. 能力自评 ================= */
  var CAP_KEY = "cap";

  function capState() {
    var s = lsGet(CAP_KEY, {});
    A2.CAP_DIMS.forEach(function (d) {
      d.items.forEach(function (it, i) {
        var k = d.id + "|" + i;
        if (typeof s[k] !== "number") s[k] = 0;
      });
    });
    return s;
  }

  function renderCap() {
    var box = $("#cap-dims");
    if (!box) return;
    var st = capState();

    box.innerHTML = A2.CAP_DIMS.map(function (d) {
      var rows = d.items.map(function (it, i) {
        var k = d.id + "|" + i, v = st[k] || 0;
        var segs = A2.LEVELS.map(function (L) {
          return '<button class="seg' + (L.lv === v ? " on" : "") + '" type="button" ' +
            'data-k="' + k + '" data-v="' + L.lv + '" ' +
            'style="' + (L.lv === v ? "background:" + L.color + ";border-color:" + L.color : "") + '" ' +
            'title="' + esc(L.t + " · " + L.d) + '">' + (L.lv === 0 ? "—" : L.t) + '</button>';
        }).join("");
        return '<div class="cap-row"><div class="cr-n">' + esc(it.n) + '<small>达标：' + esc(it.max) + '</small></div>' +
          '<div class="segs">' + segs + '</div></div>';
      }).join("");

      return '<div class="cap-dim"><div class="cap-dim-h">' +
        '<span class="cd-dot" style="background:' + d.color + '"></span>' +
        '<b>' + esc(d.name) + '</b>' +
        '<span class="cd-score" data-score="' + d.id + '">—</span></div>' + rows + '</div>';
    }).join("");

    Array.prototype.forEach.call(box.querySelectorAll(".seg"), function (b) {
      b.addEventListener("click", function () {
        var st2 = capState();
        st2[b.getAttribute("data-k")] = parseInt(b.getAttribute("data-v"), 10);
        lsSet(CAP_KEY, st2);
        renderCap();
      });
    });

    renderCapSide();
  }

  function dimScore(d, st) {
    var sum = 0;
    d.items.forEach(function (it, i) {
      var lv = st[d.id + "|" + i] || 0;
      sum += A2.LEVELS[lv].score;
    });
    return Math.round(sum / d.items.length);
  }

  function renderCapSide() {
    var side = $("#cap-side");
    if (!side) return;
    var st = capState();
    var scores = A2.CAP_DIMS.map(function (d) { return { d: d, s: dimScore(d, st) }; });
    var total = Math.round(scores.reduce(function (a, x) { return a + x.s; }, 0) / scores.length);

    Array.prototype.forEach.call(document.querySelectorAll("[data-score]"), function (el) {
      for (var i = 0; i < scores.length; i++) {
        if (scores[i].d.id === el.getAttribute("data-score")) {
          el.textContent = scores[i].s + " / 100";
          el.style.color = scores[i].s >= 80 ? "var(--ok)" : scores[i].s >= 55 ? "var(--brand)" : "var(--warn)";
        }
      }
    });

    var weakest = scores.slice().sort(function (a, b) { return a.s - b.s; })[0];
    var g = goalObj(curGoal);

    var tip = "";
    if (total === 0) {
      tip = "先按真实水平自评一遍（不要往高里填）。只有达到「独立完成」与「能排障」两级，才算真正具备实操能力。";
    } else if (g) {
      tip = "目标「" + g.short + "」下，当前最该补的是<b>" + weakest.d.name + "</b>（" + weakest.s + "/100）。该目标的侧重点：" + g.focus.join(" · ") + "。";
    } else {
      tip = "当前最薄弱的维度是<b>" + weakest.d.name + "</b>（" + weakest.s + "/100）。建议先在这一点上做一次真实交付，而不是继续横向铺开。";
    }

    side.innerHTML =
      '<div class="cap-total">' +
      '<div class="ct-num">' + total + '<small> /100</small></div>' +
      '<div class="ct-lbl">综合能力自评（四维均值）</div>' +
      '<div class="cap-bar"><i style="width:' + total + '%"></i></div>' +
      '<div class="cap-legend">' +
      scores.map(function (x) {
        return '<div><i style="background:' + x.d.color + '"></i>' + esc(x.d.name) +
          '<span style="margin-left:auto;font-weight:800;color:var(--ink-2)">' + x.s + '</span></div>';
      }).join("") +
      '</div>' +
      '<div class="cap-tip">' + tip + '</div>' +
      '</div>';
  }

  /* ================= 4. 招聘样本池 ================= */
  var JOB_KEY = "jobs";
  var jobFilter = { city: "all" };

  function jobs() {
    var list = lsGet(JOB_KEY, null);
    if (!list) {
      list = A2.JOB_SEED.slice();
      lsSet(JOB_KEY, list);
    }
    return list;
  }

  function renderJobForm() {
    var box = $("#job-form");
    if (!box) return;
    box.innerHTML = A2.JOB_FIELDS.map(function (f) {
      var input;
      if (f.type === "select") {
        input = '<select data-f="' + f.k + '">' + f.opts.map(function (o) {
          return '<option value="' + esc(o) + '">' + esc(o) + '</option>';
        }).join("") + '</select>';
      } else if (f.type === "date") {
        var t = new Date();
        var dv = t.getFullYear() + "-" + String(t.getMonth() + 1).padStart(2, "0") + "-" + String(t.getDate()).padStart(2, "0");
        input = '<input type="date" data-f="' + f.k + '" value="' + dv + '">';
      } else {
        input = '<input type="' + f.type + '" data-f="' + f.k + '" placeholder="' + esc(f.ph || "") + '">';
      }
      return '<div class="jf"><label>' + esc(f.t) + '</label>' + input + '</div>';
    }).join("") +
      '<div class="jf"><label>技能关键词（逗号分隔）</label><input type="text" data-f="skills" placeholder="路由交换,Linux"></div>' +
      '<div class="jf" style="align-self:end"><button class="btn" id="job-add" type="button" style="width:100%">录入样本</button></div>';
  }

  function renderJob() {
    var tb = $("#job-table");
    if (!tb) return;
    var list = jobs();
    var real = list.filter(function (j) { return !j.ex; });

    // 城市筛选按钮
    var fbox = $("#job-filter");
    if (fbox) {
      var cities = ["all"];
      list.forEach(function (j) { if (j.city && cities.indexOf(j.city) < 0) cities.push(j.city); });
      fbox.innerHTML = cities.map(function (c) {
        return '<button class="chip' + (jobFilter.city === c ? " on" : "") + '" data-city="' + esc(c) + '" type="button">' +
          (c === "all" ? "全部城市" : esc(c)) + '</button>';
      }).join("");
      Array.prototype.forEach.call(fbox.querySelectorAll("[data-city]"), function (b) {
        b.addEventListener("click", function () {
          jobFilter.city = b.getAttribute("data-city");
          renderJob();
        });
      });
    }

    var shown = list.filter(function (j) { return jobFilter.city === "all" || j.city === jobFilter.city; });

    if (!shown.length) {
      tb.innerHTML = '<tr><td colspan="9"><div class="empty">还没有样本。先到上方录入 5-10 条真实岗位，系统才会给出中位数与技能频次。</div></td></tr>';
    } else {
      tb.innerHTML = shown.map(function (j) {
        return '<tr>' +
          '<td class="num">' + esc(j.city) + '</td>' +
          '<td><b>' + esc(j.title) + '</b>' + (j.ex ? '<span class="tag-ex">示例</span>' : '') + '</td>' +
          '<td class="num">' + esc(j.edu) + '</td>' +
          '<td class="num">' + esc(j.exp) + '</td>' +
          '<td class="num"><b>' + j.payMin + 'K-' + j.payMax + 'K</b></td>' +
          '<td>' + (j.skills || []).join("、") + '</td>' +
          '<td>' + esc(j.cert || "—") + '</td>' +
          '<td class="num">' + esc(j.date) + '</td>' +
          '<td class="num"><span class="wt-x" data-del="' + j.id + '" title="删除">×</span></td>' +
          '</tr>';
      }).join("");
    }

    Array.prototype.forEach.call(tb.querySelectorAll("[data-del]"), function (x) {
      x.addEventListener("click", function () {
        var id = x.getAttribute("data-del");
        var l = jobs().filter(function (j) { return j.id !== id; });
        lsSet(JOB_KEY, l);
        renderJob();
      });
    });

    // 统计
    var stat = $("#job-stat");
    if (stat) {
      var mids = real.map(function (j) { return (num(j.payMin, 0) + num(j.payMax, 0)) / 2; }).filter(function (v) { return v > 0; });
      var med = median(mids);
      var dates = real.map(function (j) { return j.date; }).filter(Boolean).sort();
      stat.innerHTML =
        '<div class="js' + (real.length < 10 ? " warn" : "") + '"><b>' + real.length + '</b><span>有效样本数（不含示例）</span></div>' +
        '<div class="js"><b>' + (med == null ? "—" : med.toFixed(1) + "K") + '</b><span>薪资中位数（区间中点）</span></div>' +
        '<div class="js"><b>' + (real.length ? Math.min.apply(null, real.map(function (j) { return num(j.payMin, 0); })) + "K" : "—") + '</b><span>最低下限</span></div>' +
        '<div class="js"><b>' + (real.length ? Math.max.apply(null, real.map(function (j) { return num(j.payMax, 0); })) + "K" : "—") + '</b><span>最高上限</span></div>' +
        '<div class="js' + (real.length < 10 ? " warn" : "") + '"><b>' + (dates.length ? dates[dates.length - 1] : "—") + '</b><span>最新采集日期</span></div>' +
        (real.length < 10 ? '<div class="js warn" style="grid-column:1/-1"><b style="font-size:13px">样本不足 10 条，中位数不具备参考意义</b><span>建议每月固定采集一次，累计 20 条以上再用于判断</span></div>' : '');
    }

    // 技能频次
    var sk = $("#job-skill");
    if (sk) {
      var cnt = {};
      real.forEach(function (j) {
        (j.skills || []).forEach(function (s) {
          if (!s) return;
          cnt[s] = (cnt[s] || 0) + 1;
        });
      });
      var arr = Object.keys(cnt).map(function (k) { return { k: k, v: cnt[k] }; })
        .sort(function (a, b) { return b.v - a.v; }).slice(0, 8);
      var maxv = arr.length ? arr[0].v : 1;
      sk.innerHTML = arr.length
        ? arr.map(function (x) {
          return '<div class="sfrow"><span>' + esc(x.k) + '</span>' +
            '<span class="sfbar"><i style="width:' + Math.round((x.v / maxv) * 100) + '%"></i></span>' +
            '<b style="font-size:12px;color:var(--muted)">' + x.v + '</b></div>';
        }).join("")
        : '<div class="empty">录入样本后自动统计高频技能，用真实需求决定下一阶段学什么。</div>';
    }
  }

  function initJob() {
    renderJobForm();
    var add = $("#job-add");
    if (add) {
      add.addEventListener("click", function () {
        var o = { id: "j" + Date.now(), ex: false };
        Array.prototype.forEach.call(document.querySelectorAll("#job-form [data-f]"), function (inp) {
          var k = inp.getAttribute("data-f");
          o[k] = inp.value.trim();
        });
        o.payMin = num(o.payMin, 0);
        o.payMax = num(o.payMax, o.payMin);
        o.skills = (o.skills || "").split(/[,，、\s]+/).filter(Boolean);
        if (!o.title) { alert("请先填写岗位名称"); return; }
        var l = jobs();
        l.push(o);
        lsSet(JOB_KEY, l);
        renderJob();
        Array.prototype.forEach.call(document.querySelectorAll("#job-form [data-f]"), function (inp) {
          if (inp.type === "text" || inp.type === "number") inp.value = "";
        });
      });
    }
    var clr = $("#job-clear");
    if (clr) {
      clr.addEventListener("click", function () {
        if (!confirm("将清空所有招聘样本（包括示例），确定吗？")) return;
        lsSet(JOB_KEY, []);
        renderJob();
      });
    }
    renderJob();
  }

  /* ================= 5. 专升本决策 ================= */
  function renderZsb() {
    var p = $("#zsb-policy");
    if (p) {
      p.innerHTML = '<div class="tbox"><table class="tb compact"><thead><tr><th style="min-width:96px">项目</th><th>说明</th><th style="min-width:76px">状态</th></tr></thead><tbody>' +
        A2.ZSB.policy.map(function (x) {
          var cls = x.st === "需核实" ? "st-wait" : "st-ok";
          return '<tr><td><b>' + esc(x.k) + '</b></td><td>' + esc(x.v) + '</td><td><span class="st ' + cls + '">' + esc(x.st) + '</span></td></tr>';
        }).join("") + '</tbody></table></div>' +
        '<div class="note warn" style="margin-top:12px"><b>说明：</b>以上为政策框架性描述，具体比例、资格与时间每年均可能调整。执行前必须到 <a href="https://www.sdzk.cn" target="_blank" rel="noopener">山东省教育招生考试院</a> 核对当年文件。</div>';
    }

    var c = $("#zsb-cmp");
    if (c) {
      c.innerHTML = '<div class="tbox"><table class="cmp"><thead><tr><th>对比维度</th><th class="col-a">路径 A · 直接就业</th><th class="col-b">路径 B · 专升本</th></tr></thead><tbody>' +
        A2.ZSB.compare.map(function (r) {
          return '<tr><td>' + esc(r.dim) + '</td><td class="col-a">' + esc(r.a) + '</td><td class="col-b">' + esc(r.b) + '</td></tr>';
        }).join("") + '</tbody></table></div>';
    }

    var tl = $("#zsb-tl");
    if (tl) {
      tl.innerHTML = A2.ZSB.timeline.map(function (x) {
        return '<div class="tl-item"><div class="t-when">' + esc(x.w) + '</div>' +
          '<div class="t-title">' + esc(x.t) + '</div><p class="t-desc">' + esc(x.d) + '</p></div>';
      }).join("");
    }
  }

  /* ================= 5.5 城市进阶路径 ================= */
  function renderCity() {
    var box = $("#city-ladder");
    if (box) {
      box.innerHTML = A2.CITY_LADDER.map(function (c, i) {
        return '<div class="lstep">' +
          '<div class="ls-h"><span class="ls-idx">' + (i + 1) + '</span>' +
          '<div><b>' + esc(c.name) + '</b><span>' + esc(c.stage) + ' · ' + esc(c.term) + '</span></div></div>' +
          '<div class="ls-b">' +
          '<div class="ls-row"><dt>岗位</dt><dd>' + esc(c.role) + '</dd></div>' +
          '<div class="ls-row"><dt>薪资区间</dt><dd class="ls-pay">' + esc(c.pay) + '</dd></div>' +
          '<div class="ls-row"><dt>生活成本</dt><dd>' + esc(c.cost) + '</dd></div>' +
          '<div class="ls-why">' + esc(c.why) + '</div>' +
          '<div class="ls-need"><b>能力门槛</b>' + c.need.map(function (n) { return '<span>' + esc(n) + '</span>'; }).join("") + '</div>' +
          '<div class="ls-risk"><b>风险</b>' + esc(c.risk) + '</div>' +
          '</div></div>';
      }).join("");
    }

    var nb = $("#city-notes");
    if (nb) {
      nb.innerHTML = A2.CITY_NOTES.map(function (x) {
        return '<div class="citynote"><b>' + esc(x.t) + '</b><p>' + esc(x.d) + '</p></div>';
      }).join("");
    }
  }

  /* ================= 6. 周计划与复盘 ================= */
  var WEEK_KEY = "week";
  var weekTerm = A2.WEEK_POOL[0].term;

  function weekData() {
    var d = lsGet(WEEK_KEY, null);
    if (!d || !d.list) d = { term: A2.WEEK_POOL[0].term, list: [] };
    return d;
  }
  function saveWeek(d) { lsSet(WEEK_KEY, d); }

  function renderWeek() {
    var btns = $("#week-pool-btns");
    if (!btns) return;
    var d = weekData();

    btns.innerHTML = A2.WEEK_POOL.map(function (g) {
      return '<button class="chip' + (g.term === weekTerm ? " on" : "") + '" data-term="' + esc(g.term) + '" type="button">' + esc(g.term) + '</button>';
    }).join("");
    Array.prototype.forEach.call(btns.querySelectorAll("[data-term]"), function (b) {
      b.addEventListener("click", function () {
        weekTerm = b.getAttribute("data-term");
        renderWeek();
      });
    });

    var pool = $("#week-pool-list");
    if (pool) {
      var g = null;
      A2.WEEK_POOL.forEach(function (x) { if (x.term === weekTerm) g = x; });
      if (g) {
        pool.innerHTML = g.items.map(function (t, i) {
          var inList = d.list.some(function (x) { return x.n === t; });
          return '<label class="wpool-item"><input type="checkbox" data-add="' + i + '"' + (inList ? " checked disabled" : "") + '>' +
            '<span>' + esc(t) + '</span></label>';
        }).join("");
        Array.prototype.forEach.call(pool.querySelectorAll("[data-add]"), function (cb) {
          cb.addEventListener("change", function () {
            var idx = parseInt(cb.getAttribute("data-add"), 10);
            var t = g.items[idx];
            var cur = weekData();
            if (!cur.list.some(function (x) { return x.n === t; })) {
              cur.list.push({ id: "w" + Date.now(), n: t, done: false });
              saveWeek(cur);
              renderWeek();
            }
          });
        });
      }
    }

    var wl = $("#week-list");
    var dd = weekData();
    if (wl) {
      if (!dd.list.length) {
        wl.innerHTML = '<div class="empty">本周还没有任务。从左侧任务池勾选，或先定 3 件必须完成的事。</div>';
      } else {
        wl.innerHTML = dd.list.map(function (x) {
          return '<div class="wtask' + (x.done ? " done" : "") + '">' +
            '<input type="checkbox" data-wt="' + x.id + '"' + (x.done ? " checked" : "") + ' style="margin-top:3px;accent-color:var(--ok)">' +
            '<span class="wt-t">' + esc(x.n) + '</span>' +
            '<span class="wt-x" data-wdel="' + x.id + '">×</span></div>';
        }).join("");
        Array.prototype.forEach.call(wl.querySelectorAll("[data-wt]"), function (cb) {
          cb.addEventListener("change", function () {
            var id = cb.getAttribute("data-wt"), cur = weekData();
            cur.list.forEach(function (x) { if (x.id === id) x.done = cb.checked; });
            saveWeek(cur);
            renderWeek();
          });
        });
        Array.prototype.forEach.call(wl.querySelectorAll("[data-wdel]"), function (x) {
          x.addEventListener("click", function () {
            var id = x.getAttribute("data-wdel"), cur = weekData();
            cur.list = cur.list.filter(function (t) { return t.id !== id; });
            saveWeek(cur);
            renderWeek();
          });
        });
      }
    }

    var st = $("#week-stats");
    if (st) {
      var t = dd.list.length, dn = dd.list.filter(function (x) { return x.done; }).length;
      var pr = t ? Math.round((dn / t) * 100) : 0;
      st.innerHTML = '<span>本周任务 <b>' + t + '</b> 项</span>' +
        '<span>已完成 <b>' + dn + '</b> 项</span>' +
        '<span>完成率 <b style="color:' + (pr >= 70 ? "var(--ok)" : pr >= 40 ? "var(--warn)" : "var(--danger)") + '">' + pr + '%</b></span>';
    }
  }

  function buildReport() {
    var d = weekData();
    var t = d.list.length, dn = d.list.filter(function (x) { return x.done; }).length;
    var pr = t ? Math.round((dn / t) * 100) : 0;
    var now = new Date();
    var ds = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0") + "-" + String(now.getDate()).padStart(2, "0");

    var lines = [];
    lines.push("【周复盘】" + ds + "（" + weekTerm + "）");
    lines.push("");
    lines.push("一、完成情况：" + dn + "/" + t + "，完成率 " + pr + "%");
    if (d.list.length) {
      d.list.forEach(function (x) { lines.push("  " + (x.done ? "[x] " : "[ ] ") + x.n); });
    } else {
      lines.push("  （本周未设定任务）");
    }
    lines.push("");
    lines.push("二、未完成项及原因（自己填）：");
    d.list.filter(function (x) { return !x.done; }).forEach(function (x) { lines.push("  - " + x.n + " → 原因：______"); });
    if (!d.list.filter(function (x) { return !x.done; }).length) lines.push("  - 无");
    lines.push("");
    lines.push("三、本周新增可验证成果：");
    lines.push("  - 交付物：______（配置文件 / 截图 / 文档 / 仓库提交）");
    lines.push("  - 排障记录：______（现象 → 原因 → 处理）");
    lines.push("");
    lines.push("四、仍不确定的知识点：");
    lines.push("  - ______");
    lines.push("");
    lines.push("五、下周优先级（只写 3 条）：");
    lines.push("  1. ______   2. ______   3. ______");
    return lines.join("\n");
  }

  function initWeek() {
    renderWeek();
    var rep = $("#week-report");
    var gen = $("#week-report-btn");
    if (gen) {
      gen.addEventListener("click", function () {
        if (!rep) return;
        rep.textContent = buildReport();
        rep.classList.toggle("show");
        gen.textContent = rep.classList.contains("show") ? "收起周报" : "生成本周复盘";
      });
    }
    var cp = $("#week-copy");
    if (cp) {
      cp.addEventListener("click", function () {
        var txt = buildReport();
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(txt).then(function () {
            cp.textContent = "已复制";
            setTimeout(function () { cp.textContent = "复制周报"; }, 1600);
          });
        } else {
          var ta = document.createElement("textarea");
          ta.value = txt; document.body.appendChild(ta); ta.select();
          try { document.execCommand("copy"); cp.textContent = "已复制"; } catch (e) {}
          document.body.removeChild(ta);
          setTimeout(function () { cp.textContent = "复制周报"; }, 1600);
        }
      });
    }
    var cl = $("#week-clear");
    if (cl) {
      cl.addEventListener("click", function () {
        if (!confirm("清空本周任务清单？")) return;
        saveWeek({ term: weekTerm, list: [] });
        renderWeek();
      });
    }
  }

  /* ================= 7. 数据来源中心 ================= */
  function renderSrc() {
    var tb = $("#src-table");
    if (!tb) return;
    var ok = 0, wait = 0, est = 0;
    A2.SOURCES.forEach(function (s) { if (s.st === "ok") ok++; else if (s.st === "wait") wait++; else est++; });

    var stat = $("#src-stat");
    if (stat) {
      stat.innerHTML =
        '<div class="js"><b style="color:var(--ok)">' + ok + '</b><span>已核实（附官方链接）</span></div>' +
        '<div class="js warn"><b>' + wait + '</b><span>待核实（有出处但缺日期/口径）</span></div>' +
        '<div class="js"><b style="color:var(--danger)">' + est + '</b><span>估算（不确定区间）</span></div>';
    }

    var map = { ok: "已核实", wait: "待核实", est: "估算" };
    var cls = { ok: "st-ok", wait: "st-wait", est: "st-est" };

    tb.innerHTML = A2.SOURCES.map(function (s) {
      return '<tr><td><b>' + esc(s.point) + '</b><div class="srcnote">' + esc(s.note) + '</div></td>' +
        '<td>' + esc(s.org) + '</td>' +
        '<td class="num">' + esc(s.date) + '</td>' +
        '<td>' + esc(s.scope) + '</td>' +
        '<td><span class="st ' + cls[s.st] + '">' + map[s.st] + '</span></td>' +
        '<td class="num">' + (s.url ? '<a href="' + esc(s.url) + '" target="_blank" rel="noopener">官方入口 ↗</a>' : '<span style="color:var(--muted-2)">—</span>') + '</td>' +
        '</tr>';
    }).join("");
  }

  /* ================= 启动 ================= */
  function boot() {
    renderGoal();
    renderGoalOut();
    renderPrio();
    renderProj();
    renderCap();
    initJob();
    renderZsb();
    renderCity();
    initWeek();
    renderSrc();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
