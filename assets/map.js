// Interactive world map of PhD-granting institutions. Hand-built SVG, no map library.
// Land shapes: world-atlas countries-110m (Natural Earth, ISC licence; see assets/vendor/world/LICENSE.txt).
// Projection: Equal Earth (Savric, Patterson & Jenny 2018). Locations: data/institution-locations.json.
// Each circle holds the institution's site icon inside a ring coloured by the share of its people with
// a verified first job; circle area is people in the dataset (or verified first jobs). Circles are nudged
// apart where institutions share a city, grow slowly as the map is zoomed, and spread again when the
// zoom settles. Hover shows a card and a click opens the profile on devices with a pointer; on touch
// screens a tap shows the card below the map.
const NS = 'http://www.w3.org/2000/svg';
const VIEWS = {
  world: { label: 'World', box: [-128, -43, 152, 62] },
  northAmerica: { label: 'North America', box: [-126, 25, -64, 54] },
  europe: { label: 'Europe', box: [-13, 38, 31, 60.5] },
  asiaPacific: { label: 'Asia & Pacific', box: [60, -47, 180, 50] }
};
const ZOOM_GROWTH = 0.4, MAX_ZOOM = 8;
const RING_BINS = [
  { max: 0, color: '#cfd4cc', label: 'None yet' },
  { max: 1 / 3, color: '#a9cdb9', label: 'Under a third' },
  { max: 2 / 3, color: '#5e9f7d', label: 'A third to two thirds' },
  { max: 1.01, color: '#1f6b4e', label: 'Over two thirds' }
];
const ABBREVIATIONS = {
  'Massachusetts Institute of Technology': 'MIT', 'Stanford University': 'Stanford', 'University of Pennsylvania': 'Penn',
  'Georgia Institute of Technology': 'Georgia Tech', 'Carnegie Mellon University': 'CMU', 'University of Michigan at Ann Arbor': 'Michigan',
  'University of California, Berkeley': 'Berkeley', 'University of California, Los Angeles': 'UCLA', 'London School of Economics and Political Science': 'LSE',
  'Hong Kong University of Science and Technology': 'HKUST', 'National University of Singapore': 'NUS', 'University of Illinois at Urbana-Champaign': 'UIUC',
  'University of North Carolina at Chapel Hill': 'UNC', 'University of Texas at Austin': 'UT Austin', 'The University of Texas at Dallas': 'UT Dallas',
  'Erasmus University Rotterdam': 'Erasmus', 'London Business School': 'LBS', 'New York University': 'NYU', 'University of Southern California': 'USC',
  'University of British Columbia': 'UBC', 'The Ohio State University': 'Ohio State', 'The Pennsylvania State University': 'Penn State',
  'Indian Institute of Management Bangalore': 'IIM Bangalore', 'Chinese University of Hong Kong': 'CUHK', 'University of Minnesota': 'Minnesota',
  'Shanghai Jiao Tong University': 'SJTU', 'Tsinghua University': 'Tsinghua', 'University of Toronto': 'Toronto', 'University of Chicago': 'Chicago'
};
const el = (name, attrs = {}, text) => {
  const e = document.createElementNS(NS, name);
  for (const [k, v] of Object.entries(attrs)) if (v != null) e.setAttribute(k, v);
  if (text !== undefined) e.textContent = text;
  return e;
};
const html = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };
const fmt = n => Number(n).toLocaleString('en-GB');
const pct = (a, b) => (b ? `${Math.round(100 * a / b)}%` : '—');
const shortName = name => ABBREVIATIONS[name] || name.replace(/^(The )?University of /, '').replace(/ University$/, '').replace(/^The /, '');
const monogram = name => { const s = ABBREVIATIONS[name]; if (s && s.length <= 4 && s === s.toUpperCase()) return s; return shortName(name).split(/[\s-]+/).filter(w => /^[A-Z]/.test(w)).map(w => w[0]).join('').slice(0, 3) || name.slice(0, 2); };
const ringBin = share => RING_BINS.find(b => share <= b.max) || RING_BINS[RING_BINS.length - 1];
const hoverable = () => window.matchMedia('(hover: hover)').matches;
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Equal Earth projection, unscaled; y grows downward. */
function equalEarth(lon, lat) {
  const A1 = 1.340264, A2 = -0.081106, A3 = 0.000893, A4 = 0.003796, M = Math.sqrt(3) / 2;
  const phi = lat * Math.PI / 180, lam = lon * Math.PI / 180, t = Math.asin(M * Math.sin(phi)), t2 = t * t, t6 = t2 * t2 * t2;
  return [2 * Math.sqrt(3) * lam * Math.cos(t) / (3 * (A1 + 3 * A2 * t2 + t6 * (7 * A3 + 9 * A4 * t2))), -t * (A1 + A2 * t2 + t6 * (A3 + A4 * t2))];
}
/** Decode TopoJSON country polygons into arrays of rings of [lon, lat], without Antarctica. */
function countryRings(topo) {
  const [sx, sy] = topo.transform.scale, [tx, ty] = topo.transform.translate;
  const arcs = topo.arcs.map(arc => { let x = 0, y = 0; return arc.map(([dx, dy]) => { x += dx; y += dy; return [x * sx + tx, y * sy + ty]; }); });
  const arcPoints = i => (i < 0 ? arcs[~i].slice().reverse() : arcs[i]);
  const ring = indexes => indexes.flatMap((i, n) => (n ? arcPoints(i).slice(1) : arcPoints(i)));
  const out = [];
  for (const g of topo.objects.countries.geometries) {
    if (g.properties?.name === 'Antarctica') continue;
    for (const polygon of g.type === 'Polygon' ? [g.arcs] : g.type === 'MultiPolygon' ? g.arcs : []) for (const r of polygon) out.push(ring(r));
  }
  return out;
}

