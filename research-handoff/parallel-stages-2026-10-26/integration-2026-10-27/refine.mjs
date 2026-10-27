import fs from 'node:fs';
const out='research-handoff/parallel-stages-2026-10-26/integration-2026-10-27';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8')),write=(p,o)=>fs.writeFileSync(p,JSON.stringify(o,null,2)+'\n');
const h=read('data/employment-histories.json');
const j=h.records.find(r=>r.id==='roster:cornell-university:robert-a-jarrow');
const affiliations=j.jobs.filter(r=>r.titleAsWritten==='Faculty Member'||r.titleAsWritten==='Senior Fellow');
j.jobs=j.jobs.filter(r=>!affiliations.includes(r));
j.otherEmploymentMentions.push(...affiliations.map(r=>({...r,evidenceNote:'Field membership or fellowship distinction, not a separately established employment contract. '+r.evidenceNote})));
const henderson=h.records.find(r=>r.id==='roster:cornell-university:shane-g-henderson');
const director=henderson.jobs.find(j=>j.titleAsWritten==='Director, School of ORIE');
director.isCurrent=null;director.evidenceNote+=' Undated homepage director wording is not treated as current: the reviewed current school roster names David Williamson as director.';
henderson.remainingUnknowns.push('Date of former school-director appointment; current directory and undated homepage title differ.');
write('data/employment-histories.json',h);
const roster=read('data/faculty-rosters.json');
for(const name of ['paul-golz','robert-a-jarrow']){
 const p=read(out+'/inputs/stage-3/histories/'+name+'.json'),d=p.degreeFacts[0],r=roster.records.find(r=>r.id===p.id);
 if(!r.review.phdInstitution){r.review.phdInstitution=d.institutionAsWritten;r.review.phdYear=d.year;r.review.phdSourceUrl=d.sourceUrl;r.review.sources.push({url:d.sourceUrl,title:p.name+' — linked curriculum vitae',notes:'Awarded doctorate listed; individually read '+d.checkedAt+'.'});r.review.reason+=' Linked CV follow-up ('+d.checkedAt+') states '+d.degreeAsWritten+', '+d.institutionAsWritten+', '+d.year+'. No Operations doctorate inferred from current appointment.';}
}
write('data/faculty-rosters.json',roster);
const aliases=read('data/institution-aliases.json');
const decisions=[
 ['Cambridge University','University of Cambridge','https://www.duffield.cornell.edu/people/adrian-s-lewis/','Official Cornell education identifies Cambridge doctorate; existing reviewed University of Cambridge identity supplies canonical name.'],
 ['Cornell University, School of Operations Research and Industrial Engineering','Cornell University','https://www.duffield.cornell.edu/people/kathryn-elizabeth-caggiano/','Official Cornell profile identifies its own school within Cornell as doctorate institution; subordinate school is not a separate university.'],
 ['EPFL','École polytechnique fédérale de Lausanne','https://www.duffield.cornell.edu/people/soroosh-shafiee/','EPFL official-name identity already reviewed in university register; short source degree label retained.'],
 ['Paris Dauphine University','Université Paris Dauphine','https://www.duffield.cornell.edu/people/marie-chazal/','English and French forms of the reviewed Paris Dauphine identity; do not merge with other Paris universities.'],
 ['UCLouvain','University of Louvain','https://www.uclouvain.be/en/research-institutes/lidam/core/about','Reviewed Université catholique de Louvain official UCLouvain domain and existing degree identity; distinct from KU Leuven.']
];
for(const [label,canonical,url,reason]of decisions){if(aliases.aliases[label])throw Error('Alias already exists '+label);aliases.aliases[label]={canonical,reason,sourceUrls:[url],reviewedAt:'2026-10-27',reviewer:'Integrator; prior institutional review and frozen individual source checked together'};}
write('data/institution-aliases.json',aliases);
write(out+'/refinement-decisions.json',{checkedAt:'2026-10-27',institutionAliases:decisions,roleMoves:affiliations.map(r=>({person:j.id,title:r.titleAsWritten,employer:r.employerAsWritten})),degreeAdditions:['Paul Gölz: CMU Computer Science PhD 2022','Robert A. Jarrow: MIT Finance PhD 1979'],limitations:['City University of New York award campus unknown; not assigned to a constituent college.','Paris VI remains a historical written institution; not merged into a generic University of Paris.','Eötvös degree label retained; no guessed map coordinates.']});
