// app.js — Pata Hai? PWA

const GCS_BASE = 'https://storage.googleapis.com/pata-hai-daily/daily';

// ── State ────────────────────────────────────────────────
let dailyData = null;
let activeTab = 'world';
let quizState = { current: 0, score: 0, answered: false };

// ── Helpers ──────────────────────────────────────────────
function today() {
  return new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD in local time
}

function fmt(date) {
  return new Date(date + 'T00:00:00').toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short'
  });
}

function el(id) { return document.getElementById(id); }

function showPanel(tab) {
  document.querySelectorAll('.section-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  el(`panel-${tab}`).classList.add('active');
  document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
  activeTab = tab;
}

// ── Boot ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  // Set header date
  el('app-date').textContent = fmt(today());

  // Tab click handlers
  document.querySelectorAll('.nav-tab').forEach(btn => {
    btn.addEventListener('click', () => showPanel(btn.dataset.tab));
  });

  // Fetch data
  try {
    const res = await fetch(`${GCS_BASE}/${today()}.json`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    dailyData = await res.json();
    renderAll(dailyData);
  } catch (err) {
    console.error('[pata-hai] fetch failed:', err);
    el('skeleton').classList.add('hidden');
    el('offline-screen').classList.remove('hidden');
  }
});

// ── Render All Sections ───────────────────────────────────
function renderAll(data) {
  el('skeleton').classList.add('hidden');
  renderWorldAffairs(data.sections.world_affairs);
  renderEconomy(data.sections.economy);
  renderCulture(data.sections.culture);
  renderPerson(data.sections.person);
  renderTopic5(data.sections.topic5);
  if (data.sections.trade) renderTrade(data.sections.trade);
  renderQuiz(data.sections.quiz.questions);
  document.querySelectorAll('.section-panel').forEach(p => p.classList.remove('hidden'));
  showPanel('world');
}

// ── Chips helper ─────────────────────────────────────────
function chipsHTML(chips) {
  if (!chips || !chips.length) return '';
  return `<div class="chips">${chips.map(c => `<span class="chip">${c}</span>`).join('')}</div>`;
}

// ── Section Card helper ───────────────────────────────────
function sectionCardHTML({ tag, headline, lede, body, upsc_angle, chips }) {
  return `
    <div class="card">
      <div class="section-tag">${tag}</div>
      <h2 class="card-headline">${headline}</h2>
      <p class="card-lede">${lede}</p>
      <p class="card-body">${body}</p>
      <div class="upsc-angle">
        <div class="upsc-angle-label">🎓 UPSC Angle</div>
        <div class="upsc-angle-text">${upsc_angle}</div>
      </div>
      ${chipsHTML(chips)}
    </div>`;
}

// ── World Affairs ─────────────────────────────────────────
function renderWorldAffairs(waList) {
  const items = Array.isArray(waList) ? waList : [waList]; // backward compat
  el('panel-world').innerHTML = items.map((wa, idx) => {
    const perspectives = wa.perspectives || [];
    const perspHTML = perspectives.length ? `
      <div class="perspectives-card">
        <div class="perspectives-header" onclick="togglePerspectives(this)">
          <span class="perspectives-title">👁 Two Perspectives</span>
          <span class="perspectives-toggle">▼</span>
        </div>
        <div class="perspectives-body">
          ${perspectives.map(p => `
            <div class="perspective-item">
              <span class="perspective-badge ${p.lean}">${p.lean.toUpperCase()}</span>
              <div class="perspective-source">${p.source}</div>
              <div class="perspective-headline">${p.headline}</div>
              <div class="perspective-angle">${p.angle}</div>
            </div>`).join('')}
        </div>
      </div>` : '';

    return `<div class="card">
      <div class="section-tag">${wa.tag} ${idx > 0 ? `<span style="font-size:9px;color:var(--muted);font-weight:400;text-transform:none;">story ${idx+1}</span>` : ''}</div>
      <h2 class="card-headline">${wa.headline}</h2>
      <p class="card-lede">${wa.lede}</p>
      <p class="card-body">${wa.body}</p>
      <div class="upsc-angle">
        <div class="upsc-angle-label">🎓 UPSC Angle</div>
        <div class="upsc-angle-text">${wa.upsc_angle}</div>
      </div>
      ${chipsHTML(wa.chips)}
      ${perspHTML}
    </div>`;
  }).join('');
}

