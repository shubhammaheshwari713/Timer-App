// Chronos (Vanilla JS) — Timer • Stopwatch • Counter
// State management with localStorage persistence

const STORAGE_KEY = 'chronos-state';
const palette = ['#1e40af', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

function nextColor(index) { return palette[index % palette.length]; }
function pad2(v) { return String(v).padStart(2, '0'); }
function clamp(v, min, max) { return Math.min(max, Math.max(min, v)); }
function formatStopwatch(ms, fractionDigits = 3) {
  const totalMs = Math.max(0, Math.floor(ms));
  const minutes = Math.floor(totalMs / 60000);
  const seconds = Math.floor((totalMs % 60000) / 1000);
  const remainderMs = totalMs % 1000;
  const fraction = (remainderMs / 1000).toFixed(fractionDigits).slice(2);
  return `${pad2(minutes)}:${pad2(seconds)}.${fraction}`;
}
function formatHMS(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}:${pad2(minutes)}:${pad2(seconds)}`;
  return `${pad2(minutes)}:${pad2(seconds)}`;
}
function parseToMs(hours, minutes, seconds) {
  hours = Number.isFinite(hours) ? hours : 0;
  minutes = Number.isFinite(minutes) ? minutes : 0;
  seconds = Number.isFinite(seconds) ? seconds : 0;
  return Math.max(0, hours * 3600000 + minutes * 60000 + seconds * 1000);
}
function percent(progress, total) { if (total <= 0) return 0; return clamp((progress / total) * 100, 0, 100); }

function nanoid() {
  return (crypto && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2))
    .replace(/-/g, '').slice(0, 12);
}

const defaultState = {
  theme: 'system',
  stopwatches: [],
  timers: [],
  counters: [],
};

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(defaultState);
    const parsed = JSON.parse(raw);
    return { ...structuredClone(defaultState), ...parsed };
  } catch {
    return structuredClone(defaultState);
  }
}

function saveState(state) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
}

let state = loadState();

// Subscriptions for re-render
const subscribers = new Set();
function subscribe(fn) { subscribers.add(fn); return () => subscribers.delete(fn); }
function setState(mutator) {
  const draft = structuredClone(state);
  mutator(draft);
  state = draft;
  saveState(state);
  subscribers.forEach((fn) => fn(state));
}

// Actions
const actions = {
  setTheme(theme) { setState((s) => { s.theme = theme; }); },

  // Stopwatch
  addStopwatch(label) {
    setState((s) => {
      s.stopwatches.push({ id: nanoid(), label: label || `Stopwatch ${s.stopwatches.length + 1}`, startedAtMs: null, accumulatedMs: 0, laps: [], color: nextColor(s.stopwatches.length) });
    });
  },
  removeStopwatch(id) { setState((s) => { s.stopwatches = s.stopwatches.filter((w) => w.id !== id); }); },
  startStopwatch(id) { setState((s) => { s.stopwatches = s.stopwatches.map((w) => (w.id === id && w.startedAtMs == null ? { ...w, startedAtMs: Date.now() } : w)); }); },
  stopStopwatch(id) { setState((s) => { s.stopwatches = s.stopwatches.map((w) => { if (w.id !== id || w.startedAtMs == null) return w; const elapsed = Date.now() - w.startedAtMs; return { ...w, startedAtMs: null, accumulatedMs: w.accumulatedMs + elapsed }; }); }); },
  resetStopwatch(id) { setState((s) => { s.stopwatches = s.stopwatches.map((w) => (w.id === id ? { ...w, startedAtMs: null, accumulatedMs: 0, laps: [] } : w)); }); },
  lapStopwatch(id) { setState((s) => { s.stopwatches = s.stopwatches.map((w) => { if (w.id !== id) return w; const now = Date.now(); const total = (w.startedAtMs ? now - w.startedAtMs : 0) + w.accumulatedMs; const lastTotal = w.laps.length ? w.laps[w.laps.length - 1].totalMs : 0; const lapMs = total - lastTotal; const lap = { id: nanoid(), timestampMs: now, lapMs, totalMs: total }; return { ...w, laps: [...w.laps, lap] }; }); }); },
  renameStopwatch(id, label) { setState((s) => { s.stopwatches = s.stopwatches.map((w) => (w.id === id ? { ...w, label } : w)); }); },

  // Timer
  addTimer(presetMs, label) { setState((s) => { s.timers.push({ id: nanoid(), label: label || `Timer ${s.timers.length + 1}`, totalMs: presetMs, startedAtMs: null, remainingMs: presetMs, color: nextColor(s.timers.length), sound: 'chime' }); }); },
  removeTimer(id) { setState((s) => { s.timers = s.timers.filter((t) => t.id !== id); }); },
  startTimer(id) { setState((s) => { s.timers = s.timers.map((t) => (t.id === id && t.startedAtMs == null ? { ...t, startedAtMs: Date.now() } : t)); }); },
  stopTimer(id) { setState((s) => { s.timers = s.timers.map((t) => { if (t.id !== id || t.startedAtMs == null) return t; const elapsed = Date.now() - t.startedAtMs; const remain = Math.max(0, t.remainingMs - elapsed); return { ...t, startedAtMs: null, remainingMs: remain }; }); }); },
  resetTimer(id) { setState((s) => { s.timers = s.timers.map((t) => (t.id === id ? { ...t, startedAtMs: null, remainingMs: t.totalMs } : t)); }); },
  setTimerRemaining(id, ms) { setState((s) => { s.timers = s.timers.map((t) => (t.id === id ? { ...t, remainingMs: ms } : t)); }); },
  renameTimer(id, label) { setState((s) => { s.timers = s.timers.map((t) => (t.id === id ? { ...t, label } : t)); }); },
  setTimerSound(id, sound) { setState((s) => { s.timers = s.timers.map((t) => (t.id === id ? { ...t, sound } : t)); }); },

  // Counter
  addCounter(config = {}) {
    setState((s) => {
      const base = { id: nanoid(), label: `Counter ${s.counters.length + 1}`, start: 0, target: 100, value: 0, direction: 'up', step: 1, intervalMs: 100, startedAtMs: null, color: nextColor(s.counters.length) };
      const merged = { ...base, ...config, value: (config.start ?? base.start) };
      s.counters.push(merged);
    });
  },
  removeCounter(id) { setState((s) => { s.counters = s.counters.filter((c) => c.id !== id); }); },
  startCounter(id) { setState((s) => { s.counters = s.counters.map((c) => (c.id === id && c.startedAtMs == null ? { ...c, startedAtMs: Date.now() } : c)); }); },
  stopCounter(id) { setState((s) => { s.counters = s.counters.map((c) => (c.id === id ? { ...c, startedAtMs: null } : c)); }); },
  resetCounter(id) { setState((s) => { s.counters = s.counters.map((c) => (c.id === id ? { ...c, value: c.start, startedAtMs: null } : c)); }); },
  setCounterConfig(id, config) { setState((s) => { s.counters = s.counters.map((c) => (c.id === id ? { ...c, ...config } : c)); }); },
  renameCounter(id, label) { setState((s) => { s.counters = s.counters.map((c) => (c.id === id ? { ...c, label } : c)); }); },
};

// View helpers
function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') node.className = v;
    else if (k === 'dataset') Object.entries(v).forEach(([dk, dv]) => node.dataset[dk] = dv);
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'style' && typeof v === 'object') Object.assign(node.style, v);
    else if (k in node) node[k] = v;
    else if (v != null) node.setAttribute(k, v);
  }
  for (const child of children.flat()) {
    if (child == null) continue;
    if (typeof child === 'string' || typeof child === 'number') node.appendChild(document.createTextNode(String(child)));
    else node.appendChild(child);
  }
  return node;
}

function icon(svgPath, size = 16) {
  const svg = el('svg', { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true' });
  svg.innerHTML = svgPath;
  return svg;
}

// Minimal Lucide-like icons used
const Icons = {
  Play: () => icon('<polygon points="5 3 19 12 5 21 5 3"></polygon>'),
  Square: () => icon('<rect x="6" y="6" width="12" height="12"></rect>'),
  RotateCcw: () => icon('<polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>'),
  Plus: () => icon('<line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>'),
  Trash2: () => icon('<polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path>'),
  Flag: () => icon('<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line>'),
  Download: () => icon('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line>'),
  Bell: () => icon('<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path>'),
  Sun: () => icon('<circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"></path>'),
  Moon: () => icon('<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>'),
  MonitorCog: () => icon('<rect x="2" y="3" width="20" height="14" rx="2"></rect><path d="M6 19h12"></path><circle cx="12" cy="10" r="2"></circle><path d="M12 6v1"></path><path d="M12 13v1"></path><path d="M15.464 7.536l-.707.707"></path><path d="M8.243 14.757l-.707.707"></path><path d="M15.464 12.464l-.707-.707"></path><path d="M8.243 9.243l-.707-.707"></path>'),
};

// Renderers
function renderTopBar(currentTab) {
  const tabs = [
    { key: 'timer', label: 'Timer' },
    { key: 'stopwatch', label: 'Stopwatch' },
    { key: 'counter', label: 'Counter' },
    { key: 'settings', label: 'Settings' },
  ];
  return el('div', { class: 'topbar' },
    el('div', { class: 'topbar-inner' },
      el('div', { class: 'row' },
        tabs.map((t) => el('button', { class: 'tab-btn', dataset: { active: String(currentTab === t.key) }, onClick: () => setTab(t.key) }, t.label))
      ),
      el('a', { class: 'text-sm', href: 'https://github.com', target: '_blank', rel: 'noreferrer' }, 'Chronos')
    )
  );
}

function TimerCard(item) {
  const running = item.startedAtMs != null;
  const now = Date.now();
  const remain = running ? Math.max(0, item.remainingMs - (now - item.startedAtMs)) : item.remainingMs;
  const done = remain <= 0;
  const pct = percent(item.totalMs - remain, item.totalMs);

  if (done && running) {
    actions.stopTimer(item.id);
    try {
      if (item.sound !== 'silent') { playSound(item.sound); }
      document.body.classList.add('animate-flash');
      setTimeout(() => document.body.classList.remove('animate-flash'), 1500);
      if ('Notification' in window) {
        if (Notification.permission === 'granted') new Notification(`${item.label} finished`);
      }
    } catch {}
  }

  const header = el('div', { class: 'row space-between' },
    el('div', { class: 'row' },
      el('div', { style: { width: '12px', height: '12px', borderRadius: '999px', backgroundColor: item.color } }),
      el('input', { class: 'input', style: { background: 'transparent', border: 'none', fontSize: '1.125rem', fontWeight: '700', width: 'auto' }, value: item.label, onInput: (e) => actions.renameTimer(item.id, e.target.value) })
    ),
    el('div', { class: 'row' },
      !running
        ? el('button', { class: 'btn btn-success', onClick: () => actions.startTimer(item.id) }, Icons.Play(), 'Start')
        : el('button', { class: 'btn btn-warning', onClick: () => actions.stopTimer(item.id) }, Icons.Square(), 'Pause'),
      el('button', { class: 'btn btn-outline', onClick: () => actions.resetTimer(item.id) }, Icons.RotateCcw(), 'Reset'),
      el('button', { class: 'btn btn-danger', onClick: () => actions.removeTimer(item.id) }, Icons.Trash2())
    )
  );

  const progressBar = el('div', { class: 'progress' }, el('div', { class: 'bar', style: { width: `${pct}%` } }));

  const inputs = el('div', { class: 'grid', style: { gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '8px' } },
    el('input', { class: 'input', type: 'number', min: 0, placeholder: 'hh', onInput: (e) => actions.setTimerRemaining(item.id, parseToMs(Number(e.target.value), Math.floor(remain / 60000) % 60, Math.floor(remain / 1000) % 60)) }),
    el('input', { class: 'input', type: 'number', min: 0, max: 59, placeholder: 'mm', onInput: (e) => actions.setTimerRemaining(item.id, parseToMs(0, Number(e.target.value), Math.floor(remain / 1000) % 60)) }),
    el('input', { class: 'input', type: 'number', min: 0, max: 59, placeholder: 'ss', onInput: (e) => actions.setTimerRemaining(item.id, parseToMs(0, Math.floor(remain / 60000) % 60, Number(e.target.value))) }),
  );

  const sounds = ['beep', 'chime', 'bell', 'silent'].map((sName) => el('button', { class: `btn btn-outline${item.sound === sName ? ' ringed' : ''}`, onClick: () => actions.setTimerSound(item.id, sName) }, Icons.Bell(), ` ${sName}`));

  return el('div', { class: 'card', style: { borderColor: item.color } },
    header,
    el('div', { class: 'mt-4' },
      el('div', { class: 'text-4xl tabular-nums' }, formatHMS(remain)),
      el('div', { class: 'mt-3' }, progressBar),
      el('div', { class: 'mt-3 row', style: { flexWrap: 'wrap', gap: '8px' } }, inputs, ...sounds)
    )
  );
}

function TimerPage() {
  const presets = [
    { label: '1m', ms: 60_000 },
    { label: '5m', ms: 5 * 60_000 },
    { label: '15m', ms: 15 * 60_000 },
    { label: '30m', ms: 30 * 60_000 },
    { label: '1h', ms: 60 * 60_000 },
  ];

  const header = el('div', { class: 'row space-between' },
    el('h2', { class: 'text-2xl' }, 'Timer'),
    el('div', { class: 'row' },
      ...presets.map((p) => el('button', { class: 'btn btn-outline', onClick: () => actions.addTimer(p.ms, `Timer ${p.label}`) }, p.label)),
      el('button', { class: 'btn btn-primary', onClick: () => actions.addTimer(5 * 60_000) }, Icons.Plus(), 'Add Timer')
    )
  );

  const content = state.timers.length
    ? el('div', { class: 'grid grid-2' }, state.timers.map((t) => TimerCard(t)))
    : el('div', { class: 'card' }, el('p', { class: 'text-sm' }, 'No timers yet. Use presets or "Add Timer" to create one.'));

  return el('div', { class: 'container' }, header, el('div', { class: 'mt-4' }, content));
}

function StopwatchCard(item) {
  const running = item.startedAtMs != null;
  const now = Date.now();
  const elapsed = running ? now - item.startedAtMs + item.accumulatedMs : item.accumulatedMs;

  function exportCSV() {
    const header = 'Lap,Split (ms),Split,Total (ms),Total\n';
    const rows = item.laps.map((lap, i) => `${i + 1},${lap.lapMs},${formatStopwatch(lap.lapMs)},${lap.totalMs},${formatStopwatch(lap.totalMs)}`);
    const csv = header + rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${item.label.replace(/\s+/g, '_')}_laps.csv`;
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }

  const header = el('div', { class: 'row space-between' },
    el('div', { class: 'row' },
      el('div', { style: { width: '12px', height: '12px', borderRadius: '999px', backgroundColor: item.color } }),
      el('input', { class: 'input', style: { background: 'transparent', border: 'none', fontSize: '1.125rem', fontWeight: '700', width: 'auto' }, value: item.label, onInput: (e) => actions.renameStopwatch(item.id, e.target.value) })
    ),
    el('div', { class: 'row' },
      !running
        ? el('button', { class: 'btn btn-success', onClick: () => actions.startStopwatch(item.id) }, Icons.Play(), 'Start')
        : el('button', { class: 'btn btn-warning', onClick: () => actions.stopStopwatch(item.id) }, Icons.Square(), 'Stop'),
      el('button', { class: 'btn btn-outline', onClick: () => actions.resetStopwatch(item.id) }, Icons.RotateCcw(), 'Reset'),
      el('button', { class: 'btn btn-outline', onClick: () => actions.lapStopwatch(item.id), disabled: !running }, Icons.Flag(), 'Lap'),
      el('button', { class: 'btn btn-outline', onClick: exportCSV, disabled: item.laps.length === 0 }, Icons.Download(), 'CSV'),
      el('button', { class: 'btn btn-danger', onClick: () => actions.removeStopwatch(item.id) }, Icons.Trash2())
    )
  );

  const table = item.laps.length ? el('div', { class: 'mt-4', style: { maxHeight: '192px', overflow: 'auto', border: `1px solid var(--border)`, borderRadius: '12px' } },
    el('table', { style: { width: '100%', fontSize: '0.875rem', borderCollapse: 'separate', borderSpacing: 0 } },
      el('thead', {},
        el('tr', {},
          el('th', { style: { textAlign: 'left', padding: '8px 12px', position: 'sticky', top: 0, background: 'var(--bg-muted)' } }, 'Lap'),
          el('th', { style: { textAlign: 'left', padding: '8px 12px', position: 'sticky', top: 0, background: 'var(--bg-muted)' } }, 'Split'),
          el('th', { style: { textAlign: 'left', padding: '8px 12px', position: 'sticky', top: 0, background: 'var(--bg-muted)' } }, 'Total'),
        )
      ),
      el('tbody', {},
        item.laps.map((lap, i) => el('tr', {},
          el('td', { style: { padding: '8px 12px' } }, String(i + 1)),
          el('td', { style: { padding: '8px 12px' } }, formatStopwatch(lap.lapMs, 3)),
          el('td', { style: { padding: '8px 12px' } }, formatStopwatch(lap.totalMs, 3)),
        ))
      )
    )
  ) : null;

  return el('div', { class: 'card', style: { borderColor: item.color } },
    header,
    el('div', { class: 'mt-4 text-5xl tabular-nums' }, formatStopwatch(elapsed, 3)),
    table
  );
}

