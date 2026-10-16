// Small interactive SVG chart primitives: horizontal bars, stacked columns, lines and a bubble grid.
// No charting library. Each chart redraws on container resize, has a hover/focus tooltip and a
// table view of the same numbers (the yellow and magenta series sit below 3:1 contrast on paper,
// so the table is the required relief, not decoration).
const NS = 'http://www.w3.org/2000/svg';
export const fmt = n => Number(n).toLocaleString('en-GB');
export const pct = (a, b, digits = 0) => (b ? `${(100 * a / b).toFixed(digits)}%` : '—');
export const SURFACE = '#fcfbf8';
const INK = '#252b2a', MUTED = '#66716d', RULE = '#d6dad3', GRID = '#e8ebe5';

const svgEl = (name, attrs = {}, text) => {
  const e = document.createElementNS(NS, name);
  for (const [k, v] of Object.entries(attrs)) if (v !== undefined && v !== null) e.setAttribute(k, v);
  if (text !== undefined) e.textContent = text;
  return e;
};
export const html = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };
const charW = (size = 13) => size * 0.53;
const truncate = (text, width, size = 13) => { const max = Math.floor(width / charW(size)); return text.length <= max ? text : text.slice(0, Math.max(1, max - 1)) + '…'; };
const nice = max => { if (max <= 0) return 1; const p = Math.pow(10, Math.floor(Math.log10(max))), f = max / p; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p; };

// One tooltip for the page. `lines` is an array of strings or {text, strong, color, muted}.
let tipEl;
function tipNode() {
  if (tipEl) return tipEl;
  tipEl = html('div', 'chart-tip'); tipEl.setAttribute('role', 'tooltip'); tipEl.hidden = true; document.body.append(tipEl);
  return tipEl;
}
export function showTip(lines, x, y) {
  const t = tipNode(); t.replaceChildren();
  for (const line of lines) {
    const row = html('div', 'chart-tip-line');
    const l = typeof line === 'string' ? { text: line } : line;
    if (l.color) { const dot = html('span', 'chart-tip-dot'); dot.style.background = l.color; row.append(dot); }
    const span = html(l.strong ? 'strong' : 'span', l.muted ? 'muted' : '', l.text); row.append(span);
    t.append(row);
  }
  t.hidden = false;
  const w = t.offsetWidth, h = t.offsetHeight, vw = window.innerWidth, vh = window.innerHeight;
  let left = x + 14, top = y + 14;
  if (left + w > vw - 8) left = x - w - 14;
  if (top + h > vh - 8) top = y - h - 14;
  t.style.left = Math.max(4, left + window.scrollX) + 'px'; t.style.top = Math.max(4, top + window.scrollY) + 'px';
}
export function hideTip() { if (tipEl) tipEl.hidden = true; }
// Attach hover and keyboard-focus tooltips to an element. `lines` may be a function (called on show).
export function attachTip(el, lines) {
  const get = () => (typeof lines === 'function' ? lines() : lines);
  el.addEventListener('mouseenter', e => showTip(get(), e.clientX, e.clientY));
  el.addEventListener('mousemove', e => showTip(get(), e.clientX, e.clientY));
  el.addEventListener('mouseleave', hideTip);
  el.addEventListener('focus', () => { const r = el.getBoundingClientRect(); showTip(get(), r.left + r.width / 2, r.top + r.height); });
  el.addEventListener('blur', hideTip);
}
document.addEventListener('scroll', hideTip, { passive: true });

