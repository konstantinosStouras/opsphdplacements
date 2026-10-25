import fs from 'node:fs';
import path from 'node:path';
import {isCurrentPhdProgramme,isNamedOperationsProgramme,hasNamedOperationsScope} from '../../../../assets/program-model.js';

const root=path.resolve(import.meta.dirname,'../../../..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const assignments=read('research-handoff/universities/assignments.json');
const owned=new Set(assignments.shards.a.map(x=>x.id).filter(id=>assignments.overrides[id]!=='shard-b'));
const programmes=read('data/doctoral-programs.json').records;
const units=read('data/university-reviews.json').records.flatMap(x=>x.units);
const exclusions={
 'chalmers-university-of-technology--technology-management-economics-supply-operations-phd':{
  reason:'Formal doctoral school and award are Technology Management and Economics; host department has the same generic title. Supply and Operations Management is an officially named division whose staff teach in the broader PhD, not a named doctoral specialization or the hosting department/school.',
  urls:['https://www.chalmers.se/en/research/doctoral-studies/graduate-schools/technology-management-and-economics/','https://www.chalmers.se/en/departments/tme/research/supply-and-operations-management/'],
  sourceCheckedAt:'2026-10-25'
 },
 'aalborg-university--materials-mechanical-manufacturing-phd-operations':{
  reason:'Formal doctorate and host are Materials Science, Mechanical and Manufacturing Engineering / Department of Materials and Production. Operations Management and Logistics names a supervising research group, not the doctoral programme, named specialization, department or school.',
  urls:['https://www.phd.aau.dk/eng/organization-and-management','https://www.mp.aau.dk/research/research-areas/soim'],
  sourceCheckedAt:'2026-10-25'
 }
};
const holds={
 'erasmus-university-rotterdam--management-economics-bplis':{
  reason:'The named PhD specialization is Business Processes, Logistics and Information Systems, and the programme says ERIM hosts it. The linked Technology and Operations Management department belongs to founding school RSM; saved evidence does not yet prove that department directly hosts this specialization.',
  urls:['https://www.rsm.nl/faculty-research/phd-in-management/full-time-phd-programme/','https://www.rsm.nl/faculty-research/departments/technology-and-operations-management/'],sourceCheckedAt:'2026-10-25'
 },
 'ewha-womans-university--business-administration-management-decision-science':{
  reason:'Management Decision Science appears in MA/PhD curriculum, while a separate Management Science area title is linked. Confirm whether the latter is a formal doctoral concentration/host, rather than a general business research area; Management Decision Science alone does not match the exact title gate.',
  urls:['https://biz.ewha.ac.kr/bizeng/biz/curriculum-business-science.do'],sourceCheckedAt:'2026-10-21'
 },
 'kedge-business-school--business-administration-supply-chain-phd':{
  reason:'The broad Business Administration PhD and Supply Chain research pathway do not themselves match; KEDGE has a named Operations Management and Information Systems academic department, but the saved evidence does not establish this department as the actual host of this PhD pathway.',
  urls:['https://student.kedge.edu/programmes/phd-doctor-of-philosophy-in-business-administration','https://student.kedge.edu/faculty/departments/operations-management-and-information-systems-mosi'],sourceCheckedAt:'2026-10-22'
 },
 'hamad-bin-khalifa-university--logistics-supply-chain-management-phd':{
  reason:'The PhD is formally Logistics and Supply Chain Management. A current Division of Mechanical and Industrial Engineering inventory associates it, while the programme overview uses another host label (EMDS). Reconcile the host and decide whether a division is within the owner-approved department/school title gate before counting.',
  urls:['https://www.hbku.edu.qa/en/cse/phd-logistics-supply-chain-management','https://www.hbku.edu.qa/en/cse/divisions'],sourceCheckedAt:'2026-10-22'
 }
};
const decisions=programmes.filter(p=>owned.has(p.universityId)&&isCurrentPhdProgramme(p)&&isNamedOperationsProgramme(p,units)).map(p=>{
 const namedUnits=units.filter(u=>(p.unitIds||[]).includes(u.id)&&hasNamedOperationsScope(u.name)).map(u=>({id:u.id,name:u.name,type:u.type}));
 const ownNamed=['programName','specialization','department','school'].filter(k=>hasNamedOperationsScope(p[k]));
 const special=exclusions[p.id]||holds[p.id];
 const disposition=exclusions[p.id]?'exclude-from-qualifying-register':holds[p.id]?'hold-for-host-or-title-adjudication':'retain';
 const reason=special?.reason||(
  hasNamedOperationsScope(p.programName)?'Officially recorded doctoral programme/degree title itself contains the qualifying term.':
  hasNamedOperationsScope(p.specialization)?'Saved opened official evidence identifies this as a named doctoral specialization, field, concentration or programme research area.':
  hasNamedOperationsScope(p.department)||hasNamedOperationsScope(p.school)?'Saved opened official evidence links the route to a qualifying named academic host.':
  p.id==='georgia-institute-of-technology--algorithms-combinatorics-optimization-phd'?'Official joint doctorate is sponsored by the H. Milton Stewart School of Industrial and Systems Engineering; count once.':
  'Saved opened official evidence identifies the linked qualifying department/school as part of the doctoral route.'
 );
 return {programmeId:p.id,universityId:p.universityId,disposition,reason,originalCheckedAt:p.checkedAt,sourceCheckedAt:special?.sourceCheckedAt||p.checkedAt,officialSourceUrls:special?.urls||p.sources.filter(s=>s.access==='opened-and-read').slice(0,3).map(s=>s.url),titleEvidence:{programName:p.programName,specialization:p.specialization,department:p.department,school:p.school,namedUnits:disposition==='retain'?namedUnits:namedUnits},priorLimitations:p.limitations};
});
const out={auditDate:'2026-10-25',scope:'All currently public title-gated current research-doctorate routes belonging to frozen shard A, except explicit shard-B ownership override. Saved opened official evidence and original check dates; only Chalmers, Aalborg and Erasmus official pages were newly reopened by web on 25 October.',method:'Exact named programme title, degree-linked named specialization/field, or actual qualifying department/school host. Descriptive topic, supervisor, lab, chair, unrelated division or affiliation alone does not qualify. Hold unresolved host relations rather than infer.',counts:{reviewed:decisions.length,retain:decisions.filter(x=>x.disposition==='retain').length,exclude:decisions.filter(x=>x.disposition==='exclude-from-qualifying-register').length,hold:decisions.filter(x=>x.disposition==='hold-for-host-or-title-adjudication').length},decisions};
fs.writeFileSync(path.join(import.meta.dirname,'title-adjudication.json'),JSON.stringify(out,null,2)+'\n');
console.log(out.counts);
