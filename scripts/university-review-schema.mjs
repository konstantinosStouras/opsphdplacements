import assert from 'node:assert/strict';

const text = v => typeof v === 'string' && v.trim().length > 0;
const date = v => /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v;
const url = v => {
  try { const u = new URL(v); return ['https:', 'http:'].includes(u.protocol) && !u.username && !u.password; } catch { return false; }
};
const fields = new Set(['operations-management', 'operations-research', 'industrial-engineering', 'supply-chain', 'logistics']);
const types = new Set(['department', 'school', 'division', 'group', 'area', 'center', 'institute', 'pillar', 'cluster', 'chair', 'laboratory']);
const dispositions = new Set(['replaced', 'duplicate', 'out-of-scope', 'not-a-unit', 'unresolved']);

export function validateUniversityReviews(records, originals) {
  assert(Array.isArray(records), 'records must be an array');
  const imported = new Map(originals.map(r => [r.id, r])), ids = new Set();
  for (const r of records) {
    const fail = message => `${r.id || '(missing id)'}: ${message}`;
    assert(imported.has(r.id) && !ids.has(r.id), fail('unknown or duplicate university ID')); ids.add(r.id);
    assert(['reviewed', 'partial', 'blocked'].includes(r.status), fail('invalid review status'));
    assert(date(r.checkedAt) && text(r.reviewer), fail('check date and reviewer required'));
    assert(Array.isArray(r.sources) && r.sources.length, fail('source attempts required'));
    for (const s of r.sources) assert(url(s.url) && date(s.checkedAt) && ['read', 'blocked'].includes(s.outcome) && text(s.note), fail('invalid source'));
    const supported = (u, d) => r.sources.some(s => s.url === u && s.checkedAt === d && s.outcome === 'read');
    assert(r.canonicalName === null || text(r.canonicalName), fail('canonical name must be text or null'));
    if (r.canonicalName) assert(url(r.universitySourceUrl) && supported(r.universitySourceUrl, r.checkedAt), fail('university name needs opened evidence'));
    else assert(r.universitySourceUrl === null, fail('unverified name cannot have verification URL'));
    if (r.organisationAliases !== undefined) {
      assert(r.canonicalName && Array.isArray(r.organisationAliases), fail('organisation aliases need a verified parent identity'));
      const aliases = new Set();
      for (const a of r.organisationAliases) {
        assert(text(a.name) && text(a.evidence) && date(a.checkedAt) && supported(a.sourceUrl, a.checkedAt), fail('organisation alias requires dated opened relationship evidence'));
        const key = a.name.normalize('NFKC').toLocaleLowerCase();
        assert(!aliases.has(key), fail('duplicate organisation alias')); aliases.add(key);
      }
    }
    assert(Array.isArray(r.units) && Array.isArray(r.decisions) && Array.isArray(r.limitations), fail('units, decisions and limitations required'));
    assert(r.limitations.every(text), fail('empty limitation'));
    if(r.doctoralReview){
      const d=r.doctoralReview;
      assert(['verified','partial','no-qualifying-programme-verified'].includes(d.status)&&date(d.checkedAt),fail('invalid doctoral review status/date'));
      assert(Array.isArray(d.programmeIds)&&d.programmeIds.every(text)&&new Set(d.programmeIds).size===d.programmeIds.length,fail('invalid doctoral programme links'));
      assert(Array.isArray(d.sources)&&d.sources.length&&d.sources.every(s=>url(s.url)&&date(s.checkedAt)&&['read','blocked'].includes(s.outcome)&&text(s.note)),fail('doctoral review requires dated source observations'));
      assert(Array.isArray(d.branches)&&d.branches.every(b=>['business','engineering','mathematics','other'].includes(b.branch)&&text(b.conclusion)&&Array.isArray(b.sourceUrls)&&b.sourceUrls.every(u=>d.sources.some(s=>s.url===u))),fail('invalid doctoral branch scope'));
      assert(Array.isArray(d.limitations)&&d.limitations.every(text)&&typeof d.coverageComplete==='boolean',fail('doctoral limitations/coverage state required'));
      if(d.status==='verified')assert(d.programmeIds.length,fail('doctoral verification needs programme evidence'));
      if(d.coverageComplete)assert(['business','engineering'].every(branch=>d.branches.some(b=>b.branch===branch&&['checked','not-present'].includes(b.reviewState))),fail('complete doctoral coverage needs both branch inventories'));
    }
    if (r.directoryExclusion !== undefined) {
      const e = r.directoryExclusion;
      assert(e && text(e.reason) && date(e.checkedAt) && supported(e.sourceUrl, e.checkedAt), fail('directory exclusion requires opened evidence and reason'));
      assert(r.status === 'reviewed' && r.canonicalName && r.units.length === 0 && r.duplicateOf === null, fail('directory exclusion requires reviewed identity, no university units and no alias target'));
    }
    const unitIds = new Set(), unitNames = new Set();
    for (const u of r.units) {
      assert(text(u.id) && !unitIds.has(u.id), fail('duplicate unit ID')); unitIds.add(u.id);
      assert(text(u.name) && (u.school === null || text(u.school)) && types.has(u.type), fail('unit name, parent and type required'));
      assert(!/^[A-Z]{1,5}(?:[\/&+, -]+[A-Z]{1,5})*$/.test(u.name), fail('acronym-only unit name; official full name required'));
      const key = [u.name, u.school, u.type].join('|').normalize('NFKC').toLocaleLowerCase();
      assert(!unitNames.has(key), fail('duplicate canonical unit')); unitNames.add(key);
      assert(Array.isArray(u.fields) && u.fields.length && u.fields.every(f => fields.has(f)), fail('unit requires operations scope'));
      assert(date(u.checkedAt) && supported(u.sourceUrl, u.checkedAt) && text(u.evidence), fail('unit requires read source and evidence'));
    }
    const originalIds = new Set(imported.get(r.id).departments.map(d => d.id)), decided = new Set();
    for (const d of r.decisions) {
      assert(originalIds.has(d.sourceDepartmentId) && !decided.has(d.sourceDepartmentId), fail('unknown or duplicate source-department decision'));
      decided.add(d.sourceDepartmentId);
      assert(dispositions.has(d.disposition) && text(d.reason) && Array.isArray(d.unitIds), fail('invalid label decision'));
      assert(d.unitIds.every(id => unitIds.has(id)), fail('decision references unknown canonical unit'));
      if (['replaced', 'duplicate'].includes(d.disposition)) assert(d.unitIds.length, fail('replacement/duplicate must identify unit'));
      if (d.disposition === 'unresolved') assert(r.limitations.length, fail('unresolved label needs limitation'));
    }
    if (r.status === 'reviewed') {
      assert(r.canonicalName && decided.size === originalIds.size, fail('reviewed requires verified identity and every imported label decision'));
    } else assert(r.limitations.length, fail('incomplete review needs limitations'));
    if (r.status === 'blocked') assert(!r.canonicalName && r.units.length === 0, fail('blocked means no verified evidence; use partial otherwise'));
    assert(r.duplicateOf === null || (imported.has(r.duplicateOf) && r.duplicateOf !== r.id && r.canonicalName), fail('invalid university duplicate target'));
  }
  const byId = new Map(records.map(r => [r.id, r]));
  for (const r of records) {
    let next = r; const seen = new Set();
    while (next?.duplicateOf) {
      assert(!seen.has(next.id), `${r.id}: duplicate cycle`); seen.add(next.id);
      next = byId.get(next.duplicateOf);
    }
  }
  return records;
}
