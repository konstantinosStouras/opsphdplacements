import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
// People come from two sources: the OM List import (data/faculty.json) and the operations faculty found on the
// faculty pages linked from the universities database (data/faculty-roster-people.json, built by
// scripts/build-roster-people.mjs). Both share one research ledger and one placements file.
const rosterFile=path.join(root,'data/faculty-roster-people.json');
const faculty=[...JSON.parse(fs.readFileSync(path.join(root,'data/faculty.json'),'utf8')).records,...(fs.existsSync(rosterFile)?JSON.parse(fs.readFileSync(rosterFile,'utf8')).records:[])];
const byId=new Map(faculty.map(r=>[r.id,r]));
const priorFile=path.join(root,'data/research-status.json');
const prior=fs.existsSync(priorFile)?JSON.parse(fs.readFileSync(priorFile,'utf8')).records:[];
const reviews=new Map(prior.filter(r=>r.status!=='pending').map(r=>[r.facultyId,r]));
const files=process.argv.slice(2);
if(!files.length)console.log('No results file given: rewriting the ledger and placements from the current people files.');
for(const file of files){const parsed=JSON.parse(fs.readFileSync(path.resolve(root,file),'utf8').replace(/^\uFEFF/,''));const rows=Array.isArray(parsed)?parsed:parsed.records||parsed.results; if(!Array.isArray(rows))throw Error(`Invalid results: ${file}`);
 for(const r of rows){const person=byId.get(r.facultyId);if(!person)throw Error(`Unknown faculty: ${r.facultyId}`);if(person.name!==r.name)throw Error(`Name mismatch for ${r.facultyId}`);if(!['verified','unresolved','not-yet-completed-phd'].includes(r.status))throw Error(`Invalid status: ${r.name}`);if(!r.checkedAt||!r.reason||!Array.isArray(r.sources)||!r.sources.length)throw Error(`Missing research provenance: ${r.name}`);for(const source of r.sources)if(!/^https?:\/\//.test(source.url)||!source.title)throw Error(`Invalid evidence URL/title: ${r.name}`);
 if(r.status==='verified'){if(!r.employer||!r.evidenceNote||!r.evidenceUrl||!r.sources.some(s=>s.url===r.evidenceUrl))throw Error(`Missing placement evidence: ${r.name}`);if(!['tenure-track','postdoc','other-academic','industry','government','nonprofit','unknown'].includes(r.category))throw Error(`Invalid category: ${r.name}`);if(r.placementYear!=null&&(!Number.isInteger(r.placementYear)||r.placementYear<1900||r.placementYear>2100))throw Error(`Invalid start year: ${r.name}`);if(r.phdYearVerified&&person.phdYear&&r.phdYearVerified!==person.phdYear&&!r.phdYearResolution)throw Error(`Unresolved PhD year conflict: ${r.name}`);}
 reviews.set(r.facultyId,r);
 }}
const records=faculty.map(person=>({...(reviews.get(person.id)||{facultyId:person.id,name:person.name,status:'pending',checkedAt:null,sources:[],reason:'Individual first-placement research is pending.'}),source:person.source||'omlist'}));
const placements=records.filter(r=>r.status==='verified').map(r=>{const f=byId.get(r.facultyId);return{id:`first-${f.id}`,facultyId:f.id,name:f.name,phdYear:r.phdYearVerified??f.phdYear,sourceImportedPhdYear:f.phdYear,phdYearVerificationStatus:r.phdYearVerified!=null?'verified':f.phdYear!=null?'source-reported':'unknown',phdInstitution:r.phdInstitutionVerified??f.phdInstitution,sourceImportedPhdInstitution:f.phdInstitution,phdInstitutionVerificationStatus:r.phdInstitutionVerified?'verified':f.phdInstitution?'source-reported':'unknown',phdInstitutionResolution:r.phdInstitutionResolution??null,discipline:f.discipline,facultyStatus:f.facultyStatus,employer:r.employer,position:r.position??null,placementYear:r.placementYear??null,category:r.category,evidenceUrl:r.evidenceUrl,evidenceNote:r.evidenceNote,sourceUrl:r.evidenceUrl,sourceProfileUrl:f.sourceProfileUrl,additionalSourceUrls:r.sources.map(s=>s.url),sources:r.sources,reviewedAt:r.checkedAt,retrievedAt:r.checkedAt,verificationStatus:'verified-first-placement',phdYearResolution:r.phdYearResolution??null,source:f.source||'omlist'};});
const counts={};for(const r of records)counts[r.status]=(counts[r.status]||0)+1;
const bySource={};for(const r of records){const s=(bySource[r.source]||={total:0,counts:{}});s.total++;s.counts[r.status]=(s.counts[r.status]||0)+1;}
const updatedAt=[...reviews.values()].map(r=>r.checkedAt).sort().at(-1)||'2026-10-16';
for(const[name,data]of[['research-status',{version:1,metadata:{updatedAt,total:faculty.length,counts,bySource},records}],['placements',{version:1,metadata:{updatedAt,recordCount:placements.length,definition:'First post-PhD employer established by an explicit initial-placement report or documented employment chronology. Unreported role/start year remain null.'},records:placements}]])fs.writeFileSync(path.join(root,`data/${name}.json`),JSON.stringify(data,null,2)+'\n');
console.log(JSON.stringify({total:faculty.length,counts,bySource,placements:placements.length}));
