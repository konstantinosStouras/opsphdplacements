// Reuse exact, already reviewed source assertions; never infer a new unit identity.
export function reconcileSourceUnit(observation, universityIds, universities, reviews) {
  const tuple = r => JSON.stringify([r.school || null, r.department || null]);
  if (!observation.school && !observation.department) return {state:'no-unit-assertion',note:'Institution-only discovery row; institutional identity and doctoral coverage remain separate checks.'};
  const matches=[];
  const exactSourceOwners=universities.filter(u=>universityIds.includes(u.id)&&(u.departments||[]).some(d=>d.id===observation.sourceRecordId));
  for (const id of new Set(universityIds)) {
    const university=universities.find(u=>u.id===id),review=reviews.find(r=>r.id===id);
    if (!university || !review?.canonicalName) continue;
    for (const department of university.departments || []) {
      if(exactSourceOwners.length&&department.id!==observation.sourceRecordId)continue;
      if (tuple(department)!==tuple(observation)) continue;
      const decision=review.decisions.find(d=>d.sourceDepartmentId===department.id);
      if (!decision) continue;
      const units=(decision.unitIds||[]).map(unitId=>review.units.find(u=>u.id===unitId));
      const evidenced=units.every(u=>u&&review.sources.some(s=>s.outcome==='read'&&s.url===u.sourceUrl&&s.checkedAt===u.checkedAt));
      matches.push({universityId:id,sourceDepartmentId:department.id,disposition:decision.disposition,unitIds:decision.unitIds,reason:decision.reason,reviewCheckedAt:review.checkedAt,unitEvidence:units.filter(Boolean).map(u=>({id:u.id,sourceUrl:u.sourceUrl,checkedAt:u.checkedAt})),evidenced});
    }
  }
  if (!matches.length) return {state:'pending-source-reconciliation',note:'No exact school/department assertion with an existing official review decision.'};
  const signatures=new Set(matches.map(m=>JSON.stringify([['replaced','duplicate'].includes(m.disposition)?'mapped-to-unit':m.disposition,[...(m.unitIds||[])].sort()])));
  if (signatures.size!==1) return {state:'conflicting-existing-decisions',priorDecisions:matches};
  if (matches.some(m=>m.disposition==='unresolved'||!m.evidenced)) return {state:'unresolved-existing-decision',priorDecisions:matches};
  return {state:'accounted-for-by-existing-decision',note:'Exact source school/department assertion already adjudicated; preserves prior evidence dates and does not reverify current provision.',priorDecisions:matches};
}