// Redraw charts when their container changes width.
const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(entries => {
  for (const entry of entries) { const draw = entry.target._redraw; if (draw && Math.abs((entry.target._drawnWidth || 0) - entry.target.clientWidth) > 2) draw(); }
}) : null;
function mount(target, draw) {
  target._redraw = () => { target._drawnWidth = target.clientWidth; draw(target.clientWidth || 600); };
  observer?.observe(target);
  target._redraw();
}
function makeSvg(width, height, label) {
  const svg = svgEl('svg', { viewBox: `0 0 ${width} ${height}`, width, height, role: 'img', 'aria-label': label, class: 'chart-svg' });
  svg.style.width = '100%'; svg.style.height = 'auto';
  return svg;
}
function tableView(head, rows, caption) {
  const details = html('details', 'chart-table');
  details.append(html('summary', undefined, 'Show as table'));
  const table = html('table'); if (caption) table.append(html('caption', undefined, caption));
  const thead = html('thead'), tr = html('tr'); for (const h of head) tr.append(html('th', undefined, h)); thead.append(tr);
  const tbody = html('tbody');
  for (const r of rows) { const row = html('tr'); r.forEach((c, i) => row.append(html(i ? 'td' : 'th', undefined, c == null ? '' : String(c)))); tbody.append(row); }
  table.append(thead, tbody); details.append(table);
  return details;
}
function legend(series, hidden, onToggle) {
  const box = html('div', 'chart-legend'); box.setAttribute('aria-label', 'Series');
  for (const s of series) {
    const b = html('button', 'chart-legend-item' + (hidden.has(s.id) ? ' off' : '')); b.type = 'button'; b.setAttribute('aria-pressed', String(!hidden.has(s.id)));
    const dot = html('span', 'chart-legend-dot'); dot.style.background = s.color; b.append(dot, html('span', undefined, s.name));
    b.title = hidden.has(s.id) ? 'Show ' + s.name : 'Hide ' + s.name;
    b.addEventListener('click', () => onToggle(s.id)); box.append(b);
  }
  return box;
}

/** Horizontal bars. items: [{key, label, value, total?, color?, segments?: [{id, name, color, value}], note?}]. */
export function hbars(target, { items, mode = 'count', max, label = 'Bars', format, tipLines, onClick, tableHead, tableRows, rowHeight = 27, labelWidth, showValue = true }) {
  target.replaceChildren();
  if (!items.length) { target.append(html('p', 'chart-empty', 'No records in this selection.')); return; }
  mount(target, width => {
    target.replaceChildren();
    const lw = labelWidth || Math.min(260, Math.max(120, width * 0.3)), valueW = 70, h = items.length * rowHeight + 8;
    const svg = makeSvg(width, h, label), barW = Math.max(40, width - lw - valueW - 8);
    const top = max ?? Math.max(1, ...items.map(i => (mode === 'share' && i.total ? 100 * i.value / i.total : i.value)));
    const scale = v => (barW * v) / top;
    items.forEach((it, i) => {
      const y = i * rowHeight + 4, bh = rowHeight - 9;
      const g = svgEl('g', { class: 'chart-row' + (onClick ? ' clickable' : ''), tabindex: '0', role: onClick ? 'button' : 'img' });
      const shown = mode === 'share' && it.total ? 100 * it.value / it.total : it.value;
      g.setAttribute('aria-label', `${it.label}: ${format ? format(it) : fmt(it.value)}`);
      g.append(svgEl('rect', { x: 0, y: y - 2, width, height: rowHeight, fill: 'transparent' }));
      const t = svgEl('text', { x: lw - 10, y: y + bh / 2, 'text-anchor': 'end', 'dominant-baseline': 'central', class: 'chart-label' }, truncate(it.label, lw - 14));
      g.append(t);
      if (it.segments?.length) {
        let x = lw;
        for (const s of it.segments) { if (!s.value) continue; const w = scale(mode === 'share' && it.total ? 100 * s.value / it.total : s.value); g.append(svgEl('rect', { x, y, width: Math.max(0, w - 1.5), height: bh, fill: s.color, rx: 1.5 })); x += w; }
      } else {
        g.append(svgEl('rect', { x: lw, y, width: Math.max(1.5, scale(shown)), height: bh, fill: it.color || '#1f8a5a', rx: 2 }));
      }
      if (showValue) g.append(svgEl('text', { x: lw + scale(shown) + 7, y: y + bh / 2, 'dominant-baseline': 'central', class: 'chart-value' }, format ? format(it) : (mode === 'share' ? pct(it.value, it.total) : fmt(it.value))));
      if (tipLines) attachTip(g, () => tipLines(it));
      if (onClick) { g.addEventListener('click', () => onClick(it)); g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(it); } }); }
      svg.append(g);
    });
    target.append(svg);
    if (tableHead && tableRows) target.append(tableView(tableHead, tableRows, label));
  });
}

