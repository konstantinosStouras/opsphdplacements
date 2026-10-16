import {isSourceUrl} from '../assets/model.js';

export function validatePrograms(data){
 const records=data.records,ids=new Set(records?.map(r=>r.id));
 if(!Array.isArray(records)||ids.size!==records.length||data.metadata.recordCount!==records.length)throw Error('Invalid program inventory/count');
 const date=value=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&!Number.isNaN(Date.parse(value));
 for(const p of records){
  if(!p.id||!p.university||!p.programName||!p.degree||!p.scopeRationale||!p.fields?.length||!date(p.lastCheckedAt)||!date(p.statusAsOf))throw Error(`Missing program scope/provenance: ${p.id}`);
  if(!['active','closed','renamed','transitioned','unknown','admissions-suspended','admissions-ended'].includes(p.status))throw Error(`Invalid program status: ${p.id}`);
  if(!p.sources?.length||!p.facts?.length)throw Error(`Missing program evidence: ${p.id}`);
  const sources=new Map(p.sources.map(s=>[s.id,s]));
  if(sources.size!==p.sources.length)throw Error(`Duplicate program source ID: ${p.id}`);
  for(const s of p.sources)if(!s.id||!isSourceUrl(s.url)||!s.title||!date(s.lastCheckedAt))throw Error(`Invalid program source: ${p.id}`);
  for(const f of p.facts){
   if(!f.field||!f.evidenceNote||!date(f.lastCheckedAt)||!Array.isArray(f.sourceIds)||f.sourceIds.some(id=>!sources.has(id)))throw Error(`Invalid program fact: ${p.id}`);
   if(f.value!=null&&!f.sourceIds.length)throw Error(`Unsourced program fact: ${p.id}/${f.field}`);
   if(Object.hasOwn(p,f.field)&&JSON.stringify(p[f.field])!==JSON.stringify(f.value))throw Error(`Program summary contradicts fact: ${p.id}/${f.field}`);
  }
  for(const field of ['university','programName','degree','fields','status'])if(!p.facts.some(f=>f.field===field&&f.value!=null))throw Error(`Missing program field evidence: ${p.id}/${field}`);
  for(const h of p.history||[])if(!h.event||!date(h.lastCheckedAt)||!h.sourceIds?.length||h.sourceIds.some(id=>!sources.has(id)))throw Error(`Invalid program history: ${p.id}`);
  if(p.successorProgramId&&!ids.has(p.successorProgramId))throw Error(`Unknown successor: ${p.id}`);
 }
 return data;
}
