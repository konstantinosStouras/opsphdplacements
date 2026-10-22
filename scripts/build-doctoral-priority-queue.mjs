// Discovery prioritisation only: an imported degree institution is not programme evidence.
import fs from 'node:fs';
import {fold} from '../assets/model.js';
import {universityRows} from '../assets/university-model.js';
import {organisationRows} from '../assets/organisation-model.js';
import {isCurrentPhdProgramme} from '../assets/program-model.js';
const read=f=>JSON.parse(fs.readFileSync(f,'utf8'));
const universities=read('data/universities.json'),reviews=read('data/university-reviews.json'),programmes=read('data/doctoral-programs.json');
const faculty=read('data/faculty.json').records,assignments=read('research-handoff/universities/assignments.json');
const groups=universityRows(universities.records,reviews.records),byOriginal=new Map(groups.flatMap(g=>g.originals.map(o=>[o.id,g]))),byName=new Map();
const add=(name,g)=>{if(name&&g){const key=fold(name);byName.set(key,[...new Set([...(byName.get(key)||[]),g.id])]);}};
for(const g of groups)for(const name of [g.name,...g.originals.flatMap(o=>[o.name,...(o.spellings||[])])])add(name,g);
const organisations=organisationRows(read('data/entities.json'),universities,reviews,programmes,read('data/faculty.json'),read('data/faculty-roster-people.json'),read('data/employment-histories.json'),read('data/linkedin-histories.json'));
for(const o of organisations){const ids=[...new Set(o.entities.flatMap(e=>(e.directory?.universities||[]).map(u=>byOriginal.get(u.id)?.id)).filter(Boolean))];if(ids.length===1)for(const name of o.names)add(name,groups.find(g=>g.id===ids[0]));}
const owner=id=>assignments.overrides[id]||Object.entries(assignments.shards).find(([,rows])=>rows.some(r=>r.id===id))?.[0]?.replace(/^([abc])$/,'shard-$1')||'integrator';
const leads=new Map();let missing=0;
for(const p of faculty){if(!p.phdInstitution||['unknown','not reported','n a'].includes(fold(p.phdInstitution))){missing++;continue;}
 const ids=byName.get(fold(p.phdInstitution))||[],key=ids.length===1?ids[0]:'unresolved:'+fold(p.phdInstitution);
 const g=ids.length===1?groups.find(g=>g.id===ids[0]):null;
 let row=leads.get(key);if(!row){row={id:key,name:g?.name||p.phdInstitution,sourceUniversityIds:g?.originals.map(o=>o.id)||[],candidateUniversityIds:ids,identityMatch:g?'accepted university/entity name':'unresolved discovery label',reportedFacultyCount:0,reportedNames:[],facultyIds:[],sourceUrls:[],owners:[...new Set((g?.originals||[]).map(o=>owner(o.id)))],doctoralObservations:(g?.originals||[]).map(o=>reviews.records.find(r=>r.id===o.id)?.doctoralReview).filter(Boolean),verifiedCurrentProgrammeIds:programmes.records.filter(q=>isCurrentPhdProgramme(q)&&(q.universityId?g?.originals.some(o=>o.id===q.universityId):g&&fold(q.university)===fold(g.name))).map(q=>q.id)};leads.set(key,row);}
 row.reportedFacultyCount++;row.reportedNames.push(p.phdInstitution);row.facultyIds.push(p.id);if(p.phdInstitutionSourceUrl)row.sourceUrls.push(p.phdInstitutionSourceUrl);
}
const records=[...leads.values()].map(r=>({...r,reportedNames:[...new Set(r.reportedNames)],sourceUrls:[...new Set(r.sourceUrls)],branchCoverageComplete:r.doctoralObservations.some(d=>d.coverageComplete),nextStep:!r.sourceUniversityIds.length?'Resolve official identity and add/associate discovery record without speculative merge':r.doctoralObservations.some(d=>d.coverageComplete)?'Current scoped doctoral inventory checked; retain evidence and historical limitations':'Verify official current relevant doctoral routes across business and engineering; record branch gaps'})).sort((a,b)=>b.reportedFacultyCount-a.reportedFacultyCount||a.name.localeCompare(b.name));
const output={asOf:reviews.records.flatMap(r=>[r.checkedAt,r.doctoralReview?.checkedAt]).filter(Boolean).sort().at(-1),state:'Stage 1 discovery priority; Stage 2 held',method:'First verify PhD institutions reported by the 2,149 OM List faculty, ranked by number of reported faculty; then expand to other OM List/Operations Academia university and job-source candidates. Names are linked only by accepted exact aliases. Imported degree institutions do not establish relevant field, current doctoral provision, degree completion or uninterrupted programme history.',totalOmListFaculty:faculty.length,facultyWithoutNamedPhdInstitution:missing,distinctReportedInstitutionLabels:new Set(faculty.filter(p=>p.phdInstitution).map(p=>p.phdInstitution)).size,rankedInstitutionLeads:records.length,matchedLeads:records.filter(r=>r.sourceUniversityIds.length).length,unresolvedLeads:records.filter(r=>!r.sourceUniversityIds.length).length,withVerifiedCurrentRoutes:records.filter(r=>r.verifiedCurrentProgrammeIds.length).length,withCompletedCurrentBranchScope:records.filter(r=>r.branchCoverageComplete).length,records};
fs.writeFileSync('research-handoff/priorities/stage-1-doctoral-priority-queue.json',JSON.stringify(output,null,2)+'\n');
console.log({...output,records:undefined});
