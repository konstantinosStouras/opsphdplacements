// Construct dated proposals from individually reviewed source observations.
// --integrate is a one-time append, not a refresh; it refuses existing identities.
import fs from 'node:fs';
const base='research-handoff/careers';
const read=f=>JSON.parse(fs.readFileSync(f,'utf8'));
const write=(f,d)=>fs.writeFileSync(f,JSON.stringify(d,null,2)+'\n');
const input=read(`${base}/batches/2026-10-20-79-103-observations.json`);
const assignment=read(`${base}/batches/2026-10-20-79-103-assignment.json`);
const months=['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
function date(s) {
  if(s==null || /^present$/i.test(s)) return {asWritten:s,year:null,month:null,precision:'unknown'};
  const match=s.match(/\b(19|20)\d{2}\b/);
  if(!match) throw Error(`Unparsed date ${s}`);
  let month=null;
  const numeric=s.match(/^(\d{2})\/\d{4}$/);
  if(numeric) month=Number(numeric[1]);
  else {const i=months.indexOf(s.slice(0,3).toLowerCase());if(i>=0)month=i+1;}
  return {asWritten:s,year:Number(match[0]),month,precision:month?'month':'year'};
}
const records=input.records.sort((a,b)=>a.order-b.order).map(r=>{
  const p=assignment.records.find(p=>p.order===r.order);
  if(!p) throw Error(`Unknown order ${r.order}`);
  const h={id:p.id,name:p.name,recordIds:[p.id],checkedAt:input.checkedAt,reviewer:input.reviewer,reviewStatus:'partial',
    identityBasis:r.identityBasis,coverageNote:`Partial employment history. ${r.limitations.join(' ')}`,
    jobs:r.jobs.map(([employer,title,start,end,url])=>{
      const sourceType=url?'official-profile':r.sourceType||'official-profile';
      return {employerAsWritten:employer,titleAsWritten:title,start:date(start),end:date(end),
        isCurrent:/^present$/i.test(end||'')?true:end?false:null,sourceType,
        sourceUrl:url||r.sourceUrl,checkedAt:input.checkedAt,
        evidenceNote:`${sourceType==='cv'?'Opened CV employment/experience entry':'Opened official faculty or institutional profile'}. ${sourceType==='cv'?(r.sourceDate?`CV date: ${r.sourceDate}. `:'CV has no established issue date. '):''}Dates are retained as written. Open-ended CV labels refer to that document, not independently to the check date. Unknown dates and overlapping role observations are not filled or collapsed.`};
    }),
    otherEmploymentMentions:(r.mentions||[]).map(m=>typeof m==='string'?{sourceUrl:r.sourceUrl,checkedAt:input.checkedAt,evidenceNote:m}:{...m,checkedAt:input.checkedAt}),
    remainingUnknowns:r.limitations,accessLimitations:[...(r.accessLimitations||[]),...(r.failedSources||[]).map(u=>`No readable employment content obtained on this check: ${u}`)]};
  if(r.sourceDate) h.sourceDate=r.sourceDate;
  if(r.periods) {
    h.verifiedPhdYear=r.verifiedPhdYear;h.degreeSourceUrl=r.sourceUrl;
    h.postPhdPeriods=r.periods.map(period=>({...period,checkedAt:input.checkedAt,sourceUrls:[r.sourceUrl],
      evidenceNote:'Only the explicitly supported primary employment interval is summarized, at approximate year precision. Concurrent visits, distinctions and service are not counted twice.'}));
    h.summaryLimitations=r.summaryLimitations;
  }
  return h;
});
if(records.length!==25 || new Set(records.map(r=>r.id)).size!==25) throw Error('Expected exactly 25 distinct assigned people');
if(process.argv.includes('--integrate')) {
  const publicData=read('data/employment-histories.json');
  const ids=new Set([...publicData.records,...read('data/linkedin-histories.json').records].flatMap(h=>[h.id,...h.recordIds||[]]));
  for(const h of records) if(h.recordIds.some(id=>ids.has(id))) throw Error(`Already present: ${h.id}; review rather than overwrite`);
  publicData.records.push(...records);
  write('data/employment-histories.json',publicData);
}
for(const h of records) {
  const filename=h.id.replaceAll(':','_');
  write(`${base}/histories/${filename}.json`,h);
  write(`${base}/reviews/${filename}.json`,{id:h.id,name:h.name,status:'partial',checkedAt:h.checkedAt,
    reason:h.coverageNote,sourceUrls:[...new Set([...h.jobs,...h.otherEmploymentMentions].map(j=>j.sourceUrl))],
    nextStep:'Resolve the listed chronology and source limitations with a newer complete CV or an individually identity-matched LinkedIn Experience review. Do not infer first-job sequence or continuity.',
    integrationStatus:process.argv.includes('--integrate')?'Integrated in data/employment-histories.json':'Reviewed proposal; not yet public'});
}
console.log(`${records.length} partial histories; ${records.reduce((n,h)=>n+h.jobs.length,0)} role observations; ${records.filter(h=>h.postPhdPeriods).length} bounded summaries.`);
