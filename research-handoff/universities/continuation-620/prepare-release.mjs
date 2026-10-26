import fs from 'node:fs';
import crypto from 'node:crypto';
const dir='research-handoff/universities/continuation-620';
const stats='406 qualifying current doctoral programmes and named fields at 303 institutions. Of 835 source records, 621 unit reviews are complete, 209 partial and five blocked; 621 of 815 doctoral observations have complete current branch checks. There are 265 grouped incomplete identities and three unmatched OM List reported-degree labels.';
function replace(file,start,line){const text=fs.readFileSync(file,'utf8'),re=new RegExp('^'+start+'.*$','m');if(!re.test(text))throw Error(file);fs.writeFileSync(file,text.replace(re,line));}
replace('README.md','Stage 1 integration checkpoint',`Stage 1 integration checkpoint (26 October 2026): ${stats} Cranfield's current title-based doctoral inventory is checked; its broader project observations remain outside the qualifying register. Stage 1 incomplete; Stages 2–4 held. See [current handoff](${dir}/README.md).`);
replace('TODO.md','Stage 1 update,',`Stage 1 update, 26 October 2026: ${stats} See [continuation620](${dir}/README.md). Cranfield's five-page centre directory and relevant doctoral/project inventories are checked. Individual project topics do not establish named doctoral specializations. Historical unit identity and duration discrepancies remain documented. Stages 2–4 and automation held.`);
replace('research-handoff/priorities/README.md','Current Stage 1 public scope:',`Current Stage 1 public scope: official programme title, named doctoral field/specialization or actual department/school host must name Operations, Management Science or Industrial Engineering, including evidenced linguistic equivalents. ${stats} See [continuation620](../universities/continuation-620/README.md). Historical checkpoints retain their dates.`);
fs.writeFileSync(dir+'/README.md',`# Stage 1 continuation 620 — 26 October 2026

Reviewed successor to e6d739c. ${stats} Stages 2–4 and automation held.

## Findings integrated

Cranfield's current title-based doctoral inventory is complete within the reviewed sources. Nine official sources were read in Chrome: the central research-degree page including the expanded PhD description; all five centre-directory pages (61 entries, not 61 distinct units); the Leadership and Management research-project inventory; the Centre for Life-cycle Engineering and Management page; and its research-opportunities page. The three previously recorded broad doctoral observations remain unchanged and outside the qualifying title gate. No programme, person or career fact was added.

Operational decisions, humanitarian operations and paperless aircraft operations occur as individual project topics, not evidenced named doctoral specializations. The CLEM page identifies collaboration with Through-life Engineering Services, not identity or succession. Its opportunities page uses a different legacy host title; that historical ambiguity remains explicit. The generic PhD and Management durations also differ in the source and are not harmonized by inference. Prior observations and check dates are preserved in the public overlay and prior audit.

## Validation

All 58 JavaScript tests and required validators passed. Frozen-cut preservation and visitor-note audit passed. Organisation display audit reports 1,256 rows, zero duplicate display names, unchanged doctorate-person and first-job associations. Four Python schema tests, relational database build and static build are required release checks. Record stamps and staged-cut completeness must pass immediately before publication. All 561 programme records, imported source rows and people/history datasets are unchanged.

## Remaining

214 incomplete unit source records and 214 incomplete doctoral source scopes overlap across 265 grouped identities. Three unmatched OM institution labels and separate source-assertion/directory coverage gates remain. Current OM-priority branch coverage is 199 completed leads; this does not verify individual faculty degrees. Continue the remaining high-priority university inventories, starting with Karlsruhe. No complete Stage 1 or automatic-runner claim.
`);
const files=['README.md','TODO.md','RESEARCH-STATUS.md','index.html',...['entities','doctoral-programs','university-reviews','record-dates'].map(n=>'data/'+n+'.json'),...['README.md','STAGE-1-REMAINING-2026-10-23.md','stage-1-doctoral-priority-queue.json','stage-1-university-queue.json'].map(n=>'research-handoff/priorities/'+n)];
for(const f of fs.readdirSync(dir))if(/\.(json|md|mjs|txt)$/.test(f))files.push(dir+'/'+f);
files.push(dir+'/release-files.txt',dir+'/release-hashes.json');
const paths=[...new Set(files)].sort();
fs.writeFileSync(dir+'/release-files.txt',paths.join('\n')+'\n');
fs.writeFileSync(dir+'/release-hashes.json',JSON.stringify({frozenAt:new Date().toISOString(),files:paths.filter(p=>p!==dir+'/release-hashes.json').map(path=>({path,sha256:crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex')}))},null,2)+'\n');
console.log({releasePaths:paths.length});
