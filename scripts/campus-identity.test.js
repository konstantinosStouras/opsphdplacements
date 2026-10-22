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

test('explicit school aliases join career observations without merging similar or conflicting names',()=>{
 const empty={records:[]};
 const universities={records:[{id:'a',name:'A University',departments:[]},{id:'b',name:'B University',departments:[]}]};
 const aliases=[{name:'A University, School'}];
 const reviews={records:universities.records.map(r=>({...r,canonicalName:r.name,universitySourceUrl:'https://example.edu',status:'reviewed',units:[],limitations:[],duplicateOf:null,organisationAliases:r.id==='a'?aliases:[]}))};
 const entities={records:universities.records.map(r=>({id:r.id,name:r.name,aliases:[r.name],country:'US',programs:[],directory:{universities:[{id:r.id}]}}))};
 const histories={records:[{id:'person',jobs:[{employerAsWritten:'A University, School'}]},{id:'other',jobs:[{employerAsWritten:'A University, Another School'}]}]};
 let rows=organisationRows(entities,universities,reviews,empty,empty,empty,histories,empty);
 assert.equal(rows.length,3);assert(rows.find(r=>r.name==='A University').careers.has('person'));assert(rows.find(r=>r.name==='A University').search.includes('school'));
 reviews.records[1].organisationAliases=aliases;
 rows=organisationRows(entities,universities,reviews,empty,empty,empty,histories,empty);
 assert.equal(rows.length,4);assert(!rows.find(r=>r.name==='A University').careers);
});
