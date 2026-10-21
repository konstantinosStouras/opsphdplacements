import {dataUrl} from './data-url.js';
// Metrics shared by the coverage grid, trends and profiles. Everything is computed from the public
// datasets: faculty.json (people), placements.json (verified first jobs) and research-status.json
// (one research disposition per person). Shares of first-job types are always shares of *verified*
// first jobs; the unresolved and not-yet-reviewed counts travel alongside so no reader mistakes a
// verified share for a share of all graduates.
import { fold } from './model.js';
export const CATEGORIES = [
  { id: 'tenure-track', label: 'Tenure track', color: '#1f8a5a' },
  { id: 'postdoc', label: 'Postdoc', color: '#2a78d6' },
  { id: 'teaching-track', label: 'Teaching track', color: '#159b9b' },
  { id: 'other-academic', label: 'Other academic', color: '#eb6834' },
  { id: 'industry', label: 'Industry', color: '#6250d6' },
  { id: 'government', label: 'Government', color: '#eda100' },
  { id: 'nonprofit', label: 'Non-profit', color: '#e87ba4' },
  { id: 'unknown', label: 'Type not reported', color: '#b8732a' }
];
export const CAT = Object.fromEntries(CATEGORIES.map(c => [c.id, c]));
export const STATUSES = [
  { id: 'verified', label: 'Verified first job', color: '#1f8a5a' },
  { id: 'unresolved', label: 'Researched, still unresolved', color: '#eb6834' },
  { id: 'not-yet-completed-phd', label: 'PhD not yet completed', color: '#2a78d6' },
  { id: 'pending', label: 'Not yet reviewed', color: '#c3c8bf' }
];
export const STATUS = Object.fromEntries(STATUSES.map(s => [s.id, s]));
export const ACADEMIC = new Set(['tenure-track', 'postdoc', 'teaching-track', 'other-academic']);
const THIS_YEAR = new Date().getFullYear();

/** Names that differ only in accents, punctuation, spacing or case are one organisation; the most used
 *  spelling stands for all of them, the same rule as scripts/build-institutions.mjs. */
function canonicalNames(names) {
  const groups = new Map();
  for (const n of names) { if (!n) continue; const k = fold(n); const g = groups.get(k) || new Map(); g.set(n, (g.get(n) || 0) + 1); groups.set(k, g); }
  const canon = new Map();
  for (const g of groups.values()) { const best = [...g].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0][0]; for (const n of g.keys()) canon.set(n, best); }
  return n => (n && canon.get(n)) || n;
}
export function buildIndex(state) {
  const statusById = new Map((state.progress?.records || []).map(r => [r.facultyId, r]));
  const placementById = new Map(state.placements.map(p => [p.facultyId, p]));
  const phdName = canonicalNames(state.faculty.map(f => placementById.get(f.id)?.phdInstitution || f.phdInstitution)), employerName = canonicalNames(state.placements.map(p => p.employer));
  // A verified review can correct the imported PhD institution or year; the corrected values win here.
  const people = state.faculty.map(f => { const raw = placementById.get(f.id) || null, placement = raw ? { ...raw, employer: employerName(raw.employer) } : null; return { ...f, phdInstitution: phdName(placement?.phdInstitution || f.phdInstitution), phdYear: placement?.phdYear ?? f.phdYear, status: statusById.get(f.id)?.status || 'pending', review: statusById.get(f.id) || null, placement }; });
  const years = [...new Set(people.map(p => p.phdYear).filter(y => y && y <= THIS_YEAR))].sort((a, b) => a - b);
  const latest = years[years.length - 1];
  const employerCountry = new Map(), institutionCountry = new Map();
  return { people, years, latest, statusById, placementById, employerCountry, institutionCountry };
}

export const PERIODS = [
  { value: 'all', label: 'All cohorts' },
  { value: 'last3', label: 'Last 3 cohorts' },
  { value: 'last5', label: 'Last 5 cohorts' },
  { value: 'last10', label: 'Last 10 cohorts' },
  { value: 'pre2000', label: 'Before 2000' },
  { value: '2000s', label: '2000 to 2009' },
  { value: '2010s', label: '2010 to 2019' },
  { value: '2020s', label: '2020 onwards' }
];
export const periodLabel = value => PERIODS.find(p => p.value === value)?.label || (/^\d{4}$/.test(value) ? `Class of ${value}` : String(value));
/** Predicate on a PhD year for a period. People without a PhD year are included only in "all". */
export function inPeriod(period, latest) {
  if (period === 'all') return () => true;
  if (/^\d{4}$/.test(period)) return y => y === Number(period);
  const last = { last3: 3, last5: 5, last10: 10 }[period];
  if (last) return y => y != null && y > latest - last && y <= latest;
  const bands = { pre2000: [-Infinity, 1999], '2000s': [2000, 2009], '2010s': [2010, 2019], '2020s': [2020, Infinity] }[period];
  return y => y != null && y >= bands[0] && y <= bands[1];
}
export function fillPeriodSelect(select, index, { withYears = false } = {}) {
  select.replaceChildren(...PERIODS.map(p => new Option(p.label, p.value)));
  if (withYears) { const group = document.createElement('optgroup'); group.label = 'Single cohort'; for (const y of index.years.filter(y => y >= 2000)) group.append(new Option(String(y), String(y))); select.append(group); }
}

