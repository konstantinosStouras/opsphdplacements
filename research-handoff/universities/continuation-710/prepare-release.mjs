import fs from 'node:fs';import crypto from 'node:crypto';
const dir='research-handoff/universities/continuation-710',stats='410 qualifying current doctoral programmes and named fields at 306 institutions. Of 835 source records, 628 unit reviews are complete, 202 partial and five blocked; 633 of 818 doctoral observations have complete current branch checks. There are 258 grouped incomplete identities and three unmatched OM List reported-degree labels.';
function replace(file,start,line){const text=fs.readFileSync(file,'utf8'),re=new RegExp('^'+start+'.*$','m');if(!re.test(text))throw Error(file);fs.writeFileSync(file,text.replace(re,line));}
replace('README.md','Stage 1 integration checkpoint',`Stage 1 integration checkpoint (26 October 2026): ${stats} Erasmus and IIM Calcutta stale unit-review states reconciled against later published inventories; Bocconi alias linked to existing completed scope. Stage 1 incomplete; Stages 2–4 held. See [current handoff](${dir}/README.md).`);
replace('TODO.md','Stage 1 update,',`Stage 1 update, 26 October 2026: ${stats} See [continuation710](${dir}/README.md). No new programme facts or source reads in this integration. Original source dates, units, decisions and historical limitations retained. Chrome PDF extension-window handoff still pending; publication700 succeeded. Expanded live checks for UCL and releases700/710 await browser control. Further stale-unit candidates Leipzig, Magdeburg, Brighton and Geneva require individual integration review. Stages 2–4 and automation held.`);
replace('research-handoff/priorities/README.md','Current Stage 1 public scope:',`Current Stage 1 public scope: official programme title, named doctoral field/specialization or reviewed academic host must name Operations, Management Science or Industrial Engineering, including evidenced linguistic equivalents. Actual institutes/divisions require the individual teaching/research and doctoral-linkage assessment in RESEARCH-DESIGN.md. ${stats} See [continuation710](../universities/continuation-710/README.md). Historical checkpoints retain their dates.`);
fs.writeFileSync(dir+'/README.md',`# Stage 1 continuation 710 — 26 October 2026

Reviewed successor to baee107. ${stats} Stages 2–4 and automation held.

## Integrated review-state corrections

Erasmus: two existing source records retained an obsolete incomplete technical-inventory/Economics doctoral mapping limitation. Later published full university faculty/institute inventory and exact Econometrics and Management Science doctoral field resolve it. Unit reviews now complete; actual department/institute/group types, both doctoral pathways, overlapping student-population limitation, earlier access failures and all dates retained.

IIM Calcutta: complete academic-group inventory plus later published full-time and Executive PhD inventories resolve the old wider-current-scope limitation. Unit review now complete. Operations Management remains an academic group; historical ORSA wording is still uncertain, with no invented closure date or additional current offering.

Bocconi: link the already reconciled older source alias to the existing complete current doctoral scope. The current negative qualifying-title finding is retained; this does not deny Operations research activity or historical doctorates. No new institution or programme is created.

All source observations were already read and published. This is integration, not fresh source verification. The frozen prior cut preserves superseded limitations. Identity check dates, all original sources, units, decisions, degree facts, imported records and every person record remain intact.

## Validation and publication

58 JavaScript tests and required validators, four Python schema tests, relational build, static build, organisation and frozen-cut audits passed. Display audit: 1,252 organisation rows, zero exact duplicate names, 2,937 doctorate-person associations and 2,087 first-job associations unchanged. Check record stamps and frozen cut immediately before publication. Prior release700 deployed successfully in run40322405066. Live expanded UCL/700/710 inspection awaits the Chrome extension-window handoff; no visual/mobile verification claimed.

## Remaining

207 incomplete unit source records overlap with incomplete doctoral scopes across 258 grouped identities. Source assertions, live-directory coverage and three unmatched OM doctorate labels also remain. Earlier pending browser handoffs remain: Reading PDF extension window and separate Eindhoven security verification. Former research agents are usage-limited; root is sole integrator. No new browsing or automated continuation is claimed. Leipzig, Magdeburg, Brighton and Geneva have later published scope evidence to assess against older unit limitations; keep genuine administrative conflicts unresolved.
`);
const files=['README.md','TODO.md','RESEARCH-STATUS.md','index.html',...['entities','university-reviews','record-dates'].map(n=>'data/'+n+'.json'),...['README.md','STAGE-1-REMAINING-2026-10-23.md','stage-1-doctoral-priority-queue.json','stage-1-university-queue.json'].map(n=>'research-handoff/priorities/'+n)];for(const f of fs.readdirSync(dir))if(/\.(json|md|mjs|txt)$/.test(f))files.push(dir+'/'+f);files.push(dir+'/release-files.txt',dir+'/release-hashes.json');const paths=[...new Set(files)].sort();fs.writeFileSync(dir+'/release-files.txt',paths.join('\n')+'\n');fs.writeFileSync(dir+'/release-hashes.json',JSON.stringify({frozenAt:new Date().toISOString(),files:paths.filter(p=>p!==dir+'/release-hashes.json').map(path=>({path,sha256:crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex')}))},null,2)+'\n');console.log({releasePaths:paths.length});
