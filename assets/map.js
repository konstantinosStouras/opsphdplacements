import {dataUrl} from './data-url.js';
import {distinctNames} from './organisation-model.js';
// Interactive world map of PhD-granting institutions. Hand-built SVG, no map library.
// Land shapes: world-atlas countries-110m (Natural Earth, ISC licence; see assets/vendor/world/LICENSE.txt).
// Projection: Equal Earth (Savric, Patterson & Jenny 2018). Locations: data/institution-locations.json.
// Institutions that sit close together at the current zoom are grouped into one larger circle that shows
// how many it holds; clicking or tapping it zooms in until the group splits (at the deepest zoom every
// institution is drawn on its own, nudged apart from its neighbours). A single institution is a
// white disc holding its site icon inside a ring coloured by the share of its people with a verified
// first job. Circle area is people in the dataset (or verified first jobs). Hover shows a card and a
// click opens the profile on devices with a pointer; on touch screens a tap shows the card below the map.
const NS = 'http://www.w3.org/2000/svg';
const VIEWS = {
  world: { label: 'World', box: [-128, -43, 152, 62] },
  northAmerica: { label: 'North America', box: [-126, 25, -64, 54] },
  europe: { label: 'Europe', box: [-13, 38, 31, 60.5] },
  asiaPacific: { label: 'Asia & Pacific', box: [60, -47, 180, 50] }
};
const ZOOM_GROWTH = 0.4, MAX_ZOOM = 10;
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
const loadLocations = () => (locationsPromise ||= fetch(dataUrl('data/institution-locations.json')).then(r => r.json()).catch(e => { locationsPromise = null; throw e; }));

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
  // A matched item without coordinates is left off the map (and counted as unplaced), never drawn at 0°, 0°.
  // Spellings of one institution that share a Wikidata item ("University of Michigan" and "University of
  // Michigan at Ann Arbor") are one circle, named after the spelling with the most people.
  const byItem = new Map();
  for (const r of locations.records) {
    if (!r.qid || !Number.isFinite(r.lat) || !Number.isFinite(r.lon) || !stats.has(r.institution)) continue;
    const s = stats.get(r.institution), n = byItem.get(r.qid);
    if (!n) { byItem.set(r.qid, { type: 'node', id: r.institution, name: r.institution, names: [r.institution], qid: r.qid, country: r.country || null, logo: r.logo || null, lat: r.lat, lon: r.lon, ...s, top: s.people }); continue; }
    n.names.push(r.institution); n.logo ||= r.logo || null;
    if (s.people > n.top) { n.id = n.name = r.institution; n.top = s.people; n.lat = r.lat; n.lon = r.lon; }
    for (const k of ['people', 'verified', 'unresolved', 'tt']) n[k] += s[k];
    n.first = Math.min(n.first, s.first); n.last = Math.max(n.last, s.last);
  }
  const nodes = [...byItem.values()];
  const unmapped = [...stats.keys()].filter(name => !nodes.some(n => n.names.includes(name)));
  const unmappedPeople = unmapped.reduce((n, name) => n + stats.get(name).people, 0);

  const M = { region: 'world', metric: 'people', zoom: { k: 1, tx: 0, ty: 0 }, selected: null, layout: null, anim: 0, frame: 0, panning: false, dragged: false };
  const value = n => (M.metric === 'people' ? n.people : n.verified);

  // ---- Page structure ----
  const controls = html('div', 'map-controls');
  const regionGroup = html('div', 'map-control-group'), metricGroup = html('div', 'map-control-group');
  regionGroup.append(html('span', 'map-control-label', 'Region'), toggleGroup(Object.entries(VIEWS).map(([k, v]) => [k, v.label]), 'world', v => { M.region = v; M.selected = null; render(true); }));
  metricGroup.append(html('span', 'map-control-label', 'Circle area'), toggleGroup([['people', 'People in the dataset'], ['verified', 'Verified first jobs']], 'people', v => { M.metric = v; M.selected = null; render(false); }));
  controls.append(regionGroup, metricGroup);
  const stage = html('div', 'map-stage');
  const svg = el('svg', { class: 'map-svg', role: 'group', 'aria-label': 'Map of PhD-granting institutions in the dataset' });
  const zoomBox = html('div', 'map-zoom');
  const buttons = {};
  for (const [id, text, label] of [['in', '+', 'Zoom in'], ['out', '−', 'Zoom out'], ['reset', '↺', 'Reset the map']]) { const b = html('button', undefined, text); b.type = 'button'; b.setAttribute('aria-label', label); b.title = label; buttons[id] = b; zoomBox.append(b); }
  const hint = html('div', 'map-zoom-hint', /Mac|iPhone|iPad/.test(navigator.platform) ? 'Pinch or ⌘ + scroll to zoom the map' : 'Pinch or Ctrl + scroll to zoom the map');
  const card = html('div', 'map-card'); card.hidden = true; card.setAttribute('role', 'dialog'); card.setAttribute('aria-label', 'Details');
  stage.append(svg, zoomBox, hint, card);
  const legend = html('div', 'map-legend');
  const note = html('p', 'map-note');
  target.replaceChildren(controls, stage, legend, note);

  function toggleGroup(entries, current, on) {
    const box = html('div', 'map-toggle-group'); box.setAttribute('role', 'group');
    for (const [v, t] of entries) { const b = html('button', 'map-toggle' + (v === current ? ' active' : ''), t); b.type = 'button'; b.setAttribute('aria-pressed', String(v === current)); b.addEventListener('click', () => { box.querySelectorAll('button').forEach(x => { x.classList.toggle('active', x === b); x.setAttribute('aria-pressed', String(x === b)); }); on(v); }); box.append(b); }
    return box;
  }

  // ---- Projection and base layout for the chosen region ----
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

    const active = nodes.filter(n => value(n) > 0);
    const maxN = Math.max(1, ...active.map(value));
    const rMax = M.region === 'world' ? (mobile ? 9 : 16) : (mobile ? 15 : 28);
    const rMin = M.region === 'world' ? (mobile ? 5 : 6) : (mobile ? 6.5 : 8);
    for (const n of active) { [n.x0, n.y0] = project(n.lon, n.lat); n.r = Math.max(rMin, rMax * Math.sqrt(value(n) / maxN)); }
    const inRegion = active.filter(n => n.x0 > -40 && n.x0 < W + 40 && n.y0 > -40 && n.y0 < H + 40);

    svg.replaceChildren();
    const defs = el('defs'), clip = el('clipPath', { id: 'map-logo-clip', clipPathUnits: 'objectBoundingBox' }); clip.append(el('circle', { cx: 0.5, cy: 0.5, r: 0.5 })); defs.append(clip);
    const world = el('g', { class: 'map-world' });
    world.append(el('path', { class: 'map-grid', d: grid, 'vector-effect': 'non-scaling-stroke' }), el('path', { class: 'map-land', d: landPath, 'vector-effect': 'non-scaling-stroke' }));
    const dots = el('g', { class: 'map-dots' }), labels = el('g', { class: 'map-labels', 'aria-hidden': 'true' });
    svg.append(defs, world, dots, labels);
    M.layout = { W, H, mobile, nodes: inRegion, maxN, rMax, rMin, world, dots, labels, items: [], font: `${mobile ? 10.5 : 12.5}px ${getComputedStyle(document.body).fontFamily}`, clusterDistance: mobile ? 24 : 32 };
    M.zoom = { k: 1, tx: 0, ty: 0 }; M.selected = null;
    cancelAnimationFrame(M.anim);
    settle(false, animate);
    renderLegend();
    note.textContent = `${fmt(inRegion.length)} institutions${M.region === 'world' ? '' : ' in this region'}. Institutions close together at the current zoom are grouped into one circle that shows how many it holds; click or tap it to zoom in until they separate. Circle area is ${M.metric === 'people' ? 'the number of people in the dataset who earned their doctorate there' : 'the number of verified first jobs among them'}; a single institution's ring shows how many of its people have a verified first job. Locations are approximate campus positions from Wikidata; ${fmt(unmapped.length)} institution names (${fmt(unmappedPeople)} people) could not be matched to a location and are not drawn. The dataset is a faculty-based sample, not every graduate. ${hoverable() ? 'Hover a circle for details and click an institution to open its profile; drag to pan once zoomed.' : 'Tap an institution for details; pinch to zoom and drag to pan once zoomed.'}`;
  }

  // ---- Clustering at the current zoom: institutions within a short screen distance share one circle ----
  function cluster() {
    const L = M.layout, { k, tx, ty } = M.zoom, s = Math.pow(k, ZOOM_GROWTH), T = L.clusterDistance;
    // At the deepest zoom nothing is grouped: institutions in the same city (or at the same coordinates)
    // would otherwise stay one circle that can never be opened; spread() nudges them apart instead.
    const atMax = k >= MAX_ZOOM - 0.001;
    const pts = L.nodes.map(n => ({ n, x: n.x0 * k + tx, y: n.y0 * k + ty })).filter(p => p.x > -150 && p.x < L.W + 150 && p.y > -150 && p.y < L.H + 150).sort((a, b) => value(b.n) - value(a.n));
    const taken = new Set(), items = [];
    for (const seed of pts) {
      if (taken.has(seed.n.id)) continue;
      const members = atMax ? [seed] : pts.filter(p => !taken.has(p.n.id) && Math.hypot(p.x - seed.x, p.y - seed.y) <= T);
      for (const p of members) taken.add(p.n.id);
      if (members.length === 1) { const n = seed.n; items.push({ type: 'node', id: n.id, node: n, x0: n.x0, y0: n.y0, r: n.r * s, value: value(n) }); continue; }
      const total = members.reduce((t, p) => t + value(p.n), 0);
      const x0 = members.reduce((t, p) => t + p.n.x0 * value(p.n), 0) / total, y0 = members.reduce((t, p) => t + p.n.y0 * value(p.n), 0) / total;
      const people = members.reduce((t, p) => t + p.n.people, 0), verified = members.reduce((t, p) => t + p.n.verified, 0);
      const countries = [...new Set(members.map(p => p.n.country).filter(Boolean))];
      const r = Math.min(L.rMax * 1.7, Math.max(L.rMin * 1.9, L.rMax * Math.sqrt(total / L.maxN))) * s;
      items.push({ type: 'cluster', id: 'cluster:' + members.map(p => p.n.id).sort().join('|'), members: members.map(p => p.n), x0, y0, r, value: total, people, verified, countries });
    }
    return items;
  }
  // Nudge overlapping circles apart in screen space, pulling each back toward its true position.
  function spread(items) {
    const L = M.layout, { k, tx, ty } = M.zoom;
    for (const it of items) { it.tx = it.x0 * k + tx; it.ty = it.y0 * k + ty; it.sx = it.tx; it.sy = it.ty; it.sr = it.r; }
    for (let iter = 0; iter < 200; iter++) {
      let moved = false;
      for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) {
        const a = items[i], b = items[j]; let dx = b.sx - a.sx, dy = b.sy - a.sy, dist = Math.hypot(dx, dy); const min = a.sr + b.sr + 1.5;
        if (dist >= min) continue;
        if (dist < 1e-6) { dx = Math.cos(i + j); dy = Math.sin(i + j); dist = 1; }
        const push = (min - dist) / 2, ux = dx / dist, uy = dy / dist;
        a.sx -= ux * push; a.sy -= uy * push; b.sx += ux * push; b.sy += uy * push; moved = true;
      }
      for (const it of items) { it.sx += (it.tx - it.sx) * 0.04; it.sy += (it.ty - it.sy) * 0.04; it.sx = Math.max(it.sr, Math.min(L.W - it.sr, it.sx)); it.sy = Math.max(it.sr, Math.min(L.H - it.sr, it.sy)); }
      if (!moved && iter > 20) break;
    }
    for (const it of items) { it.ox = it.sx - it.tx; it.oy = it.sy - it.ty; }
  }
  function buildDots(items, animate) {
    const L = M.layout;
    L.dots.replaceChildren(); L.dots.classList.toggle('map-enter', animate && !reducedMotion());
    L.items = [];
    items.forEach((it, i) => {
      const g = el('g', { class: it.type === 'cluster' ? 'map-dot map-cluster' : 'map-dot', tabindex: '0', role: 'button' });
      const body = el('g', { class: 'map-dot-body' }); body.style.setProperty('--i', i);
      body.append(el('circle', { class: 'map-hit', r: Math.max(it.r + 6, L.mobile ? 14 : 10) }));
      if (it.type === 'cluster') {
        g.setAttribute('aria-label', `${it.members.length} institutions grouped here, ${fmt(it.people)} people in the dataset. Zoom in to separate them.`);
        const count = String(it.members.length);
        body.append(el('circle', { class: 'map-cluster-halo', r: it.r + 5 }), el('circle', { class: 'map-shade', r: it.r + 0.4, cy: 0.9 }), el('circle', { class: 'map-cluster-disc', r: it.r }), el('text', { class: 'map-cluster-count', 'font-size': Math.max(10, it.r * (count.length > 2 ? 0.62 : 0.85)) }, count));
      } else {
        const n = it.node, bin = ringBin(n.people ? n.verified / n.people : 0);
        g.setAttribute('aria-label', `${n.name}: ${fmt(n.people)} people in the dataset, ${fmt(n.verified)} verified first jobs`);
        body.append(el('circle', { class: 'map-shade', r: it.r + 0.4, cy: 0.9 }), el('circle', { class: 'map-ring', r: it.r, fill: bin.color }));
        // A thin ring (about 11 % of the radius) carries the verified share; the logo gets the rest of the circle.
        const inner = it.r - (it.r < 9 ? 1.2 : Math.max(1.5, it.r * 0.11));
        body.append(el('circle', { class: 'map-mono-disc', r: inner }));
        if (n.logo) {
          const img = el('image', { href: n.logo, x: -inner, y: -inner, width: 2 * inner, height: 2 * inner, 'clip-path': 'url(#map-logo-clip)', preserveAspectRatio: 'xMidYMid meet' });
          img.addEventListener('error', () => { img.replaceWith(el('text', { class: 'map-mono', 'font-size': inner * 0.75 }, monogram(n.name))); }, { once: true });
          body.append(img);
        } else { const mono = monogram(n.name); body.append(el('text', { class: 'map-mono', 'font-size': inner * (mono.length > 3 ? 0.62 : 0.78) }, mono)); }
      }
      g.append(body); L.dots.append(g); L.items.push([g, it]);
      // Touch screens emulate mouse events on whatever lies under the finger, which may not be the circle a
      // tap resolves to; only pointer devices get the hover behaviour.
      g.addEventListener('mouseenter', () => { if (!M.panning && hoverable()) hoverEnter(it); });
      g.addEventListener('mouseleave', () => { if (hoverable()) hoverLeave(it); });
      g.addEventListener('focus', () => { if (hoverable()) showCard(it, false); });
      g.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); activate(it); } if (e.key === 'Escape') hideCard(); });
    });
  }
  function activate(it) {
    if (it.type === 'cluster') { zoomToCluster(it); return; }
    if (hoverable() && openProfile) openProfile(it.node.name); else showCard(it, true);
  }

  // ---- Zoom: the world scales; circles move with it, and regroup once the zoom settles ----
  const at = it => ({ x: it.sx, y: it.sy, r: it.sr });
  function draw() {
    const L = M.layout; if (!L) return;
    const { k, tx, ty } = M.zoom, zoomed = k > 1.001;
    L.world.setAttribute('transform', `translate(${tx.toFixed(1)},${ty.toFixed(1)}) scale(${k.toFixed(4)})`);
    for (const [g, it] of L.items) { it.sx = it.x0 * k + tx + (it.ox || 0); it.sy = it.y0 * k + ty + (it.oy || 0); g.style.transform = `translate(${it.sx.toFixed(1)}px,${it.sy.toFixed(1)}px)`; }
    svg.classList.toggle('zoomed', zoomed);
    svg.style.touchAction = zoomed ? 'none' : 'pan-y';  // one finger pans the map once zoomed, the page before
    buttons.out.disabled = buttons.reset.disabled = !zoomed; buttons.in.disabled = k >= MAX_ZOOM - 0.001;
  }
  let settleTimer = 0;
  function live() {
    const L = M.layout; if (!L) return;
    L.labels.style.visibility = 'hidden';
    if (!M.selected) hideCard();
    if (!M.frame) M.frame = requestAnimationFrame(() => { M.frame = 0; draw(); });
    clearTimeout(settleTimer); settleTimer = setTimeout(() => settle(true), 180);
  }
  function settle(glide, animate = false) {
    const L = M.layout; if (!L) return;
    cancelAnimationFrame(M.frame); M.frame = 0; clearTimeout(settleTimer);
    if (M.zoom.k <= 1.001) M.zoom = { k: 1, tx: 0, ty: 0 };
    const items = cluster();
    spread(items);
    buildDots(items, animate);
    draw();
    placeLabels();
    const selected = M.selected && L.items.find(([, it]) => it.id === M.selected);
    if (selected) showCard(selected[1], true); else if (!card.hidden) hideCard();
  }
  const canvas = document.createElement('canvas');
  function placeLabels() {
    const L = M.layout, { W, H, mobile } = L, fontSize = mobile ? 10.5 : 12.5, boxes = [];
    const ctx = canvas.getContext('2d'); ctx.font = L.font;
    const all = L.items.map(([, it]) => ({ it, ...at(it) })).filter(p => p.x > -p.r && p.x < W + p.r && p.y > -p.r && p.y < H + p.r);
    const zb = zoomBox.getBoundingClientRect(), sb = stage.getBoundingClientRect();
    boxes.push({ x: zb.left - sb.left - 4, y: zb.top - sb.top - 4, w: zb.width + 8, h: zb.height + 8 });
    const hits = b => boxes.some(o => b.x < o.x + o.w && b.x + b.w > o.x && b.y < o.y + o.h && b.y + b.h > o.y) || all.some(o => { const nx = Math.max(b.x, Math.min(o.x, b.x + b.w)), ny = Math.max(b.y, Math.min(o.y, b.y + b.h)); return Math.hypot(o.x - nx, o.y - ny) < o.r; });
    const base = M.region === 'world' ? (mobile ? 8 : 20) : (mobile ? 12 : 32), maxLabels = Math.round(base * Math.min(M.zoom.k, 4));
    L.labels.replaceChildren(); L.labels.style.visibility = '';
    let count = 0;
    const singles = all.filter(p => p.it.type === 'node');
    const major = Math.max(10, Math.round(singles.length * 0.15));
    for (const p of [...singles.slice(0, major), ...singles.slice(major)]) {
      if (count >= maxLabels) break;
      const text = shortName(p.it.node.name), w = ctx.measureText(text).width + 6, h = fontSize + 2;
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
  // A hover card stays open while the pointer travels from the circle to the card and while it is over
  // the card, so its links can be clicked: leaving starts a short timer that the card cancels. A circle
  // crossed on the way to an open card replaces it only if the pointer stays on that circle for a moment.
  let hideTimer = 0, showTimer = 0, cardItem = null;
  const HIDE_DELAY = 350, SWITCH_DELAY = 140;
  function hoverEnter(it) {
    clearTimeout(hideTimer); clearTimeout(showTimer);
    if (!card.hidden && cardItem?.id === it.id) return;
    if (card.hidden) showCard(it, false);
    else showTimer = setTimeout(() => showCard(it, false), SWITCH_DELAY);
  }
  function hoverLeave(it) {
    clearTimeout(showTimer);
    if (cardItem?.id === it.id && M.selected !== it.id) hideSoon();
  }
  function hideSoon() { clearTimeout(hideTimer); hideTimer = setTimeout(() => { if (!M.selected) hideCard(); }, HIDE_DELAY); }
  card.addEventListener('mouseenter', () => { clearTimeout(hideTimer); clearTimeout(showTimer); });
  card.addEventListener('mouseleave', () => { if (hoverable() && !M.selected) hideSoon(); });
  function showCard(it, pinned) {
    clearTimeout(hideTimer); clearTimeout(showTimer); cardItem = it;
    M.selected = pinned ? it.id : null;
    for (const [g, d] of M.layout.items) g.classList.toggle('selected', pinned && d.id === it.id);
    card.replaceChildren();
    const actions = html('div', 'map-card-actions');
    if (it.type === 'cluster') {
      const top = [...it.members].sort((a, b) => value(b) - value(a));
      card.append(html('p', 'map-card-name', `${it.members.length} institutions near ${shortName(top[0].name)}`));
      if (it.countries.length) card.append(html('p', 'map-card-meta', it.countries.slice(0, 3).join(', ') + (it.countries.length > 3 ? ` and ${it.countries.length - 3} more` : '')));
      const dl = html('dl');
      for (const [k, v] of [['People in the dataset', fmt(it.people)], ['Verified first jobs', `${fmt(it.verified)} (${pct(it.verified, it.people)})`]]) { const row = html('div'); row.append(html('dt', undefined, k), html('dd', undefined, v)); dl.append(row); }
      card.append(dl);
      const list = html('ul', 'map-card-list');
      for (const n of top.slice(0, 6)) { const li = html('li'); const b = html('button', 'text-button', n.name); b.type = 'button'; b.addEventListener('click', () => (openProfile ? openProfile(n.name) : onSelect?.(n.name))); li.append(b, html('span', 'map-card-count', fmt(value(n)))); list.append(li); }
      if (top.length > 6) { const li = html('li', 'map-card-more', `and ${top.length - 6} more`); list.append(li); }
      card.append(list);
      const b = html('button', 'map-card-open', 'Zoom in to separate →'); b.type = 'button'; b.addEventListener('click', () => zoomToCluster(it)); actions.append(b);
    } else {
      const n = it.node;
      card.append(html('p', 'map-card-name', n.name));
      const meta = [n.country, Number.isFinite(n.first) ? (n.first === n.last ? `class of ${n.first}` : `classes of ${n.first}–${n.last}`) : null].filter(Boolean).join(' · ');
      if (meta) card.append(html('p', 'map-card-meta', meta));
      const otherNames=distinctNames(n.names,n.name);if (otherNames.length) card.append(html('p', 'map-card-meta', `Counts include the names ${otherNames.join('; ')}`));
      const dl = html('dl');
      for (const [k, v] of [['People in the dataset', fmt(n.people)], ['Verified first jobs', `${fmt(n.verified)} (${pct(n.verified, n.people)})`], ['Tenure track, of verified', n.verified ? pct(n.tt, n.verified) : '—'], ['Researched, unresolved', fmt(n.unresolved)], ['Not yet reviewed', fmt(n.people - n.verified - n.unresolved)]]) { const row = html('div'); row.append(html('dt', undefined, k), html('dd', undefined, v)); dl.append(row); }
      card.append(dl);
      if (openProfile) { const b = html('button', 'map-card-open', 'Open profile →'); b.type = 'button'; b.addEventListener('click', () => openProfile(n.name)); actions.append(b); }
      if (onSelect) { const b = html('button', 'map-card-open', 'Show records →'); b.type = 'button'; b.addEventListener('click', () => onSelect(n.name)); actions.append(b); }
    }
    const close = html('button', 'map-card-close', '×'); close.type = 'button'; close.setAttribute('aria-label', 'Close'); close.addEventListener('click', hideCard); actions.append(close);
    card.append(actions);
    card.hidden = false;
    if (stage.clientWidth < 600) { card.classList.add('below'); card.style.left = card.style.top = ''; if (pinned) card.scrollIntoView({ block: 'nearest', behavior: reducedMotion() ? 'auto' : 'smooth' }); return; }
    card.classList.remove('below');
    const cw = card.offsetWidth, ch = card.offsetHeight, p = at(it);
    let left = p.x + p.r + 12, top = p.y - ch / 2;
    if (left + cw > stage.clientWidth) left = p.x - p.r - 12 - cw;
    card.style.left = `${Math.max(0, left)}px`; card.style.top = `${Math.max(0, Math.min(stage.clientHeight - ch, top))}px`;
  }
  function hideCard() { clearTimeout(hideTimer); clearTimeout(showTimer); cardItem = null; M.selected = null; card.hidden = true; if (M.layout) for (const [g] of M.layout.items) g.classList.remove('selected'); }
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !card.hidden) hideCard(); });

  // ---- Legend ----
  function renderLegend() {
    const L = M.layout, { rMax, rMin, maxN } = L;
    legend.replaceChildren();
    const fits = [1, 10, 50, 100, 200].filter(n => n <= maxN * 1.05), above = fits.filter(n => rMax * Math.sqrt(n / maxN) >= rMin * 1.15), sizes = above.length ? above.slice(-3) : fits.slice(-1);
    const r = n => Math.max(rMin, rMax * Math.sqrt(n / maxN)), big = r(sizes[sizes.length - 1]);
    const size = html('div', 'map-legend-size'); size.append(html('span', 'map-legend-head', M.metric === 'people' ? 'People in the dataset' : 'Verified first jobs'));
    let x = 0; const items = sizes.map(n => { const cx = x + Math.max(r(n), 10); x = cx + Math.max(r(n), 10) + 8; return [n, cx]; });
    const s = el('svg', { width: x, height: 2 * big + 16, 'aria-hidden': 'true' });
    for (const [n, cx] of items) s.append(el('circle', { cx, cy: 2 * big + 1 - r(n), r: r(n), class: 'map-legend-ring' }), el('text', { x: cx, y: 2 * big + 14, 'text-anchor': 'middle' }, String(n)));
    size.append(s);
    const group = html('div', 'map-legend-size'); group.append(html('span', 'map-legend-head', 'Grouped institutions'));
    const gs = el('svg', { width: 150, height: 2 * big + 16, 'aria-hidden': 'true' }), gr = Math.max(big, 11);
    gs.append(el('circle', { cx: gr + 2, cy: 2 * big + 1 - gr, r: gr, class: 'map-cluster-disc' }), el('text', { x: gr + 2, y: 2 * big + 1 - gr, class: 'map-cluster-count', 'font-size': Math.max(10, gr * 0.85) }, '12'), el('text', { x: 2 * gr + 12, y: 2 * big + 4 - gr, class: 'map-legend-text' }, 'institutions; click to zoom in'));
    group.append(gs);
    const key = html('div', 'map-legend-key'); key.append(html('span', 'map-legend-head', 'People with a verified first job (ring)'));
    for (const b of RING_BINS) { const item = html('span', 'map-key'); const ring = html('span', 'map-key-ring'); ring.style.setProperty('--c', b.color); item.append(ring, b.label); key.append(item); }
    legend.append(size, group, key);
  }

  // ---- Zoom and pan ----
  const clamp = ({ k, tx, ty }) => { const { W, H } = M.layout; k = Math.max(1, Math.min(MAX_ZOOM, k)); return { k, tx: Math.min(0, Math.max(W - W * k, tx)), ty: Math.min(0, Math.max(H - H * k, ty)) }; };
  const nudgeAt = (px, py) => { let ox = 0, oy = 0, w = 0; for (const [, it] of M.layout.items) { const dist = Math.hypot(it.sx - px, it.sy - py); if (dist <= it.sr) return [it.ox || 0, it.oy || 0]; const wd = 1 / (1 + Math.pow(dist / (it.sr + 6), 6)); ox += wd * (it.ox || 0); oy += wd * (it.oy || 0); w += wd; } return w > 0.05 ? [ox / w, oy / w] : [0, 0]; };
  // The view after zooming by `factor` about (px, py): what is under that point stays under it.
  const zoomedAt = (px, py, factor) => { const [ox, oy] = nudgeAt(px, py), z = M.zoom, k = Math.max(1, Math.min(MAX_ZOOM, z.k * factor)), gx = (px - ox - z.tx) / z.k, gy = (py - oy - z.ty) / z.k; return clamp({ k, tx: px - ox - gx * k, ty: py - oy - gy * k }); };
  const centreOn = (x0, y0, k) => clamp({ k, tx: M.layout.W / 2 - x0 * k, ty: M.layout.H / 2 - y0 * k });
  const buttonZoom = factor => {
    const L = M.layout;
    if (M.zoom.k > 1.001 || factor < 1) return zoomedAt(L.W / 2, L.H / 2, factor);
    const total = L.items.reduce((s, [, it]) => s + it.value, 0);
    const cx = L.items.reduce((s, [, it]) => s + it.sx * it.value, 0) / total, cy = L.items.reduce((s, [, it]) => s + it.sy * it.value, 0) / total;
    const [, it] = L.items.reduce((a, b) => (Math.hypot(b[1].sx - cx, b[1].sy - cy) < Math.hypot(a[1].sx - cx, a[1].sy - cy) ? b : a));
    return centreOn(it.x0, it.y0, Math.min(MAX_ZOOM, M.zoom.k * factor));
  };
  // Zoom in on a group so that its members fill most of the view (at least doubling the zoom), which
  // spreads them as far apart as one step can; institutions in the same city separate at the top zoom.
  function zoomToCluster(it) {
    const L = M.layout, xs = it.members.map(n => n.x0), ys = it.members.map(n => n.y0);
    const w = Math.max(...xs) - Math.min(...xs), h = Math.max(...ys) - Math.min(...ys);
    const fit = Math.min(L.W / Math.max(w, 1e-6), L.H / Math.max(h, 1e-6)) * 0.55;
    const k = Math.min(MAX_ZOOM, Math.max(M.zoom.k * 2, fit));
    animateZoom(centreOn((Math.max(...xs) + Math.min(...xs)) / 2, (Math.max(...ys) + Math.min(...ys)) / 2, k), 360);
  }
  function animateZoom(to, ms = 280) {
    if (!M.layout) return;
    cancelAnimationFrame(M.anim);
    if (reducedMotion()) { M.zoom = to; settle(false); return; }
    const from = { ...M.zoom }, t0 = performance.now(), ease = x => 1 - Math.pow(1 - x, 3);
    const step = now => { const u = Math.min(1, (now - t0) / ms), e = ease(u); M.zoom = { k: from.k * Math.pow(to.k / from.k, e), tx: from.tx + (to.tx - from.tx) * e, ty: from.ty + (to.ty - from.ty) * e }; M.layout.labels.style.visibility = 'hidden'; draw(); if (u < 1) M.anim = requestAnimationFrame(step); else { M.zoom = to; settle(true); } };
    M.anim = requestAnimationFrame(step);
  }
  const pointAt = e => { const b = svg.getBoundingClientRect(), s = (M.layout?.W || b.width) / b.width; return [(e.clientX - b.left) * s, (e.clientY - b.top) * s]; };
  // A click or tap goes to the nearest circle whose padded area contains the point, so a small circle
  // drawn on top of a large neighbour does not steal the tap.
  const nearest = (px, py, pad) => { let best = null, bestD = Infinity; for (const [, it] of M.layout.items) { const d = Math.hypot(it.sx - px, it.sy - py) - it.sr; if (d <= pad && d < bestD) { best = it; bestD = d; } } return best; };
  svg.addEventListener('click', e => {
    if (M.dragged || !M.layout) return;
    const [px, py] = pointAt(e), it = nearest(px, py, M.layout.mobile ? 12 : 4);
    if (!it) { if (M.selected) hideCard(); return; }
    activate(it);
  });
  buttons.in.addEventListener('click', () => M.layout && animateZoom(buttonZoom(2)));
  buttons.out.addEventListener('click', () => M.layout && animateZoom(buttonZoom(0.5)));
  buttons.reset.addEventListener('click', () => animateZoom({ k: 1, tx: 0, ty: 0 }));
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
