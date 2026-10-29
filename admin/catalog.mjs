// Source extraction only: presence of a URL is not a new verification decision.
export function sourceLabel(raw) {
  const url = new URL(raw);
  if (/(^|\.)linkedin\.com$/i.test(url.hostname)) return 'LinkedIn';
  if (/^scholar\.google\.[a-z.]+$/i.test(url.hostname)) return 'Google Scholar';
  if (/(^|\.)orcid\.org$/i.test(url.hostname)) return 'ORCID';
  if (url.pathname.toLowerCase().endsWith('.pdf')) return 'PDF / CV';
  return url.hostname.replace(/^www\./, '');
}

export function collectSources(value, prefix = '') {
  const found = new Map();
  function walk(node, path, inheritedDate = null) {
    if (!node || typeof node !== 'object') return;
    const date = node.checkedAt || node.lastCheckedAt || node.reviewedAt || node.retrievedAt || node.extractedAt || inheritedDate;
    for (const [key, item] of Object.entries(node)) {
      const field = path ? `${path}.${key}` : key;
      if (typeof item === 'string' && /(?:url|urls|website|profile)$/i.test(key)) add(item, field, date);
      else if (Array.isArray(item) && /urls$/i.test(key)) item.forEach((url, i) => add(url, `${field}[${i}]`, date));
      if (item && typeof item === 'object') walk(item, field, date);
    }
  }
  function add(raw, field, checkedAt) {
    try {
      const url = new URL(raw);
      if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) return;
      const entry = found.get(url.href) || {url: url.href, label: sourceLabel(url.href), observations: []};
      entry.observations.push({field, checkedAt});
      found.set(url.href, entry);
    } catch { /* Unknown/malformed links remain in the original record. */ }
  }
  walk(value, prefix);
  return [...found.values()];
}

export function buildCatalog(datasets) {
  const read = name => datasets[name]?.records || [];
  const histories = [...read('employment-histories'), ...read('linkedin-histories')];
  const historyByPerson = new Map();
  for (const history of histories) for (const id of new Set([history.id, ...(history.recordIds || [])])) {
    if (!historyByPerson.has(id)) historyByPerson.set(id, []);
    historyByPerson.get(id).push(history);
  }
  const placements = new Map(read('placements').map(row => [row.facultyId, row]));
  const progress = new Map(read('research-status').map(row => [row.facultyId, row]));
  const row = (record, evidence, institution, year) => ({
    id: record.id, name: record.name || record.canonicalName || record.programName || record.id,
    institution: institution || '', year: year ?? null,
    status: evidence.review?.status || record.reviewStatus || record.verificationStatus || record.status || 'Not assessed',
    sources: collectSources(evidence),
  });
  const people = [...read('faculty'), ...read('faculty-roster-people')].map(person => row(person, {
    person, firstJob: placements.get(person.id) || null, review: progress.get(person.id) || null,
    histories: historyByPerson.get(person.id) || [],
  }, person.currentInstitution, person.phdYear));
  const universities = new Map(read('universities').map(record => [record.id, record]));
  const reviews = new Map(read('university-reviews').map(record => [record.id, record]));
  const programs = new Map(read('doctoral-programs').map(record => [record.id, record]));
  const organisations = read('entities').map(entity => {
    const ids = (entity.directory?.universities || []).map(item => item.id);
    const programIds = (Array.isArray(entity.programs) ? entity.programs : entity.programs?.programs || []).map(item => item.id);
    return row(entity, {entity, universities: ids.map(id => universities.get(id)).filter(Boolean),
      reviews: ids.map(id => reviews.get(id)).filter(Boolean),
      programs: programIds.map(id => programs.get(id)).filter(Boolean)}, entity.country);
  });
  const graduates = read('graduate-lists').map(graduate => row(graduate, {
    graduate, histories: historyByPerson.get(graduate.id) || [],
    facultyLink: graduate.facultyId ? {id: graduate.facultyId, review: progress.get(graduate.facultyId) || null,
      firstJob: placements.get(graduate.facultyId) || null, histories: historyByPerson.get(graduate.facultyId) || []} : null,
  }, graduate.institution, graduate.listedYear));
  return {version: 1, generatedAt: new Date().toISOString(),
    note: 'Existing recorded sources only; links do not independently verify every row field. Unmerged proposals excluded.',
    tables: {people, organisations, graduates}};
}
