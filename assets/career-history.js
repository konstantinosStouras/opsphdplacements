import {isSourceUrl} from './model.js';

// Histories join only on reviewed stable identifiers, never on names.
export function historyIndex(records) {
  const index = new Map();
  for (const record of records) for (const id of new Set([record.id, ...(record.recordIds || [])])) {
    if (index.has(id)) throw Error(`Multiple career reviews for ${id}`);
    index.set(id, record);
  }
  return index;
}
export const jobText = j => `${j.observedPeriod?.asWritten ? 'Observed '+j.observedPeriod.asWritten+' (appointment boundaries unknown)' : `${j.start?.asWritten || 'Unknown start'} – ${j.end?.asWritten || 'Unknown end'}`}: ${j.employerAsWritten || 'Employer unknown'} — ${j.titleAsWritten || 'Role unknown'}`;

// A reviewed departure corrects the display without rewriting the source roster.
export function affiliationCorrection(history) {
  const a=history?.reviewedAffiliation;
  return a?.directoryStatus==='former' && a.label && (isSourceUrl(a.sourceUrl)||a.publicAffiliationReviewed===true) && /^\d{4}-\d{2}-\d{2}$/.test(a.checkedAt||'') ? a : null;
}

// Only reviewed primary-career intervals qualify. Never derive continuity from first/current jobs.
export function careerSummary(history) {
  if (!history) return 'Not yet researched';
  if (history.reviewStatus === 'blocked') return 'Source unavailable; employment history not verified';
  const periods = history.postPhdPeriods || [];
  if (!periods.length) return 'Insufficient dated evidence to calculate';
  return periods.map(p => {
    const end = p.currentThroughCheck ? p.checkedAt : String(p.endYear);
    const years = Number(end.slice(0, 4)) - p.startYear;
    return `Approximately ${years} years in ${p.sector} till ${end} (${p.startYear}–${end.slice(0, 4)})`;
  }).join('; ') + (history.summaryLimitations ? `. ${history.summaryLimitations}` : '');
}

export function validateCareerHistories(data, knownIds) {
  if (!Array.isArray(data?.records)) throw Error('Missing career history records');
  historyIndex(data.records);
  const date = d => /^\d{4}-\d{2}-\d{2}$/.test(d || '') && !Number.isNaN(Date.parse(d));
  for (const h of data.records) {
    if (!knownIds.has(h.id) || !h.name || !h.identityBasis || !date(h.checkedAt) || !Array.isArray(h.jobs) || !h.coverageNote) throw Error(`Invalid career review: ${h.id}`);
    for (const id of h.recordIds || []) if (!knownIds.has(id)) throw Error(`Unknown identity: ${id}`);
    for (const j of [...h.jobs, ...(h.otherEmploymentMentions || [])]) {
      if (!isSourceUrl(j.sourceUrl) || !date(j.checkedAt) || !j.evidenceNote) throw Error(`Missing role evidence: ${h.id}`);
    }
    for (const j of h.jobs) for (const key of ['start', 'end']) {
      const d = j[key];
      if (!d || !['year','month','unknown'].includes(d.precision) || (d.year != null && (!Number.isInteger(d.year) || d.year < 1900 || d.year > 2100)) || (d.month != null && (!Number.isInteger(d.month) || d.month < 1 || d.month > 12)) || (d.precision === 'month' && (d.year == null || d.month == null)) || (d.precision === 'year' && (d.year == null || d.month != null))) throw Error(`Invalid role date: ${h.id}`);
    }
    let previousEnd = -Infinity;
    for (const p of h.postPhdPeriods || []) {
      const end = p.currentThroughCheck ? Number(p.checkedAt?.slice(0,4)) : p.endYear;
      if (!isSourceUrl(h.degreeSourceUrl) || !['academia','industry','government','nonprofit','self-employment'].includes(p.sector) || !Number.isInteger(p.startYear) || !Number.isInteger(end) || end < p.startYear || end > Number(p.checkedAt?.slice(0,4)) || p.startYear < previousEnd || !date(p.checkedAt) || !p.evidenceNote || !p.sourceUrls?.length || !p.sourceUrls.every(isSourceUrl) || !Number.isInteger(h.verifiedPhdYear) || p.startYear < h.verifiedPhdYear) throw Error(`Invalid post-PhD interval: ${h.id}`);
      previousEnd = end;
    }
  }
  return data;
}
