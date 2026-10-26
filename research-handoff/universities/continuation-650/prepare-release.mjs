import fs from 'node:fs';import crypto from 'node:crypto';
const dir='research-handoff/universities/continuation-650',stats='407 qualifying current doctoral programmes and named fields at 303 institutions. Of 835 source records, 624 unit reviews are complete, 206 partial and five blocked; 622 of 815 doctoral observations have complete current branch checks. There are 264 grouped incomplete identities and three unmatched OM List reported-degree labels.';
function replace(file,start,line){const text=fs.readFileSync(file,'utf8'),re=new RegExp('^'+start+'.*$','m');if(!re.test(text))throw Error(file);fs.writeFileSync(file,text.replace(re,line));}
replace('README.md','Stage 1 integration checkpoint',`Stage 1 integration checkpoint (26 October 2026): ${stats} Manchester's current academic-unit inventory and business doctoral scope are reviewed; wider technical doctoral fields remain partial. Stage 1 incomplete; Stages 2–4 held. See [current handoff](${dir}/README.md).`);
replace('TODO.md','Stage 1 update,',`Stage 1 update, 26 October 2026: ${stats} See [continuation650](${dir}/README.md). Manchester central units, business divisions and broad doctoral catalogue checked; detailed Mathematics sources inaccessible and wider technical scope remains partial. IIT Delhi brochure and Eindhoven user verification handoff remain unresolved. Stages 2–4 and automation held.`);
replace('research-handoff/priorities/README.md','Current Stage 1 public scope:',`Current Stage 1 public scope: official programme title, named doctoral field/specialization or actual department/school host must name Operations, Management Science or Industrial Engineering, including evidenced linguistic equivalents. ${stats} See [continuation650](../universities/continuation-650/README.md). Historical checkpoints retain their dates.`);
fs.writeFileSync(dir+'/README.md',`# Stage 1 continuation 650 — 26 October 2026

Reviewed successor to 27c1f8c. ${stats} Stages 2–4 and automation held.

## Integrated findings

University of Manchester: full central university faculty/school/department structure and business school's four divisions, four institutes and four centres read in Chrome. Existing Management Sciences and Marketing division retained, unit review complete. Full 2027 postgraduate research catalogue and current Business and Management PhD description checked. Business branch scope complete within those dated inventories; Operations and Supply Chain Management remains a theme within the existing programme, not another degree.

Programme details checked for Applied Mathematics, Computer Science, Management of Projects, Mechanical Engineering, Sustainable Industrial Systems and AI in Decision Making for Complex Systems. The computing department's full nine expertise areas and six themes also read. These sources do not establish another qualifying programme. Generic Industrial Systems, manufacturing, AI and project-management wording is not Industrial Engineering or Operations by inference.

Detailed Mathematics themes/expertise and the central mathematics redirect timed out. Their contents were not read. Other technical fields have not all been adjudicated. Institution-wide doctoral coverage therefore remains partial. This is one completed unit review and expanded doctoral evidence, not a claim of a complete university doctoral check. All existing programme facts and original dates remain unchanged; no people work undertaken.

## Validation and publication

All 58 JavaScript tests and required validators, four Python schema tests, relational database build, static build, organisation audit and frozen-cut audit passed. All 562 programme records, imported university rows and person data remain unchanged. Organisation display remains 1,252 rows with zero exact duplicate names and unchanged 2,937 doctorate-person and 2,087 first-job associations. Source notes retain old observations and dated new checks. Check stamps and staged public cut immediately before publishing.

Prior release 27c1f8c deployed successfully in run40313813304. Live expanded Karlsruhe entry confirms all historical aliases consolidated and dated OR coverage note; live IIT Delhi entry confirms completed unit review, two existing programmes and incomplete doctoral scope. Confirm this release's deployment and expanded Manchester evidence after publication.

## Remaining

211 incomplete unit source records and 213 incomplete doctoral source scopes overlap across 264 grouped identities. Separate source-assertion/live-directory gates and three unmatched OM reported-degree labels remain. No Stage 1 completion or automatic-runner claim. Eindhoven security verification awaits the user; IIT Delhi brochure and Manchester Mathematics sources remain individual access limitations while other universities continue.
`);
const files=['README.md','TODO.md','RESEARCH-STATUS.md','index.html',...['entities','doctoral-programs','university-reviews','record-dates'].map(n=>'data/'+n+'.json'),...['README.md','STAGE-1-REMAINING-2026-10-23.md','stage-1-doctoral-priority-queue.json','stage-1-university-queue.json'].map(n=>'research-handoff/priorities/'+n)];for(const f of fs.readdirSync(dir))if(/\.(json|md|mjs|txt)$/.test(f))files.push(dir+'/'+f);files.push(dir+'/release-files.txt',dir+'/release-hashes.json');const paths=[...new Set(files)].sort();fs.writeFileSync(dir+'/release-files.txt',paths.join('\n')+'\n');fs.writeFileSync(dir+'/release-hashes.json',JSON.stringify({frozenAt:new Date().toISOString(),files:paths.filter(p=>p!==dir+'/release-hashes.json').map(path=>({path,sha256:crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex')}))},null,2)+'\n');console.log({releasePaths:paths.length});
