import fs from 'node:fs';
import {validateDataset,isSourceUrl} from '../assets/model.js';
import {validatePrograms} from './validate-programs.mjs';
const programs=validatePrograms(JSON.parse(fs.readFileSync(new URL('../data/doctoral-programs.json',import.meta.url),'utf8')));
console.log(`Program register: ${programs.records.length} sourced records with field check dates.`);
const faculty=JSON.parse(fs.readFileSync(new URL('../data/faculty.json',import.meta.url),'utf8')).records;
const ids=new Set(faculty.map(r=>r.id));
for(const name of ['faculty','placements']){const data=validateDataset(JSON.parse(fs.readFileSync(new URL(`../data/${name}.json`,import.meta.url),'utf8')));if(data.metadata?.recordCount!==undefined&&data.metadata.recordCount!==data.records.length)throw Error('Metadata count mismatch');if(name==='placements')for(const r of data.records){if(r.verificationStatus!=='verified-first-placement'||!r.employer||!r.evidenceUrl||!r.evidenceNote||!r.reviewedAt||!ids.has(r.facultyId))throw Error('First placements require identity, employer, evidence and review');if(r.placementYear!==null&&(!Number.isInteger(r.placementYear)||r.placementYear<1900||r.placementYear>2100))throw Error('Invalid placement year');if(!r.sources?.some(s=>s.url===r.evidenceUrl))throw Error('Primary evidence missing from source list');}console.log(`${name}: ${data.records.length} valid records`);}
const progressPath=new URL('../data/research-status.json',import.meta.url);
if(fs.existsSync(progressPath)){const data=JSON.parse(fs.readFileSync(progressPath,'utf8'));if(data.records.length!==faculty.length||new Set(data.records.map(r=>r.facultyId)).size!==faculty.length||data.records.some(r=>!ids.has(r.facultyId)))throw Error('Research ledger must cover every faculty profile exactly once.');const counts={};for(const r of data.records)counts[r.status]=(counts[r.status]||0)+1;for(const[key,value]of Object.entries(counts))if(data.metadata.counts[key]!==value)throw Error('Research status count mismatch');console.log('Research ledger covers every imported faculty member.');}
const ledger=JSON.parse(fs.readFileSync(progressPath,'utf8')).records;
const placements=JSON.parse(fs.readFileSync(new URL('../data/placements.json',import.meta.url),'utf8')).records;
const verified=new Map(ledger.filter(r=>r.status==='verified').map(r=>[r.facultyId,r]));
if(verified.size!==placements.length||new Set(placements.map(r=>r.facultyId)).size!==placements.length)throw Error('Verified ledger and placements must contain the same people exactly once.');
for(const r of ledger){
 if(!['pending','verified','unresolved','not-yet-completed-phd'].includes(r.status))throw Error(`Unknown research status: ${r.name}`);
 if(r.status!=='pending'&&(!r.reason||!r.checkedAt||!r.sources?.length))throw Error(`Missing review evidence: ${r.name}`);
 for(const s of r.sources||[])if(!isSourceUrl(s.url)||!s.title)throw Error(`Invalid review source: ${r.name}`);
}
for(const p of placements){
 const r=verified.get(p.facultyId);
 if(!r||r.employer!==p.employer||r.evidenceUrl!==p.evidenceUrl||r.checkedAt!==p.reviewedAt)throw Error(`Placement disagrees with research ledger: ${p.name}`);
 if(p.placementYear!=null&&p.phdYear!=null&&p.placementYear<p.phdYear)throw Error(`First new job predates doctorate: ${p.name}`);
 if(p.phdInstitution!==p.sourceImportedPhdInstitution&&!p.phdInstitutionResolution)throw Error(`Undocumented degree institution correction: ${p.name}`);
 for(const [field,evidenceField] of [['phdYear','phdYearVerified'],['phdInstitution','phdInstitutionVerified']]){
  const expected=r[evidenceField]!=null?'verified':p[field]!=null&&p[field]!==''?'source-reported':'unknown';
  if(p[field+'VerificationStatus']!==expected)throw Error(`Incorrect degree-field verification status: ${p.name}`);
 }
}
console.log('Every published placement matches its reviewed evidence record.');
