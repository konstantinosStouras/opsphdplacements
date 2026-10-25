import fs from 'node:fs';
import crypto from 'node:crypto';
const d='research-handoff/universities/continuation-230',read=p=>JSON.parse(fs.readFileSync(p)),m=read(d+'/integration-manifest.json');
m.supplementalUnits=['research-handoff/universities/continuation-210/shard-b/ted-current-parent-unit.json','research-handoff/universities/continuation-211/shard-b/lone-star-source-bounded-unit.json'];
m.supplementalProgrammes=['research-handoff/universities/continuation-195/shard-b/sustech-formal-doctoral-hosts.json'];
m.supplementalHashes=[...m.supplementalUnits,...m.supplementalProgrammes].map(path=>({path,sha256:crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex')}));
fs.writeFileSync(d+'/integration-manifest.json',JSON.stringify(m,null,2)+'\n');
fs.writeFileSync(d+'/supplemental-units.json',JSON.stringify(m.supplementalUnits.map(read),null,2)+'\n');
console.log({unitReviews:m.supplementalUnits.length,credentialUnresolvedProgrammeObservations:m.supplementalProgrammes.length});