let worldPromise = null;
const loadWorld = () => (worldPromise ||= fetch('assets/vendor/world/countries-110m.json').then(r => r.json()).then(countryRings).catch(e => { worldPromise = null; throw e; }));
let locationsPromise = null;
const loadLocations = () => (locationsPromise ||= fetch('data/institution-locations.json').then(r => r.json()).catch(e => { locationsPromise = null; throw e; }));

export async function renderMap(target, state, { onSelect, openProfile, isCurrent = () => true } = {}) {
  target.classList.remove('empty');
  target.replaceChildren(html('p', 'map-note', 'Loading the map…'));
  let land, locations;
  try { [land, locations] = await Promise.all([loadWorld(), loadLocations()]); }
  catch {
    if (!isCurrent()) return;
    target.classList.add('empty');
    target.replaceChildren(html('strong', undefined, 'The map could not be loaded'), html('span', undefined, 'Please reload the page, or use the other coverage views.'));
    return;
  }
  if (!isCurrent()) return;  // another coverage view was chosen while the shapes loaded

  // One node per located institution: people in the directory and their research status.
  const stats = new Map();
  const indexed = state.faculty.some(p => 'placement' in p);
  for (const p of state.faculty) {
    if (!p.phdInstitution) continue;
    const s = stats.get(p.phdInstitution) || { people: 0, verified: 0, unresolved: 0, tt: 0, first: Infinity, last: -Infinity };
    s.people++;
    if (p.placement) { s.verified++; if (p.placement.category === 'tenure-track') s.tt++; } else if (p.status === 'unresolved') s.unresolved++;
    if (p.phdYear) { s.first = Math.min(s.first, p.phdYear); s.last = Math.max(s.last, p.phdYear); }
    stats.set(p.phdInstitution, s);
  }
  if (!indexed) for (const r of state.placements) { const s = stats.get(r.phdInstitution); if (s) { s.verified++; if (r.category === 'tenure-track') s.tt++; } }
  const nodes = locations.records.filter(r => r.qid && stats.has(r.institution)).map(r => ({ id: r.institution, name: r.institution, qid: r.qid, country: r.country || null, logo: r.logo || null, lat: r.lat, lon: r.lon, ...stats.get(r.institution) }));
  const unmapped = [...stats.keys()].filter(name => !nodes.some(n => n.id === name));
  const unmappedPeople = unmapped.reduce((n, name) => n + stats.get(name).people, 0);

  const M = { region: 'world', metric: 'people', zoom: { k: 1, tx: 0, ty: 0 }, selected: null, pin: null, layout: null, anim: 0, frame: 0, panning: false, dragged: false };
  const value = n => (M.metric === 'people' ? n.people : n.verified);

  // ---- Page structure ----
  const controls = html('div', 'map-controls');
  const regionGroup = html('div', 'map-control-group'), metricGroup = html('div', 'map-control-group');
  regionGroup.append(html('span', 'map-control-label', 'Region'), toggleGroup(Object.entries(VIEWS).map(([k, v]) => [k, v.label]), 'world', v => { M.region = v; M.pin = null; M.selected = null; render(true); }));
  metricGroup.append(html('span', 'map-control-label', 'Circle area'), toggleGroup([['people', 'People in the dataset'], ['verified', 'Verified first jobs']], 'people', v => { M.metric = v; M.selected = null; render(false); }));
  controls.append(regionGroup, metricGroup);
  const stage = html('div', 'map-stage');
  const svg = el('svg', { class: 'map-svg', role: 'group', 'aria-label': 'Map of PhD-granting institutions in the dataset' });
  const zoomBox = html('div', 'map-zoom');
  const buttons = {};
  for (const [id, text, label] of [['in', '+', 'Zoom in'], ['out', '−', 'Zoom out'], ['reset', '↺', 'Reset the map']]) { const b = html('button', undefined, text); b.type = 'button'; b.setAttribute('aria-label', label); b.title = label; buttons[id] = b; zoomBox.append(b); }
  const hint = html('div', 'map-zoom-hint', /Mac|iPhone|iPad/.test(navigator.platform) ? 'Pinch or ⌘ + scroll to zoom the map' : 'Pinch or Ctrl + scroll to zoom the map');
  const card = html('div', 'map-card'); card.hidden = true; card.setAttribute('role', 'dialog'); card.setAttribute('aria-label', 'Institution details');
  stage.append(svg, zoomBox, hint, card);
  const legend = html('div', 'map-legend');
  const note = html('p', 'map-note');
  target.replaceChildren(controls, stage, legend, note);

  function toggleGroup(entries, current, on) {
    const box = html('div', 'map-toggle-group'); box.setAttribute('role', 'group');
    for (const [v, t] of entries) { const b = html('button', 'map-toggle' + (v === current ? ' active' : ''), t); b.type = 'button'; b.setAttribute('aria-pressed', String(v === current)); b.addEventListener('click', () => { box.querySelectorAll('button').forEach(x => { x.classList.toggle('active', x === b); x.setAttribute('aria-pressed', String(x === b)); }); on(v); }); box.append(b); }
    return box;
  }

  // ---- Layout: project the region, place and spread the circles ----
  function render(animate) {
    const W = stage.clientWidth || 600, mobile = W < 600;
    const [west, south, east, north] = VIEWS[M.region].box;
    const edge = [];
    for (let i = 0; i <= 20; i++) { const lon = west + (east - west) * i / 20, lat = south + (north - south) * i / 20; edge.push(equalEarth(lon, south), equalEarth(lon, north), equalEarth(west, lat), equalEarth(east, lat)); }
    const x0 = Math.min(...edge.map(p => p[0])), x1 = Math.max(...edge.map(p => p[0])), y0 = Math.min(...edge.map(p => p[1])), y1 = Math.max(...edge.map(p => p[1]));
    const k = W / (x1 - x0), H = Math.round((y1 - y0) * k);
    const project = (lon, lat) => { const [x, y] = equalEarth(lon, lat); return [(x - x0) * k, (y - y0) * k]; };
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.setAttribute('width', W); svg.setAttribute('height', H);
    const landPath = land.map(ring => { let d = '', prev = null; for (const [lon, lat] of ring) { const [x, y] = project(lon, lat); d += `${prev === null || Math.abs(lon - prev) > 180 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`; prev = lon; } return d + 'Z'; }).join('');
    const line = pts => pts.map(([lon, lat], i) => { const [x, y] = project(lon, lat); return `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`; }).join('');
    const span = (a, b, step) => Array.from({ length: Math.round((b - a) / step) + 1 }, (_, i) => a + i * step);
    const grid = [...span(-180, 180, 30).map(lon => line(span(-80, 80, 4).map(lat => [lon, lat]))), ...span(-60, 80, 20).map(lat => line(span(-180, 180, 4).map(lon => [lon, lat])))].join('');

    const shownAll = nodes.filter(n => value(n) > 0);
    const maxN = Math.max(1, ...shownAll.map(value));
    const rMax = M.region === 'world' ? (mobile ? 9 : 16) : (mobile ? 15 : 28);
    const rMin = M.region === 'world' ? (mobile ? 5 : 6) : (mobile ? 6.5 : 8);
    for (const n of shownAll) { [n.x0, n.y0] = project(n.lon, n.lat); n.x = n.x0; n.y = n.y0; n.r = Math.max(rMin, rMax * Math.sqrt(value(n) / maxN)); }
    const shown = shownAll.filter(n => n.x0 > -n.r && n.x0 < W + n.r && n.y0 > -n.r && n.y0 < H + n.r).sort((a, b) => value(b) - value(a));
    for (let it = 0; it < 240; it++) {
      for (let i = 0; i < shown.length; i++) for (let j = i + 1; j < shown.length; j++) {
        const a = shown[i], b = shown[j]; let dx = b.x - a.x, dy = b.y - a.y, dist = Math.hypot(dx, dy); const min = a.r + b.r + 1;
        if (dist >= min) continue;
        if (dist < 1e-6) { dx = Math.cos(i + j); dy = Math.sin(i + j); dist = 1; }
        const push = (min - dist) / 2, ux = dx / dist, uy = dy / dist;
        a.x -= ux * push; a.y -= uy * push; b.x += ux * push; b.y += uy * push;
      }
      for (const n of shown) { n.x += (n.x0 - n.x) * 0.04; n.y += (n.y0 - n.y) * 0.04; n.x = Math.max(n.r, Math.min(W - n.r, n.x)); n.y = Math.max(n.r, Math.min(H - n.r, n.y)); }
    }

    svg.replaceChildren();
    const defs = el('defs'), clip = el('clipPath', { id: 'map-logo-clip', clipPathUnits: 'objectBoundingBox' }); clip.append(el('circle', { cx: 0.5, cy: 0.5, r: 0.5 })); defs.append(clip);
    const world = el('g', { class: 'map-world' });
    world.append(el('path', { class: 'map-grid', d: grid, 'vector-effect': 'non-scaling-stroke' }), el('path', { class: 'map-land', d: landPath, 'vector-effect': 'non-scaling-stroke' }));
    const dots = el('g', { class: 'map-dots' + (animate && !reducedMotion() ? ' map-enter' : '') });
    const labels = el('g', { class: 'map-labels', 'aria-hidden': 'true' });
    svg.append(defs, world, dots, labels);
    const dotEls = [];
    shown.forEach((n, i) => {
      const share = n.people ? n.verified / n.people : 0, bin = ringBin(share);
      const g = el('g', { class: 'map-dot', tabindex: '0', role: 'button', 'aria-label': `${n.name}: ${fmt(n.people)} people in the dataset, ${fmt(n.verified)} verified first jobs` });
      const body = el('g', { class: 'map-dot-body' }); body.style.setProperty('--i', i);
      body.append(el('circle', { class: 'map-hit', r: Math.max(n.r + 6, mobile ? 14 : 10) }), el('circle', { class: 'map-shade', r: n.r + 0.4, cy: 0.9 }), el('circle', { class: 'map-ring', r: n.r, fill: bin.color }));
      const inner = n.r - (n.r < 9 ? 1.4 : Math.max(1.8, n.r * 0.15));
      if (n.logo) {
        body.append(el('circle', { class: 'map-mono-disc', r: inner }));
        const img = el('image', { href: n.logo, x: -inner, y: -inner, width: 2 * inner, height: 2 * inner, 'clip-path': 'url(#map-logo-clip)', preserveAspectRatio: 'xMidYMid meet' });
        img.addEventListener('error', () => { img.replaceWith(el('text', { class: 'map-mono', 'font-size': inner * 0.75 }, monogram(n.name))); }, { once: true });
        body.append(img);
      } else {
        const mono = monogram(n.name);
        body.append(el('circle', { class: 'map-mono-disc', r: inner }), el('text', { class: 'map-mono', 'font-size': inner * (mono.length > 3 ? 0.62 : 0.78) }, mono));
      }
      g.append(body); dots.append(g); dotEls.push([g, n]);
      g.addEventListener('mouseenter', () => { if (!M.panning && hoverable()) showCard(n, false); });
      // Touch screens emulate mouse events on the element under the finger, which may not be the circle a
      // tap resolves to; only pointer devices get the hover behaviour.
      g.addEventListener('mouseleave', () => { if (hoverable() && M.selected !== n.id) hideCard(); });
      g.addEventListener('focus', () => { if (hoverable()) showCard(n, false); });
      g.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); if (openProfile) openProfile(n.name); else showCard(n, true); } if (e.key === 'Escape') hideCard(); });
    });
    M.layout = { W, H, mobile, shown, byId: Object.fromEntries(shown.map(n => [n.id, n])), dots: dotEls, world, labels, font: `${mobile ? 10.5 : 12.5}px ${getComputedStyle(document.body).fontFamily}` };
    M.zoom = { k: 1, tx: 0, ty: 0 }; M.selected = null; M.pin = null;
    cancelAnimationFrame(M.anim);
    settle(false);
    renderLegend(rMax, rMin, maxN);
    note.textContent = `${fmt(shown.length)} institutions shown${M.region === 'world' ? '' : ' in this region'}. Circle area is ${M.metric === 'people' ? 'the number of people in the dataset who earned their doctorate there' : 'the number of verified first jobs among them'}; the ring shows how many of its people have a verified first job. Locations are approximate campus positions from Wikidata; ${fmt(unmapped.length)} institution names (${fmt(unmappedPeople)} people) could not be matched to a location and are not drawn. The dataset is a faculty-based sample, not every graduate. ${hoverable() ? 'Hover a circle for details and click it to open the profile; drag to pan once zoomed.' : 'Tap a circle for details; pinch to zoom and drag to pan once zoomed.'}`;
  }

  // ---- Zoom: the world scales; circles move with it and grow more slowly, so they spread apart ----
  const at = n => ({ x: n.sx, y: n.sy, r: n.sr });
  function draw() {
    const L = M.layout; if (!L) return;
    const { k, tx, ty } = M.zoom, s = Math.pow(k, ZOOM_GROWTH), zoomed = k > 1.001;
    L.world.setAttribute('transform', `translate(${tx.toFixed(1)},${ty.toFixed(1)}) scale(${k.toFixed(4)})`);
    for (const [g, n] of L.dots) { n.sx = n.x0 * k + tx + (n.ox || 0); n.sy = n.y0 * k + ty + (n.oy || 0); n.sr = n.r * s; g.style.transform = `translate(${n.sx.toFixed(1)}px,${n.sy.toFixed(1)}px) scale(${s.toFixed(4)})`; }
    svg.classList.toggle('zoomed', zoomed);
    svg.style.touchAction = zoomed ? 'none' : 'pan-y';  // one finger pans the map once zoomed, the page before
    buttons.out.disabled = buttons.reset.disabled = !zoomed; buttons.in.disabled = k >= MAX_ZOOM - 0.001;
  }
  let settleTimer = 0, glideTimer = 0;
  function live() {
    const L = M.layout; if (!L) return;
    L.labels.style.visibility = 'hidden';
    if (!M.selected) hideCard();
    if (!M.frame) M.frame = requestAnimationFrame(() => { M.frame = 0; draw(); });
    clearTimeout(settleTimer); settleTimer = setTimeout(() => settle(true), 180);
  }
  function settle(glide) {
    const L = M.layout; if (!L) return;
    cancelAnimationFrame(M.frame); M.frame = 0; clearTimeout(settleTimer);
    const { k, tx, ty } = M.zoom, s = Math.pow(k, ZOOM_GROWTH);
    if (k <= 1.001) { M.zoom = { k: 1, tx: 0, ty: 0 }; M.pin = null; for (const n of L.shown) { n.ox = n.x - n.x0; n.oy = n.y - n.y0; } }
    else {
      for (const n of L.shown) { n.tx = n.x0 * k + tx; n.ty = n.y0 * k + ty; n.sr = n.r * s; n.sx = n.tx + (n.ox || 0); n.sy = n.ty + (n.oy || 0); }
      const near = L.shown.filter(n => n.tx > -150 && n.tx < L.W + 150 && n.ty > -150 && n.ty < L.H + 150);
      for (let it = 0; it < 150; it++) {
        let moved = false;
        for (let i = 0; i < near.length; i++) for (let j = i + 1; j < near.length; j++) {
          const a = near[i], b = near[j]; let dx = b.sx - a.sx, dy = b.sy - a.sy, dist = Math.hypot(dx, dy); const min = a.sr + b.sr + 1;
          if (dist >= min) continue;
          if (dist < 1e-6) { dx = Math.cos(i + j); dy = Math.sin(i + j); dist = 1; }
          const ux = dx / dist, uy = dy / dist, gap = min - dist, pa = a.id === M.pin ? 0 : b.id === M.pin ? 1 : 0.5;
          a.sx -= ux * gap * pa; a.sy -= uy * gap * pa; b.sx += ux * gap * (1 - pa); b.sy += uy * gap * (1 - pa); moved = true;
        }
        for (const n of near) { if (n.id === M.pin) continue; n.sx += (n.tx - n.sx) * 0.04; n.sy += (n.ty - n.sy) * 0.04; }
        if (!moved && it > 20) break;
      }
      for (const n of L.shown) { n.ox = n.sx - n.tx; n.oy = n.sy - n.ty; }
    }
    svg.classList.toggle('settling', glide && !reducedMotion());
    draw();
    clearTimeout(glideTimer); if (glide) glideTimer = setTimeout(() => svg.classList.remove('settling'), 260);
    placeLabels();
    if (M.selected && L.byId[M.selected]) showCard(L.byId[M.selected], true); else if (!card.hidden && !M.selected) hideCard();
  }
  const canvas = document.createElement('canvas');
  function placeLabels() {
    const L = M.layout, { W, H, shown, mobile } = L, fontSize = mobile ? 10.5 : 12.5, boxes = [];
    const ctx = canvas.getContext('2d'); ctx.font = L.font;
    const pts = shown.map(n => ({ n, ...at(n) })).filter(p => p.x > -p.r && p.x < W + p.r && p.y > -p.r && p.y < H + p.r);
    const zb = zoomBox.getBoundingClientRect(), sb = stage.getBoundingClientRect();
    boxes.push({ x: zb.left - sb.left - 4, y: zb.top - sb.top - 4, w: zb.width + 8, h: zb.height + 8 });
    const hits = b => boxes.some(o => b.x < o.x + o.w && b.x + b.w > o.x && b.y < o.y + o.h && b.y + b.h > o.y) || pts.some(o => { const nx = Math.max(b.x, Math.min(o.x, b.x + b.w)), ny = Math.max(b.y, Math.min(o.y, b.y + b.h)); return Math.hypot(o.x - nx, o.y - ny) < o.r; });
    const base = M.region === 'world' ? (mobile ? 6 : 18) : (mobile ? 10 : 30), maxLabels = Math.round(base * Math.min(M.zoom.k, 4));
    L.labels.replaceChildren(); L.labels.style.visibility = '';
    let count = 0;
    const major = Math.max(10, Math.round(pts.length * 0.15));
    for (const p of [...pts.slice(0, major), ...pts.slice(major)]) {
      if (count >= maxLabels) break;
      const text = shortName(p.n.name), w = ctx.measureText(text).width + 6, h = fontSize + 2;
      // Right of the circle, then left, below and above: the first spot with room wins.
      const spots = [[p.x + p.r + 3, p.y - h / 2, 'start'], [p.x - p.r - 3 - w, p.y - h / 2, 'end'], [p.x - w / 2, p.y + p.r + 2, 'middle'], [p.x - w / 2, p.y - p.r - 2 - h, 'middle']];
      for (const [x, y, anchor] of spots) {
        const box = { x, y, w, h };
        if (x < 0 || x + w > W || y < 0 || y + h > H || hits(box)) continue;
        boxes.push(box); count++;
        L.labels.append(el('text', { x: (anchor === 'start' ? x : anchor === 'end' ? x + w : x + w / 2).toFixed(1), y: (y + h / 2 + fontSize * 0.35).toFixed(1), 'text-anchor': anchor, 'font-size': fontSize }, text));
        break;
      }
    }
  }

  // ---- Card ----
  function showCard(n, pinned) {
    M.selected = pinned ? n.id : null;
    for (const [g, d] of M.layout.dots) g.classList.toggle('selected', pinned && d.id === n.id);
    card.replaceChildren();
    card.append(html('p', 'map-card-name', n.name));
    const meta = [n.country, Number.isFinite(n.first) ? (n.first === n.last ? `class of ${n.first}` : `classes of ${n.first}–${n.last}`) : null].filter(Boolean).join(' · ');
    if (meta) card.append(html('p', 'map-card-meta', meta));
    const dl = html('dl');
    for (const [k, v] of [['People in the dataset', fmt(n.people)], ['Verified first jobs', `${fmt(n.verified)} (${pct(n.verified, n.people)})`], ['Tenure track, of verified', n.verified ? pct(n.tt, n.verified) : '—'], ['Researched, unresolved', fmt(n.unresolved)], ['Not yet reviewed', fmt(n.people - n.verified - n.unresolved)]]) { const row = html('div'); row.append(html('dt', undefined, k), html('dd', undefined, v)); dl.append(row); }
    card.append(dl);
    const actions = html('div', 'map-card-actions');
    if (openProfile) { const b = html('button', 'map-card-open', 'Open profile →'); b.type = 'button'; b.addEventListener('click', () => openProfile(n.name)); actions.append(b); }
    if (onSelect) { const b = html('button', 'map-card-open', 'Show records →'); b.type = 'button'; b.addEventListener('click', () => onSelect(n.name)); actions.append(b); }
    const close = html('button', 'map-card-close', '×'); close.type = 'button'; close.setAttribute('aria-label', 'Close'); close.addEventListener('click', () => { M.selected = null; hideCard(); }); actions.append(close);
    card.append(actions);
    card.hidden = false;
    if (stage.clientWidth < 600) { card.classList.add('below'); card.style.left = card.style.top = ''; if (pinned) card.scrollIntoView({ block: 'nearest', behavior: reducedMotion() ? 'auto' : 'smooth' }); return; }
    card.classList.remove('below');
    const cw = card.offsetWidth, ch = card.offsetHeight, p = at(n);
    let left = p.x + p.r + 12, top = p.y - ch / 2;
    if (left + cw > stage.clientWidth) left = p.x - p.r - 12 - cw;
    card.style.left = `${Math.max(0, left)}px`; card.style.top = `${Math.max(0, Math.min(stage.clientHeight - ch, top))}px`;
  }
  function hideCard() { M.selected = null; card.hidden = true; if (M.layout) for (const [g] of M.layout.dots) g.classList.remove('selected'); }
  // A click or tap goes to the nearest circle whose padded area contains the point, so a small circle
  // drawn on top of a large neighbour does not steal the tap. With a pointer, the click opens the profile.
  const nearest = (px, py, pad) => { let best = null, bestD = Infinity; for (const n of M.layout.shown) { const d = Math.hypot(n.sx - px, n.sy - py) - n.sr; if (d <= pad && d < bestD) { best = n; bestD = d; } } return best; };
  svg.addEventListener('click', e => {
    if (M.dragged || !M.layout) return;
    const [px, py] = pointAt(e), n = nearest(px, py, M.layout.mobile ? 12 : 4);
    if (!n) { if (M.selected) hideCard(); return; }
    if (hoverable() && openProfile) openProfile(n.name); else showCard(n, true);
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !card.hidden) hideCard(); });

  // ---- Legend ----
  function renderLegend(rMax, rMin, maxN) {
    legend.replaceChildren();
    const fits = [1, 10, 50, 100, 200].filter(n => n <= maxN * 1.05), above = fits.filter(n => rMax * Math.sqrt(n / maxN) >= rMin * 1.15), sizes = above.length ? above.slice(-3) : fits.slice(-1);
    const r = n => Math.max(rMin, rMax * Math.sqrt(n / maxN)), big = r(sizes[sizes.length - 1]);
    const size = html('div', 'map-legend-size'); size.append(html('span', 'map-legend-head', M.metric === 'people' ? 'People in the dataset' : 'Verified first jobs'));
    let x = 0; const items = sizes.map(n => { const cx = x + Math.max(r(n), 10); x = cx + Math.max(r(n), 10) + 8; return [n, cx]; });
    const s = el('svg', { width: x, height: 2 * big + 16, 'aria-hidden': 'true' });
    for (const [n, cx] of items) s.append(el('circle', { cx, cy: 2 * big + 1 - r(n), r: r(n), class: 'map-legend-ring' }), el('text', { x: cx, y: 2 * big + 14, 'text-anchor': 'middle' }, String(n)));
    size.append(s);
    const key = html('div', 'map-legend-key'); key.append(html('span', 'map-legend-head', 'People with a verified first job (ring)'));
    for (const b of RING_BINS) { const item = html('span', 'map-key'); const ring = html('span', 'map-key-ring'); ring.style.setProperty('--c', b.color); item.append(ring, b.label); key.append(item); }
    legend.append(size, key);
  }

  // ---- Zoom and pan ----
  const clamp = ({ k, tx, ty }) => { const { W, H } = M.layout; k = Math.max(1, Math.min(MAX_ZOOM, k)); return { k, tx: Math.min(0, Math.max(W - W * k, tx)), ty: Math.min(0, Math.max(H - H * k, ty)) }; };
  const nudgeAt = (px, py) => { let ox = 0, oy = 0, w = 0; M.pin = null; for (const n of M.layout.shown) { const dist = Math.hypot(n.sx - px, n.sy - py); if (dist <= n.sr) { M.pin = n.id; return [n.ox || 0, n.oy || 0]; } const wd = 1 / (1 + Math.pow(dist / (n.sr + 6), 6)); ox += wd * (n.ox || 0); oy += wd * (n.oy || 0); w += wd; } return w > 0.05 ? [ox / w, oy / w] : [0, 0]; };
  // The view after zooming by `factor` about (px, py): what is under that point stays under it.
  const zoomedAt = (px, py, factor) => { const [ox, oy] = nudgeAt(px, py), z = M.zoom, k = Math.max(1, Math.min(MAX_ZOOM, z.k * factor)), gx = (px - ox - z.tx) / z.k, gy = (py - oy - z.ty) / z.k; return clamp({ k, tx: px - ox - gx * k, ty: py - oy - gy * k }); };
  const buttonZoom = factor => {
    const L = M.layout;
    if (M.zoom.k > 1.001 || factor < 1) return zoomedAt(L.W / 2, L.H / 2, factor);
    const total = L.shown.reduce((s, n) => s + value(n), 0);
    const cx = L.shown.reduce((s, n) => s + n.sx * value(n), 0) / total, cy = L.shown.reduce((s, n) => s + n.sy * value(n), 0) / total;
    const n = L.shown.reduce((a, b) => (Math.hypot(b.sx - cx, b.sy - cy) < Math.hypot(a.sx - cx, a.sy - cy) ? b : a));
    const k = Math.min(MAX_ZOOM, M.zoom.k * factor); M.pin = n.id;
    return clamp({ k, tx: L.W / 2 - n.x0 * k - (n.ox || 0), ty: L.H / 2 - n.y0 * k - (n.oy || 0) });
  };
  function animateZoom(to, ms = 280) {
    if (!M.layout) return;
    cancelAnimationFrame(M.anim);
    if (reducedMotion()) { M.zoom = to; settle(false); return; }
    const from = { ...M.zoom }, t0 = performance.now(), ease = x => 1 - Math.pow(1 - x, 3);
    const step = now => { const u = Math.min(1, (now - t0) / ms), e = ease(u); M.zoom = { k: from.k * Math.pow(to.k / from.k, e), tx: from.tx + (to.tx - from.tx) * e, ty: from.ty + (to.ty - from.ty) * e }; M.layout.labels.style.visibility = 'hidden'; draw(); if (u < 1) M.anim = requestAnimationFrame(step); else { M.zoom = to; settle(true); } };
    M.anim = requestAnimationFrame(step);
  }
  const pointAt = e => { const b = svg.getBoundingClientRect(), s = (M.layout?.W || b.width) / b.width; return [(e.clientX - b.left) * s, (e.clientY - b.top) * s]; };
  buttons.in.addEventListener('click', () => M.layout && animateZoom(buttonZoom(2)));
  buttons.out.addEventListener('click', () => M.layout && animateZoom(buttonZoom(0.5)));
  buttons.reset.addEventListener('click', () => { M.pin = null; animateZoom({ k: 1, tx: 0, ty: 0 }); });
  let hintTimer = 0;
  svg.addEventListener('wheel', e => {
    if (!M.layout) return;
    if (!e.ctrlKey && !e.metaKey) { hint.classList.add('show'); clearTimeout(hintTimer); hintTimer = setTimeout(() => hint.classList.remove('show'), 1200); return; }
    e.preventDefault(); cancelAnimationFrame(M.anim); hint.classList.remove('show');
    const [x, y] = pointAt(e), dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
    M.zoom = zoomedAt(x, y, Math.pow(2, -Math.max(-50, Math.min(50, dy)) * 0.01)); live();
  }, { passive: false });
  svg.addEventListener('dblclick', e => { if (e.target.closest('.map-dot') || !M.layout) return; const [x, y] = pointAt(e); animateZoom(zoomedAt(x, y, e.shiftKey ? 0.5 : 2)); });
  const down = new Map(); let start = null;
  const begin = () => { const pts = [...down.values()]; start = { z: { ...M.zoom }, p: pts[0] }; if (pts.length >= 2) { start.dist = Math.hypot(pts[0][0] - pts[1][0], pts[0][1] - pts[1][1]) || 1; start.mid = [(pts[0][0] + pts[1][0]) / 2, (pts[0][1] + pts[1][1]) / 2]; start.nudge = nudgeAt(...start.mid); } };
  svg.addEventListener('pointerdown', e => { if (!M.layout || (e.pointerType === 'mouse' && e.button !== 0)) return; cancelAnimationFrame(M.anim); down.set(e.pointerId, pointAt(e)); begin(); M.dragged = false; });
  svg.addEventListener('pointermove', e => {
    if (!start || !down.has(e.pointerId)) return;
    down.set(e.pointerId, pointAt(e));
    const pts = [...down.values()];
    if (pts.length >= 2 && start.dist) {
      const dist = Math.hypot(pts[0][0] - pts[1][0], pts[0][1] - pts[1][1]), mid = [(pts[0][0] + pts[1][0]) / 2, (pts[0][1] + pts[1][1]) / 2];
      const k = Math.max(1, Math.min(MAX_ZOOM, start.z.k * dist / start.dist)), [ox, oy] = start.nudge, gx = (start.mid[0] - ox - start.z.tx) / start.z.k, gy = (start.mid[1] - oy - start.z.ty) / start.z.k;
      M.zoom = clamp({ k, tx: mid[0] - ox - gx * k, ty: mid[1] - oy - gy * k }); M.dragged = true; live();
    } else if (pts.length === 1 && start.z.k > 1.001) {
      const dx = pts[0][0] - start.p[0], dy = pts[0][1] - start.p[1];
      if (!M.dragged && Math.hypot(dx, dy) < 4) return;
      M.dragged = M.panning = true; M.zoom = clamp({ k: start.z.k, tx: start.z.tx + dx, ty: start.z.ty + dy }); live();
    }
  });
  const end = e => { if (!down.delete(e.pointerId)) return; if (down.size) begin(); else start = null; M.panning = false; setTimeout(() => { M.dragged = false; }, 0); };
  for (const type of ['pointerup', 'pointercancel', 'pointerleave']) svg.addEventListener(type, end);

  // Re-render when the stage changes width (orientation change, window resize).
  let resizeTimer = 0;
  new ResizeObserver(() => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => { if (isCurrent() && M.layout && Math.abs(M.layout.W - stage.clientWidth) > 2) render(false); }, 150); }).observe(stage);
  render(true);
}
