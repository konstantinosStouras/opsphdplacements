import fs from 'node:fs';
import assert from 'node:assert/strict';
import {writeComplete} from '../../../scripts/write-complete.mjs';
const dir='research-handoff/universities/continuation-270',read=p=>JSON.parse(fs.readFileSync(p));
const data=read('data/doctoral-programs.json');
for(const x of read(dir+'/title-adjudications.json')){const p=data.records.find(r=>r.id===x.programmeId);assert(p);for(const id of x.titleScopeReview.sourceIds)assert(p.sources.some(s=>s.id===id));p.titleScopeReview=x.titleScopeReview;}
writeComplete('data/doctoral-programs.json',JSON.stringify(data,null,2)+'\n');
console.log('Recorded one explicit title exclusion; original facts and dates preserved.');