function togglePerspectives(header) {
  const toggle = header.querySelector('.perspectives-toggle');
  const body = header.nextElementSibling;
  const isOpen = body.classList.toggle('open');
  toggle.classList.toggle('open', isOpen);
}

// ── Economy ───────────────────────────────────────────────
function renderEconomy(ec) {
  el('panel-economy').innerHTML = sectionCardHTML(ec);
}

// ── Culture ───────────────────────────────────────────────
function renderCulture(cuList) {
  const items = Array.isArray(cuList) ? cuList : [cuList];
  el('panel-culture').innerHTML = items.map(cu => {
    const dance = cu.related_dance;
    const danceHTML = dance ? `
      <div class="dance-card">
        <div class="dance-emoji">${dance.emoji}</div>
        <div>
          <div class="dance-name">${dance.name}</div>
          <div class="dance-desc">${dance.desc}</div>
        </div>
      </div>` : '';
    return `<div class="card">
      <div class="section-tag">${cu.tag}</div>
      <h2 class="card-headline">${cu.headline}</h2>
      <p class="card-lede">${cu.lede}</p>
      <p class="card-body">${cu.body}</p>
      <div class="upsc-angle">
        <div class="upsc-angle-label">🎓 UPSC Angle</div>
        <div class="upsc-angle-text">${cu.upsc_angle}</div>
      </div>
      ${chipsHTML(cu.chips)}
      ${danceHTML}
    </div>`;
  }).join('');
}

// ── Person ────────────────────────────────────────────────
function renderPerson(peList) {
  const items = Array.isArray(peList) ? peList : [peList];
  el('panel-person').innerHTML = items.map(pe => {
    const wikiLink = pe.wiki_url ? `
      <a class="wiki-link" href="${pe.wiki_url}" target="_blank" rel="noopener">
        📖 Read more on Wikipedia →
      </a>` : '';
    return `<div class="card">
      <div class="section-tag">${pe.tag}</div>
      <h2 class="card-headline">${pe.headline}</h2>
      <p class="card-lede">${pe.lede}</p>
      <p class="card-body">${pe.body}</p>
      <div class="upsc-angle">
        <div class="upsc-angle-label">🎓 UPSC Angle</div>
        <div class="upsc-angle-text">${pe.upsc_angle}</div>
      </div>
      ${chipsHTML(pe.chips)}
      ${wikiLink}
    </div>`;
  }).join('');
}

// ── Topic5 ────────────────────────────────────────────────
const TOPIC5_KEYS = [
  { key: 'polity',  label: '🏛️ Polity' },
  { key: 'env',     label: '🌿 Env' },
  { key: 'science', label: '🔬 Science' },
  { key: 'geo',     label: '🗺️ Geo' },
  { key: 'history', label: '⚔️ History' },
  { key: 'social',  label: '🤝 Social' },
];

