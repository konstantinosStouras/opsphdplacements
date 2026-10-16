// Coverage grid, trends and profiles built from the public datasets. See analytics.js for the
// numbers and charts.js for the drawing. Nothing here infers a job: every chart counts verified
// first jobs and shows the unresolved and not-yet-reviewed people beside them.
import { bubbleGrid, columns, hbars, lines, rankedRows, tiles, fmt, pct, html } from './charts.js';
import { CATEGORIES, CAT, STATUSES, STATUS, buildIndex, loadCountries, institutionMetrics, employerMetrics, inPeriod, periodLabel, fillPeriodSelect } from './analytics.js';

let index = null;
export async function getIndex(state) {
  if (!index) { index = buildIndex(state); loadCountries(index).then(() => document.dispatchEvent(new Event('countries-loaded'))); }
  return index;
}

/** The sentence above the coverage views, from the data. */
export function coverageLede(idx) {
  const inst = new Set(idx.people.map(p => p.phdInstitution).filter(Boolean));
  const countries = new Set([...inst].map(i => idx.institutionCountry.get(i)).filter(Boolean));
  const years = idx.people.map(p => p.phdYear).filter(Boolean);
  const verified = idx.people.filter(p => p.placement).length, unresolved = idx.people.filter(p => p.status === 'unresolved').length;
  const pending = idx.people.length - verified - unresolved;
  return `${fmt(inst.size)} PhD-granting institutions${countries.size ? ` in ${countries.size} countries` : ''} appear in the dataset: ${fmt(idx.people.length)} people listed in the OM List faculty directory, from the class of ${Math.min(...years)} to the class of ${Math.max(...years)}. ${fmt(verified)} of them have a verified first job after the PhD; ${fmt(unresolved)} were researched without a firm answer, and ${fmt(pending)} have not been reviewed yet or have not completed the doctorate. These are directory members, not every graduate of each program.`;
}

/** Coverage by year: one row per PhD institution, one circle per graduating class. */
export function renderCoverageYears(target, idx, { onSelect, minPeople = 5 } = {}) {
  target.replaceChildren();
  const controls = html('div', 'map-controls');
  const label = html('label', 'inline-select', 'Institutions shown');
  const select = document.createElement('select');
  for (const [v, t] of [[10, 'with 10 or more people'], [5, 'with 5 or more people'], [3, 'with 3 or more people'], [1, 'all institutions']]) select.append(new Option(t, String(v)));
  select.value = String(minPeople); label.append(select);
  const key = html('p', 'map-note');
  const gridBox = html('div', 'coverage-grid');
  controls.append(label); target.append(controls, key, gridBox);
  const draw = () => {
    const min = Number(select.value);
    const cells = {}, perInst = {};
    for (const p of idx.people) {
      if (!p.phdInstitution || !p.phdYear) continue;
      perInst[p.phdInstitution] = (perInst[p.phdInstitution] || 0) + 1;
      const c = (cells[`${p.phdInstitution}|${p.phdYear}`] ||= { row: p.phdInstitution, col: p.phdYear, n: 0, verified: 0, unresolved: 0, pending: 0 });
      c.n++; if (p.placement) c.verified++; else if (p.status === 'unresolved') c.unresolved++; else c.pending++;
    }
    const rows = Object.entries(perInst).filter(([, n]) => n >= min).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([id]) => ({ id, label: id }));
    const shown = new Set(rows.map(r => r.id));
    const list = Object.values(cells).filter(c => shown.has(c.row)).map(c => ({ ...c, share: c.n ? c.verified / c.n : 0 }));
    const years = list.map(c => c.col), cols = [];
    for (let y = Math.min(...years); y <= Math.max(...years); y++) cols.push(y);
    key.textContent = `Each circle is one institution's graduating class in the directory, sized by its number of people and filled by the share with a verified first job (full circle: every person verified; empty: none yet). ${rows.length} institutions shown, ordered by people in the dataset. Hover or focus a circle for the numbers; click one to open those records.`;
    bubbleGrid(gridBox, {
      rows, cols, cells: list, label: 'Coverage of PhD institutions by graduating class', onClick: onSelect,
      tipLines: (r, y, c) => [{ text: r.label, strong: true }, `Class of ${y}: ${c.n} ${c.n === 1 ? 'person' : 'people'} in the directory`, { text: `Verified first job: ${c.verified} (${pct(c.verified, c.n)})`, color: STATUS.verified.color }, { text: `Researched, unresolved: ${c.unresolved}`, color: STATUS.unresolved.color }, { text: `Not yet reviewed: ${c.pending}`, color: STATUS.pending.color }],
      tableHead: ['PhD institution', 'Class', 'People', 'Verified', 'Unresolved', 'Not reviewed'],
      tableRows: list.sort((a, b) => rows.findIndex(r => r.id === a.row) - rows.findIndex(r => r.id === b.row) || a.col - b.col).map(c => [c.row, c.col, c.n, c.verified, c.unresolved, c.pending])
    });
  };
  select.addEventListener('change', draw);
  draw();
}

