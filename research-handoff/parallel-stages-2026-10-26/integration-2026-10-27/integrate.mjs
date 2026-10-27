import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const base='research-handoff/parallel-stages-2026-10-26';
const out=base+'/integration-2026-10-27';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const write=(p,o)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,JSON.stringify(o,null,2)+'\n');};
const clone=o=>structuredClone(o);
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const mode=process.argv[2];
if(mode==='freeze'){
 if(fs.existsSync(out+'/frozen-inputs.json'))throw Error('Frozen input cut already exists');
 const manifest=[];
 for(const lane of ['stage-2','stage-3'])for(const rel of fs.readdirSync(base+'/'+lane,{recursive:true}).filter(p=>p.endsWith('.json'))){
  const src=base+'/'+lane+'/'+rel,dst=out+'/inputs/'+lane+'/'+rel;read(src);fs.mkdirSync(path.dirname(dst),{recursive:true});fs.copyFileSync(src,dst);manifest.push({path:lane+'/'+rel.replaceAll('\\','/'),sha256:hash(dst)});
 }
 fs.mkdirSync('research/integration-2026-10-27/prior',{recursive:true});
 for(const f of fs.readdirSync('data').filter(f=>f.endsWith('.json')))fs.copyFileSync('data/'+f,'research/integration-2026-10-27/prior/'+f);
 write(out+'/frozen-inputs.json',{frozenAt:new Date().toISOString(),files:manifest});
 console.log('Frozen',manifest.length,'proposal files; prior public data retained in ignored audit cache.');
 process.exit();
}
if(mode!=='apply')throw Error('Use freeze or apply');
if(fs.existsSync(out+'/integration-result.json'))throw Error('Already applied; review before any replay');
for(const f of read(out+'/frozen-inputs.json').files)if(hash(out+'/inputs/'+f.path)!==f.sha256)throw Error('Input changed '+f.path);
const s2=out+'/inputs/stage-2/',s3=out+'/inputs/stage-3/';
const people=[...read('data/faculty.json').records,...read('data/faculty-roster-people.json').records];
const peopleById=new Map(people.map(p=>[p.id,p]));
const roster=read('data/faculty-rosters.json'), rosterById=new Map(roster.records.map(r=>[r.id,r]));
const captured=read(s3+'cornell-orie-roster-2026-10-26.json');
const identities=read(s3+'cornell-identities.reviewed.json').records;
const doikov=read(s3+'nikita-doikov.history.json');
identities.push({rosterIndex:7,name:doikov.name,personId:doikov.id,titleConfirmed:'Assistant Professor',degreeInstitution:'UCLouvain',degreeYear:2021,degreeTitle:'Ph.D. (Engineering and Technology)',sourceUrl:doikov.degreeFacts[0].sourceUrl,checkedAt:'2026-10-26',identityBasis:doikov.identityBasis,evidenceNote:doikov.degreeFacts[0].evidenceNote,employmentMentions:[]});
const byIndex=new Map(identities.map(r=>[r.rosterIndex,r]));
const dep={id:'cornell-university__school-of-operations-research-and-information-engineering-or',school:'School of Operations Research and Information Engineering',department:null,type:'University'};
const decisions=[],accepted=[];
const slug=s=>s.normalize('NFD').replace(/\p{M}/gu,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
for(let i=0;i<captured.records.length;i++){
 const c=captured.records[i],v=byIndex.get(i+1),staff=/Staff/.test(c.section),om=v?.personId?.startsWith('omlist-'),existing=v&&peopleById.has(v.personId);
 const eligible=!staff&&v&&c.section!=='Graduate Field Faculty'&&v.name!=='Sam Ganzfried';
 const id=om?'roster:cornell-university:'+slug(c.nameAsWritten):(v?.personId||'roster:cornell-university:'+slug(c.nameAsWritten));
 let r=rosterById.get(id);
 const disposition=staff?'staff-not-faculty':om?'existing-om-list-link':existing?'existing-faculty-link':eligible?'accepted-new-faculty':'held-population-scope';
 decisions.push({observationId:c.observationId,name:c.nameAsWritten,id,personId:v?.personId||null,section:c.section,disposition,reason:staff?'Administrative staff excluded from faculty register.':om||existing?'Official linked profile, appointment and doctorate comparison support existing identity.':eligible?'Named ORIE core/emeritus/research-teaching roster appointment and individually opened official identity source support faculty inclusion; doctorate subject is not relabeled.':'Graduate-field affiliation alone or Fellow title does not establish a qualifying faculty appointment; retained for individual scope review.'});
 if(!r){r={id,name:c.nameAsWritten,titleAsListed:c.titleAsWritten,listedRole:staff?'staff':'faculty',extraction:'individually-read-official-roster',profileUrl:c.profileUrl,university:'Cornell University',universityId:'cornell-university',entityId:'wd:Q49115',country:'United States',departments:[dep],facultyUrls:[captured.sourceUrl],retrievedAt:c.checkedAt,omList:null,phdInstitution:null,phdYear:null,researchStatus:null,firstJob:null,verification:'unverified'};roster.records.push(r);rosterById.set(id,r);}
 else {r.facultyUrls=[...new Set([...r.facultyUrls,captured.sourceUrl])];if(!r.departments.some(d=>d.id===dep.id))r.departments.push(dep);r.additionalRosterObservations=[...(r.additionalRosterObservations||[]),{sourceUrl:captured.sourceUrl,checkedAt:c.checkedAt,section:c.section,titleAsWritten:c.titleAsWritten,profileUrl:c.profileUrl}];}
 if(!existing){
  const reason=decisions.at(-1).reason+' '+(v?.evidenceNote||v?.identityBasis||'')+(v?.degreeTitle?' Degree as written: '+v.degreeTitle+'.':'')+(v?.limitation?' '+v.limitation:'');
  r.review={status:staff?'extraction-noise':om?'same-as-om-list':eligible?'confirmed-faculty':'unresolved',checkedAt:c.checkedAt,reason,sources:[{url:captured.sourceUrl,title:'Cornell ORIE faculty and staff roster',notes:c.section+'; individually read 26 October 2026.'},...(v?[{url:v.sourceUrl,title:v.name+' — official individual profile',notes:v.evidenceNote||v.identityBasis||'Individual appointment and education reviewed.'}]:[])],profileUrl:v?.sourceUrl||c.profileUrl,titleConfirmed:v?.titleConfirmed||c.titleAsWritten,areaConfirmed:eligible?'School of Operations Research and Information Engineering':null,phdInstitution:eligible?v.degreeInstitution||null:null,phdYear:eligible?v.degreeYear??null:null,phdSourceUrl:eligible&&v.degreeInstitution?v.sourceUrl:null,omListFacultyId:om?v.personId:null,note:staff?'Roster staff observation; not a faculty identity.':null};
 }
 if(eligible||existing&&!om)accepted.push(v);
}
roster.pages.push({url:captured.sourceUrl,status:200,rendered:true,retrievedAt:'2026-10-26',error:null,listed:89,departments:[dep.id],accessMethod:captured.accessMethod});
const count=f=>roster.records.filter(f).length,counts=roster.metadata.counts;
counts.people=roster.records.length;counts.unverified=count(r=>r.verification==='unverified');counts.reviewed=count(r=>r.review);counts.reviewOutcomes={};counts.unverifiedByListedRole={};
for(const r of roster.records){if(r.review)counts.reviewOutcomes[r.review.status]=(counts.reviewOutcomes[r.review.status]||0)+1;if(r.verification==='unverified')counts.unverifiedByListedRole[r.listedRole]=(counts.unverifiedByListedRole[r.listedRole]||0)+1;}
for(const u of roster.universities){const rs=roster.records.filter(r=>r.universityId===u.universityId);u.listed=rs.length;u.reviewed=rs.filter(r=>r.review).length;u.unverified=rs.filter(r=>r.verification==='unverified').length;}
roster.metadata.pages.total++;roster.metadata.pages.fetched++;roster.metadata.pages.withPeople++;roster.metadata.pages.rendered++;roster.metadata.reviewsUpdatedAt='2026-10-26';
write('data/faculty-rosters.json',roster);write(out+'/identity-decisions.json',decisions);
const stores=['employment-histories','linkedin-histories'].map(n=>({name:n,data:read('data/'+n+'.json')}));
const findHistory=id=>stores.flatMap(s=>s.data.records).find(h=>h.id===id||h.recordIds?.includes(id));
const strip=p=>{const h=clone(p);for(const k of ['integrationStatus','personId','addedAt','updatedAt'])delete h[k];return h;};
const repairNotes=h=>{for(const j of [...h.jobs,...(h.otherEmploymentMentions||[])])if(!j.evidenceNote)j.evidenceNote=`${j.titleAsWritten||'Role not specified'} at ${j.employerAsWritten||'employer not specified'} is stated in the reviewed ${j.sourceType==='cv'?'CV':'official biography'}. Dates are retained as written (${j.start?.asWritten||'start unknown'}; ${j.end?.asWritten||'end unknown'}); no missing date or continuous tenure inferred.`;return h;};
const histAudit=[];
for(const v of accepted){
 const file=fs.readdirSync(s3+'histories').find(f=>read(s3+'histories/'+f).id===v.personId);
 let proposal=v.personId===doikov.id?doikov:file?read(s3+'histories/'+file):null;
 let h=findHistory(v.personId);
 if(proposal){if(h)throw Error('Detailed Stage3 history already exists; reconcile '+v.personId);h=repairNotes(strip(proposal));h.reviewStatus='partial';h.careerComplete=false;h.integrationReview={checkedAt:'2026-10-27',basis:'Reviewed frozen source observations and identity linkage; original source-check dates retained.'};
  if(v.name==='Brenda Dietrich'){const idx=h.jobs.findIndex(j=>j.titleAsWritten==='IBM Fellow');h.otherEmploymentMentions.push({...h.jobs[idx],evidenceNote:'IBM Fellow distinction in 2007; not counted as a separate employment appointment. '+h.jobs[idx].evidenceNote});h.jobs.splice(idx,1);}
  if(v.name==='Nikhil Garg'){const mentions=h.jobs.filter(j=>/title unspecified/.test(j.titleAsWritten||'')||j.employerAsWritten==='GreenEarth');h.jobs=h.jobs.filter(j=>!mentions.includes(j));h.otherEmploymentMentions.push(...mentions.map(j=>({...j,evidenceNote:'Research-group/service affiliation; employment or remuneration not established. '+j.evidenceNote})));}
  if(v.name==='Marie Chazal')h.otherEmploymentMentions=h.otherEmploymentMentions.filter(j=>!j.sourceUrl.includes('binghamton.edu'));
  stores[0].data.records.push(h);
 }else if(!h){h={id:v.personId,name:v.name,recordIds:[],checkedAt:v.checkedAt,reviewer:'Codex; Stage 3 official-profile observations reviewed by integrator',identityBasis:v.identityBasis||'Individually opened official profile linked from named ORIE roster.',coverageNote:'Official profile employment mentions only; linked CV and full career follow-up remain incomplete.',reviewStatus:'partial',careerComplete:false,jobs:[],otherEmploymentMentions:[],remainingUnknowns:['Linked-source chronology and first post-PhD job remain unverified.'],accessLimitations:[]};stores[0].data.records.push(h);}
 if(!proposal){h.otherEmploymentMentions.push(...(v.employmentMentions||[]).map(t=>({sourceUrl:v.sourceUrl,checkedAt:v.checkedAt,evidenceNote:t+'; source-limited biography observation, not an independently dated new appointment.'})));h.checkedAt='2026-10-26';}
 if(v.degreeInstitution)h.degreeFacts=[...(h.degreeFacts||[]),{institutionAsWritten:v.degreeInstitution,degreeAsWritten:v.degreeTitle||'Doctorate stated by official profile',year:v.degreeYear??null,sourceUrl:v.sourceUrl,checkedAt:v.checkedAt,evidenceNote:v.evidenceNote||'Doctorate information stated on individually reviewed official profile; exact credential and unknown dates retained.'}];
 histAudit.push({stage:3,id:h.id,name:h.name,jobs:h.jobs.length,mentions:h.otherEmploymentMentions.length});
}
const ledger=read('data/research-status.json'),ledgerById=new Map(ledger.records.map(r=>[r.facultyId,r])),updates=new Map();
for(const f of fs.readdirSync(s2+'reviews').filter(f=>f.endsWith('.json'))){const p=read(s2+'reviews/'+f),h=findHistory(p.personId);if(!h)throw Error('Missing Stage2 history '+p.personId);h.previousCoverageNotes=[...(h.previousCoverageNotes||[]),{checkedAt:h.checkedAt,coverageNote:h.coverageNote}];h.checkedAt=p.checkedAt;h.reviewStatus='partial';h.careerComplete=false;h.coverageNote+=' Follow-up on 26 October 2026 adds individually checked official/identity-linked observations; earlier successful source dates remain unchanged.';h.otherEmploymentMentions.push(...(p.historyObservation?.otherEmploymentMentions||[]));h.remainingUnknowns=[...new Set([...h.remainingUnknowns,...(p.remainingUnknowns||[]),...(p.historyObservation?.remainingUnknowns||[])])];h.accessLimitations=[...new Set([...h.accessLimitations,...(p.accessLimitations||[]),...(p.historyObservation?.accessLimitations||[])])];if(p.conflicts)h.sourceConflicts=[...(h.sourceConflicts||[]),...p.conflicts];histAudit.push({stage:2,id:h.id,name:h.name});}
for(const id of ['omlist-8190a06eee7eb70d','omlist-a173b96254688dad']){
 const h=findHistory(id),old=clone(h.jobs),p=read(s2+'histories/'+id+'.orcid.json');
 const li=id==='omlist-a173b96254688dad'?read(s2+'histories/'+id+'.linkedin.json'):null;
 h.jobs=[...(li?.jobs||[]),...p.jobs];h.otherEmploymentMentions.push(...old.map(j=>({...j,evidenceNote:'Earlier corroborating observation of an appointment now dated by linked sources; not an additional job. '+j.evidenceNote})),...p.otherEmploymentMentions);h.identityBasis=p.identityBasis;h.coverageNote=p.coverageNote+(li?' '+li.coverageNote:'');h.remainingUnknowns=[...new Set([...h.remainingUnknowns,...p.remainingUnknowns])];if(li)h.linkedInCaptures=[{profileUrl:li.profileUrl,checkedAt:li.checkedAt,experienceAccess:li.experienceAccess,profileHistoryComplete:true,coverageNote:li.coverageNote}];
}
{
 const id='omlist-8ba10b8b761608fd',h=findHistory(id),p=read(s2+'histories/'+id+'.linkedin.json');
 const pairs=[[0,0],[1,1],[4,2],[5,4],[6,5],[7,6]];
 for(const [oldIndex,newIndex]of pairs){const old=h.jobs[oldIndex];h.otherEmploymentMentions.push({...clone(old),evidenceNote:'Earlier CV observation of the same role; retained separately from the later self-reported chronology, not an additional job. '+old.evidenceNote});h.jobs[oldIndex]={...p.jobs[newIndex],evidenceNote:p.jobs[newIndex].evidenceNote+([1,5].includes(oldIndex)?' Dates differ from older CV; both source assertions retained in supporting notes.':'')};}
 h.otherEmploymentMentions.push({...p.jobs[3],evidenceNote:'Aggregate Namur span corroborates two earlier title-specific CV entries; not a third Namur appointment.'},...p.otherEmploymentMentions);h.linkedInCaptures=[{profileUrl:p.profileUrl,checkedAt:p.checkedAt,experienceAccess:p.experienceAccess,profileHistoryComplete:true,coverageNote:p.coverageNote}];h.remainingUnknowns=h.remainingUnknowns.filter(t=>!t.startsWith('Doctoral education is a 2006'));h.remainingUnknowns.push('Official Clemson degree listing corroborates 2010; conferral month remains unknown.');
}
for(const f of fs.readdirSync(s2+'degrees')){
 const d=read(s2+'degrees/'+f),h=findHistory(d.facultyId),fact=strip(d);h.degreeFacts=[...(h.degreeFacts||[]),fact];
 const r=clone(ledgerById.get(d.facultyId));const sourceUrl=d.sourceUrl||d.evidenceUrl;
 r.degreeEvidence=[...(r.degreeEvidence||[]),fact];r.sources.push({url:sourceUrl,title:d.name+' — doctorate evidence',checkedAt:d.checkedAt,notes:d.evidenceNote});
 r.reason+=' Degree follow-up checked 26 October 2026: '+d.evidenceNote+' '+(d.limitations||[]).join(' ');
 if(d.year&&d.facultyId!=='omlist-a173b96254688dad'){r.phdYearVerified=d.year;r.phdYearResolution='Official awarded-degree listing confirms '+d.year+'; source checked '+d.checkedAt+'. '+(d.unknowns||[]).join(' ');}
 if(d.facultyId==='omlist-2b94f410fafe4aab')r.phdInstitutionVerified='Kwame Nkrumah University of Science and Technology';
 updates.set(d.facultyId,r);
}
{
 const p=read(s2+'placements/omlist-a173b96254688dad.json')[0],old=ledgerById.get(p.facultyId);
 const r={...clone(old),...p,reason:'The prior unresolved CIBC/Delaware ordering is resolved by the individually read full LinkedIn Experience and Toronto doctorate metadata. CIBC is dated April–September 2020; the recorded Ph.D. acceptance/convocation month is November 2020; Delaware begins March 2021. Delaware is the earliest documented new post-PhD appointment in these sources. Exact degree day and any unlisted employment remain unknown.',previousReview:clone(old),degreeEvidence:updates.get(p.facultyId).degreeEvidence};
 r.sources=[...old.sources,...p.sources];r.evidenceNote=r.reason;updates.set(r.facultyId,r);
}
for(const s of stores)write('data/'+s.name+'.json',s.data);
write(out+'/placement-and-degree-updates.json',[...updates.values()]);
write(out+'/integration-result.json',{checkedAt:'2026-10-27',newFaculty:decisions.filter(d=>d.disposition==='accepted-new-faculty').length,existingLinks:decisions.filter(d=>/existing/.test(d.disposition)).length,held:decisions.filter(d=>d.disposition==='held-population-scope').length,staff:decisions.filter(d=>d.disposition==='staff-not-faculty').length,histories:histAudit,firstJobProposals:1,degreeEvidenceUpdates:updates.size,limitations:['All career histories remain partial.','Graduate-field-only identities and Maxwell Fellow held outside faculty register.','Muntaka provisional LinkedIn identity, Roy unread CV and Chazal Binghamton candidate excluded.','No doctorate date inferred from Aaron education range or Elidrissi defence date.','No Stage 4 proposals included in this release.']});
console.log(JSON.stringify(read(out+'/integration-result.json')));
