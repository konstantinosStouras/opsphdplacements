import fs from 'node:fs';
import crypto from 'node:crypto';
const d='research-handoff/universities/continuation-240',read=p=>JSON.parse(fs.readFileSync(p)),m=read(d+'/integration-manifest.json');
const title='research-handoff/universities/continuation-192/shard-c/ucf.modeling-exact-title-adjudication.json',scope='research-handoff/universities/continuation-193/shard-c/university-of-central-florida.doctoral-scope-composite.json';
m.titleInputs=[m.titleInput,title];if(!m.scopes.includes(scope))m.scopes.push(scope);
for(const path of[title,scope])if(!m.frozenInputs.some(x=>x.path===path))m.frozenInputs.push({path,sha256:crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex')});
fs.writeFileSync(d+'/integration-manifest.json',JSON.stringify(m,null,2)+'\n');
fs.writeFileSync(d+'/adjudicate-titles.mjs',fs.readFileSync(d+'/adjudicate-maryland.mjs','utf8').replace('input=[read(m.titleInput)]','input=m.titleInputs.map(read)'));
console.log({titleDecisions:m.titleInputs.length,scopeReviews:m.scopes.length});
