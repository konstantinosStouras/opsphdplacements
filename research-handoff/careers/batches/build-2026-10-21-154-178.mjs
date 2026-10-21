// Dated, manually reviewed proposals. --integrate appends once; never use as refresh.
import fs from 'node:fs';
const base='research-handoff/careers';
const read=f=>JSON.parse(fs.readFileSync(f,'utf8'));
const write=(f,d)=>fs.writeFileSync(f,JSON.stringify(d,null,2)+'\n');
const input=read(`${base}/batches/2026-10-21-154-178-observations.json`);
const assignment=read(`${base}/batches/2026-10-21-154-178-assignment.json`);
const ongoing=s=>/^(present|pres\.|current)$/i.test(s||'');
const months=['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
function date(s){
 if(s==null||ongoing(s))return {asWritten:s,year:null,month:null,precision:'unknown'};
 const match=s.match(/\b(19|20)\d{2}\b/);if(!match)throw Error(`Unparsed date ${s}`);
 const numeric=s.match(/(?:Since )?(\d{1,2})\/\d{4}/);
 const i=months.indexOf(s.slice(0,3).toLowerCase());
 const month=numeric?Number(numeric[1]):i>=0?i+1:null;
 return {asWritten:s,year:Number(match[0]),month,precision:month?'month':'year'};
}
const records=input.records.sort((a,b)=>a.order-b.order).map(r=>{
 const p=assignment.records.find(p=>p.order===r.order);if(!p)throw Error(`Unassigned ${r.order}`);
 const h={id:p.id,name:p.name,recordIds:[p.id],checkedAt:input.checkedAt,reviewer:input.reviewer,reviewStatus:'partial',identityBasis:r.identityBasis,
 coverageNote:`Partial employment history. ${r.limitations.join(' ')}`,
 jobs:r.jobs.map(([employer,title,start,end,url,location])=>({employerAsWritten:employer,titleAsWritten:title,start:date(start),end:date(end),isCurrent:ongoing(end)?true:end?false:null,sourceType:url?'official-profile':r.sourceType||'official-profile',sourceUrl:url||r.sourceUrl,checkedAt:input.checkedAt,
 ...(location?{locationAsWritten:location}:{}),
 evidenceNote:`Individually opened ${r.sourceType==='cv'?'CV employment or professional-experience section':'institutional profile career or biography section'}. ${r.sourceDate?`Document date: ${r.sourceDate}. `:''}Missing dates remain unknown; concurrent titles are not added into tenure. Open-ended CV claims refer to the document, not independently to the check date.`})),
 otherEmploymentMentions:(r.mentions||[]).map(m=>typeof m==='string'?{sourceUrl:r.sourceUrl,checkedAt:input.checkedAt,evidenceNote:m}:{...m,checkedAt:input.checkedAt}),
 remainingUnknowns:r.limitations,accessLimitations:[...(r.accessLimitations||[]),...(r.failedSources||[]).map(u=>`No readable content obtained on this check: ${u}`)]};
 if(r.additionalSources)h.additionalSourceUrls=r.additionalSources;
 if(r.sourceDate)h.sourceDate=r.sourceDate;
 if(r.duplicateCandidateId)h.identityFollowUp={candidateRecordId:r.duplicateCandidateId,status:'unmerged duplicate candidate',evidenceNote:'Official profile links a CV spelling out the expanded name; global duplicate reconciliation remains separate.'};
 if(r.periods){h.verifiedPhdYear=r.verifiedPhdYear;h.degreeSourceUrl=r.sourceUrl;h.postPhdPeriods=r.periods.map(p=>({...p,checkedAt:input.checkedAt,sourceUrls:[r.sourceUrl],evidenceNote:'Explicitly bounded academic appointments and doctorate year support this interval at approximate year precision. Later open-ended claims are not extrapolated.'}));h.summaryLimitations=r.summaryLimitations.join(' ');}
 return h;
});
if(records.length!==25||new Set(records.map(r=>r.id)).size!==25)throw Error('Expected 25 assigned identities');
if(process.argv.includes('--integrate')){
 const data=read('data/employment-histories.json');const ids=new Set([...data.records,...read('data/linkedin-histories.json').records].flatMap(h=>[h.id,...h.recordIds||[]]));
 for(const h of records)if(h.recordIds.some(id=>ids.has(id)))throw Error(`Already public: ${h.id}`);
 data.records.push(...records);write('data/employment-histories.json',data);
}
for(const h of records){const file=h.id.replaceAll(':','_');write(`${base}/histories/${file}.json`,h);write(`${base}/reviews/${file}.json`,{id:h.id,name:h.name,status:'partial',checkedAt:h.checkedAt,reason:h.coverageNote,sourceUrls:[...new Set([...h.jobs,...h.otherEmploymentMentions].map(x=>x.sourceUrl).concat(h.additionalSourceUrls||[]))],nextStep:'Resolve listed chronology, document age and identity limitations with a newer complete CV or individually matched LinkedIn Experience review. Do not infer first-job sequence or continuous tenure.',integrationStatus:process.argv.includes('--integrate')?'Integrated in data/employment-histories.json':'Reviewed proposal; not yet public'});}
console.log(JSON.stringify({people:records.length,roles:records.reduce((n,h)=>n+h.jobs.length,0),mentions:records.reduce((n,h)=>n+h.otherEmploymentMentions.length,0),summaries:records.filter(h=>h.postPhdPeriods).length}));
