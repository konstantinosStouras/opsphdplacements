import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const dir=new URL('.',import.meta.url),lane='research-handoff/parallel-stages-2026-10-26/stage-4/mit-or-2013';
const read=f=>JSON.parse(fs.readFileSync(f)),write=(f,v)=>fs.writeFileSync(f,JSON.stringify(v,null,2)+'\n');
const manifest=read(lane+'/publication-ready.json');
fs.mkdirSync(new URL('inputs/',dir),{recursive:true});
for(const f of manifest.files){const text=fs.readFileSync(lane+'/'+f.file,'utf8').replace(/\r\n/g,'\n');assert.equal(crypto.createHash('sha256').update(text).digest('hex'),f.sha256Lf);fs.writeFileSync(new URL('inputs/'+f.file,dir),text);}
write(new URL('inputs/publication-ready.json',dir),manifest);
const cohort=read(new URL('inputs/cohort-proposal.json',dir)),g=read('data/graduate-lists.json'),h=read('data/employment-histories.json');
const oldG=structuredClone(g.records),oldH=structuredClone(h.records);
const captureNames=['cristian-figueroa','matthieu-monsch','xin-lu','virot-chiraphadhanakul','matthew-william-fontana','philipp-wilhelm-keller'];
const captures=captureNames.map(n=>read(new URL('inputs/'+n+'.history-proposal.json',dir)));
const period=y=>({year:y,month:null,precision:y?'year':'unknown',asWritten:y?String(y):null});
const orc='https://orc.mit.edu/accordion_item/2013/',D='2026-10-28';
for(const p of cohort.records){
 const id=p.proposedGraduateId;assert(!g.records.some(x=>x.id===id),'Refuse replay');
 const linked=p.existingPersonId||null,raw=p.sourceNameAsWritten;
 const r={id,name:p.name,institution:'Massachusetts Institute of Technology',listedYear:2013,field:'operations',programId:'mit-operations-research-phd',facultyId:linked,match:linked?'reviewed-primary-source-identity':null,matchLeads:[],careerOwner:p.careerOwner,identityReview:{status:p.degreeEvidenceSourceUrl?'reviewed':'source-listed-professional-identity-unresolved',checkedAt:D,evidence:p.degreeEvidenceNote},sightings:[],degreeMilestones:[]};
 const sight=(url,name,note,meaning)=>({sourceUrl:url,pageUrl:url,sourceDate:null,checkedAt:D,archive:'live',name,yearMeaning:meaning,program:'PhD Operations Research',destination:null,position:null,degree:'PhD',note,extractedAt:D});
 r.sightings.push(sight(orc,raw,p.thesisTitle+'; listed '+p.thesisDateAsWritten+'. Thesis timing is not formal conferral.','thesis'));
 r.degreeMilestones.push({kind:'thesis-date',displayText:'ORC thesis list: '+p.thesisDateAsWritten,sourceUrl:orc,checkedAt:D,evidenceNote:p.thesisTitle,limitation:'Thesis timing is separate from degree completion and formal conferral.',formalAwardDateAssigned:false});
 if(p.degreeEvidenceSourceUrl){
  const li=p.degreeEvidenceSourceUrl.includes('linkedin.com');
  r.degreeReview={status:'reported-doctorate',period:period(li?null:2013),awardDay:null,field:'Operations Research',checkedAt:D,sourceUrl:p.degreeEvidenceSourceUrl,evidenceNote:p.degreeEvidenceNote,dateEvidenceMeaning:li?'Self-reported doctorate and study endpoint; formal award year not independently established.':'Reported doctorate year; no formal award date assigned.',limitations:['Formal award month/day unverified.','Source-bounded thesis list, not a class census.']};
  r.sightings.push(sight(p.degreeEvidenceSourceUrl,p.name,p.degreeEvidenceNote,'career-observation'));
 }
 if(p.name==='Yehua Wei'){
  r.identityReview.evidence='Exact thesis title in the individual Duke-hosted CV identifies Yehua Wei as author and David Simchi-Levi as adviser; ORC mistakenly lists the adviser. Original source name retained in the sighting.';
  r.sightings[0].note+=' Source lists David Simchi-Levi; author corrected to Yehua Wei using the exact-title primary CV.';
 }
 if(p.name.includes('O’Hair'))r.degreeMilestones.push({kind:'reported-completion',displayText:'Personal MIT biography reports receiving the PhD in June 2013.',sourceUrl:p.degreeEvidenceSourceUrl,checkedAt:D,evidenceNote:'Historical page last updated September 8, 2013; not current faculty-status evidence.',limitation:'Reported completion, not independently checked formal award day.',formalAwardDateAssigned:false});
 g.records.push(r);
 const cap=captures.find(c=>c.personId===id);if(!cap)continue;
 const rec=structuredClone(cap);delete rec.personId;delete rec.integrationStatus;
 rec.id=id;rec.recordIds=[];rec.reviewStatus='partial';rec.careerComplete=false;
 rec.identityBasis ||= 'Exact ORC thesis source name; external professional identity remains unresolved. No same-name professional profile accepted.';
 rec.coverageNote ||= 'Only the thesis listing is established; professional identity, degree completion and career remain unresolved.';
 rec.otherEmploymentMentions ||= [];
 rec.sources=[{url:orc,checkedAt:D,outcome:'read',note:p.thesisTitle}];
 if(cap.profileUrl)rec.sources.push({url:cap.profileUrl,checkedAt:D,outcome:'entire-accessible-experience-read-by-stage4-in-Chrome',note:cap.identityBasis});
 rec.linkedinSourceCapture=cap.profileUrl?structuredClone(cap):null;
 rec.degreeReview=r.degreeReview||null;
 rec.firstJobAssessment={status:'unresolved',reason:'Degree-to-employment ordering and earliest new appointment are not established. Source study endpoints and thesis months are not formal award dates.'};
 rec.remainingUnknowns=[...(rec.remainingUnknowns||[]),'Exact formal award date remains unknown; no continuous sector tenure inferred.'];
 const jobs=[];for(const j of rec.jobs){if(/intern|research assistant/i.test(j.titleAsWritten||''))rec.otherEmploymentMentions.push(j);else jobs.push(j);}rec.jobs=jobs;
 if(p.name==='Virot Chiraphadhanakul'){
  const cv=read(new URL('inputs/virot-university-cv-observations.json',dir));
  rec.sources.push({url:cv.sourceUrl,checkedAt:D,outcome:'read',note:'Entire one-page university-hosted CV read; source date unknown. DBA/MBA degree labels conflict with ORC/individual profile and are preserved, not silently corrected.'});
  for(const o of cv.employmentObservations)rec.otherEmploymentMentions.push({sourceUrl:cv.sourceUrl,checkedAt:D,evidenceNote:`Undated university CV: ${o.employer}, ${o.title}, ${o.startAsWritten}–${o.endAsWritten}. Corroborating or alternative-title observation of an existing role, not a duplicate appointment. Historical Present is not extended to 2026.`});
  rec.remainingUnknowns.push('University CV labels the doctorate DBA and the dual SM MBA; these credential conflicts remain unresolved. Skooldio Managing Director versus profile President is retained as a title variant.');
  r.sightings.push(sight(cv.sourceUrl,p.name,'University CV reports MIT Operations Research doctorate in 2013 but labels it DBA; profile reports PhD. Credential discrepancy retained; no formal award date assigned.','career-observation'));
 }
 assert(!h.records.some(x=>x.id===id));h.records.push(rec);
}
assert.deepEqual(g.records.slice(0,oldG.length),oldG);assert.deepEqual(h.records.slice(0,oldH.length),oldH);
const m=g.metadata;m.updatedAt=D;m.records=g.records.length;m.sightings=g.records.reduce((s,r)=>s+r.sightings.length,0);m.linkedToPeople=g.records.filter(r=>r.facultyId).length;
for(const k of Object.keys(m.byField))m.byField[k]=g.records.filter(r=>r.field===k).length;
for(const k of Object.keys(m.byArchive))m.byArchive[k]=g.records.flatMap(r=>r.sightings).filter(s=>(s.archive||'live')===k).length;
let c=m.coverage.find(c=>c.institution==='Massachusetts Institute of Technology'&&c.listedYear===2013);assert(c);
const all=g.records.filter(r=>r.institution===c.institution&&r.listedYear===2013);c.names=all.length;c.linked=all.filter(r=>r.facultyId).length;c.pages=[...new Set(all.flatMap(r=>r.sightings.map(s=>s.pageUrl)))];c.rosterStatus='partial';
write('data/graduate-lists.json',g);write('data/employment-histories.json',h);
write(new URL('applied.json',dir),{graduateRecordsAdded:10,partialHistoryRecordsAdded:6,structuredRolesAdded:h.records.slice(oldH.length).reduce((s,r)=>s+r.jobs.length,0),supportingMentionsAdded:h.records.slice(oldH.length).reduce((s,r)=>s+r.otherEmploymentMentions.length,0),firstJobsAdded:0,oldGraduateRecordsPreserved:oldG.length,oldHistoryRecordsPreserved:oldH.length,formalAwardMonthsAssigned:0,facultyLinks:3,remaining:'Fontana/Keller professional identity and degree completion; six graduate first jobs; four faculty career deferrals; exact award dates; credential/title conflicts.'});
