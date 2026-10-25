import test from 'node:test';
import assert from 'node:assert/strict';
import {validateDoctoralProposal,isPhdDegree,canResolveCredential} from './doctoral-proposal-schema.mjs';
import {isCurrentPhdProgramme,isNamedOperationsProgramme,hasNamedOperationsScope} from '../assets/program-model.js';
import {organisationRows} from '../assets/organisation-model.js';
test('official Science suffix remains one PhD credential, while other doctoral titles stay distinct',()=>{
 assert(isPhdDegree('Doctor of Philosophy - Science'));
 assert(isCurrentPhdProgramme({status:'active',degree:'Doctor of Philosophy - Science'}));
 assert(!isPhdDegree('Doctor of Business Administration - Science'));
});
test('Stage 1 public title gate keeps named Ops and IE awards without promoting unrelated engineering hosts',()=>{
 const hosts=[{id:'mechanical',name:'Department of Mechanical Engineering'},{id:'operations',name:'Department of Operations and Information Management'}];
 assert(isNamedOperationsProgramme({programName:'Doctor of Philosophy in Operations Research with Engineering',unitIds:['mechanical']},hosts));
 assert(isNamedOperationsProgramme({programName:'PhD in Management',specialization:'Operations Management',unitIds:[]},hosts));
 assert(isNamedOperationsProgramme({programName:'PhD in Management',unitIds:['operations']},hosts));
 assert(hasNamedOperationsScope('School of Industrial and Systems Engineering'));
 assert(!isNamedOperationsProgramme({programName:'PhD in Mechanical Engineering',unitIds:['mechanical']},hosts));
 assert(!hasNamedOperationsScope('Department of Mechanical Engineering'));
 assert(!hasNamedOperationsScope('PhD in Systems Engineering'));
});
const universities=[{id:'u'},{id:'other'}],reviews=[{id:'u',duplicateOf:null,units:[{id:'u--operations'}]},{id:'other',duplicateOf:null,units:[{id:'other--ie'}]}];
test('reviewed descriptive research topics cannot re-enter the named-title register',()=>{
 const p={programName:'PhD in Mechanical Engineering',specialization:'Operations Management laboratory research',unitIds:['lab'],titleScopeReview:{decision:'excluded'}};
 assert(!isNamedOperationsProgramme(p,[{id:'lab',name:'Operations Management Laboratory'}]));
 assert(isNamedOperationsProgramme({programName:'PhD in Mechanical Engineering',specialization:'Industrial Engineering',unitIds:[]}));
 assert.equal(p.specialization,'Operations Management laboratory research');
 assert(!isNamedOperationsProgramme({...p,titleScopeReview:{decision:'pending'}}));
 assert(hasNamedOperationsScope('Industrial and Process Engineering'));
 assert(hasNamedOperationsScope('Industrial and Process Safety Engineering'));
 assert(hasNamedOperationsScope('Industrial and Manufacturing Systems Engineering'));
 assert(hasNamedOperationsScope('Operational research'));
 assert(!hasNamedOperationsScope('Operational Technology'));
 assert(!hasNamedOperationsScope('Process Safety Engineering'));
});
const proposal=()=>({universityId:'u',checkedAt:'2026-10-21',status:'verified',programmes:[{id:'u--phd-om',programName:'Business Administration',degree:'PhD',specialization:'Operations Management',school:'Business School',department:null,unitIds:['u--operations'],fields:['Operations Management'],status:'active',sourceUrl:'https://example.edu/phd',checkedAt:'2026-10-21',evidence:'Official doctoral curriculum explicitly offers Operations Management specialization.',limitations:[]}],branches:[{branch:'business',conclusion:'Named doctoral track verified; engineering not yet checked.',sourceUrls:['https://example.edu/phd']}],sources:[{url:'https://example.edu/phd',checkedAt:'2026-10-21',outcome:'read',note:'Doctoral curriculum and exact specialization read.'}],limitations:['Engineering inventory remains to be checked.']});
test('doctoral evidence cannot be replaced by an unavailable source or a different university unit',()=>{
 assert.doesNotThrow(()=>validateDoctoralProposal(proposal(),universities,reviews));
 for(const change of [p=>p.sources[0].outcome='blocked',p=>p.programmes[0].checkedAt='2026-10-22',p=>p.programmes[0].unitIds=['other--ie'],p=>p.programmes=[],p=>p.programmes[0].school=undefined,p=>p.coverageComplete=true]){
  const p=proposal();change(p);assert.throws(()=>validateDoctoralProposal(p,universities,reviews));
 }
});
test('research PhD credentials remain distinct from DBA, generic doctoral wording and masters',()=>{
 for(const degree of ['PhD','Ph.D.','Doctor of Philosophy','DPhil','Doctor of Philosophy (PhD)','Doctor of Philosophy (Ph.D.)','PhD (Doctor of Philosophy)','Doctor of Philosophy in Engineering','PhD in Engineering Systems','Philosophiæ doctor (Ph. D.)','Philosophiae doctor (PhD)','PhD or ScD'])assert(isPhdDegree(degree));
 for(const degree of ['DBA','Doctoral Program','Doctorate','Master of Science'])assert(!isPhdDegree(degree));
});
test('current provider eligibility excludes training routes and unresolved or historical credentials',()=>{
 assert(isCurrentPhdProgramme({status:'active',degree:'PhD'}));
 assert(isCurrentPhdProgramme({status:'admissions-suspended',degree:'PhD'}));
 assert(isCurrentPhdProgramme({status:'active',degree:'Dr. sc.',phdEligibility:'verified-research-doctorate',researchDoctorateEvidence:{evidence:'Research doctorate'}}));
 for(const p of [{status:'closed',degree:'PhD'},{status:'active',degree:'PhD',programmeType:'research-training'},{status:'active',degree:'Doctoral degree',phdEligibility:'credential-unresolved'},{status:'active',degree:'DBA'}])assert(!isCurrentPhdProgramme(p));
});
test('explicit qualification evidence can resolve a generic placeholder but cannot convert an actual non-PhD award',()=>{
 const p={degree:'PhD',credentialResolutionEvidence:{sourceUrl:'https://example.edu/phd',checkedAt:'2026-10-21',evidence:'Official programme expressly identifies PhD qualification.'}};
 assert(canResolveCredential({degree:'Doctoral degree',phdEligibility:'credential-unresolved'},p));
 for(const degree of ['DBA','Doctor of Business Administration','Dr. rer. pol.','ScD'])assert(!canResolveCredential({degree,phdEligibility:'credential-unresolved'},p));
 assert(!canResolveCredential({degree:'Doctoral degree',phdEligibility:'credential-unresolved'},{degree:'PhD'}));
 const q=proposal();q.programmes[0].credentialResolutionEvidence=p.credentialResolutionEvidence;
 assert.throws(()=>validateDoctoralProposal(q,universities,reviews));
 q.programmes[0].existingProgramId='u--phd-om';assert.doesNotThrow(()=>validateDoctoralProposal(q,universities,reviews));
 q.programmes[0].credentialResolutionEvidence.sourceUrl='https://example.edu/unread';assert.throws(()=>validateDoctoralProposal(q,universities,reviews));
});
test('doctoral routes follow stable university IDs across official-name and alias changes',()=>{
 const u={id:'u',name:'Old English University',country:'Country',departments:[]};
 const alias={...u,id:'alias',name:'Business School Alias'};
 const r={id:'u',canonicalName:'Official Local Name',universitySourceUrl:'https://example.edu',checkedAt:'2026-10-21',status:'reviewed',units:[],limitations:[],decisions:[],duplicateOf:null};
 const entity={id:'entity',name:u.name,aliases:[u.name],country:'Country',directory:{universities:[{id:'alias'}]},programs:[]};
 const programme={id:'programme',universityId:'u',university:'A former programme label',programName:'Industrial Engineering',degree:'PhD',fields:[]};
 const rows=organisationRows({records:[entity]},{records:[u,alias]},{records:[r,{...r,id:'alias',duplicateOf:'u'}]},{records:[programme]},...Array.from({length:4},()=>({records:[]})));
 assert.equal(rows.length,1);assert.deepEqual(rows[0].programs.map(p=>p.id),['programme']);
});
