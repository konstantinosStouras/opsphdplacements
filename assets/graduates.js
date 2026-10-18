// Graduate lists by program and year (data/graduate-lists.json): the names the programs' own placement,
// alumni and graduate pages list, read live and from archived copies (Internet Archive, Common Crawl). A listing shows only that the page
// named the person under that year on that date; it is not a verified degree or first job, and no
// program-year is complete. Nothing here is inferred from where people work now.
import { tiles, fmt, html } from './charts.js';
import { loadJson } from './analytics.js';

const link = (text, href) => { const a = html('a', undefined, text); a.href = href; a.target = '_blank'; a.rel = 'noopener noreferrer'; return a; };
const FIELD = { operations: 'Operations', 'other-field': 'Another field', unstated: 'Area not stated' };
const MEANING = { graduation: 'graduation year', placement: 'placement year', 'job-market': 'job-market year', 'class-of': 'class year', unstated: 'year as listed, meaning not stated' };

export async function renderGraduates(section) {
  const summary = section.querySelector('#graduate-summary'), controls = section.querySelector('#graduate-controls'), note = section.querySelector('#graduate-note'), table = section.querySelector('#graduate-table');
  let data;
  try { data = await loadJson('data/graduate-lists.json'); }
  catch { note.textContent = 'The graduate lists have not been published yet.'; return; }
  const { metadata: m, records } = data;
  const inst = new Map();
  for (const r of records) { const s = inst.get(r.institution) || { all: 0, operations: 0, years: new Set() }; s.all++; if (r.field === 'operations') s.operations++; if (r.listedYear) s.years.add(r.listedYear); inst.set(r.institution, s); }
  const pages = new Set(records.flatMap(r => r.sightings.map(s => s.pageUrl)));
  const yearsSeen = records.filter(r => r.listedYear).map(r => r.listedYear);
  tiles(summary, [
    { value: fmt(m.records), label: 'Names listed, by institution and year', note: `${fmt(m.sightings)} listings across ${fmt(pages.size)} pages` },
    { value: fmt(m.byField.operations), label: 'Listed under an operations area', note: `${fmt(m.byField.unstated)} with no area stated, ${fmt(m.byField['other-field'])} in other areas of the same schools` },
    { value: fmt(m.institutions), label: 'Institutions with a list' },
    { value: fmt(m.linkedToPeople), label: 'Already in the people database', note: 'name and PhD institution both match' },
    { value: yearsSeen.length ? `${Math.min(...yearsSeen)}–${Math.max(...yearsSeen)}` : '—', label: 'Years covered by the pages read so far' },
  ]);
  note.textContent = `Updated ${m.updatedAt}. ${m.note}`;

  controls.replaceChildren();
  const instLabel = html('label', undefined, 'Institution'); const instSelect = document.createElement('select');
  instSelect.append(new Option('All institutions', ''));
  for (const [name, s] of [...inst.entries()].sort((a, b) => b[1].operations - a[1].operations || b[1].all - a[1].all)) instSelect.append(new Option(`${name} (${fmt(s.operations)} operations, ${fmt(s.all)} listed)`, name));
  instLabel.append(instSelect);
  const fieldLabel = html('label', undefined, 'Area'); const fieldSelect = document.createElement('select');
  for (const [v, t] of [['ops', 'Operations and area not stated'], ['operations', 'Operations only'], ['', 'All areas listed']]) fieldSelect.append(new Option(t, v));
  fieldLabel.append(fieldSelect);
  const search = html('label', 'search-label', 'Search'); const q = document.createElement('input'); q.type = 'search'; q.placeholder = 'Name, destination or area'; search.append(q);
  controls.append(instLabel, fieldLabel, search);

  const draw = () => {
    const words = q.value.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
    const rows = records.filter(r => (!instSelect.value || r.institution === instSelect.value) && (fieldSelect.value === '' || (fieldSelect.value === 'operations' ? r.field === 'operations' : r.field !== 'other-field')) && words.every(w => [r.name, r.institution, ...r.sightings.flatMap(s => [s.program, s.destination, s.position])].join(' ').toLocaleLowerCase().includes(w)));
    rows.sort((a, b) => (b.listedYear ?? 0) - (a.listedYear ?? 0) || a.institution.localeCompare(b.institution) || a.name.localeCompare(b.name));
    table.replaceChildren();
    const status = html('p', 'map-note', `${fmt(rows.length)} names${instSelect.value ? '' : ' across ' + fmt(new Set(rows.map(r => r.institution)).size) + ' institutions'}; years as the pages give them.`);
    const t = document.createElement('table'); const thead = document.createElement('thead'); const hr = document.createElement('tr');
    for (const h of ['Year', 'Name', 'Institution and area', 'Listed destination', 'Listed on']) hr.append(html('th', undefined, h));
    thead.append(hr); t.append(thead);
    const tbody = document.createElement('tbody');
    const PAGE = 120; let shown = 0;
    const addRows = () => { for (const r of rows.slice(shown, shown + PAGE)) {
      const tr = document.createElement('tr');
      const last = r.sightings[r.sightings.length - 1];
      const yearCell = html('td', undefined, r.listedYear ? String(r.listedYear) : '—'); if (r.listedYear) yearCell.append(html('small', undefined, MEANING[last.yearMeaning] || ''));
      const nameCell = html('td'); nameCell.append(html('strong', undefined, r.name));
      if (r.facultyId) { const a = html('a', undefined, 'in the people database'); a.href = `?q=${encodeURIComponent(r.name)}#explorer`; nameCell.append(html('small'), a); }
      const instCell = html('td'); instCell.append(r.institution, html('small', undefined, [last.program, FIELD[r.field]].filter(Boolean).join(' · ')));
      const destCell = html('td', undefined, [last.position, last.destination].filter(Boolean).join(', ') || '—'); if (last.degree) destCell.append(html('small', undefined, last.degree));
      const srcCell = html('td');
      for (const s of r.sightings) { const tag = s.archive === 'internet-archive' || s.sourceUrl.includes('web.archive.org') ? ' (Internet Archive)' : s.archive === 'commoncrawl' ? ' (Common Crawl)' : ''; srcCell.append(link(`${s.sourceDate}${tag}`, s.sourceUrl), ' '); }
      tr.append(yearCell, nameCell, instCell, destCell, srcCell); tbody.append(tr);
    } shown = Math.min(rows.length, shown + PAGE); more.hidden = shown >= rows.length; more.textContent = `Show more (${fmt(rows.length - shown)} left)`; };
    t.append(tbody);
    const more = html('button', 'text-button', ''); more.type = 'button'; more.addEventListener('click', addRows);
    table.append(status, t, more); addRows();
  };
  for (const c of [instSelect, fieldSelect]) c.addEventListener('change', draw);
  q.addEventListener('input', draw);
  draw();
}