// ---------------------------------------------------------------------------------------------
// Trends: verified first jobs over time, by PhD institution, by field and by employer.
const trend = { evoMode: 'count', evoLayer: 'jobs', evoInst: 'all', rankPeriod: 'all', rankCat: 'tenure-track', fieldPeriod: 'all', fieldCat: 'tenure-track', empPeriod: 'all', empCat: '' };
const option = (select, values, current) => { select.replaceChildren(...values.map(([v, t]) => new Option(t, v))); select.value = current; };
const toggle = (entries, current, on) => {
  const box = html('div', 'tabs map-tabs');
  for (const [v, t] of entries) { const b = html('button', v === current ? 'active' : '', t); b.type = 'button'; b.setAttribute('aria-pressed', String(v === current)); b.addEventListener('click', () => { box.querySelectorAll('button').forEach(x => { x.classList.toggle('active', x === b); x.setAttribute('aria-pressed', String(x === b)); }); on(v); }); box.append(b); }
  return box;
};
const labelled = (text, control) => { const l = html('label', 'inline-select', text); l.append(control); return l; };
const institutionsWithAtLeast = (idx, min) => Object.entries(idx.people.reduce((o, p) => { if (p.phdInstitution) o[p.phdInstitution] = (o[p.phdInstitution] || 0) + 1; return o; }, {})).filter(([, n]) => n >= min).sort((a, b) => a[0].localeCompare(b[0])).map(([name, n]) => [name, `${name} (${n})`]);

export function renderTrends(view, hosts, idx, actions) {
  const { controls, content, note } = hosts;
  controls.replaceChildren(); content.replaceChildren(); content.classList.remove('empty'); note.textContent = '';
  ({ evolution: renderEvolution, institutions: renderInstitutionRanking, fields: renderFieldRanking, employers: renderEmployers })[view]?.(hosts, idx, actions);
}

function renderEvolution({ controls, content, note }, idx, actions) {
  const inst = document.createElement('select'); inst.setAttribute('aria-label', 'PhD institution');
  option(inst, [['all', 'All PhD institutions'], ...institutionsWithAtLeast(idx, 10)], trend.evoInst);
  inst.addEventListener('change', () => { trend.evoInst = inst.value; draw(); });
  controls.append(labelled('PhD institution', inst), toggle([['count', 'Count'], ['share', 'Share']], trend.evoMode, v => { trend.evoMode = v; draw(); }), toggle([['jobs', 'Verified first jobs by type'], ['coverage', 'Research coverage']], trend.evoLayer, v => { trend.evoLayer = v; draw(); }));
  const draw = () => {
    const all = trend.evoInst === 'all', rows = idx.people.filter(p => p.phdYear && p.phdYear <= idx.latest && (all || p.phdInstitution === trend.evoInst));
    const from = all ? Math.max(1980, Math.min(...rows.map(p => p.phdYear))) : Math.min(...rows.map(p => p.phdYear));
    const years = []; for (let y = from; y <= idx.latest; y++) years.push(y);
    const percent = trend.evoMode === 'share';
    let series, head, tableRows, tip;
    if (trend.evoLayer === 'jobs') {
      const counts = {}; for (const p of rows) if (p.placement && p.phdYear >= from) (counts[p.phdYear] ||= {})[p.placement.category] = (counts[p.phdYear][p.placement.category] || 0) + 1;
      series = CATEGORIES.map(c => ({ id: c.id, name: c.label, color: c.color, data: years.map(y => counts[y]?.[c.id] || 0) }));
      const totals = years.map(y => Object.values(counts[y] || {}).reduce((a, b) => a + b, 0));
      tip = (i, active) => [{ text: `Class of ${years[i]}`, strong: true }, `${fmt(totals[i])} verified first jobs`, ...active.filter(s => s.data[i]).map(s => ({ text: `${s.name}: ${fmt(s.data[i])}${percent ? ` (${pct(s.data[i], totals[i])})` : ''}`, color: s.color }))];
      head = ['Class', 'Verified first jobs', ...CATEGORIES.map(c => c.label)]; tableRows = years.map((y, i) => [y, totals[i], ...series.map(s => s.data[i])]);
      note.textContent = `${all ? `Classes of ${from} onwards, all PhD institutions` : trend.evoInst}: verified first jobs by type of job, by PhD cohort. ${percent ? 'Shares are shares of verified first jobs in that cohort, not of all graduates.' : ''} Switch to "Research coverage" to see how many people in each cohort are still unresolved or unreviewed. Click a legend entry to hide a type.`;
    } else {
      const counts = {}; for (const p of rows) { if (p.phdYear < from) continue; const c = (counts[p.phdYear] ||= { verified: 0, unresolved: 0, 'not-yet-completed-phd': 0, pending: 0 }); c[p.placement ? 'verified' : p.status === 'unresolved' ? 'unresolved' : p.status === 'not-yet-completed-phd' ? 'not-yet-completed-phd' : 'pending']++; }
      series = STATUSES.map(s => ({ id: s.id, name: s.label, color: s.color, data: years.map(y => counts[y]?.[s.id] || 0) }));
      const totals = years.map(y => Object.values(counts[y] || {}).reduce((a, b) => a + b, 0));
      tip = (i, active) => [{ text: `Class of ${years[i]}`, strong: true }, `${fmt(totals[i])} people in the directory`, ...active.filter(s => s.data[i]).map(s => ({ text: `${s.name}: ${fmt(s.data[i])} (${pct(s.data[i], totals[i])})`, color: s.color }))];
      head = ['Class', 'People', ...STATUSES.map(s => s.label)]; tableRows = years.map((y, i) => [y, totals[i], ...series.map(s => s.data[i])]);
      note.textContent = `${all ? `Classes of ${from} onwards, all PhD institutions` : trend.evoInst}: research status of each cohort in the directory. A cohort's share of verified first jobs is a measure of how far the review has got, not an outcome.`;
    }
    columns(content, { categories: years, series, stacked: true, percent, height: 420, label: 'Verified first jobs by cohort', tipLines: tip, tableHead: head, tableRows, onClick: i => actions.selectCohort?.(all ? null : trend.evoInst, years[i]) });
  };
  draw();
}

