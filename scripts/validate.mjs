import fs from 'node:fs';
import {validateDataset,isSourceUrl} from '../assets/model.js';
import {validatePrograms} from './validate-programs.mjs';
const programs=validatePrograms(JSON.parse(fs.readFileSync(new URL('../data/doctoral-programs.json',import.meta.url),'utf8')));
console.log(`Program register: ${programs.records.length} sourced records with field check dates.`);
const omlist=JSON.parse(fs.readFileSync(new URL('../data/faculty.json',import.meta.url),'utf8')).records;
const rosterPeopleUrl=new URL('../data/faculty-roster-people.json',import.meta.url);
const rosterPeople=fs.existsSync(rosterPeopleUrl)?validateDataset(JSON.parse(fs.readFileSync(rosterPeopleUrl,'utf8'))):{metadata:{recordCount:0},records:[]};
if(rosterPeople.metadata.recordCount!==rosterPeople.records.length)throw Error('faculty-roster-people: metadata count mismatch');
const faculty=[...omlist,...rosterPeople.records];
const ids=new Set(faculty.map(r=>r.id));
if(ids.size!==faculty.length)throw Error('A person id appears in both people sources.');
for(const r of rosterPeople.records){if(r.source!=='faculty-page'||!r.sourceProfileUrl||!r.currentInstitution||!r.retrievedAt)throw Error(`faculty-roster-people: missing source, profile page, institution or check date: ${r.name}`);if(r.phdInstitution&&!isSourceUrl(r.phdInstitutionSourceUrl||''))throw Error(`faculty-roster-people: doctorate without its source page: ${r.name}`);}
console.log(`faculty-roster-people: ${rosterPeople.records.length} people from the reviewed faculty pages (${rosterPeople.records.filter(r=>r.phdInstitution).length} with a stated doctorate).`);
for(const name of ['faculty','placements']){const data=validateDataset(JSON.parse(fs.readFileSync(new URL(`../data/${name}.json`,import.meta.url),'utf8')));if(data.metadata?.recordCount!==undefined&&data.metadata.recordCount!==data.records.length)throw Error('Metadata count mismatch');if(name==='placements')for(const r of data.records){if(r.verificationStatus!=='verified-first-placement'||!r.employer||!r.evidenceUrl||!r.evidenceNote||!r.reviewedAt||!ids.has(r.facultyId))throw Error('First placements require identity, employer, evidence and review');if(r.placementYear!==null&&(!Number.isInteger(r.placementYear)||r.placementYear<1900||r.placementYear>2100))throw Error('Invalid placement year');if(!r.sources?.some(s=>s.url===r.evidenceUrl))throw Error('Primary evidence missing from source list');}console.log(`${name}: ${data.records.length} valid records`);}
const progressPath=new URL('../data/research-status.json',import.meta.url);
if(fs.existsSync(progressPath)){const data=JSON.parse(fs.readFileSync(progressPath,'utf8'));if(data.records.length!==faculty.length||new Set(data.records.map(r=>r.facultyId)).size!==faculty.length||data.records.some(r=>!ids.has(r.facultyId)))throw Error('Research ledger must cover every person of both sources exactly once.');const counts={};for(const r of data.records)counts[r.status]=(counts[r.status]||0)+1;for(const[key,value]of Object.entries(counts))if(data.metadata.counts[key]!==value)throw Error('Research status count mismatch');console.log(`Research ledger covers every person of both sources (${omlist.length} OM List profiles, ${rosterPeople.records.length} from the faculty pages).`);}
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

// Derived databases are regenerated from the public files; their totals must agree with them.
for(const [file,field,expected,label] of [['institutions','people',faculty.filter(f=>f.phdInstitution||placements.find(p=>p.facultyId===f.id)?.phdInstitution).length,'people with a PhD institution'],['employers','verifiedFirstJobs',placements.length,'verified first jobs']]){
 const url=new URL(`../data/${file}.json`,import.meta.url);if(!fs.existsSync(url))throw Error(`Missing derived database data/${file}.json; run node scripts/build-institutions.mjs`);
 const data=JSON.parse(fs.readFileSync(url,'utf8'));const total=data.records.reduce((n,r)=>n+r[field],0);
 if(data.metadata.recordCount!==data.records.length||total!==expected)throw Error(`data/${file}.json is stale (${total} ${label}, expected ${expected}); run node scripts/build-institutions.mjs`);
}
console.log('Derived institution and employer databases agree with the public datasets.');

