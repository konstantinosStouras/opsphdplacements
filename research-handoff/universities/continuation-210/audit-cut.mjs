import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {displayText} from '../../../assets/model.js';
const read=p=>JSON.parse(fs.readFileSync(p)),before=p=>JSON.parse(execFileSync('git',['show','aa854da:'+p],{maxBuffer:50e6}));
const clean=r=>Object.fromEntries(Object.entries(r).filter(([k])=>!['addedAt','updatedAt'].includes(k)));
const titleIds=new Set(read('research-handoff/universities/continuation-210/title-adjudications.json').map(r=>r.programmeId));
const old=before('data/doctoral-programs.json').records,current=read('data/doctoral-programs.json').records,byId=new Map(current.map(r=>[r.id,r]));
for(const r of old){const after=structuredClone(byId.get(r.id));if(titleIds.has(r.id)){assert.equal(after.titleScopeReview.decision,'excluded');assert.deepEqual(after.sources.slice(0,r.sources.length),r.sources);after.sources=r.sources;delete after.titleScopeReview;}assert.deepEqual(clean(after),clean(r),'Prior programme facts changed: '+r.id);}
for(const p of ['data/universities.json','data/faculty.json','data/faculty-roster-people.json','data/placements.json','data/employment-histories.json','data/linkedin-histories.json'])assert.deepEqual(read(p),before(p),'Held dataset changed: '+p);
const actualUnits=new Map(read('data/university-reviews.json').records.map(r=>[r.id,r]));
for(const r of read('research-handoff/universities/continuation-210/unit-integration.json'))for(const [k,v]of Object.entries(r))if(!['addedAt','updatedAt','doctoralReview'].includes(k))assert.deepEqual(actualUnits.get(r.id)[k],v,'Unit changed after reviewed cut: '+r.id+'/'+k);
const violations=[];function scan(v,p){if(typeof v==='string'){if(/\.json\b|github\.com\/[^/]+\/opsphdplacements|raw\.githubusercontent\.com\/[^/]+\/opsphdplacements/i.test(displayText(v)))violations.push(p);}else if(Array.isArray(v))v.forEach((x,i)=>scan(x,p+'['+i+']'));else if(v&&typeof v==='object')for(const[k,x]of Object.entries(v))scan(x,p+'.'+k);}
for(const p of ['data/university-reviews.json','data/doctoral-programs.json'])scan(read(p),p);assert.equal(violations.length,0,JSON.stringify(violations));console.log({priorProgrammeFactsPreserved:old.length,added:current.length-old.length,titleOnlyAdjudications:titleIds.size,heldDatasetsUnchanged:true,displayTextViolations:0});
