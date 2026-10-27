import {fold} from './model.js';
// Graduate lists by program and year (data/graduate-lists.json): the names the programs' own placement,
// alumni and graduate pages list, read live and from archived copies (Internet Archive, Common Crawl). A listing shows only that the page
// named the person under that year on that date; it is not a verified degree or first job, and no
// program-year is complete. Nothing here is inferred from where people work now.
import { tiles, fmt, html } from './charts.js';
import { loadJson } from './analytics.js';
import {historyIndex, jobText} from './career-history.js';

const link = (text, href) => { const a = html('a', undefined, text); a.href = href; a.target = '_blank'; a.rel = 'noopener noreferrer'; return a; };
const FIELD = { operations: 'Operations', 'other-field': 'Another field', unstated: 'Area not stated' };
const MEANING = { thesis: 'thesis year', graduation: 'graduation year', placement: 'placement year', 'job-market': 'job-market year', 'class-of': 'class year', unstated: 'year as listed, meaning not stated' };

export async function renderGraduates(section) {
  const summary = section.querySelector('#graduate-summary'), controls = section.querySelector('#graduate-controls'), note = section.querySelector('#graduate-note'), table = section.querySelector('#graduate-table');
  let data;
  try { data = await loadJson('data/graduate-lists.json'); }
  catch { note.textContent = 'The graduate lists have not been published yet.'; return; }
  const { metadata: m, records } = data;
  let careers = new Map();
  try { careers = historyIndex((await loadJson('data/employment-histories.json')).records); } catch { /* Listings remain available if career evidence cannot load. */ }
  const inst = new Map();
  for (const r of records) { const s = inst.get(r.institution) || { all: 0, operations: 0, years: new Set() }; s.all++; if (r.field === 'operations') s.operations++; if (r.listedYear) s.years.add(r.listedYear); inst.set(r.institution, s); }
  const pages = new Set(records.flatMap(r => r.sightings.map(s => s.pageUrl)));
  const yearsSeen = records.filter(r => r.listedYear).map(r => r.listedYear);
  tiles(summary, [
    { value: fmt(m.records), label: 'Names listed, by institution and year', note: `${fmt(m.sightings)} listings across ${fmt(pages.size)} pages` },
    { value: fmt(m.byField.operations), label: 'Listed under an operations area', note: `${fmt(m.byField.unstated)} with no area stated, ${fmt(m.byField['other-field'])} in other areas of the same schools` },
    { value: fmt(m.institutions), label: 'Institutions with a list' },
    { value: fmt(m.linkedToPeople), label: 'Already in the people database', note: 'name and PhD institution both match' },
    { value: fmt(records.filter(r => !r.facultyId && r.firstJobReview?.status === 'verified').length), label: 'Verified first jobs in this graduate register', note: 'Additional to the faculty sample; source-bounded conclusions' },
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
    const words = fold(q.value).split(/\s+/).filter(Boolean);
    const rows = records.filter(r => (!instSelect.value || r.institution === instSelect.value) && (fieldSelect.value === '' || (fieldSelect.value === 'operations' ? r.field === 'operations' : r.field !== 'other-field')) && words.every(w => fold([r.name, r.institution, r.listedYear, FIELD[r.field], ...r.sightings.flatMap(s => [s.name, s.program, s.destination, s.position])].join(' ')).includes(w)));
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
      if (r.facultyId) { const a = html('a', undefined, 'in the people database'); a.href = `?q=${encodeURIComponent(r.facultyName || r.name)}#explorer`; nameCell.append(html('small'), a); }
      if (r.degreeReview) {
        const d = r.degreeReview, period = d.period;
        const monthLabel = period.month ? new Intl.DateTimeFormat('en', {month:'long', timeZone:'UTC'}).format(new Date(Date.UTC(period.year, period.month - 1, 1))) + ' ' : '';
        nameCell.append(html('small', undefined, `Official degree-recipient match: ${monthLabel}${period.year}. ${period.month ? 'Exact day unknown.' : 'Month and day unknown.'}`));
        nameCell.append(link(`Degree evidence · checked ${d.checkedAt}`, d.sourceUrl));
      }
      const career = careers.get(r.id);
      const identityObservations = r.sightings.filter(s => s.yearMeaning === 'career-observation');
      if (identityObservations.length) {
        const detail = document.createElement('details');
        detail.append(html('summary', undefined, 'Reviewed identity and career observations'));
        for (const s of identityObservations) {
          const p = html('p'); p.append(link(`${s.name} · checked ${s.checkedAt}`, s.sourceUrl), html('small', undefined, s.note)); detail.append(p);
        }
        detail.append(html('small', undefined, 'These observations do not establish a complete career or a first job.'));
        nameCell.append(detail);
      }
      if (r.degreeMilestones?.length) {
        const milestones = document.createElement('details');
        milestones.append(html('summary', undefined, 'Reported doctoral milestones'));
        for (const m of r.degreeMilestones) {
          const p = html('p'); p.append(link(m.displayText, m.sourceUrl), html('small', undefined, `${m.limitation} Source checked ${m.checkedAt}.`)); milestones.append(p);
        }
        nameCell.append(milestones);
      }
      if (career?.profileUrl && /^https:\/\/(?:www\.)?linkedin\.com\/in\//i.test(career.profileUrl)) {
        const profile = html('p'); profile.append(link('LinkedIn profile ↗', career.profileUrl)); nameCell.append(profile);
      }
      const firstJob = r.firstJobReview;
      if (firstJob?.status === 'verified') {
        nameCell.append(html('p', undefined, `Verified first employer: ${firstJob.employer} — ${firstJob.title || 'job title unknown'} (${firstJob.start.asWritten || 'start date unknown'}).`));
        const evidence = document.createElement('details'); evidence.append(html('summary',undefined,'First-job evidence and limitations'),html('p',undefined,firstJob.reason),html('p',undefined,firstJob.degreeBoundary));
        for (const s of firstJob.sources) evidence.append(link(`Source checked ${s.checkedAt}`,s.url),' ');
        for (const text of firstJob.limitations) evidence.append(html('small',undefined,text));
        nameCell.append(evidence);
      }
      if (career) {
        const detail = document.createElement('details');
        detail.append(html('summary', undefined, `Partial career history: ${career.jobs.length} recorded ${career.jobs.length === 1 ? 'role' : 'roles'}`));
        if (career.degreeEvidence?.studyRangeAsWritten) {
          const d = career.degreeEvidence, p = html('p');
          p.append(link(`${d.institutionAsWritten || 'Doctoral institution'} — ${d.degreeAsWritten || 'Doctoral study'}: ${d.studyRangeAsWritten}`, d.sourceUrl), html('small', undefined, `Self-reported study dates; not an independently verified conferral date. Checked ${d.checkedAt}.`));
          detail.append(p);
        }
        for (const j of career.jobs) { const p = html('p'); p.append(link(jobText(j), j.sourceUrl), html('small', undefined, `${j.evidenceNote} · Checked ${j.checkedAt}`)); detail.append(p); }
        for (const j of career.otherEmploymentMentions || []) { const p = html('p'); p.append(link([j.employerAsWritten,j.titleAsWritten].filter(Boolean).join(' — ') || 'Supporting source',j.sourceUrl),html('small',undefined,`${j.evidenceNote} · Checked ${j.checkedAt}`)); detail.append(p); }
        for (const j of career.nonEmploymentExperienceEntries || []) { const p = html('p'); p.append(link(`Nonemployment: ${j.titleAsWritten || j.type} (${j.start?.asWritten || 'unknown start'} – ${j.end?.asWritten || 'unknown end'})`,j.sourceUrl),html('small',undefined,`${j.evidenceNote} · Checked ${j.checkedAt}`)); detail.append(p); }
        detail.append(html('p',undefined,career.coverageNote),html('p',undefined,`${firstJob?.status === 'verified' ? 'The separate first-job review is shown above.' : 'First post-PhD job is not verified.'} This partial history includes roles before and during doctoral study.`));
        for (const text of career.remainingUnknowns || []) detail.append(html('small',undefined,text));
        nameCell.append(detail);
      }
      const instCell = html('td'); instCell.append(r.institution, html('small', undefined, [last.program, FIELD[r.field]].filter(Boolean).join(' · ')));
      const destCell = html('td', undefined, [last.position, last.destination].filter(Boolean).join(', ') || '—'); if (last.degree) destCell.append(html('small', undefined, last.degree));
      const srcCell = html('td');
      for (const s of r.sightings) { const tag = s.archive === 'internet-archive' || s.sourceUrl.includes('web.archive.org') ? ' (Internet Archive)' : s.archive === 'commoncrawl' ? ' (Common Crawl)' : ''; srcCell.append(link(`${s.sourceDate || 'Checked ' + s.checkedAt}${tag}`, s.sourceUrl), ' '); }
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
