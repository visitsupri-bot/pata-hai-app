// app.js — Pata Hai? PWA

const GCS_BASE = 'https://storage.googleapis.com/pata-hai-daily/daily';
const LOCAL_BASE = './local-daily'; // used when running on localhost
const DATA_BASE = location.hostname === 'localhost' || location.hostname === '127.0.0.1'
  ? LOCAL_BASE : GCS_BASE;

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
    const res = await fetch(`${DATA_BASE}/${today()}.json`);
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
  if (data.sections.india) renderIndia(data.sections.india);
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

    const indiaImpactHTML = wa.india_impact
      ? `<div class="india-impact-box">
           <span class="india-impact-label">🇮🇳 India's Stake</span>
           <span class="india-impact-text">${wa.india_impact}</span>
         </div>`
      : '';

    return `<div class="card">
      <div class="section-tag">${wa.tag} ${idx > 0 ? `<span style="font-size:9px;color:var(--muted);font-weight:400;text-transform:none;">story ${idx+1}</span>` : ''}</div>
      <h2 class="card-headline">${wa.headline}</h2>
      <p class="card-lede">${wa.lede}</p>
      <p class="card-body">${wa.body}</p>
      ${indiaImpactHTML}
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
  // Legacy format fallback (old SectionContent shape)
  if (!ec.market_snapshot) {
    el('panel-economy').innerHTML = sectionCardHTML(ec);
    return;
  }

  const snap = ec.market_snapshot;
  const snapshotHTML = `
    <div class="eco-snapshot">
      <div class="eco-snapshot-title">📊 Market Snapshot</div>
      <div class="eco-snapshot-stats">
        <div class="eco-stat">
          <span class="eco-stat-label">USD/INR</span>
          <span class="eco-stat-value">₹${snap.usd_inr}</span>
        </div>
        <div class="eco-stat">
          <span class="eco-stat-label">India GDP</span>
          <span class="eco-stat-value">${snap.gdp_growth}</span>
        </div>
        <div class="eco-stat eco-stat-mood">
          <span class="eco-stat-label">Mood</span>
          <span class="eco-stat-value">${snap.market_mood}</span>
        </div>
      </div>
      <p class="eco-mood-reason">${snap.mood_reason}</p>
    </div>`;

  const worldHTML = (ec.world_stories || []).map(s => `
    <div class="eco-section-label">🌐 World Economy</div>
    ${sectionCardHTML(s)}`).join('');

  const indiaHTML = (ec.india_stories || []).map(s => `
    <div class="eco-section-label">🇮🇳 India Economy</div>
    ${sectionCardHTML(s)}`).join('');

  let unemploymentHTML = '';
  const unemp = ec.unemployment;
  if (unemp) {
    const gs = unemp.global_snapshot || {};
    unemploymentHTML = `
      <div class="eco-section-label">👷 Jobs & Labour</div>
      <div class="unemp-snapshot">
        <div class="unemp-stat"><span class="unemp-stat-label">📈 Highest</span><span class="unemp-stat-value">${gs.highest || '—'}</span></div>
        <div class="unemp-stat"><span class="unemp-stat-label">📉 Lowest</span><span class="unemp-stat-value">${gs.lowest || '—'}</span></div>
        <div class="unemp-stat unemp-stat-india"><span class="unemp-stat-label">🇮🇳 India Rank</span><span class="unemp-stat-value">${gs.india_rank || '—'}</span></div>
        ${gs.key_insight ? `<div class="unemp-insight">${gs.key_insight}</div>` : ''}
      </div>
      ${unemp.story ? sectionCardHTML(unemp.story) : ''}`;
  }

  el('panel-economy').innerHTML = snapshotHTML + worldHTML + indiaHTML + unemploymentHTML;
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

// ── India ─────────────────────────────────────────────────
const INDIA_KEYS = [
  { key: 'politics',     label: '🏛️ Politics',    fullLabel: '🏛️ Politics & Governance' },
  { key: 'economy',      label: '📊 Economy',     fullLabel: '📊 Indian Economy' },
  { key: 'social',       label: '🤝 Social',      fullLabel: '🤝 Social Issues' },
  { key: 'security',     label: '🛡️ Security',    fullLabel: '🛡️ Security & Defence' },
  { key: 'science',      label: '🚀 Science',     fullLabel: '🚀 Science & Technology' },
  { key: 'environment',  label: '🌿 Environment', fullLabel: '🌿 Environment & Disasters' },
];

function renderIndia(india) {
  if (!india) {
    el('panel-india').innerHTML = `
      <div class="card">
        <div class="section-tag">🇮🇳 INDIA</div>
        <h2 class="card-headline">India coverage coming soon</h2>
        <p class="card-body">Today's India briefing will appear here once the pipeline is updated.</p>
      </div>`;
    return;
  }

  const pillsHTML = INDIA_KEYS.map((t, i) =>
    `<button class="india-pill ${i === 0 ? 'active' : ''}"
       onclick="switchIndia(this, '${t.key}')">${t.label}</button>`
  ).join('');

  const contentHTML = INDIA_KEYS.map((t, i) => {
    const raw = india[t.key];
    if (!raw) return `<div class="india-content ${i === 0 ? '' : 'hidden'}" id="india-${t.key}">
      <div class="card">
        <div class="section-tag">${t.fullLabel}</div>
        <p class="card-body" style="color:var(--muted)">No data for this category today.</p>
      </div>
    </div>`;

    const entries = Array.isArray(raw) ? raw : [raw];

    const subPillsHTML = entries.length > 1 ? `
      <div style="display:flex;gap:4px;margin-bottom:8px;flex-wrap:wrap;">
        ${entries.map((_, j) => `<button class="india-sub-pill ${j === 0 ? 'active' : ''}"
          onclick="switchIndiaSubTopic(this,'india-sub-${t.key}',${j})"
          style="padding:3px 10px;border-radius:12px;border:1px solid var(--saffron-light);background:${j === 0 ? 'var(--saffron)' : 'transparent'};color:${j === 0 ? 'white' : 'var(--saffron)'};font-size:10px;font-weight:700;cursor:pointer;">${j + 1}</button>`).join('')}
      </div>` : '';

    const entriesHTML = entries.map((sec, j) =>
      `<div class="india-sub-content ${j === 0 ? '' : 'hidden'}" id="india-sub-${t.key}-${j}">
        ${sectionCardHTML(sec)}
      </div>`
    ).join('');

    return `<div class="india-content ${i === 0 ? '' : 'hidden'}" id="india-${t.key}">
      ${subPillsHTML}
      ${entriesHTML}
    </div>`;
  }).join('');

  el('panel-india').innerHTML = `
    <div class="india-header">
      <span class="india-flag">🇮🇳</span>
      <span class="india-title">India Today</span>
    </div>
    <div class="india-pills">${pillsHTML}</div>
    ${contentHTML}`;
}

function switchIndia(pill, key) {
  document.querySelectorAll('.india-pill').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.india-content').forEach(c => c.classList.add('hidden'));
  pill.classList.add('active');
  el(`india-${key}`).classList.remove('hidden');
}

function switchIndiaSubTopic(pill, prefix, idx) {
  const parent = pill.closest('.india-content');
  parent.querySelectorAll('.india-sub-pill').forEach((p, i) => {
    p.style.background = i === idx ? 'var(--saffron)' : 'transparent';
    p.style.color = i === idx ? 'white' : 'var(--saffron)';
    p.classList.toggle('active', i === idx);
  });
  parent.querySelectorAll('.india-sub-content').forEach((c, i) => {
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

  const trendsHTML = (trade.trends || []).length ? `
    <div class="trends-header">
      <span class="trends-title">📊 Top 5 Industry Markets</span>
      <span class="trends-subtitle">Global performance · India impact</span>
    </div>
    ${(trade.trends || []).map(t => `
    <div class="trend-card">
      <div class="trend-card-top">
        <span class="trend-rank">#${t.rank}</span>
        <span class="trend-tag">${t.tag}</span>
        <span class="trend-perf">${t.performance}</span>
      </div>
      <h2 class="card-headline" style="margin:8px 0 4px">${t.headline}</h2>
      <p class="card-lede">${t.lede}</p>
      <div class="trend-impact-block trend-world">
        <div class="trend-impact-label">🌍 World Impact</div>
        <div class="trend-impact-text">${t.world_impact}</div>
      </div>
      <div class="trend-impact-block trend-india">
        <div class="trend-impact-label">🇮🇳 India Impact</div>
        <div class="trend-impact-text">${t.india_impact}</div>
      </div>
      <div class="upsc-angle">
        <div class="upsc-angle-label">🎓 UPSC Angle</div>
        <div class="upsc-angle-text">${t.upsc_angle}</div>
      </div>
      ${chipsHTML(t.chips)}
    </div>`).join('')}` : '';

  // ── Investment Picks ──
  const inv = trade.investment_picks;
  let investHTML = '';
  if (inv) {
    const renderPickList = (picks, prefix) => (picks || []).map((p, i) => `
      <div class="inv-pick ${i === 0 ? '' : 'hidden'}" id="${prefix}-${i}">
        <div class="inv-pick-top">
          <span class="inv-rank">#${p.rank}</span>
          <span class="inv-tag">${p.tag}</span>
          <span class="inv-rating">${p.rating}</span>
        </div>
        <div class="inv-stocks">🏢 ${p.representative_stocks}</div>
        <div class="inv-why">${p.why_now}</div>
        <div class="inv-play-block">
          <span class="inv-play-label">💡 How to invest</span>
          <span class="inv-play-text">${p.india_play}</span>
        </div>
        <div class="inv-risk">⚠️ Risk: ${p.risk}</div>
        ${chipsHTML(p.chips)}
      </div>`).join('');

    const renderSubPills = (picks, prefix) => picks.length > 1 ? `
      <div class="inv-sub-pills">
        ${picks.map((p, i) => `
          <button class="inv-sub-pill ${i === 0 ? 'active' : ''}"
            onclick="switchInvPick(this,'${prefix}',${i},${picks.length})">
            ${p.sector}
          </button>`).join('')}
      </div>` : '';

    investHTML = `
      <div class="inv-header">
        <span class="inv-title">💰 Investment Picks</span>
        <span class="inv-disclaimer">${inv.disclaimer || 'Educational only. Not financial advice.'}</span>
      </div>
      ${inv.reasoning ? `<div class="inv-reasoning">🧠 ${inv.reasoning}</div>` : ''}
      <div class="inv-cap-pills">
        <button class="inv-cap-pill active" onclick="switchInvCap(this,'inv-large')">🏦 Large Cap</button>
        <button class="inv-cap-pill" onclick="switchInvCap(this,'inv-mid')">📈 Mid Cap</button>
      </div>

      <div class="inv-cap-section" id="inv-large">
        <div class="inv-market-pills">
          <button class="inv-market-pill active" onclick="switchInvMarket(this,'lc','world')">🌍 World</button>
          <button class="inv-market-pill" onclick="switchInvMarket(this,'lc','india')">🇮🇳 India</button>
        </div>
        <div class="inv-market-content" id="lc-world">
          ${renderSubPills(inv.large_cap?.world || [], 'lc-w')}
          ${renderPickList(inv.large_cap?.world || [], 'lc-w')}
        </div>
        <div class="inv-market-content hidden" id="lc-india">
          ${renderSubPills(inv.large_cap?.india || [], 'lc-i')}
          ${renderPickList(inv.large_cap?.india || [], 'lc-i')}
        </div>
      </div>

      <div class="inv-cap-section hidden" id="inv-mid">
        <div class="inv-market-pills">
          <button class="inv-market-pill active" onclick="switchInvMarket(this,'mc','world')">🌍 World</button>
          <button class="inv-market-pill" onclick="switchInvMarket(this,'mc','india')">🇮🇳 India</button>
        </div>
        <div class="inv-market-content" id="mc-world">
          ${renderSubPills(inv.mid_cap?.world || [], 'mc-w')}
          ${renderPickList(inv.mid_cap?.world || [], 'mc-w')}
        </div>
        <div class="inv-market-content hidden" id="mc-india">
          ${renderSubPills(inv.mid_cap?.india || [], 'mc-i')}
          ${renderPickList(inv.mid_cap?.india || [], 'mc-i')}
        </div>
      </div>`;
  }

  el('panel-trade').innerHTML = `
    ${featuredHTML}
    ${trendsHTML}
    ${investHTML}
    <div class="card">
      <div class="section-tag">🟢 INDIA EXPORTS</div>
      ${exportItems || '<p class="card-body">No export data today.</p>'}
    </div>
    <div class="card">
      <div class="section-tag">🔵 INDIA IMPORTS</div>
      ${importItems || '<p class="card-body">No import data today.</p>'}
    </div>`;
}

function switchInvCap(btn, targetId) {
  document.querySelectorAll('.inv-cap-pill').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.inv-cap-section').forEach(s => s.classList.add('hidden'));
  btn.classList.add('active');
  el(targetId).classList.remove('hidden');
}

function switchInvMarket(btn, prefix, market) {
  const section = btn.closest('.inv-cap-section');
  section.querySelectorAll('.inv-market-pill').forEach(p => p.classList.remove('active'));
  section.querySelectorAll('.inv-market-content').forEach(c => c.classList.add('hidden'));
  btn.classList.add('active');
  el(`${prefix}-${market}`).classList.remove('hidden');
}

function switchInvPick(btn, prefix, idx, total) {
  for (let i = 0; i < total; i++) {
    const pick = el(`${prefix}-${i}`);
    if (pick) pick.classList.toggle('hidden', i !== idx);
  }
  btn.closest('.inv-sub-pills').querySelectorAll('.inv-sub-pill').forEach((p, i) => {
    p.classList.toggle('active', i === idx);
  });
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
