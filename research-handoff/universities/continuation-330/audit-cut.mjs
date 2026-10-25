import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {displayText} from '../../../assets/model.js';
import {isNamedOperationsProgramme,isCurrentPhdProgramme} from '../../../assets/program-model.js';
const dir='research-handoff/universities/continuation-330',read=p=>JSON.parse(fs.readFileSync(p)),manifest=read(dir+'/integration-manifest.json'),before=p=>JSON.parse(execFileSync('git',['show',manifest.baseCommit+':'+p],{maxBuffer:50e6})),clean=r=>Object.fromEntries(Object.entries(r).filter(([k])=>!['addedAt','updatedAt'].includes(k)));
const oldProgrammes=before('data/doctoral-programs.json').records,current=read('data/doctoral-programs.json').records,byId=new Map(current.map(r=>[r.id,r]));
const titleAudit=read(dir+'/title-resolution-audit.json'),titleMap=new Map(titleAudit.map(r=>[r.programmeId,r])),lutId='lut-university--engineering-science-doctoral-industrial-engineering-management-field';
for(const prior of oldProgrammes){const now=structuredClone(byId.get(prior.id));assert(now,'Removed programme '+prior.id);
 if(prior.id===lutId){
  for(const key of ['id','programName','degree','specialization','universityId','establishedYear','history'])assert.deepEqual(now[key],prior[key],key);
  for(const f of prior.facts)assert([...now.facts,...(now.priorFactChecks||[])].some(x=>JSON.stringify(x)===JSON.stringify(f)),'Lost prior fact '+f.field);
  for(const s of prior.sources)assert(now.sources.some(x=>x.id===s.id&&x.url===s.url&&x.lastCheckedAt===s.lastCheckedAt),'Lost source '+s.id);
  assert.equal(now.department,'Department of Industrial Engineering and Management');
  fs.writeFileSync(dir+'/lut-programme-before-after.json',JSON.stringify({prior,reviewedCurrent:now},null,2)+'\n');continue;
 }
 const x=titleMap.get(prior.id);if(x){assert.deepEqual(now.titleScopeResolution,x.resolution);delete now.titleScopeResolution;now.titleScopeReview=x.priorTitleScopeReview;if(x.priorHistory.length)now.priorTitleScopeReviews=x.priorHistory;else delete now.priorTitleScopeReviews;now.sources=now.sources.filter(s=>!x.addedSourceIds.includes(s.id));now.limitations=now.limitations.filter(s=>s!==x.addedLimitation);}
 assert.deepEqual(clean(now),clean(prior),'Prior programme changed '+prior.id);
}
const oldSources=before('data/universities.json').records,newSources=new Map(read('data/universities.json').records.map(r=>[r.id,r]));for(const p of oldSources)assert.deepEqual(clean(newSources.get(p.id)),clean(p));
for(const p of ['data/faculty.json','data/faculty-roster-people.json','data/placements.json','data/employment-histories.json','data/linkedin-histories.json'])assert.deepEqual(read(p),before(p),'Held dataset changed '+p);
const reviews=read('data/university-reviews.json').records,units=reviews.flatMap(r=>r.units||[]),unitMap=new Map(reviews.map(r=>[r.id,r]));for(const r of read(dir+'/unit-integration.json'))for(const[k,v]of Object.entries(r))if(!['addedAt','updatedAt','doctoralReview'].includes(k))assert.deepEqual(unitMap.get(r.id)[k],v,'Unapproved unit '+r.id+'/'+k);
const priorGate=new Set(read(dir+'/title-gate-before-chinese.json')),newTitleIds=current.filter(p=>isNamedOperationsProgramme(p,units)&&!priorGate.has(p.id)).map(p=>p.id).sort();
assert.deepEqual(newTitleIds,['fudan-university--mathematics-operations-research-doctorate','university-of-chinese-academy-of-sciences--070105-operations-research-and-control-theory','university-of-chinese-academy-of-sciences--120100-management-science-and-engineering','university-of-chinese-academy-of-sciences--1201z1-management-operations-research'].sort());
const violations=[];function scan(v,p){if(typeof v==='string'){if(/\.json\b|github\.com\/[^/]+\/opsphdplacements|raw\.githubusercontent\.com\/[^/]+\/opsphdplacements/i.test(displayText(v)))violations.push(p);}else if(Array.isArray(v))v.forEach((x,i)=>scan(x,p+'['+i+']'));else if(v&&typeof v==='object')for(const[k,x]of Object.entries(v))scan(x,p+'.'+k);}
for(const p of ['data/university-reviews.json','data/doctoral-programs.json'])scan(read(p),p);assert.equal(violations.length,0,JSON.stringify(violations));
const qualifying=current.filter(p=>isNamedOperationsProgramme(p,units)&&isCurrentPhdProgramme(p));
const result={priorSourcesPreserved:oldSources.length,priorProgrammes:oldProgrammes.length,documentedProgrammeChanges:[lutId,...titleMap.keys()],newProgrammeRecords:current.length-oldProgrammes.length,qualifyingProgrammes:qualifying.length,providers:new Set(qualifying.map(p=>p.universityId)).size,newChineseTitleMatches:newTitleIds,heldPeopleDataUnchanged:true,displayTextViolations:0};fs.writeFileSync(dir+'/integration-audit.json',JSON.stringify(result,null,2)+'\n');console.log(result);
