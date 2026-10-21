import {CATEGORIES} from './analytics.js';

export function cohortStats(people,year){
 const rows=people.filter(p=>p.phdYear===year),verified=rows.filter(p=>p.placement);
 return {year,people:rows.length,verified:verified.length,
  unresolved:rows.filter(p=>!p.placement&&p.status==='unresolved').length,
  other:rows.filter(p=>!p.placement&&p.status!=='unresolved').length,
  categories:CATEGORIES.map(c=>({...c,count:verified.filter(p=>p.placement.category===c.id).length,
   share:verified.length?verified.filter(p=>p.placement.category===c.id).length/verified.length:null}))};
}
