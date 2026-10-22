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
import {organisationNameResolver} from '../assets/organisation-model.js';
import {buildIndex,employerMetrics,institutionMetrics} from '../assets/analytics.js';
import {normalize,filterRecords} from '../assets/model.js';

test('KAIST has one combined destination action and a separate doctorate-origin view',()=>{
 const rows=organisationRows(read('entities'),read('universities'),read('university-reviews'),read('doctoral-programs'),read('faculty'),read('faculty-roster-people'),read('employment-histories'),read('linkedin-histories'));
 const canonicalName=organisationNameResolver(rows);
 const state={faculty:[...read('faculty').records,...read('faculty-roster-people').records].map(normalize),placements:read('placements').records.map(normalize),progress:read('research-status')};
 const idx=buildIndex(state);idx.canonicalName=canonicalName;
 const name=canonicalName('KAIST');
 const hires=employerMetrics(idx,name),origins=institutionMetrics(idx,name);
 assert.equal(hires.total,4);assert.equal(origins.total,3);
 assert.equal(new Set(hires.rows.map(p=>p.id)).size,4);
 assert.equal(filterRecords(state.placements,{institution:name,canonicalName}).length,4);
 assert.equal(employerMetrics(idx,'KAIST College of Business').total,4);
 assert.equal(state.placements.filter(p=>p.employer==='KAIST').length,1);
});
