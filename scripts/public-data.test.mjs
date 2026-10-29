import fs from 'node:fs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {projectPublicData,PUBLIC_DATA} from './public-data.mjs';
import {organisationRows} from '../assets/organisation-model.js';
import {isCurrentPhdProgramme} from '../assets/program-model.js';
import {affiliationCorrection} from '../assets/career-history.js';
import {validateDataset} from '../assets/model.js';
const read = name => JSON.parse(fs.readFileSync(new URL('../data/'+name+'.json',import.meta.url),'utf8'));
test('public projections contain no web URLs, including URLs inside evidence prose', () => {
  for(const name of PUBLIC_DATA) {
    const original=read(name), projected=projectPublicData(original,name);
    assert.equal(JSON.stringify(projected).match(/https?:\/\//i),null,name);
    if(original.records)assert.deepEqual(projected.records.map(r=>r.id),original.records.map(r=>r.id),name);
  }
});
test('private source removal preserves organisation grouping and qualifying programme counts', () => {
  const names=['entities','universities','university-reviews','doctoral-programs','faculty','faculty-roster-people','employment-histories','linkedin-histories'];
  const raw=names.map(read),publicData=raw.map((d,i)=>projectPublicData(d,names[i]));
  const summary=inputs=>organisationRows(...inputs).map(r=>({id:r.id,name:r.name,programs:r.programs.map(p=>[p.id,isCurrentPhdProgramme(p)]),units:r.reviews.flatMap(u=>u.units.map(v=>v.id)),careers:[...(r.careers||[])].sort()}));
  assert.deepEqual(summary(publicData),summary(raw));
});
test('source-free people remain valid and reviewed former affiliations survive publication', () => {
  for(const name of ['faculty','faculty-roster-people','placements'])validateDataset(projectPublicData(read(name),name));
  for(const history of read('employment-histories').records){
    const raw=affiliationCorrection(history), projected=affiliationCorrection(projectPublicData({records:[history]}).records[0]);
    assert.equal(projected?.label,raw?.label);
  }
});
