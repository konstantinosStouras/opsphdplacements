import fs from 'node:fs';

// Keep the crawlable introduction consistent with the reviewed public inputs.
const read=name=>JSON.parse(fs.readFileSync(`data/${name}.json`,'utf8'));
const people=[...read('faculty').records,...read('faculty-roster-people').records];
const jobs=read('placements').records, years=jobs.map(r=>r.phdYear).filter(Number.isInteger);
const n=value=>value.toLocaleString('en-GB'), share=value=>(100*value/jobs.length).toFixed(1);
const count=category=>jobs.filter(r=>r.category===category).length;
const nonacademic=jobs.filter(r=>['industry','government','nonprofit'].includes(r.category)).length;
const career=[...read('employment-histories').records,...read('linkedin-histories').records];
const blocked=career.filter(r=>r.reviewStatus==='blocked').length;
const reviews=read('university-reviews').metadata;
const subtitle=`Evidence from ${n(jobs.length)} verified first jobs, PhD cohorts ${Math.min(...years)}–${Math.max(...years)}`;
const abstract=`This project documents PhD careers in Operations Research, Operations Management and Industrial Engineering, starting with <a href="https://www.operationsacademia.org/universities">Operations Academia</a> and reviewing university pages, CVs and placement reports, with <a href="https://omlist.edutool.org/faculty">OM List</a> cross-checks and individual career reviews. The current faculty-based sample contains ${n(people.length)} profile records and ${n(jobs.length)} verified first jobs. ${n(count('postdoc'))} first jobs (${share(count('postdoc'))}%) are postdocs, while ${n(count('tenure-track'))} (${share(count('tenure-track'))}%) are classified as tenure-track. A further ${n(nonacademic)} documented first jobs are in industry, government or nonprofits. Job type remains undocumented for ${n(count('unknown'))} verified first employers (${share(count('unknown'))}%). These shares use all verified first jobs as their denominator; they are not population placement rates. Faculty-based selection, unresolved first jobs and incomplete career histories limit generalisation, particularly to graduates who remain outside academia. ${n(career.length)} career review records are published, including ${n(blocked)} access blockers without verified roles. Official-source university reviews are complete for ${n(reviews.reviewed)} of ${n(reviews.sourceRecords)} imported records. Partial histories, missing dates and unresolved identities remain explicit.`;
let html=fs.readFileSync('index.html','utf8');
html=html.replace(/(<p class="subtitle" id="placement-subtitle">).*?(<\/p>)/,`$1${subtitle}$2`)
 .replace(/(<p class="hero-scope">).*?(<\/p>)/,`$1A faculty-based sample of ${n(people.length)} people. Coverage is incomplete; these are not population placement rates.$2`)
 .replace(/(<div class="abstract"><h2>Abstract<\/h2><p>).*?(<\/p>)/,`$1${abstract}$2`);
fs.writeFileSync('index.html',html);
console.log(subtitle);