function rankingControls(controls, idx, keyPeriod, keyCat, draw, { allCategory = false } = {}) {
  const period = document.createElement('select'); period.setAttribute('aria-label', 'Cohorts'); fillPeriodSelect(period, idx, { withYears: true }); period.value = trend[keyPeriod];
  period.addEventListener('change', () => { trend[keyPeriod] = period.value; draw(); });
  const cat = document.createElement('select'); cat.setAttribute('aria-label', 'Type of first job');
  option(cat, [...(allCategory ? [['', 'All types']] : []), ...CATEGORIES.map(c => [c.id, c.label])], trend[keyCat]);
  cat.addEventListener('change', () => { trend[keyCat] = cat.value; draw(); });
  controls.append(labelled('Cohorts', period), labelled('Type of first job', cat));
}

function renderInstitutionRanking({ controls, content, note }, idx, actions) {
  const draw = () => {
    const sel = inPeriod(trend.rankPeriod, idx.latest), groups = {}, people = {};
    for (const p of idx.people) { if (!p.phdInstitution || !sel(p.phdYear)) continue; people[p.phdInstitution] = (people[p.phdInstitution] || 0) + 1; if (!p.placement) continue; const g = (groups[p.phdInstitution] ||= { total: 0, hits: 0 }); g.total++; if (p.placement.category === trend.rankCat) g.hits++; }
    const min = /^\d{4}$/.test(trend.rankPeriod) ? 5 : 10, c = CAT[trend.rankCat];
    const items = Object.entries(groups).filter(([, g]) => g.total >= min).map(([name, g]) => ({ key: name, label: name, value: g.hits, total: g.total, people: people[name], color: c.color })).sort((a, b) => b.value / b.total - a.value / a.total || b.total - a.total);
    const dropped = Object.keys(groups).length - items.length;
    hbars(content, { items, mode: 'share', max: 100, label: `${c.label} share of verified first jobs by PhD institution`, format: it => `${pct(it.value, it.total)} · ${it.value} of ${it.total}`, onClick: it => actions.selectInstitution?.(it.key), tipLines: it => [{ text: it.label, strong: true }, { text: `${c.label}: ${it.value} of ${it.total} verified first jobs (${pct(it.value, it.total)})`, color: c.color }, { text: `${fmt(it.people)} people in the directory for these cohorts; ${fmt(it.people - it.total)} without a verified first job yet`, muted: true }], tableHead: ['PhD institution', c.label, 'Verified first jobs', 'Share', 'People in directory'], tableRows: items.map(it => [it.label, it.value, it.total, pct(it.value, it.total), it.people]) });
    note.textContent = `Share of each institution's verified first jobs that were ${c.label.toLowerCase()} jobs, ${/^\d{4}$/.test(trend.rankPeriod) ? `class of ${trend.rankPeriod}` : periodLabel(trend.rankPeriod).toLowerCase()}. Institutions with fewer than ${min} verified first jobs in the period are left out${dropped ? ` (${dropped} this time)` : ''}. The denominator is verified first jobs, not all graduates: hover a bar to see how many directory members still lack a verified first job. Click a bar to open the records.`;
  };
  rankingControls(controls, idx, 'rankPeriod', 'rankCat', draw);
  draw();
}

