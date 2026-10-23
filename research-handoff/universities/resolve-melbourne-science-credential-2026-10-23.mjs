import fs from 'node:fs';
import assert from 'node:assert/strict';
const file = new URL('../../data/doctoral-programs.json', import.meta.url);
const data = JSON.parse(fs.readFileSync(file, 'utf8'));
const record = data.records.find(row => row.id === 'university-of-melbourne--doctor-philosophy-science-operations-research');
assert(record && record.degree === 'Doctor of Philosophy - Science' && record.phdEligibility === 'credential-unresolved');
assert(record.sources.some(source => source.url === 'https://study.unimelb.edu.au/find/courses/graduate/doctor-of-philosophy-science/' && source.access === 'opened-and-read'));
record.priorReviewNotes = [...(record.priorReviewNotes || []), {
  checkedAt: '2026-10-23',
  evidenceNote: 'Credential classification correction: the exact official award Doctor of Philosophy - Science is a PhD. The previously unresolved flag came from a parser that omitted the Science suffix; the source and original degree text are preserved.',
  phdEligibility: 'credential-unresolved'
}];
record.phdEligibility = 'verified';
fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
