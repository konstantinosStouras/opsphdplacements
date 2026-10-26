import fs from 'node:fs';import crypto from 'node:crypto';import {execFileSync} from 'node:child_process';
const dir='research-handoff/universities/continuation-720',read=p=>JSON.parse(fs.readFileSync(p)),write=(p,v)=>fs.writeFileSync(dir+'/'+p,JSON.stringify(v,null,2)+'\n');
const records=read('data/university-reviews.json').records;
const corrections={
 'leipzig-university':{old:'Detailed mathematics/computer-science',note:'Later published current fourteen-faculty/institute inventory, all Mathematics departments and Computer Science research-category panels resolve the earlier technical-unit gap. The published doctoral review separately records relevant regulation sections and their reading method. Broad BWL translation remains excluded; no new source visit or degree fact in this integration.'},
 'otto-von-guericke-university-magdeburg':{old:'Detailed PhD Management',note:'Later published complete doctoral-faculty inventory and actual business chair, Mathematics, Mechanical, Computer Science, Electrical and Process/Systems institute inventories resolve the earlier current unit-scope gap. Operations Management and Management Science chairs remain chairs; no department, new doctorate or current credential equivalence is inferred. Original mixed Chrome/web source methods and dates retained.'},
 'university-of-brighton':{old:'Engineering and mathematics',note:'Later published full current institutional school inventory and relevant Business, Engineering, Computing and Mathematics doctoral field inventories resolve the earlier unit-scope gap. Current restructuring notice remains explicit; no unannounced department names or school assignment for the shared Mathematics/Statistics doctoral offering are inferred. Original research evidence and dates retained.'},
 'university-of-geneva':{old:'Other university doctoral faculties',note:'Later published full nine-faculty central structure, Science section/department inventory and plausible doctoral-mention regulations resolve the earlier current unit-scope gap. Broad GSEM/Institute of Management is not renamed Operations. Neither reported individual doctorate is verified by this institutional review; original dates retained.'},
 'university-of-southampton':{old:'Wider business and engineering',note:'Later published complete institutional faculty/school/department inventory, including all six business departments and four engineering departments, resolves the earlier unit-inventory gap. Additional current ECS group inventory and doctoral fields were separately reviewed. CORMSIS remains a centre and Operational Research a group; no new department or degree inferred.'}
};
write('prior-reviewed-cut.json',records.filter(r=>Object.hasOwn(corrections,r.id)));
const unitInputs=[];
for(const [id,c]of Object.entries(corrections)){
 const prior=records.find(r=>r.id===id),u=structuredClone(prior);
 if(prior.status!=='partial'||!prior.doctoralReview.coverageComplete||prior.decisions.some(d=>d.disposition==='unresolved'))throw Error('Unresolved gate '+id);
 if(!u.limitations.some(l=>l.startsWith(c.old)))throw Error('Expected limitation missing '+id);
 for(const k of ['addedAt','updatedAt','doctoralReview'])delete u[k];
 u.status='reviewed';u.limitations=u.limitations.filter(l=>!l.startsWith(c.old));u.limitations.push(c.note,'Review-state reconciliation uses already published observations. Integration is not a new source read or a historical census.');
 for(const s of prior.doctoralReview.sources)if(!u.sources.some(x=>JSON.stringify(x)===JSON.stringify(s)))u.sources.push(s);
 const f=id+'.unit.json';write(f,u);unitInputs.push(dir+'/'+f);
}
const retain={
 'ajman-university':'Conflicting current administrative department labels need official resolution.',
 'emlv-ecole-de-commerce-et-de-management':'Formal current unit type and wider unit identities remain unverified.',
 'imt-atlantique':'Complete doctoral-specialty list does not replace the unfinished actual department inventory.',
 'indian-statistical-institute':'Statutory division list revision date is unknown; complete current units and geographically separate division units still need review.',
 'kimep-university':'Historical OMIS succession to current business departments remains unresolved.',
 'moscow-institute-of-physics-and-technology':'Complete admissions table does not resolve current unit identities or blocked Operations Research lead.',
 'the-university-of-memphis':'Conflicting combined versus separate department pages remain unresolved.',
 'ubc-sauder-school-of-business':'Industrial Engineering group and Okanagan challenges remain pending; no bypass.',
 'university-of-maryland':'Conflicting current DOIT and legacy LBPP administrative and doctoral host labels remain unresolved.',
 'university-of-maryland-college-park':'Same unresolved administrative evidence conflict under the other source label.',
 'university-of-new-haven-connecticut':'Complete current business-unit inventory remains unread.',
 'world-maritime-university':'Single current doctoral offering does not establish a complete department inventory.'
};
write('retained-incomplete-audit.json',{checkedAt:'2026-10-26',method:'Offline comparison of existing published unit and doctoral observations; no new official-source reads.',records:Object.entries(retain).map(([id,reason])=>({id,status:records.find(r=>r.id===id).status,reason}))});
const m={baseCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),sources:[],unitInputs,programmes:[],scopes:[],assertionInputs:[]};m.frozenInputs=unitInputs.map(path=>({path,sha256:crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex')}));write('integration-manifest.json',m);
fs.writeFileSync(dir+'/apply-phase.mjs',fs.readFileSync('research-handoff/universities/continuation-710/apply-phase.mjs','utf8').replaceAll('continuation-710','continuation-720'));console.log({unitStatusCorrections:unitInputs.length,retainedPartial:12,newSourceReads:0});
