import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const base='research-handoff/universities/continuation-133';
const a=['alba-graduate-business-school','east-texas-a-m-university','hanken-school-of-economics','huron-university','institut-mines-telecom','international-management-institute','international-university-of-rabat'];
const units=[...a.map(id=>`${base}/shard-a/${id}.unit.json`),`${base}/shard-b/katholieke-universiteit-ku-leuven-unit.json`,`${base}/shard-b/suny-korea-unit.json`,`${base}/taejae-university.unit.json`];
const doctoral=[...a.map(id=>`${base}/shard-a/${id}.doctoral.json`),`${base}/shard-b/suny-korea-doctoral.json`,`${base}/taejae-university.doctoral.json`];
const scopes=[`${base}/shard-b/katholieke-universiteit-ku-leuven-doctoral.json`];
const run=(script,files,flags=[])=>execFileSync(process.execPath,[`scripts/${script}`, ...files,...flags],{stdio:'inherit'});
run('merge-university-reviews.mjs',units,['--dry-run']);
if(process.argv.includes('--apply')){
 run('merge-university-reviews.mjs',units);
 run('merge-doctoral-proposals.mjs',doctoral);
 run('merge-doctoral-proposals.mjs',doctoral,['--apply']);
 run('merge-doctoral-proposals.mjs',scopes,['--scope-only']);
 run('merge-doctoral-proposals.mjs',scopes,['--scope-only','--apply']);
 fs.writeFileSync(`${base}/integration-manifest.json`,JSON.stringify({integratedAt:'2026-10-25',units,doctoral,scopes,earlierIntegratedRootPairs:['john-carroll-university (continuation129)','valparaiso-university','sacred-heart-university'],scopeOnlySeven:['university-of-alabama-at-birmingham','university-of-alaska-fairbanks','university-of-kentucky','university-of-colorado-denver','university-of-dayton','university-of-calgary','university-of-nevada'],held:'UTSA scopeComplete rejected: exact Civil/science doctoral fields remain unreviewed.'},null,2)+'\n');
}
