import fs from 'node:fs';
import assert from 'node:assert/strict';
import {writeComplete} from '../../../scripts/write-complete.mjs';
const read=p=>JSON.parse(fs.readFileSync(p));
const dir='research-handoff/universities/continuation-300';
const proposal=read('research-handoff/universities/continuation-222/shard-c/doctoral-alias-safe-mirror-manifest.json');
const data=read('data/university-reviews.json'),byId=new Map(data.records.map(r=>[r.id,r]));
const audit=[];
for(const x of proposal.safeMirrors){
 const alias=byId.get(x.aliasId),canonical=byId.get(x.canonicalId);
 assert.equal(alias.duplicateOf,canonical.id);
 assert.deepEqual(alias.doctoralReview??null,x.priorAliasDoctoralReview);
 assert.deepEqual(canonical.doctoralReview,x.canonicalDoctoralReviewSnapshot);
 assert(!alias.doctoralReview?.checkedAt||alias.doctoralReview.checkedAt<=canonical.doctoralReview.checkedAt);
 assert(!alias.doctoralReview?.coverageComplete||canonical.doctoralReview.coverageComplete);
 assert((alias.doctoralReview?.programmeIds||[]).every(id=>canonical.doctoralReview.programmeIds.includes(id)));
 const prior=structuredClone(alias); alias.doctoralReview=structuredClone(canonical.doctoralReview);
 audit.push({aliasId:alias.id,canonicalId:canonical.id,assessedAt:'2026-10-25',priorAlias:prior,newDoctoralReview:alias.doctoralReview});
}
if(process.argv.includes('--apply')){
 writeComplete('data/university-reviews.json',JSON.stringify(data,null,2)+'\n');
 fs.writeFileSync(dir+'/alias-synchronization-audit.json',JSON.stringify(audit,null,2)+'\n');
}
console.log({aliases: audit.length,apply:process.argv.includes('--apply'),newSourceChecks:0,newProgrammes:0});