function renderFieldRanking({ controls, content, note }, idx, actions) {
  const draw = () => {
    const sel = inPeriod(trend.fieldPeriod, idx.latest), groups = {}, people = {};
    for (const p of idx.people) { if (!sel(p.phdYear)) continue; const f = p.discipline || 'Unknown'; people[f] = (people[f] || 0) + 1; if (!p.placement) continue; const g = (groups[f] ||= { total: 0, hits: 0 }); g.total++; if (p.placement.category === trend.fieldCat) g.hits++; }
    const c = CAT[trend.fieldCat];
    const items = Object.entries(groups).map(([name, g]) => ({ key: name, label: name, value: g.hits, total: g.total, people: people[name], color: c.color })).sort((a, b) => b.value / b.total - a.value / a.total);
    hbars(content, { items, mode: 'share', max: 100, label: `${c.label} share of verified first jobs by field`, format: it => `${pct(it.value, it.total)} · ${it.value} of ${it.total}`, tipLines: it => [{ text: it.label, strong: true }, { text: `${c.label}: ${it.value} of ${it.total} verified first jobs (${pct(it.value, it.total)})`, color: c.color }, { text: `${fmt(it.people)} people in the directory`, muted: true }], tableHead: ['Field', c.label, 'Verified first jobs', 'Share', 'People in directory'], tableRows: items.map(it => [it.label, it.value, it.total, pct(it.value, it.total), it.people]) });
    note.textContent = `Fields are the OM List directory's discipline labels for each person (Operations, Supply Chain Management, Decision Sciences); they describe the directory listing, not the subject of the doctorate. Shares are shares of verified first jobs, ${periodLabel(trend.fieldPeriod).toLowerCase()}.`;
  };
  rankingControls(controls, idx, 'fieldPeriod', 'fieldCat', draw);
  draw();
}

function renderEmployers({ controls, content, note }, idx, actions) {
  const draw = () => {
    const sel = inPeriod(trend.empPeriod, idx.latest), groups = {};
    for (const p of idx.people) { if (!p.placement || !sel(p.phdYear) || (trend.empCat && p.placement.category !== trend.empCat)) continue; const g = (groups[p.placement.employer] ||= { n: 0, cats: {}, sources: {} }); g.n++; g.cats[p.placement.category] = (g.cats[p.placement.category] || 0) + 1; if (p.phdInstitution) g.sources[p.phdInstitution] = (g.sources[p.phdInstitution] || 0) + 1; }
    const top = Object.entries(groups).sort((a, b) => b[1].n - a[1].n || a[0].localeCompare(b[0])).slice(0, 25);
    const items = top.map(([name, g]) => ({ key: name, label: name, value: g.n, segments: CATEGORIES.map(c => ({ id: c.id, name: c.label, color: c.color, value: g.cats[c.id] || 0 })), sources: g.sources }));
    const used = CATEGORIES.filter(c => top.some(([, g]) => g.cats[c.id]));
    content.replaceChildren();
    const legendBox = html('div', 'chart-legend'); for (const c of used) { const item = html('span', 'chart-legend-item'); const dot = html('span', 'chart-legend-dot'); dot.style.background = c.color; item.append(dot, html('span', undefined, c.label)); legendBox.append(item); }
    const chart = html('div'); content.append(legendBox, chart);
    hbars(chart, { items, label: 'First employers ranked by verified first jobs', onClick: it => actions.selectEmployer?.(it.key), tipLines: it => [{ text: it.label, strong: true }, `${fmt(it.value)} verified first jobs`, ...it.segments.filter(s => s.value).map(s => ({ text: `${s.name}: ${s.value}`, color: s.color })), { text: 'From: ' + Object.entries(it.sources).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([n, k]) => `${n} (${k})`).join(', '), muted: true }], tableHead: ['Employer', 'Verified first jobs', ...used.map(c => c.label)], tableRows: items.map(it => [it.label, it.value, ...used.map(c => it.segments.find(s => s.id === c.id).value)]) });
    note.textContent = `First employers ranked by the number of verified first jobs across all PhD institutions, ${periodLabel(trend.empPeriod).toLowerCase()}${trend.empCat ? `, ${CAT[trend.empCat].label.toLowerCase()} jobs only` : ''}. Only verified first jobs are counted; an employer's later hires and the unresolved cases are not. Click a bar to open the records.`;
  };
  rankingControls(controls, idx, 'empPeriod', 'empCat', draw, { allCategory: true });
  draw();
}