function renderTopic5(topic5) {
  const pillsHTML = TOPIC5_KEYS.map((t, i) =>
    `<button class="topic5-pill ${i === 0 ? 'active' : ''}"
       onclick="switchTopic5(this, '${t.key}')">${t.label}</button>`
  ).join('');

  const contentHTML = TOPIC5_KEYS.map((t, i) => {
    const entries = Array.isArray(topic5[t.key]) ? topic5[t.key] : [topic5[t.key]];
    if (!entries || !entries.length) return '';

    // Sub-pills for 1/2/3 within each topic
    const subPillsHTML = entries.length > 1 ? `
      <div style="display:flex;gap:4px;margin-bottom:8px;">
        ${entries.map((_, j) => `<button class="topic5-sub-pill ${j===0?'active':''}"
          onclick="switchSubTopic(this,'t5sub-${t.key}',${j})"
          style="padding:3px 10px;border-radius:12px;border:1px solid var(--saffron-light);background:${j===0?'var(--saffron)':'transparent'};color:${j===0?'white':'var(--saffron)'};font-size:10px;font-weight:700;cursor:pointer;">${j+1}</button>`).join('')}
      </div>` : '';

    const entriesHTML = entries.map((sec, j) =>
      `<div class="topic5-sub-content ${j===0?'':'hidden'}" id="t5sub-${t.key}-${j}">
        ${sectionCardHTML(sec)}
      </div>`
    ).join('');

    return `<div class="topic5-content ${i === 0 ? '' : 'hidden'}" id="t5-${t.key}">
      ${subPillsHTML}
      ${entriesHTML}
    </div>`;
  }).join('');

  el('panel-topic5').innerHTML = `
    <div class="topic5-pills">${pillsHTML}</div>
    ${contentHTML}`;
}

function switchTopic5(pill, key) {
  document.querySelectorAll('.topic5-pill').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.topic5-content').forEach(c => c.classList.add('hidden'));
  pill.classList.add('active');
  el(`t5-${key}`).classList.remove('hidden');
}

function switchSubTopic(pill, prefix, idx) {
  const parent = pill.closest('.topic5-content');
  parent.querySelectorAll('.topic5-sub-pill').forEach((p, i) => {
    p.style.background = i === idx ? 'var(--saffron)' : 'transparent';
    p.style.color = i === idx ? 'white' : 'var(--saffron)';
    p.classList.toggle('active', i === idx);
  });
  parent.querySelectorAll('.topic5-sub-content').forEach((c, i) => {
    c.classList.toggle('hidden', i !== idx);
  });
}

// ── Quiz ──────────────────────────────────────────────────
function renderQuiz(questions) {
  quizState = { current: 0, score: 0, answered: false, questions };
  showQuizQuestion();
}

function showQuizQuestion() {
  const { current, questions } = quizState;
  if (current >= questions.length) { showQuizResult(); return; }

  const q = questions[current];
  const progress = ((current) / questions.length) * 100;
  const letters = ['A', 'B', 'C', 'D'];

  const optionsHTML = q.options.map((opt, i) => `
    <button class="quiz-option" onclick="answerQuiz(this, ${i}, ${q.answer_index})">
      <span class="option-letter">${letters[i]}</span>
      <span class="option-text">${opt}</span>
    </button>`).join('');

  el('panel-quiz').innerHTML = `
    <div class="card">
      <div class="quiz-header">
        <span class="quiz-title">📝 Daily Quiz</span>
        <span class="quiz-counter">Q ${current + 1} of ${questions.length}</span>
      </div>
      <div class="quiz-progress">
        <div class="quiz-progress-fill" style="width:${progress}%"></div>
      </div>
      <p class="quiz-question">${q.question}</p>
      <div class="quiz-options">${optionsHTML}</div>
      <div class="quiz-explanation" id="quiz-explanation">${q.explanation}</div>
      <button class="quiz-next-btn" id="quiz-next-btn"
        onclick="nextQuizQuestion()">
        ${current + 1 < questions.length ? 'Next Question →' : 'See Results 🎉'}
      </button>
    </div>`;
}

function answerQuiz(btn, selectedIndex, correctIndex) {
  if (quizState.answered) return;
  quizState.answered = true;

  const options = document.querySelectorAll('.quiz-option');
  options.forEach(opt => opt.setAttribute('disabled', true));

  if (selectedIndex === correctIndex) {
    btn.classList.add('correct');
    quizState.score++;
  } else {
    btn.classList.add('incorrect');
    options[correctIndex].classList.add('correct');
  }

  el('quiz-explanation').classList.add('visible');
  el('quiz-next-btn').classList.add('visible');
}

function nextQuizQuestion() {
  quizState.current++;
  quizState.answered = false;
  showQuizQuestion();
}