const countBy = (rows, key) => { const out = {}; for (const r of rows) { const v = typeof key === 'function' ? key(r) : r[key]; if (v == null || v === '') continue; out[v] = (out[v] || 0) + 1; } return out; };
const ranked = obj => Object.entries(obj).sort((a, b) => b[1].n - a[1].n || a[0].localeCompare(b[0]));
const rangeOf = years => (years.length ? (years[0] === years[years.length - 1] ? String(years[0]) : `${years[0]}–${years[years.length - 1]}`) : '—');

/** People who earned their doctorate at `name`, with their research status and verified first jobs. */
export function institutionMetrics(index, name, period = 'all') {
  const sel = inPeriod(period, index.latest);
  const rows = index.people.filter(p => p.phdInstitution === name && sel(p.phdYear));
  const verified = rows.filter(p => p.placement);
  const statuses = countBy(rows, 'status');
  const cats = countBy(verified, p => p.placement.category);
  const byYear = {};
  for (const p of rows) {
    if (!p.phdYear) continue;
    const y = (byYear[p.phdYear] ||= { n: 0, verified: 0, unresolved: 0, pending: 0, tt: 0, academic: 0 });
    y.n++;
    if (p.placement) { y.verified++; if (p.placement.category === 'tenure-track') y.tt++; if (ACADEMIC.has(p.placement.category)) y.academic++; }
    else if (p.status === 'unresolved') y.unresolved++; else y.pending++;
  }
  const employers = {}, countries = {}, positions = {};
  for (const p of verified) {
    const e = (employers[p.placement.employer] ||= { n: 0, cats: {} }); e.n++; e.cats[p.placement.category] = (e.cats[p.placement.category] || 0) + 1;
    const c = index.employerCountry.get(p.placement.employer); if (c) countries[c] = (countries[c] || 0) + 1;
    const pos = p.placement.position || 'Role not reported'; positions[pos] = (positions[pos] || 0) + 1;
  }
  const years = Object.keys(byYear).map(Number).sort((a, b) => a - b);
  return {
    name, rows, verified, statuses, cats, byYear, years,
    total: rows.length, verifiedCount: verified.length,
    tt: cats['tenure-track'] || 0,
    academic: verified.filter(p => ACADEMIC.has(p.placement.category)).length,
    unresolved: statuses.unresolved || 0, pending: (statuses.pending || 0) + (statuses['not-yet-completed-phd'] || 0),
    perCohort: years.length ? rows.length / years.length : 0,
    range: rangeOf(years),
    employers: ranked(employers), countries: Object.entries(countries).sort((a, b) => b[1] - a[1]), positions: Object.entries(positions).sort((a, b) => b[1] - a[1])
  };
}

/** Verified first jobs at `name`, by the PhD cohort of the person hired. */
export function employerMetrics(index, name, period = 'all') {
  const sel = inPeriod(period, index.latest);
  const rows = index.people.filter(p => p.placement?.employer === name && sel(p.phdYear));
  const sources = {}, positions = {}, byYear = {};
  for (const p of rows) {
    const s = (sources[p.phdInstitution || 'PhD institution not reported'] ||= { n: 0, cats: {} }); s.n++; s.cats[p.placement.category] = (s.cats[p.placement.category] || 0) + 1;
    const pos = p.placement.position || 'Role not reported'; const q = (positions[pos] ||= { n: 0 }); q.n++;
    if (p.phdYear) { const y = (byYear[p.phdYear] ||= {}); y[p.placement.category] = (y[p.placement.category] || 0) + 1; }
  }
  const years = Object.keys(byYear).map(Number).sort((a, b) => a - b);
  return {
    name, rows, total: rows.length, years, range: rangeOf(years),
    cats: countBy(rows, p => p.placement.category),
    startYears: countBy(rows, p => p.placement.placementYear),
    sources: ranked(sources), positions: ranked(positions), byYear,
    country: index.employerCountry.get(name) || null,
    recent: [...rows].sort((a, b) => (b.phdYear || 0) - (a.phdYear || 0) || a.name.localeCompare(b.name))
  };
}

/** Load a JSON file once and remember it. */
const memo = new Map();
export function loadJson(url) {
  if (!memo.has(url)) memo.set(url, fetch(dataUrl(url)).then(r => { if (!r.ok) throw Error(`Could not load ${url}`); return r.json(); }).catch(e => { memo.delete(url); throw e; }));
  return memo.get(url);
}
/** Fill the country maps from the published location files, when they exist. */
export async function loadCountries(index) {
  for (const [url, map, key] of [['data/institution-locations.json', index.institutionCountry, 'institution'], ['data/employer-locations.json', index.employerCountry, 'employer']]) {
    try { const data = await loadJson(url); for (const r of data.records) if (r.country) map.set(r[key], r.country); } catch { /* optional file */ }
  }
  return index;
}
