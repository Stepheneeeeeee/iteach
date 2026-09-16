/* =========================================================
 * 算法智学 · 应用主逻辑（SPA 路由 + 五大模块）
 * ========================================================= */
"use strict";

/* ---------- 本地数据存储（学习记录） ---------- */
const Store = {
  KEY: "jte_state_v2",
  def: () => ({ learned: [], quizResults: [], wrong: [], stats: { taken: 0, total: 0, correct: 0 } }),
  get() {
    try {
      const s = JSON.parse(localStorage.getItem(this.KEY));
      return s ? Object.assign(this.def(), s) : this.def();
    } catch (e) { return this.def(); }
  },
  save(s) { try { localStorage.setItem(this.KEY, JSON.stringify(s)); } catch (e) {} },
  reset() { try { localStorage.removeItem(this.KEY); } catch (e) {} }
};

/* ---------- 应用 ---------- */
const App = {
  store: Store.get(),
  page: "dashboard",
  kpFilter: "全部",
  algo: { algo: "bubble", size: 8, data: [], steps: [], idx: 0, playing: false, timer: null, speedMs: 350 },
  quiz: null,
  demoMode: false,

  init() {
    document.getElementById("main-nav").addEventListener("click", e => {
      const btn = e.target.closest(".nav-item");
      if (btn) this.go(btn.dataset.page);
    });
    this.go("dashboard");
  },

  go(page) {
    this.page = page;
    document.querySelectorAll(".nav-item").forEach(b => b.classList.toggle("active", b.dataset.page === page));
    const titles = { dashboard: "学习仪表盘", lab: "算法实验室", knowledge: "知识点库", quiz: "随堂测验", analytics: "学情分析" };
    document.getElementById("page-title").textContent = titles[page];
    const el = document.getElementById("page-content");
    if (page === "dashboard") this.renderDashboard(el);
    else if (page === "lab") this.renderLab(el);
    else if (page === "knowledge") this.renderKnowledge(el);
    else if (page === "quiz") this.renderQuizHome(el);
    else this.renderAnalytics(el);
    window.scrollTo(0, 0);
  },

  /* ================= 数据统计 ================= */
  masteryMap() {
    const map = {};
    CHAPTERS.forEach(ch => { map[ch] = { correct: 0, total: 0, learned: 0, kCount: 0 }; });
    this.store.quizResults.forEach(r => {
      if (map[r.chapter]) { map[r.chapter].correct += r.correct; map[r.chapter].total += r.total; }
    });
    this.store.learned.forEach(id => {
      const k = KNOWLEDGE.find(x => x.id === id);
      if (k && map[k.chapter]) map[k.chapter].learned++;
    });
    CHAPTERS.forEach(ch => { map[ch].kCount = getKnowledgeByChapter(ch).length; });
    return map;
  },
  masteryScore(map, ch) {
    const m = map[ch];
    if (!m || !m.kCount) return 0;
    const qAcc = m.total ? m.correct / m.total : 0;
    const kAcc = m.learned / m.kCount;
    return Math.round(100 * (0.6 * qAcc + 0.4 * kAcc));
  },
  avgCorrect() {
    const s = this.store.stats;
    return s.total ? Math.round(s.correct / s.total * 100) : 0;
  },
  todayStr() {
    const d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  },

  /* ================= 学习仪表盘 ================= */
  renderDashboard(el) {
    const s = this.store;
    const map = this.masteryMap();
    const learnedCount = s.learned.length;
    const scores = CHAPTERS.map(ch => this.masteryScore(map, ch));
    const avgMastery = Math.round(scores.reduce((a, b) => a + b, 0) / Math.max(1, scores.length));

    const stats = [
      { v: learnedCount + "/" + KNOWLEDGE.length, l: "已学知识点" },
      { v: s.stats.taken, l: "完成测验（次）" },
      { v: this.avgCorrect() + "%", l: "平均正确率" },
      { v: avgMastery, l: "平均掌握度" }
    ];
    const hasData = s.stats.taken > 0 || learnedCount > 0;

    el.innerHTML = `
      <div class="hero">
        <h2>同学，欢迎回到算法智学</h2>
        <p>本系统面向高校《数据结构与算法》课程，提供「排序算法可视化实验室」「知识点库」「随堂测验」「学情分析」一体化学习支持：把抽象算法变成可逐步观察的动画，让复杂逻辑一目了然。</p>
        <div class="actions">
          <button class="btn" onclick="App.go('lab')">进入算法实验室</button>
          <button class="btn" onclick="App.go('quiz')">开始随堂测验</button>
        </div>
      </div>
      <div class="grid grid-4">
        ${stats.map(x => `<div class="card stat-card"><div class="stat-value">${x.v}</div><div class="stat-label">${x.l}</div></div>`).join("")}
      </div>
      <div class="grid grid-2">
        <div class="card">
          <div class="card-title">最近测验成绩趋势<span class="sub">单位：正确率 %</span></div>
          <div id="dash-line" style="height:230px"></div>
        </div>
        <div class="card">
          <div class="card-title">章节掌握度 TOP 5</div>
          <div id="dash-hbar" style="height:230px"></div>
        </div>
      </div>
      <div class="card">
        <div class="card-title">学习建议</div>
        ${hasData ? this.buildAdvice(map) : `<div class="empty"><div class="big">📖</div><p>还没有学习记录。</p><p>先去「算法实验室」播放一次排序动画，或完成一次「随堂测验」，系统将自动生成学情画像与建议。</p></div>`}
      </div>`;

    const results = s.quizResults.slice(-6);
    const lineEl = document.getElementById("dash-line");
    const hbarEl = document.getElementById("dash-hbar");
    if (results.length >= 1) {
      Charts.lineChart(lineEl, {
        labels: results.map((r, i) => "第" + (s.quizResults.length - results.length + i + 1) + "次"),
        values: results.map(r => Math.round(r.correct / r.total * 100)),
        unit: "%", fill: true
      });
    } else {
      lineEl.innerHTML = `<div class="empty"><p>暂无测验数据，完成一次测验后这里将展示成绩趋势。</p></div>`;
    }
    const top = CHAPTERS.map((ch, i) => ({ ch, sc: scores[i] }))
      .filter(x => x.sc > 0).sort((a, b) => b.sc - a.sc).slice(0, 5);
    if (top.length) {
      Charts.hBarChart(hbarEl, { labels: top.map(t => t.ch), values: top.map(t => t.sc), unit: "" });
    } else {
      hbarEl.innerHTML = `<div class="empty"><p>暂无掌握度数据。</p></div>`;
    }
  },

  buildAdvice(map) {
    const weak = CHAPTERS.filter(ch => this.masteryScore(map, ch) < 40 && this.masteryScore(map, ch) > 0)
      .concat(CHAPTERS.filter(ch => this.masteryScore(map, ch) === 0 && map[ch].kCount > 0)).slice(0, 3);
    const lines = [];
    if (this.store.wrong.length) {
      const worst = this.store.wrong.slice(-3).map(w => QUIZ_QUESTIONS.find(q => q.id === w.qid)).filter(Boolean);
      if (worst.length) {
        const chs = [...new Set(worst.map(q => q.chapter))].slice(0, 2);
        lines.push("近期错题集中在「" + chs.join("」「") + "」章节，建议先回到知识点库复习对应内容，再针对性重做测验。");
      }
    }
    if (weak.length) {
      lines.push("「" + weak.join("」「") + "」掌握度偏低，建议优先学习这些章节的知识点卡片，并用算法实验室观察相关排序/查找过程的逐步变化。");
    }
    if (!lines.length) lines.push("当前学习状态良好。可尝试挑战新的章节测验，或在算法实验室中比较不同排序算法的比较次数与交换次数，加深复杂度理解。");
    return `<ul>${lines.map(l => `<li>${l}</li>`).join("")}</ul>`;
  },

  /* ================= 算法实验室 ================= */
  renderLab(el) {
    const info = ALGO_INFO[this.algo.algo];
    el.innerHTML = `
      <div class="card">
        <div class="card-title">排序算法可视化实验室<span class="sub">逐步动画 · 伪代码同步高亮 · 实时统计</span></div>
        <div class="lab-layout">
          <div>
            <div class="ctrl-label">算法选择</div>
            <select class="select wide" id="algo-algo" onchange="App.algoAlgo()">
              ${ALGO_KEYS.map(k => `<option value="${k}" ${k === this.algo.algo ? "selected" : ""}>${ALGO_INFO[k].name}（${ALGO_INFO[k].cat}）</option>`).join("")}
            </select>
            <div class="ctrl-label">数据规模</div>
            <div class="form-row">
              <select class="select" id="algo-size" onchange="App.algoRandom()">
                ${[5, 6, 7, 8, 10, 12, 15].map(n => `<option value="${n}" ${n === this.algo.size ? "selected" : ""}>${n} 个元素</option>`).join("")}
              </select>
              <button class="btn btn-teal btn-sm" onclick="App.algoRandom()">随机生成</button>
            </div>
            <div class="ctrl-label">自定义序列（逗号分隔，2-20 个 1-999 的整数）</div>
            <div class="form-row">
              <input class="input wide" id="algo-custom" placeholder="如 5,3,8,1,9,2" onkeydown="if(event.key==='Enter')App.algoApplyCustom()">
              <button class="btn btn-ghost btn-sm" onclick="App.algoApplyCustom()">应用</button>
            </div>
            <div class="ctrl-label">播放控制</div>
            <div class="play-row">
              <button class="btn btn-ghost" onclick="App.algoReset()" title="重置">⏮</button>
              <button class="btn btn-ghost" onclick="App.algoPrev()" title="上一步">◀</button>
              <button class="btn btn-primary" id="algo-play-btn" onclick="App.algoToggle()">▶ 播放</button>
              <button class="btn btn-ghost" onclick="App.algoNext()" title="下一步">▶</button>
            </div>
            <div class="speed-row">
              <label>播放速度</label>
              <select class="select" id="algo-speed" onchange="App.algoSpeed()">
                <option value="800">慢速</option>
                <option value="350" selected>中速</option>
                <option value="120">快速</option>
              </select>
            </div>
            <div class="ctrl-label">执行统计</div>
            <div class="algo-stats">
              <div class="as-item"><div class="as-label">比较次数</div><div class="as-value" id="algo-cmp">0</div></div>
              <div class="as-item"><div class="as-label">交换 / 写入次数</div><div class="as-value" id="algo-swap">0</div></div>
            </div>
            <div class="ctrl-label">算法复杂度</div>
            <table class="cplx-table">
              <tr><td>最好时间</td><td><b>${info.best}</b></td></tr>
              <tr><td>平均时间</td><td><b>${info.avg}</b></td></tr>
              <tr><td>最坏时间</td><td><b style="color:var(--red)">${info.worst}</b></td></tr>
              <tr><td>空间复杂度</td><td>${info.space}</td></tr>
              <tr><td>稳定性</td><td>${info.stable}</td></tr>
            </table>
          </div>
          <div>
            <div class="bar-stage" id="algo-stage"></div>
            <div class="legend-row">
              <span><i style="background:#3b82f6"></i>未处理</span>
              <span><i style="background:#f97316"></i>正在比较</span>
              <span><i style="background:#e11d48"></i>正在交换</span>
              <span><i style="background:#0d9488"></i>基准 / 写入</span>
              <span><i style="background:#16a34a"></i>已就位</span>
            </div>
            <div class="card" style="margin-top:12px;padding:14px">
              <div class="card-title" style="margin-bottom:8px">伪代码 · <span style="color:var(--primary)">${info.name}</span></div>
              <div class="pseudo" id="algo-pseudo"></div>
              <div class="algo-desc" id="algo-desc">${info.desc}</div>
            </div>
          </div>
        </div>
      </div>`;
    this.algoInit();
  },

  algoInit() {
    this.algo.data = this.randomArray(this.algo.size);
    this.algoGen();
  },

  randomArray(n) {
    const arr = [];
    for (let i = 0; i < n; i++) arr.push(5 + Math.floor(Math.random() * 95));
    return arr;
  },

  algoGen() {
    const a = this.algo;
    a.steps = Array.from(AlgoEngine[a.algo](a.data));
    a.idx = 0;
    a.playing = false;
    if (a.timer) { clearInterval(a.timer); a.timer = null; }
    this.algoRender();
  },

  algoRender() {
    const a = this.algo;
    const step = a.steps[a.idx];
    const stage = document.getElementById("algo-stage");
    if (stage) AlgoRender.render(stage, step);
    const cmpEl = document.getElementById("algo-cmp");
    const swpEl = document.getElementById("algo-swap");
    if (cmpEl) cmpEl.textContent = step.cmpCount;
    if (swpEl) swpEl.textContent = step.swapCount;
    const pseudo = document.getElementById("algo-pseudo");
    if (pseudo) {
      const lines = ALGO_INFO[a.algo].pseudo;
      pseudo.innerHTML = lines.map((l, i) =>
        `<div class="pl ${i === step.line - 1 ? "active" : ""}">${l}</div>`).join("");
    }
    const desc = document.getElementById("algo-desc");
    if (desc) desc.textContent = step.desc + "　（步骤 " + (a.idx + 1) + " / " + a.steps.length + "）";
    const btn = document.getElementById("algo-play-btn");
    if (btn) btn.textContent = a.playing ? "⏸ 暂停" : "▶ 播放";
    const prevBtn = document.querySelector('.play-row .btn[onclick="App.algoPrev()"]');
    const nextBtn = document.querySelector('.play-row .btn[onclick="App.algoNext()"]');
    if (prevBtn) prevBtn.disabled = a.idx === 0;
    if (nextBtn) nextBtn.disabled = a.idx >= a.steps.length - 1;
  },

  algoAlgo() {
    this.algo.algo = document.getElementById("algo-algo").value;
    this.algoGen();
  },

  algoRandom() {
    const sel = document.getElementById("algo-size");
    this.algo.size = Number(sel ? sel.value : this.algo.size);
    this.algo.data = this.randomArray(this.algo.size);
    this.algoGen();
  },

  algoApplyCustom() {
    const inp = document.getElementById("algo-custom");
    const raw = (inp ? inp.value : "").trim();
    if (!raw) return;
    const arr = raw.split(/[,，\s]+/).map(x => Number(x)).filter(x => Number.isFinite(x) && x >= 1 && x <= 999);
    if (arr.length < 2 || arr.length > 20) {
      alert("请输入 2-20 个 1-999 之间的整数（逗号分隔）。");
      return;
    }
    this.algo.data = arr;
    this.algo.size = arr.length;
    const sizeSel = document.getElementById("algo-size");
    if (sizeSel && ![...sizeSel.options].some(o => Number(o.value) === arr.length)) {
      sizeSel.insertAdjacentHTML("beforeend", `<option value="${arr.length}" selected>${arr.length} 个元素</option>`);
    } else if (sizeSel) sizeSel.value = String(arr.length);
    this.algoGen();
  },

  algoSpeed() {
    this.algo.speedMs = Number(document.getElementById("algo-speed").value);
    if (this.algo.playing) {
      clearInterval(this.algo.timer);
      this.algoTimer();
    }
  },

  algoToggle() {
    if (this.algo.playing) this.algoPause(); else this.algoPlay();
  },

  algoPlay() {
    const a = this.algo;
    if (a.idx >= a.steps.length - 1) { a.idx = 0; }
    a.playing = true;
    this.algoTimer();
    this.algoRender();
  },

  algoTimer() {
    const a = this.algo;
    a.timer = setInterval(() => {
      if (a.idx < a.steps.length - 1) {
        a.idx++;
        this.algoRender();
      } else {
        a.playing = false;
        clearInterval(a.timer);
        a.timer = null;
        this.algoRender();
      }
    }, a.speedMs);
  },

  algoPause() {
    this.algo.playing = false;
    if (this.algo.timer) { clearInterval(this.algo.timer); this.algo.timer = null; }
    this.algoRender();
  },

  algoNext() {
    const a = this.algo;
    if (a.idx < a.steps.length - 1) { a.idx++; this.algoRender(); }
  },
  algoPrev() {
    const a = this.algo;
    if (a.idx > 0) { a.idx--; this.algoRender(); }
  },
  algoReset() {
    this.algoGen();
  },

  /* ================= 知识点库 ================= */
  renderKnowledge(el) {
    const list = this.kpFilter === "全部" ? KNOWLEDGE : getKnowledgeByChapter(this.kpFilter);
    const learned = new Set(this.store.learned);
    el.innerHTML = `
      <div class="card">
        <div class="card-title">数据结构与算法核心知识点<span class="sub">共 ${KNOWLEDGE.length} 个知识点 · 已学 ${this.store.learned.length} 个</span></div>
        <div class="chip-row">
          <span class="chip ${this.kpFilter === "全部" ? "active" : ""}" onclick="App.kpFilterBy('全部')">全部</span>
          ${CHAPTERS.map(ch => `<span class="chip ${this.kpFilter === ch ? "active" : ""}" onclick="App.kpFilterBy('${ch}')">${ch}</span>`).join("")}
        </div>
        <div class="kp-grid">
          ${list.map(k => `
            <div class="kp-card">
              <div class="kp-head">
                <h3>${k.title}</h3>
                <span class="tag tag-chapter">${k.chapter}</span>
              </div>
              <div class="kp-sum">${k.summary}</div>
              <div class="kp-formula">${k.formula}</div>
              <div class="kp-tip">${k.tip}</div>
              <div class="kp-foot">
                <span>${learned.has(k.id) ? '<span class="tag tag-ok">✓ 已掌握</span>' : ""}</span>
                <button class="btn ${learned.has(k.id) ? "btn-ghost" : "btn-teal"} btn-sm" onclick="App.kpLearn('${k.id}')">${learned.has(k.id) ? "撤销标记" : "标记为已学"}</button>
              </div>
            </div>`).join("")}
        </div>
      </div>`;
  },

  kpFilterBy(ch) {
    this.kpFilter = ch;
    this.renderKnowledge(document.getElementById("page-content"));
  },

  kpLearn(id) {
    const s = this.store;
    const i = s.learned.indexOf(id);
    if (i >= 0) s.learned.splice(i, 1); else s.learned.push(id);
    Store.save(s);
    this.renderKnowledge(document.getElementById("page-content"));
  },

  /* ================= 随堂测验 ================= */
  renderQuizHome(el) {
    el.innerHTML = `
      <div class="card">
        <div class="card-title">随堂测验<span class="sub">自动批改 · 即时解析 · 成绩自动计入学情分析</span></div>
        <div class="form-row">
          <label>测验章节</label>
          <select class="select" id="quiz-chapter">
            <option value="全部">全部章节（综合卷）</option>
            ${CHAPTERS.map(ch => `<option value="${ch}">${ch}</option>`).join("")}
          </select>
        </div>
        <div class="form-row">
          <label>题目数量</label>
          <select class="select" id="quiz-count">
            <option value="10" selected>10 题</option>
            <option value="5">5 题</option>
            <option value="15">15 题</option>
          </select>
        </div>
        <div class="note" style="margin-top:16px">
          测验说明：题目从题库随机抽取，作答后即时显示正误与详细解析；全部完成后自动记录成绩、错题与章节掌握度，并同步更新「学习仪表盘」与「学情分析」。
        </div>
        <div style="margin-top:16px">
          <button class="btn btn-primary" onclick="App.quizStart()">开始测验</button>
        </div>
      </div>`;
  },

  quizStart() {
    const chapter = document.getElementById("quiz-chapter").value;
    const count = Number(document.getElementById("quiz-count").value) || 10;
    const pool = chapter === "全部" ? QUIZ_QUESTIONS.slice() : getQuestionsByChapter(chapter).slice();
    if (!pool.length) { alert("该章节暂无题目，请选择其他章节。"); return; }
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    this.quiz = { chapter, pool: pool.slice(0, count), idx: 0, answers: new Array(Math.min(count, pool.length)).fill(null) };
    this.renderQuizQ();
  },

  renderQuizQ() {
    const q = this.quiz;
    const el = document.getElementById("page-content");
    const question = q.pool[q.idx];
    const letters = ["A", "B", "C", "D"];
    const answered = q.answers[q.idx] !== null;
    const picked = q.answers[q.idx];

    el.innerHTML = `
      <div class="card">
        <div class="card-title">随堂测验 · ${q.chapter}<span class="sub">第 ${q.idx + 1} / ${q.pool.length} 题</span></div>
        <div class="quiz-progress"><div class="bar" style="width:${(q.idx + (answered ? 1 : 0)) / q.pool.length * 100}%"></div></div>
        <p style="font-size:15px;margin-bottom:16px"><b>${q.idx + 1}. ${question.q}</b></p>
        ${question.options.map((op, i) => `
          <button class="quiz-option ${answered ? (i === question.answer ? "correct" : (i === picked ? "wrong" : "disabled")) : ""}" onclick="App.quizAnswer(${i})">
            <span class="opt-letter">${letters[i]}</span>${op}
          </button>`).join("")}
        <div class="explain ${answered ? "show " + (picked === question.answer ? "right" : "wrong") : ""}">
          <b>${answered ? (picked === question.answer ? "✓ 回答正确" : "✗ 回答错误，正确答案为 " + letters[question.answer]) : ""}</b><br>
          ${question.explanation}
        </div>
        <div style="margin-top:16px;display:flex;justify-content:space-between">
          <button class="btn btn-ghost" ${q.idx === 0 ? "disabled style='opacity:.5'" : ""} onclick="App.quizPrev()">上一题</button>
          ${q.idx === q.pool.length - 1
            ? `<button class="btn btn-primary" ${answered ? "" : "disabled style='opacity:.5'"} onclick="App.quizFinish()">查看成绩</button>`
            : `<button class="btn btn-primary" ${answered ? "" : "disabled style='opacity:.5'"} onclick="App.quizNext()">下一题</button>`}
        </div>
      </div>`;
  },

  quizAnswer(i) {
    const q = this.quiz;
    if (q.answers[q.idx] !== null) return;
    q.answers[q.idx] = i;
    const question = q.pool[q.idx];
    if (i !== question.answer) {
      this.store.wrong.push({ qid: question.id, your: i, date: this.todayStr() });
      if (this.store.wrong.length > 30) this.store.wrong.shift();
    }
    Store.save(this.store);
    this.renderQuizQ();
  },

  quizPrev() {
    if (this.quiz.idx > 0) { this.quiz.idx--; this.renderQuizQ(); }
  },
  quizNext() {
    if (this.quiz.idx < this.quiz.pool.length - 1) { this.quiz.idx++; this.renderQuizQ(); }
  },

  quizFinish() {
    const q = this.quiz;
    const correct = q.answers.filter((a, i) => a === q.pool[i].answer).length;
    const total = q.pool.length;
    this.store.quizResults.push({ date: this.todayStr(), chapter: q.chapter, correct, total });
    this.store.stats.taken++;
    this.store.stats.total += total;
    this.store.stats.correct += correct;
    Store.save(this.store);

    const el = document.getElementById("page-content");
    el.innerHTML = `
      <div class="card" style="text-align:center">
        <div class="card-title" style="justify-content:center">测验完成 · ${q.chapter}</div>
        <div class="score-ring"><canvas id="score-donut" style="width:130px;height:130px"></canvas>
          <div class="score-num"><b>${correct}/${total}</b><span>答对题数</span></div>
        </div>
        <p style="margin-bottom:6px">${correct === total ? "满分！掌握非常扎实。" : correct >= total * 0.8 ? "表现优秀，继续保持！" : correct >= total * 0.6 ? "发挥不错，建议复习错题对应知识点。" : "本次不理想，建议回到知识点库重点复习后再次测验。"}</p>
        <p style="color:var(--ink-3);font-size:13px">成绩已自动计入学情分析，可点击「查看学情分析」查看掌握度雷达图。</p>
        <div style="margin-top:16px;display:flex;gap:10px;justify-content:center">
          <button class="btn btn-primary" onclick="App.quizRestart()">再测一次</button>
          <button class="btn btn-ghost" onclick="App.go('analytics')">查看学情分析</button>
          <button class="btn btn-ghost" onclick="App.go('quiz')">返回测验首页</button>
        </div>
      </div>`;
    Charts.donutChart(document.getElementById("score-donut"), { value: correct, total: total, label: "正确率", color: "#0d9488" });
  },

  quizRestart() {
    const chapter = this.quiz.chapter;
    const count = this.quiz.pool.length;
    const pool = (chapter === "全部" ? QUIZ_QUESTIONS.slice() : getQuestionsByChapter(chapter).slice());
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    this.quiz = { chapter, pool: pool.slice(0, count), idx: 0, answers: new Array(Math.min(count, pool.length)).fill(null) };
    this.renderQuizQ();
  },

  /* ================= 学情分析 ================= */
  renderAnalytics(el) {
    const real = this.store;
    const hasReal = real.stats.taken > 0 || real.learned.length > 0;
    const useDemo = this.demoMode || !hasReal;
    const data = useDemo ? this.demoStore() : real;
    const map = {};
    CHAPTERS.forEach(ch => { map[ch] = { correct: 0, total: 0, learned: 0, kCount: 0 }; });
    data.quizResults.forEach(r => { if (map[r.chapter]) { map[r.chapter].correct += r.correct; map[r.chapter].total += r.total; } });
    data.learned.forEach(id => { const k = KNOWLEDGE.find(x => x.id === id); if (k && map[k.chapter]) map[k.chapter].learned++; });
    CHAPTERS.forEach(ch => { map[ch].kCount = getKnowledgeByChapter(ch).length; });

    const scores = CHAPTERS.map(ch => this.masteryScore(map, ch));
    const avgMastery = Math.round(scores.reduce((a, b) => a + b, 0) / Math.max(1, scores.length));
    const avgAcc = data.stats.total ? Math.round(data.stats.correct / data.stats.total * 100) : 0;
    const weakChs = CHAPTERS.filter((ch, i) => scores[i] < 40);

    const short = { "复杂度分析": "复杂度", "线性表": "线性表", "栈与队列": "栈与队列", "树与二叉树": "树与二叉树", "图": "图", "查找": "查找", "排序算法": "排序", "算法思想": "算法思想", "综合应用": "综合" };

    el.innerHTML = `
      ${useDemo ? `<div class="demo-banner"><span>当前展示的是<b>示例学情数据</b>，用于演示分析功能（真实学习记录为空时自动启用）。</span>
        <button class="btn btn-ghost btn-sm" onclick="App.demoOff()">返回空态</button></div>` : ""}
      <div class="grid grid-4">
        <div class="card stat-card"><div class="stat-value">${avgMastery}</div><div class="stat-label">平均掌握度（0-100）</div></div>
        <div class="card stat-card"><div class="stat-value">${data.stats.taken}</div><div class="stat-label">完成测验（次）</div></div>
        <div class="card stat-card"><div class="stat-value">${avgAcc}%</div><div class="stat-label">平均正确率</div></div>
        <div class="card stat-card"><div class="stat-value">${weakChs.length}</div><div class="stat-label">待巩固章节</div></div>
      </div>
      <div class="grid grid-2">
        <div class="card">
          <div class="card-title">章节掌握度雷达</div>
          <div id="an-radar" style="height:330px"></div>
        </div>
        <div class="card">
          <div class="card-title">各章测验正确率<span class="sub">0-100%</span></div>
          <div id="an-bar" style="height:330px"></div>
        </div>
      </div>
      <div class="card">
        <div class="card-title">测验成绩走势<span class="sub">最近 ${Math.min(8, data.quizResults.length)} 次</span></div>
        <div id="an-line" style="height:230px"></div>
      </div>
      <div class="card">
        <div class="card-title">近期错题回顾<span class="sub">错题将计入掌握度评估</span></div>
        <div id="an-wrong"></div>
      </div>`;

    Charts.radarChart(document.getElementById("an-radar"), {
      axes: CHAPTERS.map(c => short[c] || c), values: scores
    });
    const barData = CHAPTERS.map((ch, i) => ({ ch, acc: map[ch].total ? Math.round(map[ch].correct / map[ch].total * 100) : 0 }));
    Charts.barChart(document.getElementById("an-bar"), {
      labels: barData.map(b => short[b.ch] || b.ch),
      values: barData.map(b => b.acc), unit: ""
    });
    if (data.quizResults.length) {
      const rs = data.quizResults.slice(-8);
      Charts.lineChart(document.getElementById("an-line"), {
        labels: rs.map(r => String(r.date).slice(5)),
        values: rs.map(r => Math.round(r.correct / r.total * 100)),
        unit: "%", fill: true, color: "#0d9488"
      });
    } else {
      document.getElementById("an-line").innerHTML = `<div class="empty"><p>暂无测验记录。</p></div>`;
    }
    const wrongEl = document.getElementById("an-wrong");
    if (data.wrong.length) {
      const rows = data.wrong.slice(-8).reverse().map(w => {
        const q = QUIZ_QUESTIONS.find(x => x.id === w.qid);
        if (!q) return "";
        const letters = ["A", "B", "C", "D"];
        return `<div class="wrong-item">
          <span class="q">${q.chapter} · ${q.q}</span>
          <span class="badge-t" style="background:#fff1f2;color:#e11d48">你选 ${letters[w.your]} · 正解 ${letters[q.answer]}</span>
        </div>`;
      }).join("");
      wrongEl.innerHTML = rows || `<div class="empty"><p>暂无错题记录。</p></div>`;
    } else {
      wrongEl.innerHTML = `<div class="empty"><p>暂无错题，继续保持！</p></div>`;
    }
  },

  /* 示例学情数据（用于演示） */
  demoStore() {
    const chs = CHAPTERS.slice();
    const rnd = (seed) => { let x = seed; return () => { x = (x * 9301 + 49297) % 233280; return x / 233280; }; };
    const r = rnd(42);
    const quizResults = [];
    const perfs = [0.85, 0.7, 0.75, 0.6, 0.8, 0.65, 0.5, 0.7, 0.55];
    chs.forEach((ch, i) => {
      for (let k = 0; k < 2; k++) {
        const total = 10;
        const correct = Math.max(2, Math.min(10, Math.round(total * perfs[i] + (r() - 0.5) * 2)));
        quizResults.push({ date: "2026-09-" + String(5 + i * 1 + k).padStart(2, "0"), chapter: ch, correct, total });
      }
    });
    const learned = KNOWLEDGE.filter((k, i) => r() > 0.3).map(k => k.id);
    const wrong = [];
    QUIZ_QUESTIONS.forEach((q, i) => { if (r() > 0.55) wrong.push({ qid: q.id, your: (q.answer + 2) % 4, date: "2026-09-12" }); });
    return {
      learned, wrong,
      quizResults,
      stats: quizResults.reduce((a, x) => { a.taken++; a.total += x.total; a.correct += x.correct; return a; }, { taken: 0, total: 0, correct: 0 })
    };
  },

  demoOff() {
    this.demoMode = false;
    this.renderAnalytics(document.getElementById("page-content"));
  }
};

/* 全局暴露（供内联事件调用） */
window.App = App;
window.Store = Store;

document.addEventListener("DOMContentLoaded", () => App.init());
