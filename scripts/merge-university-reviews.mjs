import fs from 'node:fs';
import {writeComplete} from './write-complete.mjs';
import { validateUniversityReviews } from './university-review-schema.mjs';
const path = 'data/university-reviews.json';
const original = JSON.parse(fs.readFileSync('data/universities.json', 'utf8'));
const data = fs.existsSync(path) ? JSON.parse(fs.readFileSync(path, 'utf8')) : { version: 1, metadata: {}, records: [] };
const records = new Map(data.records.map(r => [r.id, r]));
const inputs = process.argv.slice(2).filter(a => a !== '--dry-run');
for (const input of inputs) {
  const proposal = JSON.parse(fs.readFileSync(input, 'utf8'));
  for (const r of Array.isArray(proposal) ? proposal : proposal.records || [proposal]) {
    const clean = structuredClone(r); delete clean.addedAt; delete clean.updatedAt;
    // Unit proposals never replace the separately integrated doctoral overlay,
    // including when a contributor copied an older public row into a proposal.
    delete clean.doctoralReview;
    // A later source review must not silently erase a reviewed member-unit
    // ownership correction or resurrect its former duplicate display units.
    for (const key of ['unitOwnershipCorrections', 'priorUnitObservations']) {
      if (clean[key] === undefined && records.get(clean.id)?.[key]) clean[key] = records.get(clean.id)[key];
    }
    if (clean.organisationAliases === undefined && records.get(clean.id)?.organisationAliases) {
      clean.organisationAliases = records.get(clean.id).organisationAliases;
      for (const alias of clean.organisationAliases) {
        const source = records.get(clean.id).sources.find(s => s.url === alias.sourceUrl && s.checkedAt === alias.checkedAt && s.outcome === 'read');
        if (source && !clean.sources.some(s => s.url === source.url && s.checkedAt === source.checkedAt && s.outcome === 'read')) clean.sources.push(source);
      }
    }
    if (records.get(clean.id)?.doctoralReview) clean.doctoralReview = records.get(clean.id).doctoralReview;
    // Preserve stamps for unchanged records; record-dates decides actual content changes.
    records.set(clean.id, { ...clean, ...(records.get(clean.id)?.addedAt ? { addedAt: records.get(clean.id).addedAt, updatedAt: records.get(clean.id).updatedAt } : {}) });
  }
}
data.records = [...records.values()].sort((a, b) => a.id.localeCompare(b.id));
validateUniversityReviews(data.records, original.records);
data.metadata = {
  definition: 'Individual official-source reviews of university names and operations units. The original directory remains in universities.json. Reviewed describes the stated source scope, not an exhaustive current or historical census. Source notes identify the access method where recorded.',
  sourceRecords: original.records.length,
  attempted: data.records.length,
  reviewed: data.records.filter(r => r.status === 'reviewed').length,
  partial: data.records.filter(r => r.status === 'partial').length,
  blocked: data.records.filter(r => r.status === 'blocked').length,
  pending: original.records.length - data.records.length
};
if (!process.argv.includes('--dry-run')) writeComplete(path, JSON.stringify(data, null, 2) + '\n');
console.log(`${process.argv.includes('--dry-run') ? 'Preview' : 'Merged'}: ${JSON.stringify(data.metadata)}`);
