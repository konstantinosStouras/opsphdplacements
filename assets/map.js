// Interactive world map of PhD-granting institutions. Hand-built SVG, no map library.
// Land shapes: world-atlas countries-110m (Natural Earth, ISC licence; see assets/vendor/world/LICENSE.txt).
// Projection: Equal Earth (Savric, Patterson & Jenny 2018). Locations: data/institution-locations.json.
const NS = 'http://www.w3.org/2000/svg';
const VIEW = { w: 1000, h: 500 };
const REGIONS = {
  world: { label: 'World', box: [-170, -56, 180, 82] },
  northAmerica: { label: 'North America', box: [-168, 14, -52, 72] },
  europe: { label: 'Europe', box: [-12, 34, 40, 62] },
  asiaPacific: { label: 'Asia and Oceania', box: [68, -45, 180, 50] }
};
const ABBREVIATIONS = {
  'Massachusetts Institute of Technology': 'MIT', 'Stanford University': 'Stanford', 'University of Pennsylvania': 'Penn',
  'Georgia Institute of Technology': 'Georgia Tech', 'Carnegie Mellon University': 'CMU', 'University of Michigan at Ann Arbor': 'Michigan',
  'University of California, Berkeley': 'Berkeley', 'University of California, Los Angeles': 'UCLA', 'London School of Economics and Political Science': 'LSE',
  'Hong Kong University of Science and Technology': 'HKUST', 'National University of Singapore': 'NUS', 'University of Illinois at Urbana-Champaign': 'UIUC',
  'University of North Carolina at Chapel Hill': 'UNC', 'University of Texas at Austin': 'UT Austin', 'University of Texas at Dallas': 'UT Dallas',
  'Erasmus University Rotterdam': 'Erasmus', 'London Business School': 'LBS', 'New York University': 'NYU', 'University of Southern California': 'USC'
};

const el = (name, attrs = {}, text) => {
  const e = document.createElementNS(NS, name);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  if (text !== undefined) e.textContent = text;
  return e;
};
const html = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };
const shortName = name => ABBREVIATIONS[name] || name.replace(/^University of /, '').replace(/ University$/, '').replace(/^The /, '');
const initials = name => (ABBREVIATIONS[name] && ABBREVIATIONS[name].length <= 4 ? ABBREVIATIONS[name] : shortName(name).split(/[\s-]+/).filter(w => /^[A-Z]/.test(w)).map(w => w[0]).join('').slice(0, 3));

/** Equal Earth projection, unscaled; y grows downward. */
function equalEarth(lon, lat) {
  const A1 = 1.340264, A2 = -0.081106, A3 = 0.000893, A4 = 0.003796, M = Math.sqrt(3) / 2;
  const phi = lat * Math.PI / 180, lam = lon * Math.PI / 180, t = Math.asin(M * Math.sin(phi)), t2 = t * t, t6 = t2 * t2 * t2;
  return [2 * Math.sqrt(3) * lam * Math.cos(t) / (3 * (A1 + 3 * A2 * t2 + t6 * (7 * A3 + 9 * A4 * t2))), -t * (A1 + A2 * t2 + t6 * (A3 + A4 * t2))];
}

/** Decode TopoJSON country polygons into arrays of rings of [lon, lat]. */
function countryRings(topo) {
  const [sx, sy] = topo.transform.scale, [tx, ty] = topo.transform.translate;
  const arcs = topo.arcs.map(arc => { let x = 0, y = 0; return arc.map(([dx, dy]) => { x += dx; y += dy; return [x * sx + tx, y * sy + ty]; }); });
  const arcPoints = i => (i < 0 ? arcs[~i].slice().reverse() : arcs[i]);
  const ring = indexes => indexes.flatMap((i, n) => (n ? arcPoints(i).slice(1) : arcPoints(i)));
  const out = [];
  for (const g of topo.objects.countries.geometries) {
    if (g.properties?.name === 'Antarctica') continue;
    const polygons = g.type === 'Polygon' ? [g.arcs] : g.type === 'MultiPolygon' ? g.arcs : [];
    for (const polygon of polygons) for (const r of polygon) out.push(ring(r));
  }
  return out;
}

