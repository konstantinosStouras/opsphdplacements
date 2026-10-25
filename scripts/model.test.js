import fs from 'node:fs';
import {organisationRows,distinctNames} from '../assets/organisation-model.js';
import {test} from 'node:test';import assert from 'node:assert/strict';import {normalize,filterRecords,groupCounts,csv,validateDataset,isSourceUrl} from '../assets/model.js';
import {cohortStats} from '../assets/cohort-stats.js';
test('cohort distributions retain unknown job types and exclude unresolved outcomes from shares',()=>{
 const people=[{phdYear:2020,placement:{category:'postdoc'}},{phdYear:2020,placement:{category:'unknown'}},{phdYear:2020,status:'unresolved'},{phdYear:null,placement:{category:'industry'}},{phdYear:2021,placement:{category:'tenure-track'}}];
 const stats=cohortStats(people,2020);assert.equal(stats.people,3);assert.equal(stats.verified,2);assert.equal(stats.unresolved,1);
 assert.equal(stats.categories.find(c=>c.id==='postdoc').share,0.5);assert.equal(stats.categories.find(c=>c.id==='unknown').share,0.5);
 assert.equal(stats.categories.reduce((s,c)=>s+c.count,0),2);assert.ok(cohortStats(people,2019).categories.every(c=>c.share===null));
});
const rows=[normalize({id:'a',name:'Test A',discipline:'Operations',currentInstitution:'Institution A',phdInstitution:'Program X',phdYear:2020,facultyStatus:'active'}),normalize({id:'b',name:'Test B',discipline:'Operations',currentInstitution:'Institution B',phdYear:null,facultyStatus:'retired'}),normalize({id:'c',name:'Test C',discipline:'Supply Chain Management',currentInstitution:'Institution A',phdInstitution:'Program Y',phdYear:2022,facultyStatus:'active'})];
test('filters combine search, status, institution and year; unknown year is excluded from ranges',()=>{assert.equal(filterRecords(rows,{status:'active'}).length,2);assert.equal(filterRecords(rows,{query:'TEST institution',from:2021}).length,1);assert.equal(filterRecords(rows,{phd:'Program X',to:2019}).length,0);assert.equal(filterRecords(rows,{institution:'Institution A'}).length,2);});
test('current affiliation never becomes first placement',()=>assert.equal(rows[0].firstPlacement,undefined));
test('one person can be found by their independently evidenced first employer and role',()=>{
 const person={...rows[0],firstPlacement:{employer:'INSEAD',position:'Assistant Professor',placementYear:2021,category:'tenure-track'}};
 assert.equal(filterRecords([person],{query:'INSEAD Assistant'}).length,1);
 assert.equal(filterRecords([person],{cols:{institution:'INSEAD',position:'Assistant'}}).length,1);
 assert.equal(filterRecords([person],{cols:{institution:'INSEAD',position:'Postdoc'}}).length,0);
 assert.equal(person.institution,'Institution A');
 assert.equal(filterRecords(rows,{query:'INSEAD'}).length,0);
});
test('verified placements render first employer and role instead of later affiliation/title',()=>{const r=normalize({verificationStatus:'verified-first-placement',employer:'First University',position:'Postdoctoral fellow',currentInstitution:'Later University',title:'Professor'});assert.equal(r.institution,'First University');assert.equal(r.position,'Postdoctoral fellow');});
test('grouping retains unknown values',()=>{assert.deepEqual(groupCounts(rows,'institution'),[['Institution A',2],['Institution B',1]]);assert.ok(groupCounts(rows,'phdYear').some(([k])=>k==='Unknown'));});
test('CSV handles quotes, newlines and spreadsheet formulas',()=>{const out=csv([{name:'=1+1',position:'a,"b"\nc'}]);assert.ok(out.includes('"\'=1+1"'));assert.ok(out.includes('"a,""b""\nc"'));});
test('reject duplicate IDs and unsafe links',()=>{const r={id:'1',name:'Test',sourceUrl:'https://example.com',retrievedAt:'2026-10-16',phdYear:null};assert.throws(()=>validateDataset({records:[r,r]}));assert.throws(()=>validateDataset({records:[{...r,sourceProfileUrl:'javascript:alert(1)'}]}));assert.doesNotThrow(()=>validateDataset({records:[r]}));});
test('public CV sources may use HTTP or HTTPS but never executable URLs or credentials',()=>{for(const url of ['https://example.edu/cv.pdf','http://example.edu/cv.pdf'])assert.equal(isSourceUrl(url),true);for(const url of ['javascript:alert(1)','data:text/html,test','https://','https://name:password@example.edu/cv.pdf',null])assert.equal(isSourceUrl(url),false);});
test('name filters ignore accents, punctuation and case so every spelling of one organisation matches',()=>{const r=[normalize({id:'k1',name:'K One',phdInstitution:'Koç University',currentInstitution:'University of California, Berkeley',phdYear:2010,facultyStatus:'active'}),normalize({id:'k2',name:'K Two',phdInstitution:'Koc University',currentInstitution:'University of California Berkeley',phdYear:2011,facultyStatus:'active'})];assert.equal(filterRecords(r,{phd:'Koc University'}).length,2);assert.equal(filterRecords(r,{institution:'University of California, Berkeley'}).length,2);assert.equal(filterRecords(r,{cols:{phd:'koç'}}).length,2);assert.equal(filterRecords(r,{query:'berkeley california'}).length,2);});

