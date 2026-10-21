import fs from 'node:fs';
import {organisationRows,distinctNames} from '../assets/organisation-model.js';
import {fold} from '../assets/model.js';

const inputs=['entities','universities','university-reviews','doctoral-programs','faculty','faculty-roster-people','employment-histories','linkedin-histories'];
const rows=organisationRows(...inputs.map(n=>JSON.parse(fs.readFileSync(new URL('../data/'+n+'.json',import.meta.url),'utf8'))));
const groups=new Map();for(const r of rows){const k=fold(r.name);groups.set(k,[...(groups.get(k)||[]),r.id]);}
const audit={
 auditedAt:new Date().toISOString(),scope:'Complete current organisation presentation; no new source or identity research.',
 inputs:inputs.map(n=>'data/'+n+'.json'),rows:rows.length,
 duplicateDisplayNames:[...groups].filter(([,ids])=>ids.length>1),
 hiddenFormattingAliases:rows.reduce((n,r)=>n+r.names.length-distinctNames(r.names,r.name).length-1,0),
 sourceEntityIds:rows.flatMap(r=>r.entities.map(e=>e.id)).sort(),
 doctoratePeople:rows.flatMap(r=>r.phd).reduce((n,p)=>n+p.people,0),
 verifiedFirstJobs:rows.flatMap(r=>r.employers).reduce((n,p)=>n+p.verifiedFirstJobs,0),
 officialBridges:rows.filter(r=>r.id.startsWith('official:')&&r.entities.length>1).map(r=>({name:r.name,entities:r.entities.map(e=>e.id),reviews:r.reviews.flatMap(u=>u.reviews.map(v=>({id:v.id,checkedAt:v.checkedAt,sourceUrl:v.universitySourceUrl})))})),
 limitation:'Repeated labels and formatting aliases are checked across all rows. Broader unresolved identity and historical successor reconciliation is not declared complete.'
};
if(audit.duplicateDisplayNames.length)throw Error('Repeated organisation display labels: '+JSON.stringify(audit.duplicateDisplayNames));
if(new Set(audit.sourceEntityIds).size!==audit.sourceEntityIds.length)throw Error('An entity is attached more than once');
if(process.argv[2])fs.writeFileSync(process.argv[2],JSON.stringify(audit,null,2)+'\n');
console.log(JSON.stringify({rows:audit.rows,duplicateDisplayNames:audit.duplicateDisplayNames.length,hiddenFormattingAliases:audit.hiddenFormattingAliases,sourceEntities:audit.sourceEntityIds.length,doctoratePeople:audit.doctoratePeople,verifiedFirstJobs:audit.verifiedFirstJobs}));