/** Stacked or grouped columns over categories. series: [{id, name, color, data: number[]}]. */
export function columns(target, { categories, series, stacked = true, percent = false, height = 300, label = 'Columns', yFormat, tipLines, onClick, tableHead, tableRows, showLegend = true, xEvery }) {
  target.replaceChildren();
  const hidden = new Set();
  if (!categories.length) { target.append(html('p', 'chart-empty', 'No records in this selection.')); return; }
  const draw = width => {
    target.replaceChildren();
    const active = series.filter(s => !hidden.has(s.id));
    if (showLegend && series.length > 1) target.append(legend(series, hidden, id => { hidden.has(id) ? hidden.delete(id) : hidden.add(id); draw(width); }));
    const m = { l: 46, r: 10, t: 12, b: 34 }, w = width - m.l - m.r, h = height - m.t - m.b;
    const svg = makeSvg(width, height, label);
    const totals = categories.map((_, i) => active.reduce((t, s) => t + (s.data[i] || 0), 0));
    const rawMax = Math.max(1, ...(stacked ? totals : active.flatMap(s => s.data)));
    const maxV = percent ? 100 : rawMax <= 4 ? rawMax : nice(rawMax);
    const ticks = percent ? 4 : Math.min(4, maxV);
    for (let k = 0; k <= ticks; k++) {
      const y = m.t + h - (h * k) / ticks, v = (maxV * k) / ticks;
      svg.append(svgEl('line', { x1: m.l, x2: m.l + w, y1: y, y2: y, stroke: k ? GRID : RULE, 'stroke-width': 1 }));
      svg.append(svgEl('text', { x: m.l - 8, y, 'text-anchor': 'end', 'dominant-baseline': 'central', class: 'chart-axis' }, yFormat ? yFormat(v) : (percent ? `${v}%` : fmt(v))));
    }
    const n = categories.length, slot = w / n, gap = Math.min(6, slot * 0.25), colW = Math.max(2, slot - gap);
    const every = xEvery || Math.max(1, Math.ceil(n / Math.floor(w / 46)));
    categories.forEach((c, i) => {
      const x = m.l + i * slot + gap / 2, total = totals[i];
      if (i % every === 0 || n <= 12) svg.append(svgEl('text', { x: x + colW / 2, y: height - m.b + 16, 'text-anchor': 'middle', class: 'chart-axis' }, String(c)));
      const g = svgEl('g', { class: 'chart-col' + (onClick ? ' clickable' : ''), tabindex: '0', role: onClick ? 'button' : 'img', 'aria-label': `${c}: ${fmt(total)}` });
      g.append(svgEl('rect', { x: m.l + i * slot, y: m.t, width: slot, height: h, fill: 'transparent', class: 'chart-hit' }));
      if (stacked) {
        let acc = 0;
        for (const s of active) {
          const v = s.data[i] || 0; if (!v) continue;
          const vh = (percent ? (total ? 100 * v / total : 0) : v) / maxV * h;
          const y = m.t + h - (acc + vh);
          g.append(svgEl('rect', { x, y: y + 1, width: colW, height: Math.max(0, vh - 2), fill: s.color, rx: 1 }));
          acc += vh;
        }
      } else {
        const gw = colW / Math.max(1, active.length);
        active.forEach((s, k) => { const v = s.data[i] || 0, vh = v / maxV * h; g.append(svgEl('rect', { x: x + k * gw, y: m.t + h - vh, width: Math.max(1, gw - 2), height: vh, fill: s.color, rx: 1 })); });
      }
      if (tipLines) attachTip(g, () => tipLines(i, active));
      if (onClick) { g.addEventListener('click', () => onClick(i)); g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(i); } }); }
      svg.append(g);
    });
    target.append(svg);
    if (tableHead && tableRows) target.append(tableView(tableHead, tableRows, label));
  };
  mount(target, draw);
}

