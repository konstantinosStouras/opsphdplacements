import fs from 'node:fs';
import crypto from 'node:crypto';
const dir='research-handoff/universities/continuation-640';
const stats='407 qualifying current doctoral programmes and named fields at 303 institutions. Of 835 source records, 623 unit reviews are complete, 207 partial and five blocked; 622 of 815 doctoral observations have complete current branch checks. There are 264 grouped incomplete identities and three unmatched OM List reported-degree labels.';
function replace(file,start,line){const text=fs.readFileSync(file,'utf8'),re=new RegExp('^'+start+'.*$','m');if(!re.test(text))throw Error(file);fs.writeFileSync(file,text.replace(re,line));}
replace('README.md','Stage 1 integration checkpoint',`Stage 1 integration checkpoint (26 October 2026): ${stats} IIT Delhi's current academic-unit inventory is reviewed; its doctoral scope remains partial. Karlsruhe predecessor names share the current institution display with historical labels preserved. Stage 1 incomplete; Stages 2–4 held. See [current handoff](${dir}/README.md).`);
replace('TODO.md','Stage 1 update,',`Stage 1 update, 26 October 2026: ${stats} See [continuation640](${dir}/README.md). IIT Delhi unit inventory completed, but doctoral brochure remains unread. Eindhoven research-directory verification challenge awaits user handoff. KIT's four historical university aliases consolidated and stale programme coverage note dated explicitly. Stages 2–4 and automation held.`);
replace('research-handoff/priorities/README.md','Current Stage 1 public scope:',`Current Stage 1 public scope: official programme title, named doctoral field/specialization or actual department/school host must name Operations, Management Science or Industrial Engineering, including evidenced linguistic equivalents. ${stats} See [continuation640](../universities/continuation-640/README.md). Historical checkpoints retain their dates.`);
fs.writeFileSync(dir+'/README.md',`# Stage 1 continuation 640 — 26 October 2026

Reviewed successor to ed84ebc. ${stats} Stages 2–4 and automation held.

## Integrated findings

IIT Delhi: full official inventories of 16 departments, six schools, 11 centres and 22 centres of excellence read in Chrome. No additional explicitly qualifying academic-unit title found. Unit review is complete; doctoral coverage remains partial. Homepage confirms current second-semester 2026–27 admissions and links its brochure, but the share page and PDF navigation timed out. The brochure was not read and is not used as verification. Existing two doctoral records remain unchanged. Preserve the previous successful Management source check and distinguish the older access failure from current access history.

Karlsruhe: current official history introduction and expanded Universität Karlsruhe (TH) panel confirm the 1 October 2009 merger into the new legal entity KIT. Four evidenced predecessor-name aliases consolidate the separate University of Karlsruhe display row. Original degree and employer labels remain unchanged; this is not a claim of uninterrupted legal identity. The existing Operations Research record's older incomplete-coverage note is explicitly dated and supplemented by the completed current inventory; prior wording is preserved in priorReviewNotes. Programme facts and original check dates remain unchanged.

Eindhoven: the complete official research-organisation portal presents a live security-verification challenge. User handoff requested; no portal contents read or alternate-access bypass attempted. The dated blocker is recorded while both unit and doctoral coverage remain partial.

## Validation and publication

All 58 JavaScript tests and required validators, four Python schema tests, relational database build, static build and frozen-cut audit passed. All 562 programme facts and all person/imported records remain unchanged; one existing programme receives only a dated coverage-note correction. Organisation audit: 1,252 rows, zero exact duplicate display names, unchanged 2,937 doctorate-person and 2,087 first-job associations. Visitor evidence-note checks passed. Record stamps and staged public cut must be checked immediately before publication.

Prior release ed84ebc deployed successfully in run40312084613 and was verified live for Karlsruhe's two pathways and Cranfield's consolidated entry. This release requires deployment confirmation and expanded live KIT/IIT Delhi verification after publication.

## Remaining and next work

212 incomplete unit source records and 213 incomplete doctoral source scopes overlap across 264 grouped identities. Three unmatched OM labels and separate source-assertion/live-directory gates remain. OM-priority coverage is 200 completed branch leads. Continue University of Manchester branch inventories while awaiting the Eindhoven handoff; IIT Delhi requires its complete doctoral annexure. No Stage 1 completion or automatic-runner claim.
`);
const files=['README.md','TODO.md','RESEARCH-STATUS.md','index.html',...['entities','doctoral-programs','university-reviews','record-dates'].map(n=>'data/'+n+'.json'),...['README.md','STAGE-1-REMAINING-2026-10-23.md','stage-1-doctoral-priority-queue.json','stage-1-university-queue.json'].map(n=>'research-handoff/priorities/'+n)];
for(const f of fs.readdirSync(dir))if(/\.(json|md|mjs|txt)$/.test(f))files.push(dir+'/'+f);
files.push(dir+'/release-files.txt',dir+'/release-hashes.json');const paths=[...new Set(files)].sort();
fs.writeFileSync(dir+'/release-files.txt',paths.join('\n')+'\n');
fs.writeFileSync(dir+'/release-hashes.json',JSON.stringify({frozenAt:new Date().toISOString(),files:paths.filter(p=>p!==dir+'/release-hashes.json').map(path=>({path,sha256:crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex')}))},null,2)+'\n');
console.log({releasePaths:paths.length});
