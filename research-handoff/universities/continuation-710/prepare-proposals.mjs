import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const dir='research-handoff/universities/continuation-710',read=p=>JSON.parse(fs.readFileSync(p)),write=(p,v)=>fs.writeFileSync(dir+'/'+p,JSON.stringify(v,null,2)+'\n');
const records=read('data/university-reviews.json').records;
const ids=['bocconi','bocconi-university','erasmus-university','erasmus-university-rotterdam','indian-institute-of-management-calcutta'];
write('prior-reviewed-cut.json',records.filter(r=>ids.includes(r.id)));
const unitInputs=[];
for(const id of ids.slice(2)){
 const prior=records.find(r=>r.id===id),u=structuredClone(prior);
 if(!prior.doctoralReview.coverageComplete||prior.decisions.some(d=>d.disposition==='unresolved'))throw Error('Unresolved gate '+id);
 for(const k of ['addedAt','updatedAt','doctoralReview'])delete u[k];
 u.status='reviewed';
 for(const s of prior.doctoralReview.sources)if(!u.sources.some(x=>JSON.stringify(x)===JSON.stringify(s)))u.sources.push(s);
 u.limitations=id.startsWith('erasmus-')?[
  'Earlier incomplete university-wide inventory and Economics doctoral mapping limitations are resolved by the already published full faculty/institute inventory and ESE Econometrics and Management Science doctoral field review. Original observations and check dates are retained. This integration is not a new source visit.',
  'Technology and Operations Management remains a department; the Econometric Institute and Operations Research group keep their actual unit types. The two doctoral pathways may share an ESE/ERIM student population and are not two independent student counts.'
 ]:[
  'Operations Management is officially an academic group, not a department; retain actual unit type.',
  'The complete official academic-group inventory and later full-time/Executive doctoral inventories resolve the earlier current institutional-scope limitation. Original observations and dates are retained; this integration is not a new source visit.',
  'Historical Operations Research and Systems Analysis wording remains unresolved outside the current admission inventories. No closure date, additional current route or individual degree correction is inferred.'
 ];
 const f=id+'.unit.json';write(f,u);unitInputs.push(dir+'/'+f);
}
const q=structuredClone(records.find(r=>r.id==='bocconi-university').doctoralReview);
if(!q.coverageComplete||q.programmeIds.length)throw Error('Unexpected Bocconi published scope');
q.universityId='bocconi';delete q.programmeIds;q.programmes=[];
q.limitations.push('The already reviewed Bocconi source alias shares this existing university-wide current scope. No new programme, institution or source visit is claimed; original check dates and historical research observations are retained.');
write('bocconi.doctoral.json',q);
const m={baseCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),sources:[],unitInputs,programmes:[],scopes:[dir+'/bocconi.doctoral.json'],assertionInputs:[]};
m.frozenInputs=[...unitInputs,...m.scopes].map(path=>({path,sha256:crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex')}));
write('integration-manifest.json',m);
fs.writeFileSync(dir+'/apply-phase.mjs',fs.readFileSync('research-handoff/universities/continuation-700/apply-phase.mjs','utf8').replaceAll('continuation-700','continuation-710'));
console.log({unitStatusCorrections:3,existingAliasScopeLinks:1,newProgrammeFacts:0,newSourceReads:0});