/** Lines over categories. series: [{id, name, color, data: (number|null)[]}]. */
export function lines(target, { categories, series, yMax, height = 240, label = 'Lines', yFormat, tipLines, tableHead, tableRows }) {
  target.replaceChildren();
  if (!categories.length) { target.append(html('p', 'chart-empty', 'No records in this selection.')); return; }
  mount(target, width => {
    target.replaceChildren();
    if (series.length > 1) target.append(legend(series, new Set(), () => {}));
    const m = { l: 46, r: 14, t: 14, b: 34 }, w = width - m.l - m.r, h = height - m.t - m.b;
    const svg = makeSvg(width, height, label);
    const top = yMax ?? nice(Math.max(1, ...series.flatMap(s => s.data.filter(v => v != null))));
    for (let k = 0; k <= 4; k++) {
      const y = m.t + h - (h * k) / 4, v = (top * k) / 4;
      svg.append(svgEl('line', { x1: m.l, x2: m.l + w, y1: y, y2: y, stroke: k ? GRID : RULE }));
      svg.append(svgEl('text', { x: m.l - 8, y, 'text-anchor': 'end', 'dominant-baseline': 'central', class: 'chart-axis' }, yFormat ? yFormat(v) : fmt(v)));
    }
    const n = categories.length, step = n > 1 ? w / (n - 1) : 0, xs = i => m.l + (n > 1 ? i * step : w / 2), ys = v => m.t + h - (v / top) * h;
    const every = Math.max(1, Math.ceil(n / Math.floor(w / 46)));
    categories.forEach((c, i) => { if (i % every === 0 || n <= 12) svg.append(svgEl('text', { x: xs(i), y: height - m.b + 16, 'text-anchor': 'middle', class: 'chart-axis' }, String(c))); });
    for (const s of series) {
      let d = '', pen = false;
      s.data.forEach((v, i) => { if (v == null) { pen = false; return; } d += `${pen ? 'L' : 'M'}${xs(i).toFixed(1)},${ys(v).toFixed(1)}`; pen = true; });
      svg.append(svgEl('path', { d, fill: 'none', stroke: s.color, 'stroke-width': 2, 'stroke-linejoin': 'round' }));
      s.data.forEach((v, i) => { if (v != null) svg.append(svgEl('circle', { cx: xs(i), cy: ys(v), r: 4, fill: s.color, stroke: SURFACE, 'stroke-width': 2 })); });
    }
    const cross = svgEl('line', { y1: m.t, y2: m.t + h, stroke: MUTED, 'stroke-dasharray': '3 3', visibility: 'hidden' }); svg.append(cross);
    categories.forEach((c, i) => {
      const g = svgEl('g', { tabindex: '0', role: 'img', 'aria-label': `${c}: ${series.map(s => `${s.name} ${s.data[i] == null ? 'no data' : (yFormat ? yFormat(s.data[i]) : s.data[i])}`).join(', ')}` });
      g.append(svgEl('rect', { x: xs(i) - step / 2, y: m.t, width: Math.max(4, step), height: h, fill: 'transparent' }));
      g.addEventListener('mouseenter', () => { cross.setAttribute('x1', xs(i)); cross.setAttribute('x2', xs(i)); cross.setAttribute('visibility', 'visible'); });
      g.addEventListener('mouseleave', () => cross.setAttribute('visibility', 'hidden'));
      if (tipLines) attachTip(g, () => tipLines(i));
      svg.append(g);
    });
    target.append(svg);
    if (tableHead && tableRows) target.append(tableView(tableHead, tableRows, label));
  });
}