// ---------------------------------------------------------------------------------------------
// Profiles: PhD institution, head-to-head comparison and first employer.
const profile = { phd: '', employer: '', compare: ['', '', '', ''], period: 'all', comparePeriod: 'all', employerPeriod: 'all' };
const COMPARE_COLORS = ['#2a78d6', '#eb6834', '#1f8a5a', '#6250d6'];
export function presetProfile(type, value) { if (type === 'phd') profile.phd = value; if (type === 'employer') profile.employer = value; if (type === 'compare') profile.compare = [...value, '', '', ''].slice(0, 4); }
export function profileSelection(type) { return type === 'phd' ? profile.phd : type === 'employer' ? profile.employer : profile.compare.filter(Boolean); }

/** A select with a text box that narrows its options. */
function pickList(labelText, values, current, onChange, placeholder = 'Type to narrow the list') {
  const box = html('label', 'pick-list'); box.append(html('span', undefined, labelText));
  const search = document.createElement('input'); search.type = 'search'; search.placeholder = placeholder; search.setAttribute('aria-label', `${labelText}: filter the list`);
  const select = document.createElement('select'); select.setAttribute('aria-label', labelText);
  const fill = () => {
    const words = search.value.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
    const shown = values.filter(([v, t]) => !v || words.every(w => t.toLocaleLowerCase().includes(w)));
    select.replaceChildren(...shown.map(([v, t]) => new Option(t, v)));
    select.value = shown.some(([v]) => v === current()) ? current() : (shown[0]?.[0] ?? '');
  };
  search.addEventListener('input', fill);
  select.addEventListener('change', () => onChange(select.value));
  fill(); box.append(search, select);
  return box;
}
const periodSelect = (idx, current, onChange) => { const s = document.createElement('select'); s.setAttribute('aria-label', 'Cohorts'); fillPeriodSelect(s, idx); s.value = current; s.addEventListener('change', () => onChange(s.value)); return labelled('Cohorts', s); };
const phdInstitutionValues = idx => [['', 'Choose a PhD institution'], ...institutionsWithAtLeast(idx, 1)];
const employerValues = idx => { const c = {}; for (const p of idx.people) if (p.placement) c[p.placement.employer] = (c[p.placement.employer] || 0) + 1; return [['', 'Choose an employer'], ...Object.entries(c).sort((a, b) => a[0].localeCompare(b[0])).map(([n, k]) => [n, `${n} (${k})`])]; };
const mainCategory = cats => CATEGORIES.find(c => cats[c.id] === Math.max(0, ...Object.values(cats)));
const panel = (title, cls) => { const p = html('div', 'profile-panel' + (cls ? ' ' + cls : '')); p.append(html('h4', undefined, title)); const body = html('div'); p.append(body); return [p, body]; };
const link = (text, href) => { const a = html('a', undefined, text); a.href = href; a.target = '_blank'; a.rel = 'noopener noreferrer'; return a; };

export function renderProfile(type, hosts, idx, actions) {
  const { controls, content } = hosts;
  controls.replaceChildren(); content.replaceChildren(); content.classList.remove('empty');
  ({ phd: renderInstitutionProfile, employer: renderEmployerProfile, compare: renderComparison })[type]?.(hosts, idx, actions);
}

