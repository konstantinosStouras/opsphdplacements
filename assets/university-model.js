import {hasNamedOperationsScope} from './program-model.js';
// Reviewed observations overlay the immutable directory import; no fuzzy identity merges.
export const universityOrder = (a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }) || a.id.localeCompare(b.id);
export const universityUnitTypeLabel = unit => unit.temporalStatus === 'historical' ? `Historical ${unit.type}` : unit.type;

export function universityRows(imported, observations = []) {
  const byId = new Map(imported.map(r => [r.id, r]));
  const reviews = new Map(observations.map(r => [r.id, r]));
  const targetFor = id => {
    const seen = new Set();
    while (reviews.get(id)?.duplicateOf && !seen.has(id)) {
      seen.add(id);
      const target = reviews.get(id).duplicateOf;
      if (!byId.has(target) || !reviews.get(target)?.canonicalName) break;
      id = target;
    }
    return id;
  };
  const groups = new Map();
  for (const source of imported) {
    const target = targetFor(source.id);
    if (reviews.get(source.id)?.directoryExclusion || reviews.get(target)?.directoryExclusion) continue;
    if (!groups.has(target)) groups.set(target, []);
    groups.get(target).push(source);
  }
  return [...groups].map(([id, originals]) => {
    const base = byId.get(id), review = reviews.get(id);
    const checked = originals.map(r => reviews.get(r.id)).filter(Boolean);
    // Same official unit can be listed by multiple imported aliases. Preserve all evidence.
    const unitMap = new Map();
    for (const observation of checked) for (const unit of observation.units) {
      const key = [unit.name, unit.school || '', unit.type, unit.temporalStatus || ''].join('|').normalize('NFKC').toLocaleLowerCase();
      if (!unitMap.has(key)) unitMap.set(key, { ...unit, evidenceSources: [] });
      const u = unitMap.get(key);
      if (!u.evidenceSources.some(s => s.sourceUrl === unit.sourceUrl && s.checkedAt === unit.checkedAt)) u.evidenceSources.push(unit);
    }
    const units = [...unitMap.values()].filter(u=>hasNamedOperationsScope(u.name)).sort((a, b) => a.name.localeCompare(b.name, 'en'));
    const statuses = originals.map(r => reviews.get(r.id)?.status || 'pending');
    const reviewStatus = statuses.every(s => s === 'reviewed') ? 'reviewed'
      : statuses.every(s => s === 'pending') ? 'pending'
      : statuses.every(s => s === 'blocked') ? 'blocked' : 'partial';
    return {
      ...base, name: review?.canonicalName || base.name,
      originals, reviews: checked, units, reviewStatus,
      universitySourceUrl: review?.universitySourceUrl || null,
      nameCheckedAt: review?.canonicalName ? review.checkedAt : null,
      reviewUpdatedAt: checked.map(r => r.updatedAt).filter(Boolean).sort().at(-1) || null,
      limitations: [...new Set(checked.flatMap(r => r.limitations))],
      peopleDatabases: [...new Map(originals.filter(r => r.peopleDatabase).map(r => [r.peopleDatabase.institutionId, r.peopleDatabase])).values()],
      searchText: [review?.canonicalName, ...originals.flatMap(r => [r.name, ...(r.spellings || []), ...r.departments.flatMap(d => [d.school, d.department].filter(hasNamedOperationsScope))]), ...units.flatMap(u => [u.name])].filter(Boolean).join(' ').toLocaleLowerCase()
    };
  }).sort(universityOrder);
}
