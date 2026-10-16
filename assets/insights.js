// Coverage grid, trends and profiles built from the public datasets. See analytics.js for the
// numbers and charts.js for the drawing. Nothing here infers a job: every chart counts verified
// first jobs and shows the unresolved and not-yet-reviewed people beside them.
import { bubbleGrid, fmt, pct, html } from './charts.js';
import { STATUS, buildIndex, loadCountries, institutionMetrics } from './analytics.js';

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