function renderInstitutionProfile({ controls, content }, idx, actions) {
  controls.append(pickList('PhD institution', phdInstitutionValues(idx), () => profile.phd, v => { profile.phd = v; draw(); }), periodSelect(idx, profile.period, v => { profile.period = v; draw(); }));
  const draw = () => {
    content.replaceChildren(); content.classList.remove('empty');
    if (!profile.phd) { content.classList.add('empty'); content.append(html('strong', undefined, 'Explore a PhD institution'), html('span', undefined, 'Choose an institution above to see its people in the directory, their verified first jobs and what is still unknown.')); return; }
    const m = institutionMetrics(idx, profile.phd, profile.period);
    const head = html('div', 'profile-head');
    head.append(html('h3', undefined, m.name));
    const meta = html('p', 'profile-meta');
    meta.append(`${periodLabel(profile.period)}: ${m.range} · ${fmt(m.total)} people in the directory`);
    const country = idx.institutionCountry.get(m.name); if (country) meta.append(` · ${country}`);
    const all = html('button', 'text-button', `All ${fmt(m.total)} records in the table →`); all.type = 'button'; all.addEventListener('click', () => actions.selectInstitution?.(m.name)); meta.append(' · ', all);
    head.append(meta); content.append(head);
    const tileBox = html('div', 'tiles');
    tiles(tileBox, [
      { value: fmt(m.total), label: 'People in the directory' },
      { value: fmt(m.verifiedCount), label: 'Verified first jobs', note: `${pct(m.verifiedCount, m.total)} of people` },
      { value: pct(m.tt, m.verifiedCount), label: 'Tenure track', note: `${m.tt} of ${m.verifiedCount} verified` },
      { value: pct(m.academic, m.verifiedCount), label: 'Any academic job', note: `${m.academic} of ${m.verifiedCount} verified` },
      { value: fmt(m.unresolved), label: 'Researched, unresolved' },
      { value: fmt(m.pending), label: 'Not yet reviewed' },
      { value: m.perCohort ? m.perCohort.toFixed(1) : '—', label: 'People per cohort' }
    ]);
    content.append(tileBox);
    const grid = html('div', 'profile-grid');
    const [p1, b1] = panel('Verified first jobs by type');
    hbars(b1, { items: CATEGORIES.map(c => ({ key: c.id, label: c.label, value: m.cats[c.id] || 0, total: m.verifiedCount, color: c.color })), label: 'First jobs by type', format: it => (it.value ? `${it.value} · ${pct(it.value, it.total)}` : ''), rowHeight: 26, tipLines: it => [{ text: it.label, strong: true }, `${it.value} of ${it.total} verified first jobs (${pct(it.value, it.total)})`] });
    const [p2, b2] = panel('Top first employers');
    rankedRows(b2, { items: m.employers.slice(0, 8).map(([name, e]) => { const mc = mainCategory(e.cats); return { label: name, value: e.n, color: mc?.color, colorLabel: mc?.label, key: name }; }), total: m.verifiedCount, onClick: it => actions.openEmployer?.(it.key), emptyText: 'No verified first jobs in this period.' });
    grid.append(p1, p2);
    const [p3, b3] = panel('People by cohort and research status');
    columns(b3, { categories: m.years, series: [{ id: 'verified', name: 'Verified first job', color: STATUS.verified.color, data: m.years.map(y => m.byYear[y].verified) }, { id: 'unresolved', name: 'Researched, unresolved', color: STATUS.unresolved.color, data: m.years.map(y => m.byYear[y].unresolved) }, { id: 'pending', name: 'Not yet reviewed', color: STATUS.pending.color, data: m.years.map(y => m.byYear[y].pending) }], height: 230, label: 'People by cohort', tipLines: (i, active) => [{ text: `Class of ${m.years[i]}`, strong: true }, `${m.byYear[m.years[i]].n} people`, ...active.filter(s => s.data[i]).map(s => ({ text: `${s.name}: ${s.data[i]}`, color: s.color }))], onClick: i => actions.selectCohort?.(m.name, m.years[i]), tableHead: ['Class', 'People', 'Verified', 'Unresolved', 'Not reviewed'], tableRows: m.years.map(y => [y, m.byYear[y].n, m.byYear[y].verified, m.byYear[y].unresolved, m.byYear[y].pending]) });
    const [p4, b4] = panel('Tenure-track share of verified first jobs by cohort');
    const withV = m.years.filter(y => m.byYear[y].verified);
    lines(b4, { categories: withV, series: [{ id: 'tt', name: 'Tenure track', color: CAT['tenure-track'].color, data: withV.map(y => Math.round(1000 * m.byYear[y].tt / m.byYear[y].verified) / 10) }], yMax: 100, height: 230, yFormat: v => `${v}%`, label: 'Tenure-track share by cohort', tipLines: i => { const y = withV[i], t = m.byYear[y]; return [{ text: `Class of ${y}`, strong: true }, `Tenure track: ${t.tt} of ${t.verified} verified first jobs (${pct(t.tt, t.verified)})`, { text: `${t.n} people in the cohort`, muted: true }]; }, tableHead: ['Class', 'Tenure track', 'Verified first jobs', 'Share'], tableRows: withV.map(y => [y, m.byYear[y].tt, m.byYear[y].verified, pct(m.byYear[y].tt, m.byYear[y].verified)]) });
    b4.append(html('p', 'map-note', 'Cohorts with small numbers swing widely; hover a point for the counts behind it.'));
    grid.append(p3, p4);
    const [p5, b5] = panel('Countries of first employers');
    if (m.countries.length) rankedRows(b5, { items: m.countries.map(([c, n]) => ({ label: c, value: n })), total: m.verifiedCount });
    else b5.append(html('p', 'chart-empty', idx.employerCountry.size ? 'No employer country known for these first jobs.' : 'Employer countries are not available yet.'));
    const [p6, b6] = panel('First job titles');
    rankedRows(b6, { items: m.positions.slice(0, 8).map(([t, n]) => ({ label: t, value: n })), total: m.verifiedCount, emptyText: 'No verified first jobs in this period.' });
    grid.append(p5, p6);
    content.append(grid, html('p', 'source-stamp', 'People come from the OM List directory, so this is not every graduate of the program. First jobs are only those verified from a CV, placement report or appointment record; each one is linked from the explorer. Shares of job types are shares of verified first jobs.'));
  };
  draw();
}