test('organisation labels omit formatting-only aliases and the displayed primary name',()=>{
 assert.deepEqual(distinctNames(["A’Sharqiyah University","A'Sharqiyah University","A’Sharqiyah University"],"A’Sharqiyah University"),[]);
 assert.deepEqual(distinctNames(['MIT','mit','Massachusetts Institute of Technology'],'Massachusetts Institute of Technology'),['MIT']);
});
test('the complete organisation view has no repeated labels and preserves source entities and counts',()=>{
 const names=['entities','universities','university-reviews','doctoral-programs','faculty','faculty-roster-people','employment-histories','linkedin-histories'];
 const inputs=names.map(n=>JSON.parse(fs.readFileSync(new URL('../data/'+n+'.json',import.meta.url),'utf8')));
 const rows=organisationRows(...inputs),entities=rows.flatMap(r=>r.entities),keys=rows.map(r=>r.name.toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^\p{L}\p{N}]+/gu,' ').trim());
 assert.equal(new Set(keys).size,keys.length);assert.equal(new Set(entities.map(e=>e.id)).size,entities.length);
 for(const e of inputs[0].records)if(e.people||e.employer||e.programs.length)assert.ok(entities.some(x=>x.id===e.id),'Missing '+e.id);
 assert.equal(rows.flatMap(r=>r.phd).reduce((n,p)=>n+p.people,0),inputs[0].records.reduce((n,e)=>n+(e.people?.institutions||[]).reduce((s,p)=>s+p.people,0),0));
 assert.equal(rows.flatMap(r=>r.employers).reduce((n,p)=>n+p.verifiedFirstJobs,0),inputs[0].records.reduce((n,e)=>n+(e.employer?.employers||[]).reduce((s,p)=>s+p.verifiedFirstJobs,0),0));
 const cuhk=rows.find(r=>r.name==='The Chinese University of Hong Kong'),shenzhen=rows.find(r=>r.name==='The Chinese University of Hong Kong, Shenzhen');assert.ok(cuhk&&shenzhen);assert.notEqual(cuhk.id,shenzhen.id);
 for(const r of rows){const aliases=distinctNames(r.names,r.name);assert.equal(aliases.length,new Set(aliases.map(n=>n.toLocaleLowerCase())).size);}
});

test('an official name review does not merge a namesake in a conflicting country',()=>{
 const entity=(id,country)=>({id,name:'Same University',aliases:['Same University'],country,programs:[]});
 const source={id:'source-a',name:'Same University',country:'Country A',departments:[]};
 const review={id:'source-a',canonicalName:'Same University',universitySourceUrl:'https://example.edu/',checkedAt:'2026-10-21',status:'reviewed',units:[],limitations:[],decisions:[]};
 const rows=organisationRows({records:[entity('a','Country A'),entity('b','Country B')]},{records:[source]},{records:[review]},...Array.from({length:5},()=>({records:[]})));
 assert.equal(rows.length,2);assert.ok(rows.find(r=>r.entities.some(e=>e.id==='a')).reviews.length);assert.equal(rows.find(r=>r.entities.some(e=>e.id==='b')).reviews.length,0);
});

test('reviewed school aliases join career-only entities while preserving countries and independent identities',()=>{
 const entity=(id,name,country='A')=>({id,name,aliases:[name],country,programs:[]});
 const parent={id:'parent',name:'Parent University',country:'A',departments:[]};
 const review={id:'parent',canonicalName:parent.name,universitySourceUrl:'https://example.edu',checkedAt:'2026-10-25',status:'reviewed',units:[],limitations:[],decisions:[],organisationAliases:[{name:'School Alias',sourceUrl:'https://example.edu/school',checkedAt:'2026-10-25',evidence:'School belongs to parent.'}]};
 const run=(country='A',ownReview=false)=>organisationRows({records:[{...entity('p',parent.name),directory:{universities:[{id:'parent'}]}},entity('s','School Alias',country)]},{records:[parent,...(ownReview?[{id:'school',name:'School Alias',country,departments:[]}]:[])]},{records:[review,...(ownReview?[{...review,id:'school',canonicalName:'School Alias',organisationAliases:[]}]:[])]},...Array.from({length:5},()=>({records:[]})));
 const joined=run();assert.equal(joined.length,1);assert.deepEqual(joined[0].entities.map(e=>e.id),['p','s']);assert(joined[0].names.includes('School Alias'));
 assert.equal(run('B').length,2);
 assert.equal(run('A',true).length,2);
});
