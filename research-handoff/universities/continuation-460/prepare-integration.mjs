import fs from 'node:fs';import crypto from 'node:crypto';import {execFileSync} from 'node:child_process';
const root='research-handoff/universities/',dir=root+'continuation-460',read=p=>JSON.parse(fs.readFileSync(p)),write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');
const reviews=new Map(read('data/university-reviews.json').records.map(r=>[r.id,r])),existing=new Set(read('data/doctoral-programs.json').records.map(r=>r.id));
const union=(a,b)=>[...new Map([...a,...b].map(s=>[JSON.stringify(s),s])).values()];
const originals=['385/shard-a/johns-hopkins-university.doctoral.json','387/shard-a/chalmers-university-of-technology.doctoral.json','389/shard-a/heriot-watt-university.doctoral.json','390/shard-a/indian-institute-of-management-calcutta.doctoral.json'].map(s=>root+'continuation-'+s);
const scopes=[dir+'/mines-paris.doctoral.json'],programmes=[];
for(const path of originals){const p=read(path);p.sources=union(reviews.get(p.universityId)?.doctoralReview?.sources||[],p.sources);
 if(p.universityId==='indian-institute-of-management-calcutta'){
   p.programmes=p.programmes.filter(r=>!existing.has(r.id));if(p.programmes.length!==1)throw Error('Expected one Executive PhD');
   p.programmes[0].limitations=['Exact credential is Executive Ph.D. in the chosen specialization. Its formal research and public dissertation defence requirements meet the research-doctorate rule; the credential is not relabelled as ordinary PhD.','Separate programme from the full-time PhD. Route counts do not establish separate graduate populations or first-job coverage.'];
   p.limitations=p.limitations.filter(s=>!s.startsWith('Exact Executive Ph.D. eligibility'));p.limitations.push('Integrator read the official overview and course-structure pages on 26 October 2026: named Operations Management specialization, exact Executive Ph.D. award and public doctoral dissertation defence established.');
   const out=dir+'/calcutta-executive-programme-integration.json';write(out,p);programmes.push(out);
 }else{const out=dir+'/'+p.universityId+'-scope-integration.json';write(out,p);scopes.push(out);}
}
const er=structuredClone(reviews.get('erasmus-university-rotterdam'));delete er.doctoralReview;delete er.addedAt;delete er.updatedAt;
const aliasSource='https://www.eur.nl/en/about-university/organisation';
er.organisationAliases=union(er.organisationAliases||[],['Rotterdam School of Management, Erasmus University Rotterdam','Rotterdam School of Management, Erasmus University'].map(name=>({name,sourceUrl:aliasSource,checkedAt:'2026-10-26',evidence:'Official Erasmus University Rotterdam faculties/institutes inventory explicitly lists Rotterdam School of Management, Erasmus University. School affiliation is grouped under its verified parent institution while original career labels remain intact.'})));
er.sources=union(er.sources,[{url:aliasSource,checkedAt:'2026-10-26',outcome:'read',note:'Full official university organisation page opened; Rotterdam School of Management is explicitly listed as a faculty/institute of Erasmus University Rotterdam. Supports exact school affiliation aliases in the combined organisation display.'}]);write(dir+'/erasmus-school-alias.unit.json',er);
const unitInputs=[dir+'/mines-paris.unit.json',dir+'/erasmus-school-alias.unit.json',root+'continuation-308/shard-c/chicago.healthcare-analytics-laboratory-unit.json',root+'continuation-310/shard-c/washington.mib-remit-source-enrichment.json',root+'continuation-311/shard-c/georgia.mis-remit-source-enrichment.json'];
const assertionInputs=[root+'continuation-308/shard-c/chicago.explicit-laboratory-source-assertion.json',root+'continuation-309/shard-c/west-florida.literal-placeholder-source-assertion.json',root+'continuation-310/shard-c/washington.mib-exact-source-assertions.json',root+'continuation-311/shard-c/georgia.mis-exact-source-assertions.json'];
const m={baseCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),sources:[dir+'/mines-paris-source-addition.json'],unitInputs,programmes,scopes,assertionInputs,originalProgrammes:originals};
m.frozenInputs=[...m.sources,dir+'/mines-paris-source-catalogue.json',...unitInputs,...programmes,...scopes,...assertionInputs,...originals].map(path=>({path,sha256:crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex')}));write(dir+'/integration-manifest.json',m);
for(const f of ['apply-phase.mjs','apply-assertions.mjs'])fs.writeFileSync(dir+'/'+f,fs.readFileSync(root+'continuation-450/'+f,'utf8').replaceAll('continuation-450','continuation-460'));
console.log({sources:1,units:unitInputs.length,programmes:1,scopes:scopes.length,sourceAssertions:assertionInputs.reduce((n,p)=>n+read(p).records.length,0)});
