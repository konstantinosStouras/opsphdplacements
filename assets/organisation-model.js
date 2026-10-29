import {fold} from './model.js';
import {universityRows} from './university-model.js';
import {isNamedOperationsProgramme} from './program-model.js';

export function distinctNames(names,exclude=''){const seen=new Set(exclude?[fold(exclude)]:[]);return names.filter(n=>{const key=fold(n);if(!key||seen.has(key))return false;seen.add(key);return true;});}

export function organisationRows(entities,universities,reviews,programs,faculty,roster,histories,linkedin){
  const units=universityRows(universities.records,reviews.records);
  // Reviewed aliases may join imported entity records; never merge by name similarity.
  const sourceToReview=new Map();for(const r of units)for(const o of r.originals)sourceToReview.set(o.id,r);
  // Bridge organisation views only through an already reviewed official identity.
  // A country conflict or multiple candidate reviews is left separate for research.
  const officialNames=new Map();
  for(const r of units)if(r.officialIdentityReviewed){const k=fold(r.name);officialNames.set(k,[...(officialNames.get(k)||[]),r]);}
  const grouped=new Map();
  for(const e of entities.records){
   const rs=[...new Set((e.directory?.universities||[]).map(u=>sourceToReview.get(u.id)).filter(Boolean))];
   if(e.directory&&!rs.length&&!e.people&&!e.employer&&!e.programs.length)continue;
   const matches=[...new Set(e.aliases.flatMap(n=>officialNames.get(fold(n))||[]))].filter(r=>{
    const countries=Array.isArray(r.country)?r.country:[r.country];return !e.country||!countries.filter(Boolean).length||countries.includes(e.country);
   });
   const directOfficial=rs.filter(r=>r.officialIdentityReviewed);
   const directNames=new Set(directOfficial.map(r=>fold(r.name)));
   const matchNames=new Set(matches.map(r=>fold(r.name)));
   const official=directNames.size===1?directOfficial[0]:!directOfficial.length&&matchNames.size===1?matches[0]:null;
   const bridge=official||(rs.length===1?rs[0]:null);
   const officialCountries=[...new Set((officialNames.get(fold(official?.name))||[]).flatMap(r=>Array.isArray(r.country)?r.country:r.country?[r.country]:[]))];
   const country=official?.country||e.country||(officialCountries.length===1?officialCountries[0]:'');
   const key=official?'official:'+fold(official.name)+'|'+fold(Array.isArray(country)?country.join(' '):country):bridge?'reviewed:'+bridge.id:e.id;
   const g=grouped.get(key)||{id:key,name:bridge?.name||e.name,entities:[],reviews:[],programs:[]};
   g.entities.push(e);for(const r of rs)if(!g.reviews.includes(r))g.reviews.push(r);if(bridge&&!g.reviews.includes(bridge))g.reviews.push(bridge);grouped.set(key,g);
  }
  const names=new Map();for(const g of grouped.values())for(const n of [g.name,...g.entities.flatMap(e=>e.aliases)])if(!names.has(fold(n)))names.set(fold(n),g);
  // Explicit school/parent observations bridge career-only labels. Ambiguous
  // targets or an existing conflicting entity remain separate for review.
  const aliasTargets=new Map();
  for(const g of grouped.values())for(const r of g.reviews)for(const review of r.reviews)for(const a of review.organisationAliases||[]){
   const k=fold(a.name), targets=aliasTargets.get(k)||new Set();targets.add(g);aliasTargets.set(k,targets);
  }
  for(const [k,targets] of aliasTargets)if(targets.size===1){
   const g=[...targets][0],other=names.get(k);
   if(other&&other!==g&&!other.reviews.length){
    const countries=r=>new Set([...r.entities.map(e=>e.country),...r.reviews.flatMap(u=>Array.isArray(u.country)?u.country:[u.country])].filter(Boolean));
    const a=countries(g),b=countries(other);
    // A separately reviewed identity or conflicting country is never merged.
    // An existing career-only entity may use an explicitly evidenced alias.
    if(!a.size||!b.size||[...b].every(c=>a.has(c))){
     g.entities.push(...other.entities);grouped.delete(other.id);
     for(const [name,target]of names)if(target===other)names.set(name,g);
    }
   }
   if(!names.has(k)||names.get(k)===g){names.set(k,g);g.reviewedAliases=g.reviews.flatMap(r=>r.reviews.flatMap(v=>v.organisationAliases||[])).map(a=>a.name);}
  }
  const observed=(name)=>{if(!name)return null;let g=names.get(fold(name));if(!g){g={id:'observed:'+fold(name),name,entities:[],reviews:[],programs:[]};grouped.set(g.id,g);names.set(fold(name),g);}return g;};
  for(const p of [...faculty.records,...roster.records]){const g=observed(p.currentInstitution||p.institution);if(g){g.affiliations||=new Set();g.affiliations.add(p.id);}}
  for(const h of [...histories.records,...linkedin.records])for(const j of h.jobs){const g=observed(j.employerAsWritten);if(g){g.careers||=new Set();g.careers.add(h.id);}}
  const rows=[...grouped.values()];
  for(const r of rows){
   r.names=[...new Set([r.name,...r.entities.flatMap(e=>e.aliases),...(r.reviewedAliases||[])])];
   r.countries=[...new Set(r.entities.map(e=>e.country).filter(Boolean))];
   const universityIds=new Set(r.reviews.flatMap(u=>u.originals.map(o=>o.id)));
   r.programs=programs.records.filter(p=>(p.universityId?universityIds.has(p.universityId):r.names.some(n=>fold(n)===fold(p.university)))&&isNamedOperationsProgramme(p,r.reviews.flatMap(u=>u.units)));
   r.phd=r.entities.flatMap(e=>e.people?.institutions||[]);
   r.employers=r.entities.flatMap(e=>e.employer?.employers||[]);
   r.search=fold([r.name,...r.names,...r.countries,...r.reviews.map(u=>u.searchText),...r.programs.flatMap(p=>[p.programName,p.specialization,...(p.fields||[])])].join(' '));
  }
  rows.sort((a,b)=>a.name.localeCompare(b.name,'en',{sensitivity:'base'}));

 return rows;
}

// Canonical display names only for unambiguous, already grouped identities.
export function organisationNameResolver(rows){
 const targets=new Map();
 for(const r of rows)for(const name of r.names){const k=fold(name),set=targets.get(k)||new Set();set.add(r);targets.set(k,set);}
 return name=>{const candidates=targets.get(fold(name));return candidates?.size===1?[...candidates][0].name:name;};
}
