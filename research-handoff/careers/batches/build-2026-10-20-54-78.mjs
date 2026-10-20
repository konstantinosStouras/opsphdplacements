// Transcribe reviewed observations only. No web retrieval or first-placement mutation.
// Default writes proposals/reviews; --integrate appends missing IDs after validating uniqueness.
import fs from 'node:fs';
const base='research-handoff/careers';
const read=f=>JSON.parse(fs.readFileSync(f,'utf8'));
const write=(f,d)=>fs.writeFileSync(f,JSON.stringify(d,null,2)+'\n');
const input=read(`${base}/batches/2026-10-20-54-78-observations.json`);
const assignment=read(`${base}/batches/2026-10-20-54-78-assignment.json`);
const months=['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
function date(s,startYear) {
  if(s==null || /^present$/i.test(s)) return {asWritten:s,year:null,month:null,precision:'unknown'};
  const match=s.match(/\b(19|20)\d{2}\b/);
  let year=match?Number(match[0]):null;
  if(/^\d{2}$/.test(s) && startYear) year=Math.floor(startYear/100)*100+Number(s);
  if(year==null) throw Error(`Unparsed date ${s}`);
  let month=null;
  const numeric=s.match(/^(\d{2})\/\d{4}$/);
  if(numeric) month=Number(numeric[1]);
  else {const i=months.indexOf(s.slice(0,3).toLowerCase());if(i>=0)month=i+1;}
  return {asWritten:s,year,month,precision:month?'month':'year'};
}
const records=input.records.sort((a,b)=>a.order-b.order).map(r=>{
  const p=assignment.records.find(p=>p.order===r.order);
  if(!p) throw Error(`Unknown order ${r.order}`);
  const h={id:p.id,name:p.name,recordIds:[p.id],checkedAt:input.checkedAt,reviewer:input.reviewer,reviewStatus:'partial',
    identityBasis:r.identityBasis,coverageNote:`Partial employment history. ${r.limitations.join(' ')}`,
    jobs:r.jobs.map(([employer,title,start,end,url])=>{
      const d=date(start);
      return {employerAsWritten:employer,titleAsWritten:title,start:d,end:date(end,d.year),
        isCurrent:/^present$/i.test(end||'')?true:null,sourceType:url?'official-profile':r.sourceType||'official-profile',
        sourceUrl:url||r.sourceUrl,checkedAt:input.checkedAt,
        evidenceNote:`${r.sourceType==='cv'?'Employment section of CV':'Opened official profile'}. ${r.sourceDate?`Source date: ${r.sourceDate}; current labels refer to that document. `:''}Dates are retained as written; unknown dates and concurrent appointments are not filled or collapsed.`};
    }),
    otherEmploymentMentions:(r.mentions||[]).map(evidenceNote=>({sourceUrl:r.sourceUrl,checkedAt:input.checkedAt,evidenceNote})),
    remainingUnknowns:r.limitations,accessLimitations:(r.failedSources||[]).map(u=>`Unavailable on this check: ${u}`)};
  if(r.sourceDate) h.sourceDate=r.sourceDate;
  if(r.period) {
    h.verifiedPhdYear=r.verifiedPhdYear;h.degreeSourceUrl=r.sourceUrl;
    h.postPhdPeriods=[{startYear:r.period[0],...(r.period[1]==='current'?{currentThroughCheck:true}:{endYear:r.period[1]}),
      sector:'academia',checkedAt:input.checkedAt,sourceUrls:[r.sourceUrl],
      evidenceNote:'Reviewed successive primary academic appointments; overlapping academic/admin/visiting roles counted once. Only the supported period is summarized.'}];
    h.summaryLimitations=r.summaryLimitations;
  }
  if(r.order===76) {
    h.jobs[2].evidenceNote+=' Disputed: the IMA institutional roster places Alexander Estes in its 2018–20 cohort with Target as industry partner and Maryland only as current/last-known affiliation.';
    h.otherEmploymentMentions=[{sourceUrl:'https://cse.umn.edu/ima/industrial-postdoctoral-fellowships',
      checkedAt:input.checkedAt,evidenceNote:'IMA roster: 2018–20 fellowship cohort, Target industry partner; University of Maryland is explicitly current/last-known affiliation, not the fellowship host. Conflicts with CV Maryland 2018–2022 entry; do not treat these as two jobs.'}];
  }
  return h;
});
if(records.length!==25 || new Set(records.map(r=>r.id)).size!==25) throw Error('Expected exactly 25 distinct assigned people');
fs.mkdirSync(`${base}/histories`,{recursive:true});
for(const h of records) {
  const filename=h.id.replaceAll(':','_');
  write(`${base}/histories/${filename}.json`,h);
  write(`${base}/reviews/${filename}.json`,{id:h.id,name:h.name,status:'partial',checkedAt:h.checkedAt,
    reason:h.coverageNote,sourceUrls:[...new Set([...h.jobs,...h.otherEmploymentMentions].map(j=>j.sourceUrl))],
    nextStep:'Resolve the listed gaps using a newer complete CV or individually identity-matched LinkedIn Experience review. Do not infer continuity or first-job sequence.',
    integrationStatus:process.argv.includes('--integrate')?'Integrated in data/employment-histories.json':'Reviewed proposal; not yet public'});
}
if(process.argv.includes('--integrate')) {
  const file='data/employment-histories.json',publicData=read(file);
  const ids=new Set([...publicData.records,...read('data/linkedin-histories.json').records].flatMap(h=>[h.id,...h.recordIds||[]]));
  for(const h of records) {
    if(h.recordIds.some(id=>ids.has(id))) throw Error(`Already present: ${h.id}; review rather than overwrite`);
    publicData.records.push(h);
  }
  write(file,publicData);
}
console.log(`${records.length} partial histories; ${records.reduce((n,h)=>n+h.jobs.length,0)} role entries. No first-job or imported-person changes.`);
