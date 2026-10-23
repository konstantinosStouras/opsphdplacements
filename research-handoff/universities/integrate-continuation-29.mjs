// Dated Stage 1 publication recipe. Frozen proposal hashes guard against later edits.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';

process.chdir(path.resolve(import.meta.dirname, '../..'));
const manifestPath = 'research-handoff/universities/release-2026-10-23-continuation-29.json';
const files = [
  ['unit', 'continuation-94/shard-c/university-of-leeds-uk.unit.json'],
  ['unit', 'continuation-100/shard-c/university-of-new-south-wales.unit.json'],
  ['unit', 'continuation-107/shard-c/university-of-manitoba.unit.json'],
  ['unit', 'continuation-110/shard-c/university-of-british-columbia.unit.json'],
  ['doctoral', 'continuation-96/shard-c/university-of-leeds-uk.doctoral.json'],
  ['doctoral', 'continuation-100/shard-c/university-of-new-south-wales.doctoral.json'],
  ['doctoral', 'continuation-108/shard-c/university-of-manitoba.doctoral.json'],
  ['doctoral', 'continuation-109/shard-c/university-of-alberta.doctoral.json'],
  ['doctoral', 'continuation-110/shard-c/university-of-british-columbia.doctoral.json'],
];
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file, 'utf8').replaceAll('\r\n', '\n')).digest('hex');
const run = (script, args) => console.log(execFileSync(process.execPath, [script, ...args], {encoding:'utf8', maxBuffer:30000000}));
if (process.argv.includes('--freeze')) {
  assert.equal(fs.existsSync(manifestPath), false, 'Manifest already exists');
  const manifest = {date:'2026-10-23', baseline:'7b3128b9ad53e7b6008ed5b46c83e15d22fba1c8',
    status:'frozen', hashFormat:'SHA256 UTF8 text with CRLF normalized to LF',
    proposals:files.map(([kind, relative]) => {const file='research-handoff/universities/'+relative; return {kind,file,sha256:hash(file)};})};
  fs.writeFileSync(manifestPath, JSON.stringify(manifest,null,2)+'\n');
  console.log('Frozen '+manifest.proposals.length+' reviewed proposal files.');
  process.exit(0);
}
const manifest=read(manifestPath);
assert.equal(manifest.baseline, '7b3128b9ad53e7b6008ed5b46c83e15d22fba1c8');
for(const proposal of manifest.proposals) assert.equal(hash(proposal.file), proposal.sha256, 'Frozen proposal changed: '+proposal.file);
const units=manifest.proposals.filter(p=>p.kind==='unit').map(p=>p.file);
if(units.length)run('scripts/merge-university-reviews.mjs',[...units,'--dry-run']);
if(!process.argv.includes('--apply')) process.exit(0);
if(units.length)run('scripts/merge-university-reviews.mjs',units);
const cache='research/stage1-continuation-29'; fs.mkdirSync(cache,{recursive:true});
const existing=new Set(read('data/doctoral-programs.json').records.map(r=>r.id));
const scope=[],facts=[];
for(const input of manifest.proposals.filter(p=>p.kind==='doctoral')){
  const proposal=read(input.file);
  const old=proposal.programmes.filter(p=>existing.has(p.existingProgramId||p.id));
  const fresh=proposal.programmes.filter(p=>!existing.has(p.existingProgramId||p.id));
  for(const [mode,programmes] of [['scope',old],['facts',fresh]]){
    if(mode==='scope' && !programmes.length)continue;
    if(mode==='facts' && !programmes.length && old.length)continue;
    const file=path.join(cache,proposal.universityId+'-'+mode+'.json');
    fs.writeFileSync(file,JSON.stringify({...proposal,programmes},null,2)+'\n');
    (mode==='scope'?scope:facts).push(file);
  }
}
for(const [set,flags] of [[scope,['--scope-only']],[facts,[]]]) if(set.length){
  run('scripts/merge-doctoral-proposals.mjs',[...set,...flags]);
  run('scripts/merge-doctoral-proposals.mjs',[...set,...flags,'--apply']);
}
const baseline=JSON.parse(execFileSync('git',['show',manifest.baseline+':data/doctoral-programs.json'],{encoding:'utf8',maxBuffer:30000000}));
const current=read('data/doctoral-programs.json');
for(const p of baseline.records)assert.deepEqual(current.records.find(r=>r.id===p.id),p,'Prior programme changed: '+p.id);
console.log('Preserved all '+baseline.records.length+' prior programme records exactly.');
