// Repair an accidental contributor unit merge after release validation.
// The newer Aristotle164 proposal stays saved-only for a subsequent reviewed cut.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const dir='research-handoff/universities/continuation-182';
const original=JSON.parse(fs.readFileSync(dir+'/unit-integration.json')).find(r=>r.id==='aristotle-university-of-thessaloniki');
assert(original&&original.decisions.length);
fs.writeFileSync(dir+'/aristotle-release-unit.json',JSON.stringify(original,null,2)+'\n');
execFileSync(process.execPath,['scripts/merge-university-reviews.mjs',dir+'/aristotle-release-unit.json',...(process.argv.includes('--apply')?[]:['--dry-run'])],{stdio:'inherit'});
