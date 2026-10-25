import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const dir='research-handoff/universities/continuation-290',read=p=>JSON.parse(fs.readFileSync(p));
const priorFile='research-handoff/universities/continuation-215/shard-c/andes.prior-misassigned-doctoral-snapshot.json';
const proposalFile='research-handoff/universities/continuation-217/shard-c/universidad-de-los-andes.chile-doctoral-replacement.json';
const source=read('data/universities.json').records.find(r=>r.id==='universidad-de-los-andes');
assert.equal(source.country,'Chile');
const reviews=read('data/university-reviews.json'),r=reviews.records.find(r=>r.id===source.id);
assert.deepEqual(r.doctoralReview,read(priorFile),'Unexpected doctoral observation; review before replacing');
assert(!read('data/doctoral-programs.json').records.some(p=>p.universityId===r.id),'Unexpected prior programme');
const p=read(proposalFile);
assert(p.sources.every(s=>new URL(s.url).hostname.endsWith('uandes.cl')));
p.limitations=[
 'Earlier doctoral evidence belonged to the Colombian university with the same name and has been corrected. This review uses only the Chilean university’s official sources.',
 'Scope covers the current official doctorate and named research-field inventories, not all individual projects or supervisors. Historical graduate coverage remains incomplete.'
];
fs.writeFileSync(dir+'/chile-reviewed-integration.json',JSON.stringify(p,null,2)+'\n');
fs.writeFileSync(dir+'/chile-correction-audit.json',JSON.stringify({universityId:r.id,checkedAt:'2026-10-25',priorFile,proposalFile,priorSha256:crypto.createHash('sha256').update(fs.readFileSync(priorFile)).digest('hex'),proposalSha256:crypto.createHash('sha256').update(fs.readFileSync(proposalFile)).digest('hex'),reason:'Same-name university country mismatch; original Chile identity and unit facts preserved; old doctoral scope retained in dated history.'},null,2)+'\n');
// The standard merger replaces branch/source observations and unions only programme IDs.
// The mistaken scope has no programme IDs, so this is a complete explicit replacement.
execFileSync(process.execPath,['scripts/merge-doctoral-proposals.mjs',dir+'/chile-reviewed-integration.json',...(process.argv.includes('--apply')?['--apply']:[])],{stdio:'inherit'});
