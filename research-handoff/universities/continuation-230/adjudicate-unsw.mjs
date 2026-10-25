import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {validatePrograms} from '../../../scripts/validate-programs.mjs';
const dir='research-handoff/universities/continuation-230',read=p=>JSON.parse(fs.readFileSync(p)),d=read('data/doctoral-programs.json'),m=read(dir+'/integration-manifest.json'),input=read(m.titleInput),audit=[];
for(const x of input){const p=d.records.find(p=>p.id===x.programmeId);assert(p);for(const[k,v]of Object.entries(x.preserve))assert.deepEqual(p[k],v,'Prior facts changed '+p.id+'/'+k);const prior=structuredClone(p),added=[];
for(const s of x.sources){assert.equal(s.outcome,'read');const id='source-'+crypto.createHash('sha256').update(s.url+'|'+s.checkedAt).digest('hex').slice(0,14);if(!p.sources.some(s=>s.id===id)){p.sources.push({id,url:s.url,title:s.note,notes:s.note,lastCheckedAt:s.checkedAt,sourceType:'official-primary',access:'opened-and-read'});added.push(id);}}
p.titleScopeReview={...x.decision,sourceIds:[...new Set([...x.decision.sourceIds,...added])]};assert.deepEqual(p.facts,prior.facts);audit.push({programmeId:p.id,addedSourceIds:added,priorTitleScopeReview:prior.titleScopeReview??null,titleScopeReview:p.titleScopeReview});}
validatePrograms(d);fs.writeFileSync(dir+'/title-adjudications.json',JSON.stringify(audit,null,2)+'\n');if(process.argv.includes('--apply'))fs.writeFileSync('data/doctoral-programs.json',JSON.stringify(d,null,2)+'\n');console.log({apply:process.argv.includes('--apply'),titleExclusions:audit.length,priorFactsPreserved:true});
