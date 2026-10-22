import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {organisationRows} from '../assets/organisation-model.js';
const read = name => JSON.parse(fs.readFileSync(new URL('../data/'+name+'.json',import.meta.url),'utf8'));
test('reviewed New Haven campuses keep countries, doctoral routes and employer observations separate', () => {
 const entities=read('entities');
 const rows=organisationRows(entities,read('universities'),read('university-reviews'),read('doctoral-programs'),read('faculty'),read('faculty-roster-people'),read('employment-histories'),read('linkedin-histories'));
 const campus=id=>rows.filter(r=>r.reviews.some(u=>u.originals.some(o=>o.id===id)));
 const sa=campus('university-of-new-haven'),us=campus('university-of-new-haven-connecticut');
 assert.equal(sa.length,1);assert.equal(us.length,1);assert.notEqual(sa[0].id,us[0].id);
 assert.deepEqual(sa[0].countries,['Saudi Arabia']);assert.deepEqual(us[0].countries,['United States']);
 assert.equal(sa[0].programs.length,0);
 assert(us[0].programs.some(p=>p.id==='university-of-new-haven-connecticut--engineering-applied-science-phd-industrial-systems'));
 assert(!sa[0].employers.some(e=>e.name.includes('Mechanical and Industrial Engineering')));
 assert(us[0].employers.some(e=>e.name.includes('Mechanical and Industrial Engineering')));
});
