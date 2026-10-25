import fs from 'node:fs';
const source = 'research-handoff/universities/continuation-127/shard-a/georgia-state-university.doctoral.json';
const target = 'research-handoff/universities/continuation-135/shard-a/georgia-state-university.doctoral.json';
const x = JSON.parse(fs.readFileSync(source, 'utf8'));
x.checkedAt = '2026-10-25';
x.status = 'no-qualifying-programme-verified';
x.coverageComplete = true;
const urls = [
  'https://www.gsu.edu/program-cards/?wpv-degree_cat%5B%5D=doctorate&wpv_filter_submit=SEARCH&wpv_post_search=',
  'https://www.gsu.edu/program-cards/?wpv-degree_cat%5B%5D=doctorate&wpv_filter_submit=SEARCH&wpv_paged=2&wpv_view_count=6485454-TCPID6484577',
  'https://www.gsu.edu/program-cards/?wpv-degree_cat%5B%5D=doctorate&wpv_filter_submit=SEARCH&wpv_paged=3&wpv_view_count=6485454-TCPID6484577',
  'https://www.gsu.edu/program-cards/?wpv-degree_cat%5B%5D=doctorate&wpv_filter_submit=SEARCH&wpv_paged=4&wpv_view_count=6485454-TCPID6484577',
];
x.branches[1].reviewState = 'checked';
x.branches[1].conclusion = 'Opened all four pages of the official current university-wide Ph.D./professional-doctorate finder by its displayed 1–4 pagination, ending with page 4 and no next page. No Operations, Management Science or Industrial Engineering degree/concentration appears. The Computer Science PhD states general/Bioinformatics tracks; the Mathematics and Statistics PhD explicitly lists five concentrations: Machine Learning and Data Science, Applied Mathematics, Mathematics, Bioinformatics and Biostatistics. No separate engineering school is listed in the finder school filter. Current technical doctoral titles do not meet the strict named-title rule.';
x.branches[1].sourceUrls = urls;
for (let i = 0; i < urls.length; i++) x.sources.push({url:urls[i],checkedAt:'2026-10-25',outcome:'read',note:`Official university doctorate finder page ${i+1} of 4 opened and doctoral programme names/details read; page 4 displays 1–4 pagination ending at 4. No qualifying named title found on this page.`});
x.limitations = [
  'Current institution-wide doctorate negative only under the 25 October named-title rule. Historical Operations Management PhD and imported Managerial Sciences unit succession remain unresolved; this current conclusion does not erase them.',
  'No inference that current Department of Management Operations and Supply Chain Management academic concentration is a current doctoral specialization; Robinson doctoral Management specializations are Organizational Behavior/Human Resources and Strategy.'
];
fs.writeFileSync(target, JSON.stringify(x,null,2)+'\n');