// The merged entities must contain every PhD institution, directory university and first employer exactly once.
{
 const url=new URL('../data/entities.json',import.meta.url);if(!fs.existsSync(url))throw Error('Missing data/entities.json; run node scripts/build-entities.mjs');
 const entities=JSON.parse(fs.readFileSync(url,'utf8')).records;
 const seen=(key)=>{const ids=entities.flatMap(key);if(new Set(ids).size!==ids.length)throw Error('An organisation is attached to two entities: '+ids.find((v,i)=>ids.indexOf(v)!==i));return new Set(ids);};
 const inst=seen(e=>e.people?e.people.institutions.map(i=>i.institutionId):[]), uni=seen(e=>e.directory?e.directory.universities.map(u=>u.id):[]), emp=seen(e=>e.employer?e.employer.employers.map(x=>x.employerId):[]);
 for(const [file,expected,have] of [['institutions',JSON.parse(fs.readFileSync(new URL('../data/institutions.json',import.meta.url),'utf8')).records.map(r=>r.id),inst],['universities',JSON.parse(fs.readFileSync(new URL('../data/universities.json',import.meta.url),'utf8')).records.map(r=>r.id),uni],['employers',JSON.parse(fs.readFileSync(new URL('../data/employers.json',import.meta.url),'utf8')).records.map(r=>r.id),emp]]){
  if(new Set(expected).size!==expected.length)throw Error(`data/${file}.json has a duplicate id; run node scripts/build-institutions.mjs or the import again`);
  const missing=expected.filter(id=>!have.has(id));if(missing.length||have.size!==expected.length)throw Error(`data/entities.json is stale for ${file} (${missing.length} missing); run node scripts/build-entities.mjs`);
 }
 const sum=(k)=>entities.reduce((n,e)=>n+(e.people?e.people[k]:0),0), published=JSON.parse(fs.readFileSync(new URL('../data/institutions.json',import.meta.url),'utf8')).records;
 if(sum('people')!==published.reduce((n,r)=>n+r.people,0)||sum('verifiedFirstJobs')!==published.reduce((n,r)=>n+r.verifiedFirstJobs,0))throw Error('data/entities.json people totals disagree with data/institutions.json; run node scripts/build-entities.mjs');
 const ids=new Set(entities.map(e=>e.id));if(ids.size!==entities.length)throw Error('Duplicate entity id');
 console.log('Merged entities cover every PhD institution, directory university and first employer exactly once.');
}

// Faculty rosters: every OM List link must exist, every review must carry its evidence, and a doctorate is never recorded without the page that states it.
{
 const url=new URL('../data/faculty-rosters.json',import.meta.url);
 if(fs.existsSync(url)){
  const roster=JSON.parse(fs.readFileSync(url,'utf8')), universityIds=new Set(JSON.parse(fs.readFileSync(new URL('../data/universities.json',import.meta.url),'utf8')).records.map(r=>r.id));
  if(roster.metadata.counts.people!==roster.records.length)throw Error('data/faculty-rosters.json metadata count mismatch');
  const seen=new Set();
  for(const r of roster.records){
   if(seen.has(r.id))throw Error(`Duplicate roster id ${r.id}`);seen.add(r.id);
   if(!r.name||!universityIds.has(r.universityId)||!r.facultyUrls?.length||!r.facultyUrls.every(isSourceUrl)||!r.retrievedAt)throw Error(`Roster row without name, university, faculty page or retrieval date: ${r.id}`);
   if(!['om-list','om-list-name-only','unverified'].includes(r.verification))throw Error(`Unknown roster verification: ${r.id}`);
   if(r.omList?.facultyId&&!ids.has(r.omList.facultyId))throw Error(`Roster row links to an unknown OM List profile: ${r.id}`);
   if(r.verification==='unverified'&&(r.phdInstitution||r.phdYear!=null||r.firstJob))throw Error(`Unverified roster row carries a doctorate or first job: ${r.id}`);
   const v=r.review;if(!v)continue;
   if(!['confirmed-faculty','extraction-noise','not-listed','same-as-om-list','unresolved'].includes(v.status)||!v.reason||!v.checkedAt||!v.sources?.length)throw Error(`Roster review without status, reason, date or sources: ${r.id}`);
   for(const s of v.sources)if(!isSourceUrl(s.url)||!s.title)throw Error(`Invalid roster review source: ${r.id}`);
   if((v.phdInstitution||v.phdYear!=null)&&!(v.phdSourceUrl&&v.sources.some(s=>s.url===v.phdSourceUrl)))throw Error(`Roster review records a doctorate without its source page: ${r.id}`);
   if(v.status==='same-as-om-list'&&!ids.has(v.omListFacultyId))throw Error(`Roster review names an unknown OM List profile: ${r.id}`);
  }
  console.log(`Faculty rosters: ${roster.records.length} listed people, ${roster.records.filter(r=>r.review).length} reviewed, every link and review evidenced.`);
 }
}
