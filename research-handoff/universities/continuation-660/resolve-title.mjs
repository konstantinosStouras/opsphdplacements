import fs from 'node:fs';import crypto from 'node:crypto';import assert from 'node:assert/strict';import {validatePrograms} from '../../../scripts/validate-programs.mjs';import {writeComplete} from '../../../scripts/write-complete.mjs';
const dir='research-handoff/universities/continuation-660',read=p=>JSON.parse(fs.readFileSync(p)),m=read(dir+'/integration-manifest.json'),x=read(m.titleResolution);
for(const f of m.frozenInputs)assert.equal(crypto.createHash('sha256').update(fs.readFileSync(f.path)).digest('hex'),f.sha256);
const data=read('data/doctoral-programs.json'),p=data.records.find(p=>p.id===x.programmeId);assert.deepEqual(p,read(dir+'/manchester-prior-programme.json'));
p.priorTitleScopeReviews=[...(p.priorTitleScopeReviews||[]),p.titleScopeReview];delete p.titleScopeReview;
const addedSourceIds=[];for(const s of x.sources){const id='source-'+crypto.createHash('sha256').update(s.url+'|2026-10-26|continuation660-title').digest('hex').slice(0,14);p.sources.push({id,url:s.url,title:s.note,notes:s.note,lastCheckedAt:s.checkedAt,sourceType:'official-primary',access:'opened-and-read'});addedSourceIds.push(id);}
p.titleScopeResolution={decision:'retain',assessedAt:'2026-10-26',reason:x.reason,sourceIds:addedSourceIds};p.limitations.push('26 October title review: '+x.reason);validatePrograms(data);
if(process.argv.includes('--apply'))writeComplete('data/doctoral-programs.json',JSON.stringify(data,null,2)+'\n');
console.log({restored:p.id,unchangedOriginalFacts:true,apply:process.argv.includes('--apply')});
