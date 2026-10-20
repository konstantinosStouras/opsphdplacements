#!/usr/bin/env node
// Publishes data/faculty-roster-people.json, the second source of people in the database.
// It is built from the one-by-one reviews in data/faculty-rosters.json: a listed person enters
// when a reviewer confirmed them as academic staff on the university's own page (status
// confirmed-faculty) and the area or title shown names an operations field (operations, supply
// chain, logistics, management science, decision sciences, operations research, production,
// industrial or systems engineering). People matched to an OM List profile are not repeated here;
// they are already in data/faculty.json. Records use the same shape as data/faculty.json so the
// site, the research ledger and the placements merge treat both sources alike; `source` says
// where each record comes from. Regenerate after every roster merge:
//   node scripts/build-roster-people.mjs
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const read = f => JSON.parse(fs.readFileSync(path.join(root, f), 'utf8'));
const roster = read('data/faculty-rosters.json');
// Reviewed aliases (data/institution-aliases.json): a PhD institution written as an abbreviation, short form, spelling
// variant or school of a university that is already in the people database counts as that university; the written form
// is kept in phdInstitutionAsWritten. Only reviewed entries apply; every other name is kept as the page writes it.
const aliasFile = path.join(root, 'data/institution-aliases.json');
const aliases = fs.existsSync(aliasFile) ? read('data/institution-aliases.json').aliases : {};

// The operations rule, applied to the area and the title the profile shows (not to the directory row).
const OPERATIONS = /operation|supply|logistic|management science|decision scien|decision technolog|industrial|systems engineering|production|\bisye\b|\bise\b|\bom\b|\bscm\b|\bods\b|\bodt\b|\bitao\b|\bisom\b|\bOR\b/i;
const RULE = 'confirmed-faculty review whose areaConfirmed or titleConfirmed matches /operation|supply|logistic|management science|decision scien|decision technolog|industrial|systems engineering|production|\\bisye\\b|\\bise\\b|\\bom\\b|\\bscm\\b|\\bods\\b|\\bodt\\b|\\bitao\\b|\\bisom\\b|\\bOR\\b/i';
// A discipline label derived from the department name shown, for the explorer's filter only.
const discipline = text => (/industrial|systems engineering|\bisye\b|\bise\b/i.test(text) ? 'Industrial Engineering'
  : /supply|logistic|\bscm\b/i.test(text) ? 'Supply Chain Management'
  : /decision scien|management science|decision technolog|operations research|\bods\b|\bodt\b|\bOR\b/i.test(text) ? 'Decision Sciences'
  : 'Operations');

const records = [];
for (const r of roster.records) {
  const v = r.review;
  if (!v || v.status !== 'confirmed-faculty') continue;
  const shown = `${v.areaConfirmed || ''} | ${v.titleConfirmed || ''}`;
  if (!OPERATIONS.test(shown)) continue;
  // An honorary title is not an appointment, so the person is not counted as academic staff (decided 17 October 2026).
  if (/\bhonorary\b/i.test(v.titleConfirmed || '')) continue;
  const sources = (v.sources || []).map(s => s.url).filter(Boolean);
  records.push({
    id: r.id,
    name: r.name,
    source: 'faculty-page',
    discipline: discipline(shown),
    sourceDisciplineLabel: v.areaConfirmed || null,
    title: v.titleConfirmed || null,
    facultyStatus: /emerit|retired/i.test(v.titleConfirmed || '') ? 'retired' : 'active',
    phdYear: v.phdYear ?? null,
    phdInstitution: v.phdInstitution ? (aliases[v.phdInstitution]?.canonical || v.phdInstitution) : null,
    phdInstitutionAsWritten: v.phdInstitution && aliases[v.phdInstitution] ? v.phdInstitution : undefined,
    phdInstitutionSourceUrl: v.phdInstitution ? v.phdSourceUrl || null : null,
    currentInstitution: r.university,
    currentInstitutionSourceUrl: v.profileUrl || r.profileUrl || null,
    universityId: r.universityId,
    entityId: r.entityId || null,
    tenureYear: null,
    topicalTags: [],
    methodologicalTags: [],
    sourceProfileUrl: v.profileUrl || r.profileUrl || null,
    sourceUrl: r.facultyUrls?.[0] || v.profileUrl,
    additionalSourceUrls: sources,
    retrievedAt: v.checkedAt,
    firstPlacement: null,
    firstPlacementYear: null,
    verificationStatus: 'faculty-page-reviewed',
    phdCompletionStatus: v.phdInstitution ? 'stated-by-profile' : 'unknown',
    reviewReason: v.reason
  });
}
records.sort((a, b) => a.currentInstitution.localeCompare(b.currentInstitution) || a.name.localeCompare(b.name));

const count = (key, f) => records.reduce((m, r) => { const k = f(r); m[k] = (m[k] || 0) + 1; return m; }, {});
const metadata = {
  source: 'People listed on the faculty pages that the Operations Academia universities database links, confirmed one by one on their own university pages (data/faculty-rosters.json) and shown in an operations area',
  rule: RULE,
  derivedFrom: ['data/faculty-rosters.json'],
  rosterReviewsUpdatedAt: roster.metadata.reviewsUpdatedAt || null,
  generatedAt: new Date().toISOString().slice(0, 10),
  recordCount: records.length,
  withPhdInstitutionCount: records.filter(r => r.phdInstitution).length,
  withPhdYearCount: records.filter(r => r.phdYear != null).length,
  aliasedPhdInstitutionCount: records.filter(r => r.phdInstitutionAsWritten).length,
  disciplineCounts: count('discipline', r => r.discipline),
  statusCounts: count('facultyStatus', r => r.facultyStatus),
  universityCount: new Set(records.map(r => r.universityId)).size,
  limitations: [
    'A listing and a profile establish the appointment and the field shown on the retrieval date; a doctorate is what an opened page states, with that page as phdInstitutionSourceUrl, and is not an independently verified degree.',
    'The discipline label is derived from the department name shown (industrial or systems engineering; supply chain or logistics; decision sciences, management science or operations research; otherwise operations) and is not a source classification.',
    'People whose only title is honorary are left out, because an honorary title is not an appointment.',
    'Whole-college directories were reviewed in full; only the people whose own page shows an operations area or title are included here, so the file is not a census of operations faculty at these universities.',
    'No first job is known for anyone in this file until it is researched and published in data/placements.json through the research ledger.'
  ]
};
fs.writeFileSync(path.join(root, 'data/faculty-roster-people.json'), JSON.stringify({ version: 1, metadata, records }, null, 2) + '\n');
console.log(`faculty-roster-people: ${records.length} people at ${metadata.universityCount} universities (${metadata.withPhdInstitutionCount} with a stated doctorate, ${metadata.withPhdYearCount} with a year); disciplines ${JSON.stringify(metadata.disciplineCounts)}`);
