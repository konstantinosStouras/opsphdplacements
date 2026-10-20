// Owner-authorized review/publication of previously saved observations.
// Does not fetch sources, alter first-job evidence, or infer career continuity.
import fs from 'node:fs';
const base='research-handoff/careers';
const original=JSON.parse(fs.readFileSync(`${base}/batches/2026-10-20-1117-continuation.json`,'utf8'));
const records=structuredClone(original.records);
const changes=[];
function moveMention(id,title,note){
  const h=records.find(h=>h.id===id),i=h.jobs.findIndex(j=>j.titleAsWritten===title);
  if(i<0)throw Error(`Missing ${id}: ${title}`);
  const [j]=h.jobs.splice(i,1);
  h.otherEmploymentMentions.push({...j,evidenceNote:note});
  changes.push({id,title,disposition:note});
}
moveMention('roster:the-pennsylvania-state-university:aggon-norm','Asst/Assoc Department Head of','Source title is truncated exactly here. Administrative responsibility is mentioned, but its complete title, dates and separate appointment status are unknown. Not counted as a distinct job.');
moveMention('roster:wilfrid-laurier-university:aiqi-zhang','Postdoctoral training, Operations Management and Statistics','Official biography states postdoctoral training at Rotman before Laurier, without a job title, dates or employment status. Retained as a training mention rather than a separately established job.');
moveMention('roster:harvard-university:alan-d-maccormack','Faculty, Technology and Operations Management unit','Biography says he joined the HBS Technology and Operations Management unit in 1998. Initial rank is not stated. This is an institutional joining date, potentially part of the separately listed HBS appointment, not an additional distinct job.');
moveMention('roster:georgia-institute-of-technology:alan-porter','Faculty, Industrial and Systems Engineering','Official biography says he joined Georgia Tech in 1975. Initial rank and transition dates are unknown. This joining date is not counted as an additional job alongside the later emeritus titles.');
moveMention('omlist-9cb7b2a4d2d65b89','Professor of Management','Undated profile-header title may describe the dated Distinguished Research Professor appointment below. Retained as a title mention, not counted as an additional distinct appointment.');
const sourceDates={
 'roster:hec-montreal:adulyasak-yossiri':'June 2025 (page last-update label)',
 'omlist-6a2f0681b34901ef':'August 4, 2020',
 'omlist-1c223937a644a56b':'Undated CV containing 2021/2022-era appointments and teaching',
 'omlist-2f9513f14c15d9f0':'Undated older CV with publications through 2016',
 'roster:george-mason-university:ajay-vinze':'February 2, 2015 for ASU CV; GMU profile separately checked October 20, 2026',
 'roster:georgia-institute-of-technology:alan-erera':'January 2026',
 'roster:naval-postgraduate-school:alan-r-washburn':'June 12, 2013 (page last-update label)'
};
for(const h of records){
  h.reviewStatus='partial';
  h.integrationStatus='Reviewed for owner-authorized publication, 20 October 2026; partial observation, not a complete career.';
  h.publicationReviewDate='2026-10-20';
  h.coverageNote=h.coverageNote.replace('All employment facts read in the opened source sections are transcribed;','The saved employment observations from opened source sections are retained;');
  if(sourceDates[h.id])h.sourceDate=sourceDates[h.id];
  h.coverageNote+=' Identity evidence: '+h.identityBasis;
  if(h.sourceDate)h.coverageNote+=' Source age: '+h.sourceDate+'.';
  for(const j of h.jobs){
    j.evidenceNote='Opened source reports this role. '+(j.start.asWritten?'Start/period label: '+j.start.asWritten+'. ':'Start date not stated. ')+(j.end.asWritten?'End/continuation label: '+j.end.asWritten+'. ':'End date not stated. ')+(h.sourceDate?'Source age: '+h.sourceDate+'. ':'')+'Present/Current labels describe the source and do not independently prove continuity through the check date. Concurrent appointments are not separate primary-sector periods.';
    if(/Fellow|Graduate Teaching Assistant|Research Assistant/.test(j.titleAsWritten))j.evidenceNote+=' Paid employment is not established merely by a fellowship/student/assistant label.';
  }
  if(h.id==='roster:george-mason-university:ajay-vinze'){
    const j=h.jobs.find(j=>j.titleAsWritten==='Interim Provost and Executive Vice President');
    j.evidenceNote+=' The stated academic-year appointment is 2025–26; no exact beginning/end or current continuation is established.';
    h.remainingUnknowns.push('ASU CV Present entries are from 2015, not asserted current alongside GMU; Missouri/GMU transitions do not establish exact ASU end dates.');
  }
  if(h.id==='omlist-f9ce7142e1fb3ac8')h.coverageNote+=' The Georgia Southern page may retain an earlier affiliation; this observation does not replace the imported directory affiliation or establish current employment there.';
  if(h.id==='roster:the-pennsylvania-state-university:aggon-norm')h.coverageNote+=' No doctorate is established by this source; inclusion preserves a faculty-directory record and does not establish eligibility for a PhD graduate census.';
  if(['omlist-be6408f99285b14b','omlist-0a592c501ad7896b','omlist-b4418a219d786de2'].includes(h.id))h.remainingUnknowns.push('Official profile identifier/institution match supports this existing directory identity, but doctorate institution and/or conferral date were not independently reconfirmed in this source check. No new alias or degree correction is proposed.');
}
const output={checkedAt:'2026-10-20',authorization:'Owner explicitly requested review and publication of the 24 saved partial histories, with uncertainty clearly marked.',records,reviewChanges:changes,roleEntries:records.reduce((n,h)=>n+h.jobs.length,0),otherMentions:records.reduce((n,h)=>n+h.otherEmploymentMentions.length,0)};
fs.writeFileSync(`${base}/batches/2026-10-20-30-53-reviewed.json`,JSON.stringify(output,null,2)+'\n');
if(process.argv.includes('--integrate')){
  const publicPath='data/employment-histories.json';
  const data=JSON.parse(fs.readFileSync(publicPath,'utf8'));
  const linkedin=JSON.parse(fs.readFileSync('data/linkedin-histories.json','utf8'));
  const ids=new Set([...data.records,...linkedin.records].flatMap(h=>[h.id,...h.recordIds||[]]));
  for(const h of records)if(h.recordIds.some(id=>ids.has(id)))throw Error(`Refusing duplicate public history ${h.id}`);
  for(const h of records){
    data.records.push(h);
    const safe=h.id.replace(/[^a-zA-Z0-9._-]/g,'-');
    fs.writeFileSync(`${base}/histories/${safe}.json`,JSON.stringify(h,null,2)+'\n');
    fs.writeFileSync(`${base}/reviews/${safe}.json`,JSON.stringify({id:h.id,name:h.name,status:'partial',checkedAt:h.checkedAt,reason:h.coverageNote,sourceUrls:h.sourceUrls,nextStep:'Resolve source-age, missing-date, incomplete-section and stated doctorate-evidence limitations; no first-job or continuity inference.',integrationStatus:'Integrated into public career observations after explicit owner publication authorization, 20 October 2026.'},null,2)+'\n');
  }
  fs.writeFileSync(publicPath,JSON.stringify(data,null,2)+'\n');
}
console.log(`${records.length} reviewed partial histories; ${output.roleEntries} role entries; ${output.otherMentions} other mentions.`);