export async function renderMap(target, state, { onSelect } = {}) {
  target.classList.remove('empty');
  target.replaceChildren(html('p', 'map-note', 'Loading the map…'));
  let world, locations;
  try {
    [world, locations] = await Promise.all([fetch('assets/vendor/world/countries-110m.json').then(r => r.json()), fetch('data/institution-locations.json').then(r => r.json())]);
  } catch {
    target.classList.add('empty');
    target.replaceChildren(html('strong', undefined, 'The map could not be loaded'), html('span', undefined, 'Please reload the page, or use the bar chart tabs.'));
    return;
  }

  // Counts per PhD institution: imported profiles and verified first jobs.
  const profiles = new Map(), verified = new Map();
  for (const r of state.faculty) if (r.phdInstitution) profiles.set(r.phdInstitution, (profiles.get(r.phdInstitution) || 0) + 1);
  for (const r of state.placements) if (r.phdInstitution) verified.set(r.phdInstitution, (verified.get(r.phdInstitution) || 0) + 1);
  const located = locations.records.filter(r => r.qid && profiles.has(r.institution));
  const unmapped = [...profiles.keys()].length - located.length;
  const unmappedPeople = [...profiles].reduce((n, [name, c]) => n + c, 0) - located.reduce((n, r) => n + profiles.get(r.institution), 0);

  // Projection fitted to the visible world (lat -58..84).
  const raw = lonlat => equalEarth(lonlat[0], lonlat[1]);
  const [x0] = raw([-180, 0]), [x1] = raw([180, 0]), [, y0] = raw([0, 84]), [, y1] = raw([0, -58]);
  const scale = Math.min(VIEW.w / (x1 - x0), VIEW.h / (y1 - y0));
  const project = (lon, lat) => { const [x, y] = equalEarth(lon, lat); return [(x - x0) * scale, (y - y0) * scale]; };
  const land = countryRings(world).map(r => 'M' + r.map(([lo, la]) => project(lo, Math.max(-58, Math.min(84, la))).map(v => v.toFixed(1)).join(',')).join('L') + 'Z').join('');
  const grid = [];
  for (let lon = -150; lon <= 150; lon += 30) grid.push('M' + [-58, 84].map(la => project(lon, la).map(v => v.toFixed(1)).join(',')).join('L'));
  for (let lat = -30; lat <= 60; lat += 30) { const pts = []; for (let lon = -180; lon <= 180; lon += 10) pts.push(project(lon, lat).map(v => v.toFixed(1)).join(',')); grid.push('M' + pts.join('L')); }

  const nodes = located.map(r => {
    const [x, y] = project(r.lon, r.lat);
    return { name: r.institution, qid: r.qid, description: r.description, logo: r.logo || null, ax: x, ay: y, x, y, profiles: profiles.get(r.institution), verified: verified.get(r.institution) || 0 };
  });

  const ui = { metric: 'profiles', region: 'world', view: { k: 1, tx: 0, ty: 0 }, pinned: null };
  const maxZoom = 10;
  const value = n => (ui.metric === 'profiles' ? n.profiles : n.verified);
  const radius = n => { const v = value(n); return v ? Math.min(21, 3.6 + 1.5 * Math.sqrt(v)) * Math.pow(ui.view.k, 0.35) : 0; };

  // Page structure.
  const controls = html('div', 'map-controls');
  const regionTabs = html('div', 'tabs map-tabs'); regionTabs.setAttribute('aria-label', 'Map region');
  const metricTabs = html('div', 'tabs map-tabs'); metricTabs.setAttribute('aria-label', 'Circle size');
  const stage = html('div', 'map-stage');
  const svg = el('svg', { viewBox: `0 0 ${VIEW.w} ${VIEW.h}`, role: 'group', 'aria-label': 'Map of PhD-granting institutions. Circle area shows the number of people in the dataset.', class: 'map-svg' });
  const landLayer = el('g'), linkLayer = el('g'), dotLayer = el('g', { class: 'map-circles' }), labelLayer = el('g', { class: 'map-labels', 'aria-hidden': 'true' });
  landLayer.append(el('path', { d: grid.join(''), class: 'map-grid' }), el('path', { d: land, class: 'map-land' }));
  const defs = el('defs');
  svg.append(defs, landLayer, linkLayer, dotLayer, labelLayer);
  const card = html('div', 'map-card'); card.hidden = true; card.setAttribute('role', 'status');
  const zoomBox = html('div', 'map-zoom');
  const zoomButtons = {};
  for (const [id, text, label] of [['in', '+', 'Zoom in'], ['out', '−', 'Zoom out'], ['reset', '↺', 'Reset the view']]) {
    const b = html('button', undefined, text); b.type = 'button'; b.setAttribute('aria-label', label); zoomButtons[id] = b; zoomBox.append(b);
  }
  stage.append(svg, zoomBox, card);
  const note = html('p', 'map-note');
  note.textContent = `Circle area shows the number of people in the dataset who earned their doctorate at each institution. Locations are approximate campus positions from Wikidata. ${located.length} institutions are mapped; ${unmapped} institutions (${unmappedPeople.toLocaleString('en-GB')} people) could not be matched to a location yet and are not shown. The dataset is a faculty-based sample, not a census of all graduates. Hover or focus a circle for details; use the zoom buttons or Ctrl + scroll to zoom and drag to pan.`;
  controls.append(regionTabs, metricTabs);
  target.replaceChildren(controls, stage, note);

  const tabs = (host, entries, current, on) => {
    host.replaceChildren();
    for (const [key, label] of entries) {
      const b = html('button', key === current ? 'active' : '', label); b.type = 'button'; b.setAttribute('aria-pressed', String(key === current));
      b.addEventListener('click', () => { host.querySelectorAll('button').forEach(x => { x.classList.toggle('active', x === b); x.setAttribute('aria-pressed', String(x === b)); }); on(key); });
      host.append(b);
    }
  };

  // Screen-space layout: each circle sits at its true place on the zoomed map and is nudged apart from neighbours.
  const toScreen = n => [n.ax * ui.view.k + ui.view.tx, n.ay * ui.view.k + ui.view.ty];
  function layout() {
    const shown = nodes.filter(n => value(n) > 0).sort((a, b) => value(b) - value(a));
    for (const n of shown) { const [sx, sy] = toScreen(n); n.sx = sx; n.sy = sy; n.x = sx; n.y = sy; n.r = radius(n); }
    for (let pass = 0; pass < 60; pass++) {
      let moved = false;
      for (let i = 0; i < shown.length; i++) for (let j = i + 1; j < shown.length; j++) {
        const a = shown[i], b = shown[j]; let dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy); const min = a.r + b.r + 1.5;
        if (d >= min) continue;
        if (d < 0.01) { dx = Math.random() - 0.5; dy = Math.random() - 0.5; d = Math.hypot(dx, dy); }
        const push = (min - d) / 2, wa = b.r / (a.r + b.r), wb = a.r / (a.r + b.r);
        a.x -= dx / d * push * 2 * wa; a.y -= dy / d * push * 2 * wa; b.x += dx / d * push * 2 * wb; b.y += dy / d * push * 2 * wb; moved = true;
      }
      for (const n of shown) { n.x += (n.sx - n.x) * 0.02; n.y += (n.sy - n.y) * 0.02; n.x = Math.max(n.r + 1, Math.min(VIEW.w - n.r - 1, n.x)); n.y = Math.max(n.r + 1, Math.min(VIEW.h - n.r - 1, n.y)); }
      if (!moved) break;
    }
    return shown;
  }

  function showCard(n, pinned) {
    card.replaceChildren();
    card.append(html('strong', undefined, n.name));
    if (n.description) card.append(html('span', 'map-card-sub', n.description));
    const rows = html('dl');
    for (const [k, v] of [['People in the dataset', n.profiles.toLocaleString('en-GB')], ['Verified first jobs', n.verified.toLocaleString('en-GB')]]) { rows.append(html('dt', undefined, k), html('dd', undefined, v)); }
    card.append(rows);
    if (pinned && onSelect) {
      const b = html('button', 'map-card-action', 'Show these records ↓'); b.type = 'button'; b.addEventListener('click', () => onSelect(n.name)); card.append(b);
    }
    const link = html('a', 'map-card-source', 'Location: Wikidata ' + n.qid + ' ↗'); link.href = 'https://www.wikidata.org/wiki/' + n.qid; link.target = '_blank'; link.rel = 'noopener noreferrer'; card.append(link);
    const rect = stage.getBoundingClientRect(), s = rect.width / VIEW.w;
    const px = n.x * s, py = n.y * s;
    card.hidden = false;
    const w = card.offsetWidth, h = card.offsetHeight;
    card.style.left = Math.max(6, Math.min(rect.width - w - 6, px + n.r * s + 10 > rect.width - w ? px - w - n.r * s - 10 : px + n.r * s + 10)) + 'px';
    card.style.top = Math.max(6, Math.min(rect.height - h - 6, py - h / 2)) + 'px';
  }
  const hideCard = () => { if (!ui.pinned) card.hidden = true; };

  function draw() {
    const shown = layout();
    dotLayer.replaceChildren(); linkLayer.replaceChildren(); labelLayer.replaceChildren(); defs.replaceChildren();
    const zoomed = ui.view.k > 1.001;
    svg.classList.toggle('zoomed', zoomed);
    svg.style.touchAction = zoomed ? 'none' : 'pan-y';
    zoomButtons.in.disabled = ui.view.k >= maxZoom - 0.001; zoomButtons.out.disabled = zoomButtons.reset.disabled = !zoomed;
    landLayer.setAttribute('transform', `translate(${ui.view.tx} ${ui.view.ty}) scale(${ui.view.k})`);
    for (const n of shown) {
      const [px, py] = [n.sx, n.sy];
      if (px < -40 || px > VIEW.w + 40 || py < -40 || py > VIEW.h + 40) continue;
      if (Math.hypot(n.x - px, n.y - py) > n.r * 0.6) {
        linkLayer.append(el('line', { x1: px, y1: py, x2: n.x, y2: n.y, class: 'map-link' }), el('circle', { cx: px, cy: py, r: 1.8, class: 'map-pin' }));
      }
      const g = el('g', { class: 'map-dot' + (ui.pinned === n ? ' selected' : ''), tabindex: '0', role: 'button', 'aria-label': `${n.name}: ${n.profiles} people in the dataset, ${n.verified} verified first jobs` });
      g.append(el('circle', { cx: n.x, cy: n.y, r: n.r }));
      if (n.logo && n.r >= 7) {
        const clipId = 'clip-' + n.qid, inner = n.r - 1.6;
        const clip = el('clipPath', { id: clipId }); clip.append(el('circle', { cx: n.x, cy: n.y, r: inner })); defs.append(clip);
        g.append(el('circle', { cx: n.x, cy: n.y, r: inner, class: 'map-logo-bg' }));
        const img = el('image', { href: n.logo, x: n.x - inner * 0.72, y: n.y - inner * 0.72, width: inner * 1.44, height: inner * 1.44, 'clip-path': `url(#${clipId})`, preserveAspectRatio: 'xMidYMid meet', class: 'map-logo' });
        img.addEventListener('error', () => { img.remove(); g.querySelector('.map-logo-bg')?.remove(); if (n.r >= 11) g.append(el('text', { x: n.x, y: n.y, class: 'map-initials', 'font-size': Math.min(13, n.r * 0.62) }, initials(n.name))); }, { once: true });
        g.append(img);
      } else if (n.r >= 11) g.append(el('text', { x: n.x, y: n.y, class: 'map-initials', 'font-size': Math.min(13, n.r * 0.62) }, initials(n.name)));
      g.addEventListener('mouseenter', () => { if (!panning) showCard(n, false); });
      g.addEventListener('mouseleave', hideCard);
      g.addEventListener('focus', () => showCard(n, ui.pinned === n));
      g.addEventListener('blur', hideCard);
      g.addEventListener('click', e => { e.stopPropagation(); ui.pinned = ui.pinned === n ? null : n; draw(); if (ui.pinned) showCard(n, true); else card.hidden = true; });
      g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); g.dispatchEvent(new MouseEvent('click', { bubbles: true })); } if (e.key === 'Escape') { ui.pinned = null; card.hidden = true; draw(); } });
      dotLayer.append(g);
    }
    // Labels for the biggest circles first: try right, left, below and above, skipping any that would collide.
    const placed = [], limit = 14 + Math.round(ui.view.k * 10), hit = (b, o) => o.x + o.r > b[0] && o.x - o.r < b[2] && o.y + o.r > b[1] && o.y - o.r < b[3];
    for (const n of shown.slice(0, limit)) {
      if (n.sx < 0 || n.sx > VIEW.w || n.sy < 0 || n.sy > VIEW.h) continue;
      const text = shortName(n.name), w = text.length * 6.4, pad = n.r + 3;
      const candidates = [[n.x + pad, n.y - 8, 'start'], [n.x - pad - w, n.y - 8, 'end'], [n.x - w / 2, n.y + pad + 1, 'middle'], [n.x - w / 2, n.y - pad - 17, 'middle']];
      for (const [bx, by, anchor] of candidates) {
        const box = [bx, by, bx + w, by + 16];
        if (box[0] < 0 || box[2] > VIEW.w || box[1] < 0 || box[3] > VIEW.h) continue;
        if (placed.some(p => box[0] < p[2] && box[2] > p[0] && box[1] < p[3] && box[3] > p[1])) continue;
        if (shown.some(o => o !== n && hit(box, o))) continue;
        placed.push(box);
        labelLayer.append(el('text', { x: anchor === 'start' ? box[0] : anchor === 'end' ? box[2] : bx + w / 2, y: by + 8, 'text-anchor': anchor, class: 'map-label' }, text));
        break;
      }
    }
  }

  // Zoom and pan. The map scales about a point; what is under that point stays under it.
  const clamp = v => {
    const k = Math.max(1, Math.min(maxZoom, v.k));
    return { k, tx: Math.min(0, Math.max(VIEW.w - VIEW.w * k, v.tx)), ty: Math.min(0, Math.max(VIEW.h - VIEW.h * k, v.ty)) };
  };
  const zoomAt = (px, py, factor, from = ui.view) => {
    const k = Math.max(1, Math.min(maxZoom, from.k * factor)), f = k / from.k;
    return clamp({ k, tx: px - (px - from.tx) * f, ty: py - (py - from.ty) * f });
  };
  const setView = v => { ui.view = clamp(v); draw(); };
  const fit = ([w, s, e, n]) => {
    const [ax, ay] = project(w, n), [bx, by] = project(e, s);
    const k = Math.min(maxZoom, Math.max(1, Math.min(VIEW.w / (bx - ax), VIEW.h / (by - ay)) * 0.95));
    setView({ k, tx: VIEW.w / 2 - (ax + bx) / 2 * k, ty: VIEW.h / 2 - (ay + by) / 2 * k });
  };
  const toView = e => { const r = svg.getBoundingClientRect(); return [(e.clientX - r.left) * VIEW.w / r.width, (e.clientY - r.top) * VIEW.h / r.height]; };
  const focus = () => {
    const seen = nodes.filter(n => value(n) > 0 && n.sx >= 0 && n.sx <= VIEW.w && n.sy >= 0 && n.sy <= VIEW.h);
    if (!seen.length) return [VIEW.w / 2, VIEW.h / 2];
    const total = seen.reduce((t, n) => t + value(n), 0);
    return [seen.reduce((t, n) => t + n.sx * value(n), 0) / total, seen.reduce((t, n) => t + n.sy * value(n), 0) / total];
  };
  zoomButtons.in.addEventListener('click', () => { const [px, py] = focus(); setView(zoomAt(px, py, 1.6)); });
  zoomButtons.out.addEventListener('click', () => { const [px, py] = focus(); setView(zoomAt(px, py, 1 / 1.6)); });
  zoomButtons.reset.addEventListener('click', () => { ui.region = 'world'; regionTabs.querySelectorAll('button').forEach((b, i) => { b.classList.toggle('active', i === 0); b.setAttribute('aria-pressed', String(i === 0)); }); setView({ k: 1, tx: 0, ty: 0 }); });
  svg.addEventListener('wheel', e => { if (!(e.ctrlKey || e.metaKey)) return; e.preventDefault(); const [px, py] = toView(e); setView(zoomAt(px, py, Math.exp(-e.deltaY * 0.0025))); }, { passive: false });
  svg.addEventListener('dblclick', e => { const [px, py] = toView(e); setView(zoomAt(px, py, 1.8)); });
  svg.addEventListener('click', () => { if (ui.pinned) { ui.pinned = null; card.hidden = true; draw(); } });

  let panning = false;
  const pointers = new Map(); let start = null;
  svg.addEventListener('pointerdown', e => {
    pointers.set(e.pointerId, toView(e));
    start = { view: ui.view, points: [...pointers.values()], moved: false };
  });
  svg.addEventListener('pointermove', e => {
    if (!pointers.has(e.pointerId) || !start) return;
    pointers.set(e.pointerId, toView(e));
    const now = [...pointers.values()];
    if (now.length === 2 && start.points.length === 2) {
      const d0 = Math.hypot(start.points[0][0] - start.points[1][0], start.points[0][1] - start.points[1][1]) || 1, d1 = Math.hypot(now[0][0] - now[1][0], now[0][1] - now[1][1]);
      setView(zoomAt((now[0][0] + now[1][0]) / 2, (now[0][1] + now[1][1]) / 2, d1 / d0, start.view)); return;
    }
    if (ui.view.k <= 1.001 && !start.moved) return;
    const [sx, sy] = start.points[0], [cx, cy] = now[0];
    if (!start.moved && Math.hypot(cx - sx, cy - sy) < 4) return;
    start.moved = true; panning = true; card.hidden = true;
    svg.setPointerCapture?.(e.pointerId);
    setView({ k: start.view.k, tx: start.view.tx + cx - sx, ty: start.view.ty + cy - sy });
  });
  const end = e => { pointers.delete(e.pointerId); start = pointers.size ? { view: ui.view, points: [...pointers.values()], moved: true } : null; setTimeout(() => { panning = false; }, 0); };
  svg.addEventListener('pointerup', end); svg.addEventListener('pointercancel', end);

  tabs(regionTabs, Object.entries(REGIONS).map(([k, v]) => [k, v.label]), ui.region, key => { ui.region = key; if (key === 'world') setView({ k: 1, tx: 0, ty: 0 }); else fit(REGIONS[key].box); });
  tabs(metricTabs, [['profiles', 'People in the dataset'], ['verified', 'Verified first jobs']], ui.metric, key => { ui.metric = key; ui.pinned = null; card.hidden = true; draw(); });
  draw();
}