function renderEmployerProfile({ controls, content }, idx, actions) {
  controls.append(pickList('First employer', employerValues(idx), () => profile.employer, v => { profile.employer = v; draw(); }), periodSelect(idx, profile.employerPeriod, v => { profile.employerPeriod = v; draw(); }));
  const draw = () => {
    content.replaceChildren(); content.classList.remove('empty');
    if (!profile.employer) { content.classList.add('empty'); content.append(html('strong', undefined, 'Explore a first employer'), html('span', undefined, 'Choose an employer above to see who it hired straight after the PhD, from which programs and into which roles.')); return; }
    const m = employerMetrics(idx, profile.employer, profile.employerPeriod);
    const head = html('div', 'profile-head'); head.append(html('h3', undefined, m.name));
    const meta = html('p', 'profile-meta'), mc = mainCategory(m.cats);
    meta.append([mc && `mostly ${mc.label.toLowerCase()} jobs`, m.country, `${periodLabel(profile.employerPeriod)}: ${m.range}`].filter(Boolean).join(' · '));
    const all = html('button', 'text-button', `All ${fmt(m.total)} verified first jobs in the table →`); all.type = 'button'; all.addEventListener('click', () => actions.selectEmployer?.(m.name)); meta.append(' · ', all);
    head.append(meta); content.append(head);
    const tileBox = html('div', 'tiles');
    const top5 = m.sources.slice(0, 5).reduce((s, [, g]) => s + g.n, 0);
    tiles(tileBox, [{ value: fmt(m.total), label: 'Verified first jobs here' }, { value: fmt(m.sources.length), label: 'PhD institutions of origin' }, { value: m.years.length ? (m.total / m.years.length).toFixed(1) : '—', label: 'Hires per cohort' }, { value: pct(top5, m.total), label: 'From the top 5 sources' }]);
    content.append(tileBox);
    const grid = html('div', 'profile-grid');
    const [p1, b1] = panel('Where the hires earned their PhD');
    rankedRows(b1, { items: m.sources.slice(0, 10).map(([name, g]) => { const c = mainCategory(g.cats); return { key: name, label: name, value: g.n, color: c?.color, colorLabel: c?.label }; }), total: m.total, onClick: it => actions.openInstitution?.(it.key) });
    const [p2, b2] = panel('Job titles');
    rankedRows(b2, { items: m.positions.slice(0, 8).map(([t, g]) => ({ label: t, value: g.n })), total: m.total });
    grid.append(p1, p2);
    const [p3, b3] = panel('Hires by PhD cohort and type of job');
    const used = CATEGORIES.filter(c => m.cats[c.id]); const years = []; if (m.years.length) for (let y = m.years[0]; y <= m.years[m.years.length - 1]; y++) years.push(y);
    columns(b3, { categories: years, series: used.map(c => ({ id: c.id, name: c.label, color: c.color, data: years.map(y => m.byYear[y]?.[c.id] || 0) })), height: 240, label: 'Hires by cohort', tipLines: (i, active) => [{ text: `Class of ${years[i]}`, strong: true }, ...active.filter(s => s.data[i]).map(s => ({ text: `${s.name}: ${s.data[i]}`, color: s.color }))], tableHead: ['Class', ...used.map(c => c.label)], tableRows: years.map(y => [y, ...used.map(c => m.byYear[y]?.[c.id] || 0)]) });
    const [p4, b4] = panel('Most recent cohorts hired');
    for (const p of m.recent.slice(0, 8)) {
      const row = html('div', 'hire-row');
      row.append(html('span', 'hire-year', p.phdYear ? String(p.phdYear) : '—'));
      row.append(p.placement.evidenceUrl ? link(p.name, p.placement.evidenceUrl) : html('span', undefined, p.name));
      const inst = html('button', 'text-button', p.phdInstitution || 'PhD institution not reported'); inst.type = 'button'; inst.addEventListener('click', () => actions.openInstitution?.(p.phdInstitution)); row.append(inst);
      row.append(html('span', 'hire-pos', [p.placement.position, p.placement.placementYear && `started ${p.placement.placementYear}`].filter(Boolean).join(' · ') || 'Role not reported'));
      b4.append(row);
    }
    if (!m.recent.length) b4.append(html('p', 'chart-empty', 'No verified first jobs in this period.'));
    grid.append(p3, p4);
    content.append(grid, html('p', 'source-stamp', 'Counts are verified first jobs after the PhD among people in the OM List directory. They are not the employer\'s total hiring, and they exclude people whose first job is still unresolved or unreviewed. Names link to the evidence used.'));
  };
  draw();
}

