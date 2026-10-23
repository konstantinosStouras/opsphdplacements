import {fold} from './model.js';
export const isPhdDegree=v=>/^(?:(?:phd|ph d)(?: doctor of philosophy| or scd| or sc d)?|doctor of philosophy(?: phd| ph d)?|philosophi(?:æ|ae) doctor (?:phd|ph d)|dphil|d phil)(?: in .+| science)?$/.test(fold(v));
// An extant programme with suspended admissions is not a closed programme.
export const isCurrentPhdProgramme=p=>['active','admissions-suspended'].includes(p.status)&&p.programmeType!=='research-training'&&(isPhdDegree(p.degree)&&p.phdEligibility!=='credential-unresolved'||p.phdEligibility==='verified-research-doctorate'&&!!p.researchDoctorateEvidence);
export const programmeLabel=p=>p.specialization&&!fold(p.programName).includes(fold(p.specialization))?p.programName+' — '+p.specialization:p.programName;
