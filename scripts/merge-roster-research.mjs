// Merge reviewed roster proposals into data/faculty-rosters.json. A proposal is a JSON array (or an object
// with "records") of review outcomes for people in that file, one per roster id. The merge refuses a row
// without a reason, a check date and an opened source, a doctorate without the page that states it, or a
// status it does not know; a later proposal for the same person replaces the earlier review.
// Usage: node scripts/merge-roster-research.mjs research/rosters/proposal-1.json [more files]
import fs from 'node:fs';
import path from 'node:path';
import { isSourceUrl } from '../assets/model.js';
const root = path.resolve(import.meta.dirname, '..');
const rosterPath = path.join(root, 'data/faculty-rosters.json');
const roster = JSON.parse(fs.readFileSync(rosterPath, 'utf8'));
const byId = new Map(roster.records.map(r => [r.id, r]));
const facultyIds = new Set(JSON.parse(fs.readFileSync(path.join(root, 'data/faculty.json'), 'utf8')).records.map(f => f.id));
export const REVIEW_STATUSES = ['confirmed-faculty', 'extraction-noise', 'not-listed', 'same-as-om-list', 'unresolved'];
const files = process.argv.slice(2);
if (!files.length) throw new Error('Pass one or more proposal files.');
let merged = 0;
for (const file of files) {
  const parsed = JSON.parse(fs.readFileSync(path.resolve(root, file), 'utf8').replace(/^﻿/, ''));
  const rows = Array.isArray(parsed) ? parsed : parsed.records || parsed.results;
  if (!Array.isArray(rows)) throw new Error(`${file}: expected an array of reviews`);
  for (const r of rows) {
    const person = byId.get(r.id);
    if (!person) throw new Error(`${file}: unknown roster id ${r.id}`);
    if (person.name !== r.name) throw new Error(`${file}: name mismatch for ${r.id} (${r.name} vs ${person.name})`);
    if (!REVIEW_STATUSES.includes(r.status)) throw new Error(`${file}: unknown status ${r.status} for ${r.name}`);
    if (!r.reason || !/^\d{4}-\d{2}-\d{2}$/.test(r.checkedAt || '') || !Array.isArray(r.sources) || !r.sources.length) throw new Error(`${file}: ${r.name} needs a reason, a check date and at least one opened source`);
    for (const s of r.sources) if (!isSourceUrl(s.url) || !s.title) throw new Error(`${file}: invalid source for ${r.name}`);
    if ((r.phdInstitution || r.phdYear != null) && !(r.phdSourceUrl && r.sources.some(s => s.url === r.phdSourceUrl))) throw new Error(`${file}: ${r.name} has a doctorate without the opened page that states it (phdSourceUrl must be one of the sources)`);
    if (r.phdYear != null && (!Number.isInteger(r.phdYear) || r.phdYear < 1900 || r.phdYear > new Date().getFullYear() + 1)) throw new Error(`${file}: implausible doctorate year for ${r.name}`);
    if (r.status === 'same-as-om-list' && !facultyIds.has(r.omListFacultyId)) throw new Error(`${file}: ${r.name} is marked as an OM List profile but omListFacultyId is not in data/faculty.json`);
    if (r.status === 'confirmed-faculty' && !r.profileUrl) throw new Error(`${file}: ${r.name} is confirmed faculty but no profile page is given`);
    person.review = { status: r.status, checkedAt: r.checkedAt, reason: r.reason, sources: r.sources, profileUrl: r.profileUrl || null, titleConfirmed: r.titleConfirmed || null, areaConfirmed: r.areaConfirmed || null, phdInstitution: r.phdInstitution || null, phdYear: r.phdYear ?? null, phdSourceUrl: r.phdSourceUrl || null, omListFacultyId: r.omListFacultyId || null, note: r.note || null };
    merged++;
  }
}
const count = f => roster.records.filter(f).length, outcomes = {};
for (const r of roster.records) if (r.review) outcomes[r.review.status] = (outcomes[r.review.status] || 0) + 1;
roster.metadata.counts.reviewed = count(r => r.review); roster.metadata.counts.reviewOutcomes = outcomes;
for (const u of roster.universities) u.reviewed = count(r => r.universityId === u.universityId && r.review);
roster.metadata.reviewsUpdatedAt = roster.records.map(r => r.review?.checkedAt).filter(Boolean).sort().at(-1) || null;
fs.writeFileSync(rosterPath, JSON.stringify(roster, null, 1) + '\n');
console.log(`merged ${merged} reviews; ${roster.metadata.counts.reviewed} of ${roster.records.length} roster people reviewed: ${JSON.stringify(outcomes)}`);