function StopwatchPage() {
  const header = el('div', { class: 'row space-between' },
    el('h2', { class: 'text-2xl' }, 'Stopwatch'),
    el('button', { class: 'btn btn-primary', onClick: () => actions.addStopwatch() }, Icons.Plus(), 'Add Stopwatch')
  );

  const content = state.stopwatches.length
    ? el('div', { class: 'grid grid-2' }, state.stopwatches.map((sw) => StopwatchCard(sw)))
    : el('div', { class: 'card' }, el('p', { class: 'text-sm' }, 'No stopwatches yet. Click "Add Stopwatch" to create one.'));

  return el('div', { class: 'container' }, header, el('div', { class: 'mt-4' }, content));
}

function CounterCard(item) {
  const running = item.startedAtMs != null;
  const now = Date.now();
  // tick logic happens centrally in ticker; here render current value
  const progress = percent(
    item.direction === 'up' ? item.value - item.start : item.start - item.value,
    Math.abs(item.target - item.start)
  );

  const header = el('div', { class: 'row space-between' },
    el('div', { class: 'row' },
      el('div', { style: { width: '12px', height: '12px', borderRadius: '999px', backgroundColor: item.color } }),
      el('input', { class: 'input', style: { background: 'transparent', border: 'none', fontSize: '1.125rem', fontWeight: '700', width: 'auto' }, value: item.label, onInput: (e) => actions.renameCounter(item.id, e.target.value) })
    ),
    el('div', { class: 'row' },
      !running
        ? el('button', { class: 'btn btn-success', onClick: () => actions.startCounter(item.id) }, Icons.Play(), 'Start')
        : el('button', { class: 'btn btn-warning', onClick: () => actions.stopCounter(item.id) }, Icons.Square(), 'Pause'),
      el('button', { class: 'btn btn-outline', onClick: () => actions.resetCounter(item.id) }, Icons.RotateCcw(), 'Reset'),
      el('button', { class: 'btn btn-danger', onClick: () => actions.removeCounter(item.id) }, Icons.Trash2())
    )
  );

  const configGrid = el('div', { class: 'grid', style: { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' } },
    el('label', { class: 'text-sm' }, 'Start', el('input', { class: 'input mt-1', type: 'number', value: item.start, onInput: (e) => actions.setCounterConfig(item.id, { start: Number(e.target.value) }) })),
    el('label', { class: 'text-sm' }, 'Target', el('input', { class: 'input mt-1', type: 'number', value: item.target, onInput: (e) => actions.setCounterConfig(item.id, { target: Number(e.target.value) }) })),
    el('label', { class: 'text-sm' }, 'Step', el('input', { class: 'input mt-1', type: 'number', value: item.step, onInput: (e) => actions.setCounterConfig(item.id, { step: Number(e.target.value) }) })),
    el('label', { class: 'text-sm' }, 'Interval (s)', el('input', { class: 'input mt-1', type: 'number', step: 0.1, min: 0.1, max: 10, value: item.intervalMs / 1000, onInput: (e) => actions.setCounterConfig(item.id, { intervalMs: Math.round(Number(e.target.value) * 1000) }) })),
    el('div', { class: 'row', style: { gridColumn: '1 / -1', gap: '8px', alignItems: 'center' } },
      el('label', { class: 'text-sm' }, 'Direction'),
      el('select', { class: 'select', value: item.direction, onInput: (e) => actions.setCounterConfig(item.id, { direction: e.target.value }) },
        el('option', { value: 'up' }, 'Up'),
        el('option', { value: 'down' }, 'Down'),
      )
    ),
  );

  const progressBar = el('div', { class: 'progress mt-3' }, el('div', { class: 'bar', style: { width: `${progress}%` } }));

  return el('div', { class: 'card', style: { borderColor: item.color } },
    header,
    configGrid,
    el('div', { class: 'mt-4 text-5xl tabular-nums' }, String(item.value)),
    progressBar,
  );
}

function CounterPage() {
  const header = el('div', { class: 'row space-between' },
    el('h2', { class: 'text-2xl' }, 'Counter'),
    el('button', { class: 'btn btn-primary', onClick: () => actions.addCounter() }, Icons.Plus(), 'Add Counter')
  );
  const content = state.counters.length
    ? el('div', { class: 'grid grid-2' }, state.counters.map((c) => CounterCard(c)))
    : el('div', { class: 'card' }, el('p', { class: 'text-sm' }, 'No counters yet. Click "Add Counter" to create one.'));
  return el('div', { class: 'container' }, header, el('div', { class: 'mt-4' }, content));
}

function SettingsPage() {
  const themeButtons = el('div', { class: 'row' },
    el('button', { class: `btn btn-outline${state.theme === 'light' ? ' ringed' : ''}`, onClick: () => actions.setTheme('light') }, Icons.Sun(), 'Light'),
    el('button', { class: `btn btn-outline${state.theme === 'dark' ? ' ringed' : ''}`, onClick: () => actions.setTheme('dark') }, Icons.Moon(), 'Dark'),
    el('button', { class: `btn btn-outline${state.theme === 'system' ? ' ringed' : ''}`, onClick: () => actions.setTheme('system') }, Icons.MonitorCog(), 'System'),
  );

  const intro = el('p', { class: 'text-sm' }, 'Your timers, stopwatches and counters persist locally. Enable notifications in your browser for alerts when timers complete.');
  const notifBtn = ('Notification' in window && Notification.permission !== 'granted')
    ? el('button', { class: 'btn btn-primary', onClick: () => Notification.requestPermission() }, 'Enable Notifications')
    : null;

  return el('div', { class: 'container' },
    el('h2', { class: 'text-2xl' }, 'Settings'),
    el('div', { class: 'card mt-4' }, el('label', { class: 'text-sm', style: { fontWeight: '600' } }, 'Theme'), el('div', { class: 'mt-2' }, themeButtons)),
    el('div', { class: 'card mt-4' }, intro, notifBtn ? el('div', { class: 'mt-2' }, notifBtn) : null)
  );
}

// Simple router via in-memory tab
let currentTab = 'timer';
function setTab(key) { currentTab = key; render(); }

// Theme sync
function applyTheme() {
  const root = document.documentElement;
  const dark = state.theme === 'dark' || (state.theme === 'system' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  root.classList.toggle('dark', !!dark);
}

// Root render
function render() {
  applyTheme();
  document.title = 'Chronos — Timer • Stopwatch • Counter';
  const root = document.getElementById('root');
  root.innerHTML = '';
  root.appendChild(renderTopBar(currentTab));
  let page;
  if (currentTab === 'timer') page = TimerPage();
  else if (currentTab === 'stopwatch') page = StopwatchPage();
  else if (currentTab === 'counter') page = CounterPage();
  else page = SettingsPage();
  root.appendChild(page);
}

// Subscribe to state changes to rerender
subscribe(() => render());

// Ticker loop (60fps)
let lastPerf = performance.now();
function tick(nowPerf) {
  const interval = 1000 / 60;
  if (nowPerf - lastPerf >= interval) {
    lastPerf = nowPerf;
    // Counter stepping logic
    state.counters.forEach((item) => {
      if (item.startedAtMs == null) return;
      const elapsed = Date.now() - item.startedAtMs;
      if (elapsed >= item.intervalMs) {
        const steps = Math.floor(elapsed / item.intervalMs);
        const delta = steps * item.step * (item.direction === 'down' ? -1 : 1);
        const next = item.value + delta;
        if ((item.direction === 'up' && next >= item.target) || (item.direction === 'down' && next <= item.target)) {
          actions.setCounterConfig(item.id, { value: item.target, startedAtMs: null });
        } else {
          actions.setCounterConfig(item.id, { value: next, startedAtMs: item.startedAtMs + steps * item.intervalMs });
        }
      }
    });
    // Timers and stopwatches are derived during render; just trigger re-render
    subscribers.forEach((fn) => fn(state));
  }
  requestAnimationFrame(tick);
}

// Boot
window.addEventListener('load', () => {
  // Request notification permission non-intrusively on first visit when timer completes; user can enable in settings.
  render();
  requestAnimationFrame(tick);
});

// Simple WebAudio sounds: beep, chime, bell
let audioCtx;
function ensureAudio() { if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
function tone(freq, durationMs, type = 'sine', gain = 0.08) {
  ensureAudio();
  const t0 = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.value = gain;
  osc.connect(g); g.connect(audioCtx.destination);
  osc.start(t0);
  g.gain.setTargetAtTime(0, t0 + durationMs / 1000 - 0.03, 0.02);
  osc.stop(t0 + durationMs / 1000);
}
function playSound(kind) {
  try {
    if (kind === 'beep') {
      tone(880, 120, 'square');
      setTimeout(() => tone(660, 140, 'square'), 140);
    } else if (kind === 'bell') {
      tone(1567, 60, 'sine', 0.06);
      setTimeout(() => tone(1047, 180, 'sine', 0.06), 60);
    } else if (kind === 'chime') {
      tone(523, 120, 'sine', 0.07);
      setTimeout(() => tone(659, 140, 'sine', 0.07), 130);
      setTimeout(() => tone(784, 180, 'sine', 0.07), 280);
    }
  } catch {}
}

