import fs from 'node:fs';
import assert from 'node:assert/strict';
import { validateUniversityReviews } from './university-review-schema.mjs';
const data = JSON.parse(fs.readFileSync('data/university-reviews.json', 'utf8'));
const source = JSON.parse(fs.readFileSync('data/universities.json', 'utf8'));
validateUniversityReviews(data.records, source.records);
assert.equal(data.metadata.sourceRecords, source.records.length);
assert.equal(data.metadata.attempted, data.records.length);
assert.equal(data.metadata.pending, source.records.length - data.records.length);
for (const status of ['reviewed', 'partial', 'blocked']) assert.equal(data.metadata[status], data.records.filter(r => r.status === status).length);
const programs=JSON.parse(fs.readFileSync('data/doctoral-programs.json','utf8')).records;
const byProgram=new Map(programs.map(p=>[p.id,p])),byReview=new Map(data.records.map(r=>[r.id,r]));
const canonical=id=>{while(byReview.get(id)?.duplicateOf)id=byReview.get(id).duplicateOf;return id;};
for(const p of programs)for(const id of p.primaryProgrammeIds||[]){const primary=byProgram.get(id);assert(primary&&primary.id!==p.id,`Unknown/self-linked primary doctoral route ${p.id}/${id}`);assert.equal(primary.universityId,p.universityId,`Cross-university primary doctoral route ${p.id}/${id}`);}
for(const r of data.records)for(const id of r.doctoralReview?.programmeIds||[]){
 const p=byProgram.get(id);assert(p,`Unknown doctoral programme ${r.id}/${id}`);
 assert.equal(p.universityId,canonical(r.id),`Wrong doctoral university linkage ${r.id}/${id}`);
 const units=new Set(data.records.filter(u=>canonical(u.id)===canonical(r.id)).flatMap(u=>u.units.map(x=>x.id)));
 assert((p.unitIds||[]).every(id=>units.has(id)),`Unknown doctoral host unit ${r.id}/${id}`);
}
console.log(`University reviews: ${data.metadata.reviewed} reviewed, ${data.metadata.partial} partial, ${data.metadata.blocked} blocked, ${data.metadata.pending} pending.`);