function showQuizResult() {
  const { score, questions } = quizState;
  const total = questions.length;
  const emoji = score === total ? '🏆' : score >= total * 0.6 ? '🎉' : '💪';
  const msg = score === total ? 'Perfect score!' :
              score >= total * 0.6 ? 'Well done!' : "Keep going — you've got this!";

  el('panel-quiz').innerHTML = `
    <div class="quiz-result">
      <div class="quiz-result-emoji">${emoji}</div>
      <div class="quiz-result-score">${score} / ${total}</div>
      <div class="quiz-result-label">${msg}</div>
      <button class="quiz-retry-btn" onclick="renderQuiz(dailyData.sections.quiz.questions)">
        Try Again
      </button>
    </div>`;
}

// ── Trade ─────────────────────────────────────────────────
function renderTrade(trade) {
  if (!trade) {
    el('panel-trade').innerHTML = `
      <div class="card">
        <div class="section-tag">📦 TRADE & COMMERCE</div>
        <h2 class="card-headline">Trade data coming soon</h2>
        <p class="card-body">Today's trade intelligence will appear here once the pipeline runs with the updated data.</p>
      </div>`;
    return;
  }

  const f = trade.featured;
  const roleClass = f.india_role === 'exporter' ? 'exporter' : 'importer';
  const roleLabel = f.india_role === 'exporter'
    ? `🇮🇳 India exports — ${f.india_share}`
    : `🛒 India imports from ${f.india_share}`;

  const destHTML = f.destinations.map(d =>
    `<span class="trade-dest-tag">${d}</span>`
  ).join('');

  const featuredHTML = `
    <div class="card">
      <div class="section-tag">📦 TODAY'S SPOTLIGHT</div>
      <h2 class="card-headline">${f.commodity}</h2>
      <span class="trade-role-badge ${roleClass}">${roleLabel}</span>
      <p class="card-body">${f.brief}</p>
      <div class="trade-stat"><span class="trade-stat-label">Global Value</span><span class="trade-stat-value">${f.value}</span></div>
      <div class="trade-stat"><span class="trade-stat-label">Annual Volume</span><span class="trade-stat-value">${f.volume}</span></div>
      <div class="trade-destinations">${destHTML}</div>
      <div class="upsc-angle" style="margin-top:12px">
        <div class="upsc-angle-label">🎓 UPSC Angle</div>
        <div class="upsc-angle-text">${f.upsc_angle}</div>
      </div>
      ${chipsHTML(f.chips)}
    </div>`;

  const exportItems = (trade.india_exports || []).map(item => tradeItemHTML(item)).join('');
  const importItems = (trade.india_imports || []).map(item => tradeItemHTML(item)).join('');

  el('panel-trade').innerHTML = `
    ${featuredHTML}
    <div class="card">
      <div class="section-tag">🟢 INDIA EXPORTS</div>
      ${exportItems || '<p class="card-body">No export data today.</p>'}
    </div>
    <div class="card">
      <div class="section-tag">🔵 INDIA IMPORTS</div>
      ${importItems || '<p class="card-body">No import data today.</p>'}
    </div>`;
}

function tradeItemHTML(item) {
  const roleClass = item.india_role === 'exporter' ? 'exporter' : 'importer';
  const roleLabel = item.india_role === 'exporter'
    ? `India exports — ${item.india_share}`
    : `India imports from ${item.india_share}`;
  const destHTML = item.destinations.map(d =>
    `<span class="trade-dest-tag">${d}</span>`
  ).join('');

  return `
    <div style="padding: 10px 0; border-bottom: 1px solid #f1f5f9;">
      <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:4px;">
        <span style="font-size:13px; font-weight:700; color:var(--ink);">${item.commodity}</span>
        <span style="font-size:10px; color:var(--stone);">${item.value}</span>
      </div>
      <span class="trade-role-badge ${roleClass}">${roleLabel}</span>
      <div class="trade-destinations">${destHTML}</div>
    </div>`;
}

// ── Service Worker Registration ───────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js')
      .then(reg => console.log('[pata-hai] SW registered:', reg.scope))
      .catch(err => console.warn('[pata-hai] SW failed:', err));
  });
}
