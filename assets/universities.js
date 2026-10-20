// The first database on the page: universities, schools and departments that do Operations, from the
// Operations Academia directory (data/universities.json), with the link to the people database shown
// where it exists. Nothing is inferred: a university without a link simply has no one in the people
// database under a name that could be matched.
import { hbars, tiles, fmt, pct, html } from './charts.js';
import { loadJson } from './analytics.js';
import { entityCounts } from './insights.js';

const PAGE = 50;
const link = (text, href) => { const a = html('a', undefined, text); a.href = href; a.target = '_blank'; a.rel = 'noopener noreferrer'; return a; };

export async function renderUniversities(section, { openInstitution } = {}) {
  const summary = section.querySelector('#university-summary'), controls = section.querySelector('#university-controls'), chart = section.querySelector('#university-chart');
  const body = section.querySelector('#university-records'), count = section.querySelector('#university-results'), more = section.querySelector('#university-more'), note = section.querySelector('#university-note');
  let data;
  try { data = await loadJson('data/universities.json'); }
  catch { note.textContent = 'The universities database could not be loaded. Please reload and try again.'; return; }
  const { metadata: m, records } = data;
  const countryOf = r => (Array.isArray(r.country) ? r.country.join(', ') : r.country || '');
  const countries = [...new Set(records.flatMap(r => (Array.isArray(r.country) ? r.country : r.country ? [r.country] : [])))].sort((a, b) => a.localeCompare(b));
  note.textContent = `Imported from the Operations Academia directory on ${m.retrievedAt}: ${fmt(m.universityCount)} universities, ${fmt(m.departmentCount)} school or department rows, ${fmt(m.countries)} countries (${fmt(records.filter(r => !r.country).length)} universities have no country in the directory; directory spellings that differ only in accents or punctuation are one university). A listing records an operations department, not a doctoral program; doctoral provision is recorded in the program register below. ${fmt(m.linkedToPeopleDatabase.universities)} universities are linked to a PhD institution in the people database (${fmt(m.linkedToPeopleDatabase.exact)} by identical name, ${fmt(m.linkedToPeopleDatabase.wikidata)} by a shared Wikidata item, ${fmt(m.linkedToPeopleDatabase.campusQualifier)} by a campus qualifier); the other ${fmt(m.universityCount - m.linkedToPeopleDatabase.universities)} have no match yet, which usually means no one in the people database earned a doctorate there under that name. Corrections made on the Operations Academia site after this snapshot are not included.`;
  // Several directory entries can link to one PhD institution (a university and its statistics department, say), so count each institution once.
  const linkedPeople = [...new Map(records.filter(r => r.peopleDatabase).map(r => [r.peopleDatabase.institutionId, r.peopleDatabase.people])).values()].reduce((n, v) => n + v, 0);
  const tileBox = html('div', 'tiles');
  const tileRows = [
    { value: fmt(m.universityCount), label: 'Universities with operations departments' },
    { value: fmt(m.departmentCount), label: 'Schools and departments listed' },
    { value: fmt(m.countries), label: 'Countries' },
    { value: fmt(m.linkedToPeopleDatabase.universities), label: 'Linked to the people database', note: `${fmt(linkedPeople)} people earned their doctorate at a linked university` },
    { value: `${fmt(m.linkedToPeopleDatabase.peopleDatabaseInstitutionsCovered)} of ${fmt(m.linkedToPeopleDatabase.peopleDatabaseInstitutionsTotal)}`, label: 'PhD institutions in the people database that appear in the directory' }
  ];
  tiles(tileBox, tileRows);
  summary.replaceChildren(tileBox);
  // The merged organisation database (data/entities.json) is larger, so its counts arrive after the table.
  entityCounts().then(c => {
    tiles(tileBox, [...tileRows, { value: fmt(c.entities), label: 'Organisations in the merged database', note: `${fmt(c.withWikidata)} keyed by a Wikidata item` }, { value: fmt(c.inBothDatabases), label: 'In both databases', note: `${fmt(c.conflicts)} ${c.conflicts === 1 ? 'conflict' : 'conflicts'} to review` }]);
    const p = html('p', 'map-note');
    p.append(`Both databases and the program register are merged into one record per organisation: ${fmt(c.entities)} organisations (${fmt(c.phdInstitutions)} PhD institutions, ${fmt(c.directoryUniversities)} directory universities, ${fmt(c.firstEmployers)} first employers), keyed by Wikidata item where known, with every name from either source kept as an alias. Each PhD institution and first-employer profile shows what the other database holds for the same organisation.`);
    summary.append(p);
  }).catch(() => {});

  // Controls: search, country, link status.
  controls.replaceChildren();
  const search = html('label', 'search-label', 'Search'); const q = document.createElement('input'); q.type = 'search'; q.placeholder = 'University, school, department or country'; search.append(q);
  const countryLabel = html('label', undefined, 'Country'); const countrySelect = document.createElement('select'); countrySelect.append(new Option('All countries', '')); for (const c of countries) countrySelect.append(new Option(c, c)); countrySelect.append(new Option('No country in the directory', '__none')); countryLabel.append(countrySelect);
  const linkLabel = html('label', undefined, 'People database'); const linkSelect = document.createElement('select'); for (const [v, t] of [['', 'All universities'], ['linked', 'Linked to a PhD institution'], ['unlinked', 'Not linked']]) linkSelect.append(new Option(t, v)); linkLabel.append(linkSelect);
  controls.append(search, countryLabel, linkLabel);
  // Faculty rosters (data/faculty-rosters.json): who the directory's faculty pages list, matched to OM List.
  // The file loads after the table so it never delays it; rows already drawn get their line when it arrives.
  let rosterByUniversity = null;
  const rosterLine = (cell, uid) => {
    const s = rosterByUniversity?.get(uid); if (!s) return;
    cell.append(html('small', 'roster-line', `Faculty page lists ${fmt(s.listed)} ${s.listed === 1 ? 'person' : 'people'}: ${fmt(s.omList)} on OM List${s.reviewed ? `, ${fmt(s.reviewed)} reviewed (${fmt(s.confirmed || 0)} confirmed faculty)` : `, ${fmt(s.unverified)} unverified`}`));
  };
  const rosterBox = html('div', 'tiles'); summary.append(rosterBox);
  loadJson('data/faculty-rosters.json').then(roster => {
    rosterByUniversity = new Map(roster.universities.map(u => [u.universityId, { ...u, confirmed: 0 }]));
    for (const r of roster.records) if (r.review?.status === 'confirmed-faculty') { const s = rosterByUniversity.get(r.universityId); if (s) s.confirmed++; }
    const c = roster.metadata.counts, pg = roster.metadata.pages, o = c.reviewOutcomes || {};
    tiles(rosterBox, [
      { value: fmt(c.people), label: 'People listed on the faculty pages linked from the directory', note: `${fmt(pg.withPeople)} of ${fmt(pg.total)} linked pages could be read` },
      { value: fmt(c.omList), label: 'Also on OM List at the same university', note: `${fmt(c.omListNameOnly)} more share a name with an OM List profile elsewhere` },
      { value: fmt(c.reviewed), label: `Reviewed one by one: ${fmt(o['confirmed-faculty'] || 0)} confirmed faculty, ${fmt(o['not-listed'] || 0)} students, staff or former members, ${fmt(o['extraction-noise'] || 0)} extraction noise, ${fmt(o.unresolved || 0)} unresolved`, note: `${fmt(c.people - c.reviewed)} not reviewed: OM List matches, or listed as students, staff or postdocs` }
    ]);
    for (const tr of body.querySelectorAll('tr[data-uid]')) rosterLine(tr.children[2], tr.dataset.uid);
    const p = html('p', 'map-note');
    p.append(`The faculty pages that the directory links were read on ${roster.metadata.generatedAt}: ${fmt(pg.fetched)} of ${fmt(pg.total)} pages answered and ${fmt(pg.withPeople)} listed people that could be extracted (the rest are dead links, pages that refuse automated readers or lists drawn by scripts). A listing establishes only that the page shows the name under that title. OM List matches provide a cross-check of names and universities, not independent verification of every fact; other listed people were reviewed one by one: a reviewer opened each person's own page and recorded the outcome, the title and area shown and, only when a page states it, the doctorate with that page's URL; no first job is assumed or recorded for them yet.`);
    summary.append(p);
  }).catch(() => {});
  let shown = 0, rows = [];
  const filter = () => {
    const words = q.value.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean), c = countrySelect.value, l = linkSelect.value;
    rows = records.filter(r => {
      if (c === '__none' ? r.country : c && countryOf(r) !== c && !(Array.isArray(r.country) && r.country.includes(c))) return false;
      if (l === 'linked' && !r.peopleDatabase) return false; if (l === 'unlinked' && r.peopleDatabase) return false;
      if (!words.length) return true;
      const hay = [r.name, countryOf(r), ...r.departments.flatMap(d => [d.school, d.department, d.type])].join(' ').toLocaleLowerCase();
      return words.every(w => hay.includes(w));
    }).sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }) || a.id.localeCompare(b.id));
    shown = 0; body.replaceChildren(); draw();
  };
  const draw = () => {
    const slice = rows.slice(shown, shown + PAGE);
    for (const r of slice) {
      const tr = html('tr'), uni = html('td'), depts = html('td'), people = html('td'), sources = html('td');
      uni.append(html('strong', undefined, r.name), html('small', undefined, countryOf(r) || 'Country not in the directory'));
      const list = html('ul', 'dept-list');
      for (const d of r.departments) { const li = html('li'); li.append(html('span', undefined, [d.school, d.department].filter(Boolean).join(' · ') || 'Department not named')); if (d.type) li.append(html('small', undefined, d.type)); list.append(li); }
      depts.append(list);
      if (r.peopleDatabase) {
        const pd = r.peopleDatabase; const b = html('button', 'text-button', pd.phdInstitution); b.type = 'button'; b.addEventListener('click', () => openInstitution?.(pd.phdInstitution));
        people.append(b, html('small', undefined, `${fmt(pd.people)} people · ${fmt(pd.verifiedFirstJobs)} verified first jobs (${pct(pd.verifiedFirstJobs, pd.people)})`), html('span', 'badge', `Match: ${pd.match.replace('-', ' ')}`));
      } else people.append(html('span', undefined, 'No link yet'), html('small', undefined, 'No PhD institution in the people database matched this name.'));
      tr.dataset.uid = r.id; rosterLine(people, r.id);
      const faculty = r.sources.filter(s => s.title.startsWith('Faculty page'));
      sources.append(link('Operations Academia directory ↗', 'https://www.operationsacademia.org/universities'), html('small', undefined, `${r.departmentCount} directory ${r.departmentCount === 1 ? 'row' : 'rows'} · tags: ${r.directorySources.join(', ') || 'none'}`));
      for (const f of faculty) sources.append(link('Faculty page ↗', f.url), html('br'));
      if (r.wikidata) sources.append(link(`Wikidata ${r.wikidata} ↗`, `https://www.wikidata.org/wiki/${r.wikidata}`));
      if (r.addedAt) sources.append(html('small', undefined, `Added ${r.addedAt.slice(0, 16).replace('T', ' ')} UTC` + (r.updatedAt && r.updatedAt !== r.addedAt ? ` · updated ${r.updatedAt.slice(0, 16).replace('T', ' ')} UTC` : '')));
      tr.append(uni, depts, people, sources); body.append(tr);
    }
    shown += slice.length;
    count.textContent = `${fmt(Math.min(shown, rows.length))} of ${fmt(rows.length)} universities shown`;
    more.hidden = shown >= rows.length;
  };
  q.addEventListener('input', filter); countrySelect.addEventListener('change', filter); linkSelect.addEventListener('change', filter);
  more.addEventListener('click', draw);
  filter();

  // Chart: universities by country, with the linked share.
  const byCountry = {};
  for (const r of records) for (const c of (Array.isArray(r.country) ? r.country : r.country ? [r.country] : ['Country not in the directory'])) { const g = (byCountry[c] ||= { n: 0, linked: 0 }); g.n++; if (r.peopleDatabase) g.linked++; }
  const items = Object.entries(byCountry).sort((a, b) => b[1].n - a[1].n).slice(0, 15).map(([c, g]) => ({ key: c, label: c, value: g.n, segments: [{ id: 'linked', name: 'Linked to the people database', color: '#1f8a5a', value: g.linked }, { id: 'unlinked', name: 'Not linked', color: '#b8c2bb', value: g.n - g.linked }] }));
  chart.replaceChildren();
  const legend = html('div', 'chart-legend'); for (const [c, t] of [['#1f8a5a', 'Linked to a PhD institution in the people database'], ['#b8c2bb', 'Not linked']]) { const i = html('span', 'chart-legend-item'); const dot = html('span', 'chart-legend-dot'); dot.style.background = c; i.append(dot, html('span', undefined, t)); legend.append(i); }
  const box = html('div'); chart.append(html('h3', undefined, 'Universities by country'), legend, box);
  hbars(box, { items, label: 'Universities with operations departments by country', onClick: it => { countrySelect.value = byCountry[it.key] && it.key !== 'Country not in the directory' ? it.key : '__none'; filter(); section.querySelector('#university-records').scrollIntoView({ block: 'nearest' }); }, tipLines: it => [{ text: it.label, strong: true }, `${fmt(it.value)} universities`, { text: `Linked to the people database: ${fmt(it.segments[0].value)}`, color: '#1f8a5a' }], tableHead: ['Country', 'Universities', 'Linked', 'Not linked'], tableRows: items.map(it => [it.label, it.value, it.segments[0].value, it.segments[1].value]) });
}
