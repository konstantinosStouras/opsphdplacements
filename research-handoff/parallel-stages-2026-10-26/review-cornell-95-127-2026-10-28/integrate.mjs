// One-shot reviewed additive integration. Never replay over a later publication.
import fs from 'node:fs';
import crypto from 'node:crypto';
const base='research-handoff/parallel-stages-2026-10-26/review-cornell-95-127-2026-10-28',lane='research-handoff/parallel-stages-2026-10-26/stage-3';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,'')),write=(p,x)=>fs.writeFileSync(p,JSON.stringify(x,null,2)+'\n'),clone=x=>structuredClone(x),sha=x=>crypto.createHash('sha256').update(x).digest('hex');
if(fs.existsSync(`${base}/audit.json`))throw Error('Already applied');
const d=read('data/employment-histories.json'),original=clone(d),by=new Map(d.records.map(h=>[h.id,h])),inputs=new Map(),latest=new Map(),manifest=[];
fs.mkdirSync(`${base}/inputs`,{recursive:true});fs.mkdirSync('research/cornell-95-127-before',{recursive:true});
for(const name of fs.readdirSync('data').filter(n=>n.endsWith('.json')))fs.copyFileSync(`data/${name}`,`research/cornell-95-127-before/${name}`);
for(let n=95;n<=127;n++){const m=read(`${lane}/career-continuation-${n}.ready.json`),p=read(`${lane}/${m.files[0].path}`);inputs.set(n,p);latest.set(p.id,n);const raw=fs.readFileSync(`${lane}/${m.files[0].path}`);fs.copyFileSync(`${lane}/${m.files[0].path}`,`${base}/inputs/${n}.json`);manifest.push({correction:n,id:p.id,name:p.name,originalPath:m.files[0].path,sha256:sha(raw)});}
const notes={
100:'The June 2021 examiner reference does not establish completion. The successful September 2021 defense and September postdoctoral start still cannot be ordered within that month.',
99:'The Stanford 2023 commencement entry lists degree candidates and explicitly does not guarantee an award. The adviser CV repeats Yuchen Wu with conflicting dissertation titles; neither resolves the degree date.',
101:'A contemporary CRM prize biography reports the Waterloo move in 1988, supporting the detailed CV rather than the short biography’s 1989. It does not establish the ordering relative to the August 1988 ANU visit.',
103:'The June 25, 2026 college announcement names Dan Kowal as successor to Wells as director of undergraduate studies. The undated leadership page still names Wells; the effective handover date remains unknown.',
107:'The June 1977 Michigan State commencement program lists Ruppert among spring-term candidates. Candidate inclusion and the ceremony date do not independently establish his degree completion date.',
112:'MIT announced a thesis defense for July 31, 2017. The event announcement does not establish a successful defense or override the CV’s September degree date.',
113:'The adviser’s graduated-students list reports August 2013. The Stanford postdoctoral start is also August 2013, so ordering within the month remains unresolved.',
114:'Northwestern’s retrospective PhD graduates register gives Spring 2019, resolving the earlier prospective graduation evidence. The Cornell postdoctoral role began in July 2019.',
117:'The contemporaneous Cornell announcement establishes the second chair term began in August 2020 and names a successor effective July 1, 2024; the conference biography’s 2023 endpoint conflicts. A 2011 CWI volume also disagrees internally between Microsoft and MIT sabbatical affiliations, so no separate Microsoft employment interval is inferred.',
118:'The Georgia Tech Fall 2011 school magazine reports the assistant-professor appointment began August 10, 2011, after completion of the MIT doctorate.',
121:'The former employer explicitly reports receiving the PhD in Spring 2011; the adviser’s May 2011 thesis/first-employment table corroborates the sequence. The historical CV separately lists the concurrent HDSI associate-professor appointment from 2019; its endpoint is unknown.',
122:'The November 14, 2023 incoming Operations Research editorial-board announcement names Jim Dai as a backup editor in chief for conflicts of interest. This is editorial service, not a new employer; a personal effective appointment date is not stated.',
125:'The historical short CV explicitly lists visiting appointments at IBM T.J. Watson and the University of Auckland. Dates, rank and compensation are not stated.',
127:'Conference proceedings independently place Chazal at ULB on February 9–10, 2012. This is an affiliation observation, not an appointment endpoint. The Binghamton namesake remains an unmerged identity candidate.'
};
const skip=new Set([97,98,110,111]);
for(const [id,n] of latest){const p=inputs.get(n),h=by.get(id);if(!h||skip.has(n))continue;
 const oldUrls=new Set((h.sources||[]).map(s=>s.url));const fresh=(p.sources||[]).filter(s=>!oldUrls.has(s.url));h.sources.push(...clone(fresh));
 // Only source-backed additional degree observations, never replace existing facts.
 for(const f of p.degreeFacts||[]){if(!(h.degreeFacts||[]).some(x=>x.sourceUrl===f.sourceUrl)){(h.degreeFacts??=[]).push(clone(f));}}
 if(notes[n]){const s=fresh.find(s=>!/(unavailable|discovery|candidateonly)/i.test(s.outcome||''))||p.sources.at(-1);(h.otherEmploymentMentions??=[]).push({sourceUrl:s.url,checkedAt:s.checkedAt||'2026-10-27',evidenceNote:notes[n]});}
 h.careerComplete=false;h.reviewStatus='partial';
}
function hist(n){return by.get(inputs.get(n).id)}
function proposedJob(n,pred){const j=inputs.get(n).jobs.find(pred);if(!j)throw Error('Missing proposed role '+n);return clone(j)}
const wells=hist(103),dus=wells.jobs.findIndex(j=>j.titleAsWritten.startsWith('Director of Undergraduate'));
wells.jobs[dus]=proposedJob(103,j=>j.titleAsWritten.startsWith('Director of Undergraduate'));
wells.jobs[dus].evidenceNote=notes[103];wells.jobs.push(proposedJob(103,j=>j.titleAsWritten==='Department Chair'));
// Administration was already preserved as supporting activity; refine there rather than create a duplicate job.
const tardos=hist(117),chair=proposedJob(117,j=>j.titleAsWritten==='Chair, Department of Computer Science'&&j.start.year===2020);
const oldChair=tardos.jobs.findIndex(j=>j.titleAsWritten==='Chair, Department of Computer Science'&&j.start.year===2020);
if(oldChair>=0)tardos.jobs[oldChair]=chair;else{
 const a=tardos.otherEmploymentMentions.find(x=>/Chair, Department of Computer Science/.test(x.titleAsWritten||x.title||'')&&JSON.stringify(x).includes('2020'));
 if(a)Object.assign(a,chair,{evidenceNote:notes[117]});else tardos.otherEmploymentMentions.push({...chair,evidenceNote:notes[117]});
}
const gold=hist(118),gi=gold.jobs.findIndex(j=>j.employerAsWritten==='Georgia Institute of Technology'&&j.titleAsWritten==='Assistant Professor');gold.jobs[gi]=proposedJob(118,j=>j.employerAsWritten==='Georgia Institute of Technology'&&j.titleAsWritten==='Assistant Professor');gold.jobs[gi].evidenceNote=notes[118];
hist(121).jobs.push(proposedJob(121,j=>j.employerAsWritten.includes('Halicioglu')));
hist(125).jobs.push(...inputs.get(125).jobs.filter(j=>j.sourceUrl==='https://people.orie.cornell.edu/miketodd/shortvita.pdf').map(j=>({...clone(j),evidenceNote:notes[125]})));
const reasons={104:'The Cornell biography explicitly places the UBC postdoctoral fellowship after completing the 1998 PhD. The CV dates that fellowship to 1998–1999. Bell Labs employment began in 1994, before the doctorate, so its continuation does not displace the first documented new post-degree appointment. Exact months remain unknown.',108:'The 2026 CV dates the Cornell PhD to May 2007, NSG employment to July 2006–June 2008, and the Tsinghua postdoc to August 2008–August 2010. The contemporary Tsinghua biography confirms NSG work spanned thesis writing and completion. Tsinghua is therefore the earliest documented new post-degree appointment; continuing pre-degree employment is retained separately.',114:'Northwestern’s retrospective PhD graduates register lists Spring 2019. The individually read LinkedIn history reports the Cornell postdoc from July 2019, corroborated by the October 2019 Cornell biography. Earlier FERC and Oliver Wyman work preceded the doctorate. Exact conferral day remains unknown.'};
const ledger=read('data/research-status.json').records,rows=[];
for(const [n,year,phdYear,phdInst] of [[104,1998,1998,'Georgia Institute of Technology'],[108,2008,2007,'Cornell University'],[114,2019,2019,'Northwestern University']]){const p=inputs.get(n),h=hist(n),a=p.firstJobAssessment,reason=reasons[n],urls=a.evidenceUrls.filter(u=>n!==104||!u.includes('amazon'));const sources=urls.map(url=>({url,title:`${h.name}: degree and career sequence`,checkedAt:url.includes('linkedin')?'2026-10-27':'2026-10-28'}));
 rows.push({facultyId:h.id,name:ledger.find(r=>r.facultyId===h.id).name,status:'verified',checkedAt:'2026-10-28',reason,sources,source:'faculty-page',employer:a.candidateEmployer,position:a.candidatePosition,placementYear:year,category:'postdoc',phdYearVerified:phdYear,phdInstitutionVerified:phdInst,evidenceUrl:urls[0],evidenceNote:reason});
 h.firstJobAssessment={status:'verified-earliest-documented-new-post-degree-job',employer:a.candidateEmployer,placementYear:year,reason,evidenceUrls:urls,reviewedAt:'2026-10-28'};
 h.remainingUnknowns=(h.remainingUnknowns||[]).filter(t=>!/(first.*(ordering|unresolved)|formal.*degree.*month|BellLabs.*endmonth)/i.test(t));h.remainingUnknowns.push('The first documented new post-degree appointment is supported; exact degree and earlier-job endpoints and the full lifetime career remain incomplete.');
}
const changed=d.records.filter((r,i)=>JSON.stringify(r)!==JSON.stringify(original.records[i]));
for(const m of manifest){const h=by.get(m.id),n=latest.get(m.id);m.disposition=!h?'held-outside-accepted-scope':n!==m.correction?`superseded-by-${n}`:skip.has(n)?'already-published-or-no-supported-change':'reviewed-additive-findings-integrated';m.firstJobAdded=[104,108,114].includes(m.correction);}
write(`${base}/inputs-manifest.json`,manifest);write(`${base}/prior-records.json`,original.records.filter(r=>changed.some(c=>c.id===r.id)));write(`${base}/first-job-proposals.json`,{records:rows});write('data/employment-histories.json',d);
write(`${base}/audit.json`,{reviewedCorrections:33,uniquePeople:latest.size,heldPeople:[...latest].filter(([id])=>!by.has(id)).map(([id,n])=>({id,name:inputs.get(n).name,correction:n})),changedHistories:changed.map(h=>({id:h.id,name:h.name,priorRoles:original.records.find(r=>r.id===h.id).jobs.length,roles:h.jobs.length})),newFirstJobs:rows.map(r=>({name:r.name,employer:r.employer,year:r.placementYear})),allCareersRemainPartial:true});
console.log(JSON.stringify({histories:changed.length,firstJobs:rows.length,people:latest.size}));