function renderComparison({ controls, content }, idx, actions) {
  const values = phdInstitutionValues(idx);
  for (let i = 0; i < 4; i++) controls.append(pickList(`Institution ${i + 1}`, values, () => profile.compare[i], v => { profile.compare[i] = v; draw(); }));
  controls.append(periodSelect(idx, profile.comparePeriod, v => { profile.comparePeriod = v; draw(); }));
  const draw = () => {
    content.replaceChildren(); content.classList.remove('empty');
    const chosen = [...new Set(profile.compare.filter(Boolean))];
    if (chosen.length < 2) { content.classList.add('empty'); content.append(html('strong', undefined, 'Compare PhD institutions'), html('span', undefined, 'Choose two to four institutions above.')); return; }
    const ms = chosen.map((name, i) => ({ name, color: COMPARE_COLORS[i], m: institutionMetrics(idx, name, profile.comparePeriod) }));
    const grid = html('div', 'stats-grid'); grid.style.setProperty('--n', ms.length);
    const header = html('div', 'stats-row stats-header'); header.append(html('div', 'stats-label', ''));
    for (const x of ms) { const h = html('div', 'stats-name'); const dot = html('span', 'chart-legend-dot'); dot.style.background = x.color; h.append(dot, html('span', undefined, x.name)); header.append(h); }
    grid.append(header);
    const rows = [['People in the directory', m => fmt(m.total)], ['Verified first jobs', m => `${fmt(m.verifiedCount)} (${pct(m.verifiedCount, m.total)})`], ['Tenure track, of verified', m => pct(m.tt, m.verifiedCount)], ['Any academic job, of verified', m => pct(m.academic, m.verifiedCount)], ['Industry, of verified', m => pct(m.cats.industry || 0, m.verifiedCount)], ['Researched, unresolved', m => fmt(m.unresolved)], ['Not yet reviewed', m => fmt(m.pending)], ['People per cohort', m => (m.perCohort ? m.perCohort.toFixed(1) : '—')], ['Cohorts', m => m.range]];
    for (const [label, f] of rows) { const r = html('div', 'stats-row'); r.append(html('div', 'stats-label', label)); for (const x of ms) r.append(html('div', 'stats-value', f(x.m))); grid.append(r); }
    content.append(grid);
    const [p1, b1] = panel('Verified first jobs by type, share of each institution\'s verified first jobs');
    columns(b1, { categories: CATEGORIES.map(c => c.label), series: ms.map(x => ({ id: x.name, name: x.name, color: x.color, data: CATEGORIES.map(c => (x.m.verifiedCount ? Math.round(1000 * (x.m.cats[c.id] || 0) / x.m.verifiedCount) / 10 : 0)) })), stacked: false, height: 320, yFormat: v => `${v}%`, label: 'First job types compared', tipLines: (i, active) => [{ text: CATEGORIES[i].label, strong: true }, ...active.map(s => { const x = ms.find(y => y.name === s.id); return { text: `${s.name}: ${s.data[i]}% (${x.m.cats[CATEGORIES[i].id] || 0} of ${x.m.verifiedCount})`, color: s.color }; })], tableHead: ['Type', ...ms.map(x => x.name)], tableRows: CATEGORIES.map((c, i) => [c.label, ...ms.map(x => `${x.m.cats[c.id] || 0} (${pct(x.m.cats[c.id] || 0, x.m.verifiedCount)})`)]) });
    content.append(p1);
    const dest = html('div', 'profile-grid compare-dest');
    for (const x of ms) { const [p, b] = panel(`Top first employers: ${x.name}`); p.style.setProperty('--c', x.color); rankedRows(b, { items: x.m.employers.slice(0, 6).map(([n, e]) => { const c = mainCategory(e.cats); return { key: n, label: n, value: e.n, color: c?.color, colorLabel: c?.label }; }), total: x.m.verifiedCount, onClick: it => actions.openEmployer?.(it.key), emptyText: 'No verified first jobs in this period.' }); dest.append(p); }
    content.append(dest, html('p', 'source-stamp', 'Shares are shares of verified first jobs, so an institution with many unreviewed people can look different once its review is complete; the unresolved and not-yet-reviewed rows show how far each review has got.'));
  };
  draw();
}
