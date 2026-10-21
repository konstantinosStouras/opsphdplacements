// Append explicitly selected discovery institutions; never rewrite an imported row.
// A source addition is pending until separately supported by an official review.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fold} from '../assets/model.js';
const root=path.resolve(import.meta.dirname,'..');
const read=file=>JSON.parse(fs.readFileSync(path.join(root,file),'utf8'));
const input=process.argv.slice(2).find(a=>!a.startsWith('--'));
assert(input,'Usage: node scripts/merge-university-source-additions.mjs selection.json [--dry-run]');
const selected=read(input), data=read('data/universities.json');
const byId=new Map(data.records.map(r=>[r.id,r]));
const catalogue=read(selected.sourceCatalogue), newRows=[];
const country=v=>v==='USA'?'United States':v;
const slug=v=>fold(v).replace(/\s+/g,'-');
for(const choice of selected.records){
 assert(choice.id&&choice.nameAsListed&&choice.reason,'Selection requires explicit ID, source name and reason');
 const assertions=catalogue.observations.filter(o=>o.name===choice.nameAsListed);
 assert(assertions.length,'Unknown source name: '+choice.nameAsListed);
 if(byId.has(choice.id)){
  assert(byId.get(choice.id).sourceAddition?.selection===input,'Refusing to overwrite existing source ID '+choice.id);
  continue;
 }
 assert(!data.records.some(r=>fold(r.name)===fold(choice.nameAsListed)),'Existing source label must be reconciled, not appended');
 const departmentMap=new Map();
 for(const a of assertions){
  const id=choice.id+'--'+slug(a.source+' '+a.sourceRecordId+' '+(a.layer||'source'));
  if(!departmentMap.has(id))departmentMap.set(id,{id,school:a.school||null,department:a.department||null,type:null,country:country(a.countryAsListed)||null,facultyUrl:null,departmentUrl:null,address:null,sources:[a.source],postings:null,lastPosted:null,lat:null,lng:null,characteristics:null,sourceAssertion:{source:a.source,sourceRecordId:a.sourceRecordId,layer:a.layer||null,sourceUrl:a.sourceUrl,hidden:!!a.hidden}});
 }
 const departments=[...departmentMap.values()], countries=[...new Set(assertions.map(a=>country(a.countryAsListed)).filter(Boolean))];
 const row={id:choice.id,name:choice.nameAsListed,country:countries.length===1?countries[0]:countries.length?countries:null,departmentCount:departments.length,departments,coords:null,directorySources:[...new Set(assertions.map(a=>a.source))],wikidata:null,peopleDatabase:null,sources:[...new Set(assertions.map(a=>a.sourceUrl))].map(url=>({url,title:'University discovery source; official identity and units reviewed separately',retrievedAt:catalogue.asOf})),sourceAddition:{selection:input,sourceCatalogue:selected.sourceCatalogue,retrievedAt:catalogue.asOf,reason:choice.reason}};
 newRows.push(row);byId.set(row.id,row);
}
data.records.push(...newRows);
data.metadata.originalImportedUniversityCount??=data.metadata.universityCount;
data.metadata.originalImportedDepartmentCount??=data.metadata.departmentCount;
data.metadata.originalImportedRowCount??=data.metadata.rowCount;
data.metadata.universityCount=data.records.length;
data.metadata.departmentCount=data.records.reduce((n,r)=>n+r.departments.length,0);
data.metadata.rowCount=data.metadata.departmentCount;
data.metadata.countries=new Set(data.records.flatMap(r=>Array.isArray(r.country)?r.country:r.country?[r.country]:[])).size;
data.metadata.sourceAdditions=data.records.filter(r=>r.sourceAddition).length;
data.metadata.sourceAdditionNote='Additional discovery assertions from frozen OM List and Operations Academia public sources. Original imported records remain intact. Official names, eligibility and alias decisions require the separate review overlay.';
if(!process.argv.includes('--dry-run'))fs.writeFileSync(path.join(root,'data/universities.json'),JSON.stringify(data,null,1)+'\n');
console.log({added:newRows.length,total:data.records.length,dryRun:process.argv.includes('--dry-run')});