/** Bubble grid: one row per entity, one column per year. cells: [{row, col, n, share}] with share in 0..1. */
export function bubbleGrid(target, { rows, cols, cells, label = 'Grid', tipLines, onClick, rowHeight = 22, maxRadius = 9, fill = '#1f8a5a', base = '#d8dcd5', tableHead, tableRows }) {
  target.replaceChildren();
  if (!rows.length) { target.append(html('p', 'chart-empty', 'No records in this selection.')); return; }
  const index = new Map(cells.map(c => [`${c.row}|${c.col}`, c]));
  const maxN = Math.max(1, ...cells.map(c => c.n));
  mount(target, width => {
    target.replaceChildren();
    const lw = Math.min(270, Math.max(110, width * 0.3)), m = { l: lw, r: 12, t: 26, b: 8 };
    const w = width - m.l - m.r, h = rows.length * rowHeight, height = h + m.t + m.b;
    const svg = makeSvg(width, height, label);
    const first = cols[0], last = cols[cols.length - 1], span = Math.max(1, last - first), xs = y => m.l + ((y - first) / span) * w;
    const cap = Math.min(maxRadius, Math.max(3.5, (w / span) * 0.52));
    const tickEvery = span > 40 ? 10 : 5;
    for (let y = Math.ceil(first / tickEvery) * tickEvery; y <= last; y += tickEvery) {
      svg.append(svgEl('line', { x1: xs(y), x2: xs(y), y1: m.t - 4, y2: m.t + h, stroke: GRID }));
      svg.append(svgEl('text', { x: xs(y), y: m.t - 10, 'text-anchor': 'middle', class: 'chart-axis' }, String(y)));
    }
    rows.forEach((r, i) => {
      const cy = m.t + i * rowHeight + rowHeight / 2;
      if (i % 2) svg.append(svgEl('rect', { x: 0, y: cy - rowHeight / 2, width, height: rowHeight, fill: '#f3f5f0' }));
      const rl = svgEl('text', { x: lw - 10, y: cy, 'text-anchor': 'end', 'dominant-baseline': 'central', class: 'chart-label' + (onClick ? ' clickable' : '') }, truncate(r.label, lw - 14));
      if (onClick) rl.addEventListener('click', () => onClick(r.id));
      svg.append(rl);
      for (const y of cols) {
        const c = index.get(`${r.id}|${y}`); if (!c) continue;
        const rad = 2.2 + (cap - 2.2) * Math.sqrt(c.n / maxN), cx = xs(y);
        const g = svgEl('g', { class: 'chart-cell' + (onClick ? ' clickable' : ''), tabindex: '0', role: onClick ? 'button' : 'img', 'aria-label': `${r.label}, class of ${y}: ${c.n} people, ${pct(c.share * c.n, c.n)} with a verified first job` });
        g.append(svgEl('circle', { cx, cy, r: Math.max(rad, 5), fill: 'transparent' }));
        g.append(svgEl('circle', { cx, cy, r: rad, fill: base }));
        const s = Math.max(0, Math.min(1, c.share || 0));
        if (s >= 0.999) g.append(svgEl('circle', { cx, cy, r: rad, fill }));
        else if (s > 0) { const a = -Math.PI / 2 + s * 2 * Math.PI; g.append(svgEl('path', { d: `M${cx},${cy}L${cx},${cy - rad}A${rad},${rad},0,${s > 0.5 ? 1 : 0},1,${(cx + rad * Math.cos(a)).toFixed(2)},${(cy + rad * Math.sin(a)).toFixed(2)}Z`, fill })); }
        if (tipLines) attachTip(g, () => tipLines(r, y, c));
        if (onClick) { g.addEventListener('click', () => onClick(r.id, y)); g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(r.id, y); } }); }
        svg.append(g);
      }
    });
    target.append(svg);
    if (tableHead && tableRows) target.append(tableView(tableHead, tableRows, label));
  });
}

/** Ranked rows (rank, name, count, share) as HTML, for destination and source lists. */
export function rankedRows(target, { items, total, onClick, emptyText = 'No records in this selection.' }) {
  target.replaceChildren();
  if (!items.length) { target.append(html('p', 'chart-empty', emptyText)); return; }
  items.forEach((it, i) => {
    const row = html('div', 'ranked-row');
    row.append(html('span', 'ranked-rank', String(i + 1)));
    if (it.color) { const dot = html('span', 'chart-legend-dot'); dot.style.background = it.color; dot.title = it.colorLabel || ''; row.append(dot); }
    if (onClick) { const b = html('button', 'ranked-name text-button', it.label); b.type = 'button'; b.addEventListener('click', () => onClick(it)); row.append(b); }
    else row.append(html('span', 'ranked-name', it.label));
    row.append(html('span', 'ranked-count', fmt(it.value)), html('span', 'ranked-share', total ? pct(it.value, total) : ''));
    target.append(row);
  });
}

/** Metric tiles: [{value, label, note?}]. */
export function tiles(target, items) {
  target.replaceChildren();
  for (const it of items) { const box = html('div', 'tile'); box.append(html('strong', undefined, it.value), html('span', undefined, it.label)); if (it.note) box.append(html('small', undefined, it.note)); target.append(box); }
}
