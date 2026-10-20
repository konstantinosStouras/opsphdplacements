import fs from 'node:fs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const batch=read('research-handoff/careers/batches/2026-10-20-next25.json');
const index=new Map(['employment','linkedin'].flatMap(t=>read(`data/${t}-histories.json`).records).map(r=>[r.id,r]));
const lines=['# Alphabetical career batch — checked 20 October 2026','','25 people attempted; 24 partial career histories added, with 154 role entries. One source blocked. Only Ghadge’s accessible LinkedIn Experience list is fully captured; no complete real-world career claimed.','','| Person | Roles added | Outcome |','|---|---:|---|'];
for(const q of batch.records)lines.push(`| ${q.name} | ${q.rolesAdded} | ${q.status} |`);
for(const q of batch.records){lines.push('',`## ${q.name}`,'');const h=index.get(q.id);if(!h){lines.push(q.reason,`Source attempted: ${q.sourceUrls[0]}`);continue;}lines.push(`Checked: ${h.checkedAt}. ${h.coverageNote}`,'',`Identity: ${h.identityBasis}`,'');for(const j of h.jobs)lines.push(`- ${j.start.asWritten||'Unknown start'} – ${j.end.asWritten||'Unknown end'}: **${j.titleAsWritten}**, ${j.employerAsWritten}. [Source](${j.sourceUrl}).`);for(const m of h.otherEmploymentMentions||[])lines.push(`- Other mention: ${m.titleAsWritten}, ${m.employerAsWritten}. ${m.evidenceNote} [Source](${m.sourceUrl}).`);lines.push('',...h.remainingUnknowns.map(x=>`Unknown: ${x}`),...(h.accessLimitations||[]).map(x=>`Access limitation: ${x}`));}
fs.writeFileSync('research-handoff/careers/batches/2026-10-20-next25-report.md',lines.join('\n')+'\n');
