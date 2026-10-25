import {fold} from './model.js';
export const isPhdDegree=v=>/^(?:(?:phd|ph d)(?: doctor of philosophy| or scd| or sc d)?|doctor of philosophy(?: phd| ph d)?|philosophi(?:æ|ae) doctor (?:phd|ph d)|dphil|d phil)(?: in .+| science)?$/.test(fold(v));
// An extant programme with suspended admissions is not a closed programme.
export const isCurrentPhdProgramme=p=>['active','admissions-suspended'].includes(p.status)&&p.programmeType!=='research-training'&&(isPhdDegree(p.degree)&&p.phdEligibility!=='credential-unresolved'||p.phdEligibility==='verified-research-doctorate'&&!!p.researchDoctorateEvidence);
// Stage 1's public gate uses official titles, not inferred research relevance.
export const hasNamedOperationsScope=name=>/operations|operational research|recherche operationnelle\b|investigacion (?:operativa|de operaciones)|gestao de operacoes|gestion de operaciones|επιχειρησιακων λειτουργιων|management science|genie industriel|ingegneria industriale\b|ingenierias? industrial(?:es)?\b|industrial(?:\s+(?:(?:and|&)\s+)?(?:systems?|human factors|management(?: systems?)?|manufacturing systems?|process(?: safety)?))?\s+engineering/i.test(fold(name||''));
export const isNamedOperationsProgramme=(p,units=[])=>
  !['excluded','pending'].includes(p.titleScopeReview?.decision)&&(
  [p.programName,p.specialization,p.department,p.school].some(hasNamedOperationsScope)||
  units.some(u=>(p.unitIds||[]).includes(u.id)&&hasNamedOperationsScope(u.name)));
export const programmeLabel=p=>p.specialization&&!fold(p.programName).includes(fold(p.specialization))?p.programName+' — '+p.specialization:p.programName;
