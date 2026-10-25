import fs from 'node:fs';
const dest='research-handoff/universities/continuation-142/shard-a/';
const date='2026-10-25';
const read=(n,id,type)=>JSON.parse(fs.readFileSync(`research-handoff/universities/continuation-${n}/shard-a/${id}.${type}.json`));
const write=(id,type,obj)=>fs.writeFileSync(`${dest}${id}.${type}.json`,JSON.stringify(obj,null,2)+'\n');
const east=read(133,'east-texas-a-m-university','unit');
east.status='partial';
east.checkedAt=date;
east.limitations.unshift('Current official sources do not identify a qualifying unit, but two imported historical source-unit labels remain unresolved. This unit review remains partial until those assertions are reconciled or explicitly disposed with evidence.');
write(east.id,'unit',east);
const cases=[
 [78,'california-state-university-long-beach','The opened complete current engineering and business award inventories and actual joint doctorate descriptions name no Operations, Management Science or Industrial Engineering programme, named specialization or host department. Optimisation projects and transportation job examples are research/application context only, not formal route titles. The blocked individual transportation research-assistant page is retained as a source limitation; no content or additional doctorate is inferred from it.'],
 [94,'college-of-charleston','The opened complete 31-result graduate inventory and Mathematics with Computation PhD overview name no doctoral Operations, Management Science or Industrial Engineering title. An Operations Research certificate is a different qualification. The blank/timeout-linked catalogue remains a limitation; unobserved content is not treated as proof of an additional formal specialization.'],
 [98,'college-of-william-and-mary','The opened entire current graduate award inventory, Applied Science PhD concentration list and Computer Science research overview contain no formally named Operations, Management Science or Industrial Engineering doctoral route. On-line manufacturing process control is research in physical inspection/sensing, not a named PhD specialization. Physics/marine titles in the complete central inventory do not match; their detailed research topics are not needed to make a named-title claim.'],
 [47,'it-university-of-copenhagen','The opened central research PhD description and complete nine-section/twenty-one-group inventories contain no official Operations, Management Science or Industrial Engineering programme, named doctoral specialization or department/school title. Urban mobility/network and algorithmic examples do not confer a formal route title. The unrelated BA hiring advert remains inaccessible, with no content inferred.']
];
for(const [batch,id,reason] of cases){
 const d=read(batch,id,'doctoral');
 d.checkedAt=date;
 const canClose=id==='california-state-university-long-beach'||id==='it-university-of-copenhagen';
 d.status=canClose?'no-qualifying-programme-verified':'partial';
 d.coverageComplete=canClose;
 for(const b of d.branches){if(canClose&&b.reviewState==='partial')b.reviewState='checked';b.conclusion+=' Current-title adjudication on 25 October: '+reason;}
 d.limitations.unshift('Current named-title scope only: '+reason);
 write(id,'doctoral',d);
}
