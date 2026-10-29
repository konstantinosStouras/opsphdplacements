// Publication projection. Full research evidence stays in the authoritative inputs.
export const PUBLIC_DATA = ['faculty','faculty-roster-people','placements','research-status',
  'employment-histories','linkedin-histories','entities','universities','university-reviews',
  'doctoral-programs','graduate-lists','institution-locations','employer-locations',
  'university-locations','institutions','employers','institution-aliases'];

const privateArrays = new Set(['sources','sourceUrls','additionalSourceUrls','evidenceSources']);
const privateText = /^(?:.*(?:source|evidence|profile|page|archive|download|canonical)Url|url|website|reviewer|identityBasis|evidenceNote|evidence|notes?|reviewReason|reason|coverageNote|previousCoverageNotes|accessLimitations|remainingUnknowns|limitations|summaryLimitations|scopeRationale|eligibilityScope|phdYearResolution|phdInstitutionResolution|archive|sourceType|access)$/i;
const webAddress = /https?:\/\/[^\s<>"'\])]+/gi;

export function projectPublicData(data, name = '') {
  function project(value) {
    if (typeof value === 'string') return value.replace(webAddress, '[reference withheld]');
    if (Array.isArray(value)) return value.map(project);
    if (!value || typeof value !== 'object') return value;
    const out = {};
    for (const [key,item] of Object.entries(value)) {
      if (privateArrays.has(key)) {out[key] = []; continue;}
      if (key === 'source') {out[key] = null; continue;}
      if (key === 'researchDoctorateEvidence') {out[key] = !!item; continue;}
      if (privateText.test(key)) {
        out[key] = Array.isArray(item) ? [] : null;
        continue;
      }
      out[key] = project(item);
    }
    // Keep reviewed semantic decisions without requiring a private URL in the browser.
    if (value.universitySourceUrl) out.officialIdentityReviewed = true;
    if (value.directoryStatus === 'former' && value.sourceUrl) out.publicAffiliationReviewed = true;
    return out;
  }
  const result = project(data);
  result.metadata ||= {};
  result.metadata.publicProjection = true;
  result.metadata.verificationAccess = 'admin-only';
  if (name === 'graduate-lists') result.metadata.sourcePageCount = new Set(data.records.flatMap(row => row.sightings.map(s => s.pageUrl))).size;
  return result;
}
