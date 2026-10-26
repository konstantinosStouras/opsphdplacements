// Public-data snapshot of remaining Stage 1 institution checks; no source facts inferred.
import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(import.meta.dirname,'..');
const load=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const universities=load('data/universities.json').records;
const reviews=load('data/university-reviews.json').records;
const pendingTitles=load('data/doctoral-programs.json').records.filter(p=>p.titleScopeReview?.decision==='pending');
const doctoral=load('research-handoff/priorities/stage-1-doctoral-priority-queue.json');
const reviewById=new Map(reviews.map(r=>[r.id,r]));
const groups=new Map();
for(const source of universities){
  const observation=reviewById.get(source.id);
  const canonical=observation?.duplicateOf&&reviewById.has(observation.duplicateOf)
    ?reviewById.get(observation.duplicateOf):observation;
  const id=canonical?.id||source.id;
  let group=groups.get(id);
  if(!group){group={name:canonical?.canonicalName||source.name,sourceIds:[],unitStates:new Set(),doctoralComplete:canonical?.doctoralReview?.coverageComplete===true,pendingTitleCount:pendingTitles.filter(p=>p.universityId===id).length};groups.set(id,group);}
  group.sourceIds.push(source.id);
  if(observation?.status!=='reviewed')group.unitStates.add(observation?.status||'pending');
}
const collator=new Intl.Collator('en',{sensitivity:'base',numeric:true});
const remaining=[...groups.values()].filter(g=>g.unitStates.size||!g.doctoralComplete||g.pendingTitleCount)
  .sort((a,b)=>collator.compare(a.name,b.name));
const unresolved=doctoral.records.filter(r=>r.identityMatch==='unresolved discovery label')
  .sort((a,b)=>collator.compare(a.name,b.name));
const lines=[
  `# Stage 1 institutions still needing checks — updated ${new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date())}`,
  '',
  'This is an alphabetical planning snapshot from the published university frame and the OM List reported-PhD-institution queue. It is **not** a list of confirmed PhD providers. Some institutions already have frozen official-source proposals awaiting integrator review and publication; they remain here until the public register records the outcome. A missing or partial doctoral review never means that no qualifying doctorate exists.',
  '',
  `The published ${universities.length} university/campus source records group into ${groups.size} display identities; ${remaining.length} identities have an incomplete unit review, doctoral branch check or title/host adjudication. Of the source records, ${universities.filter(u=>reviewById.get(u.id)?.status!=='reviewed').length} have incomplete unit reviews and ${universities.filter(u=>reviewById.get(u.id)?.doctoralReview?.coverageComplete!==true).length} lack a complete current doctoral branch scope. ${pendingTitles.length} programme title/host decisions remain pending and are withheld from qualifying counts. The separate OM List queue has ${unresolved.length} reported institution labels still needing identity reconciliation. These lists overlap in real institutions but are not merged without accepted evidence. Source-unit assertions and live directory/posting coverage are additional Stage 1 gates.`,
  '',
  '## In the university/campus discovery frame',
  '',
  '| # | Institution or current discovery label | Remaining check |',
  '|---:|---|---|',
];
for(const [i,g] of remaining.entries()){
  const tasks=[];
  if(g.unitStates.size)tasks.push('unit/identity: '+[...g.unitStates].sort().join(', '));
  if(!g.doctoralComplete)tasks.push('doctoral branch scope');
  if(g.pendingTitleCount)tasks.push('programme title/host adjudication');
  lines.push(`| ${i+1} | ${g.name.replaceAll('|','\\|')} | ${tasks.join('; ')} |`);
}
lines.push('', '## OM List reported PhD institutions without an accepted source-record match', '',
  'These are names as reported in faculty directory metadata. The name, relevant field, degree and official institutional identity still need separate checks; exact matches are not assumed.',
  '', '| # | Reported name | Faculty reports |', '|---:|---|---:|');
for(const [i,r] of unresolved.entries())lines.push(`| ${i+1} | ${r.name.replaceAll('|','\\|')} | ${r.reportedFacultyCount} |`);
lines.push('', 'Stages 2–4 remain held until Stage 1 is finished.', '');
const dest=path.join(root,'research-handoff/priorities/STAGE-1-REMAINING-2026-10-23.md');
fs.writeFileSync(dest,lines.join('\n'));
console.log(`Wrote ${remaining.length} grouped discovery identities and ${unresolved.length} unresolved OM reported-degree labels to ${dest}`);
