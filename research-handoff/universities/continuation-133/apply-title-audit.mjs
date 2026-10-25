import fs from 'node:fs';
import assert from 'node:assert/strict';
import {validatePrograms} from '../../../scripts/validate-programs.mjs';
const base='research-handoff/universities/continuation-133',old='research-handoff/universities/continuation-132';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const data=read('data/doctoral-programs.json'),decisions=[];
for(const x of read(`${old}/shard-a/title-adjudication.json`).decisions){if(x.disposition==='retain')continue; decisions.push({id:x.programmeId,decision:x.disposition.startsWith('exclude')?'excluded':'pending',reason:x.reason,proposal:`${old}/shard-a/title-adjudication.json`});}
for(const x of read(`${old}/shard-b/title-adjudication.json`).recommendations){if(x.recommendation==='retain'||x.programId==='nova-university-lisbon--management-phd-operations-technology-innovation')continue;decisions.push({id:x.programId,decision:x.recommendation==='exclude'?'excluded':'pending',reason:x.rationale,proposal:`${old}/shard-b/title-adjudication.json`});}
for(const x of read(`${old}/shard-c/current-eligible-title-evidence-audit.json`).records){if(!/recommend-title-exclusion|uncertain/.test(x.disposition))continue; decisions.push({id:x.programmeId,decision:x.disposition.startsWith('recommend')?'excluded':'pending',reason:x.reason,proposal:`${old}/shard-c/current-eligible-title-evidence-audit.json`});}
for(const x of read(`${base}/root-extra-title-audit.json`).recommendations){if(x.recommendation==='retain')continue;decisions.push({id:x.programId,decision:x.recommendation==='exclude'?'excluded':'pending',reason:x.rationale,proposal:`${base}/root-extra-title-audit.json`});}
const fresh=read(`${base}/shard-c/university-of-stirling.fresh-title-review.json`),stirling=decisions.find(x=>x.id===fresh.programmeId);assert(stirling);stirling.decision='excluded';stirling.reason=fresh.evidence;stirling.proposal=`${base}/shard-c/university-of-stirling.fresh-title-review.json`;
assert.equal(new Set(decisions.map(x=>x.id)).size,decisions.length);
for(const d of decisions){const p=data.records.find(x=>x.id===d.id);assert(p);d.priorTitleScopeReview=p.titleScopeReview??null;d.sourceChecks=p.sources.map(s=>({url:s.url,lastCheckedAt:s.lastCheckedAt}));p.titleScopeReview={decision:d.decision,assessedAt:'2026-10-25',reason:d.reason,sourceIds:p.sources.map(s=>s.id)};}
validatePrograms(data);
fs.writeFileSync(`${base}/title-audit-applied.json`,JSON.stringify({assessedAt:'2026-10-25',method:'Methodological title/host adjudication; original degree and programme facts/check dates preserved. Pending title/host evidence withheld from qualifying counts without asserting a negative programme finding. Direct named doctoral research areas may qualify; generic research groups do not. NOVA retained using fresh direct programme-area evidence in shard-b/nova-named-doctoral-area-support.json.',decisions},null,2)+'\n');
if(process.argv.includes('--apply'))fs.writeFileSync('data/doctoral-programs.json',JSON.stringify(data,null,2)+'\n');
console.log({apply:process.argv.includes('--apply'),excluded:decisions.filter(x=>x.decision==='excluded').length,pending:decisions.filter(x=>x.decision==='pending').length});
