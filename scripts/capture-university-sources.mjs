// Freeze public discovery assertions, never convert them into official reviews.
// No sign-in, API key, personal editor identity or job-submission data is read.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const root=path.resolve(import.meta.dirname,'..');
const date=new Date().toISOString().slice(0,10);
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const fields=['rowId','institution','school','department','unit','country','type','deptUrl','facultyUrl','adUrl','postedAtUrl','furtherInfoUrl','hidden','add','dataset','schoolDept','t'];
const decode=v=>v.stringValue??(v.booleanValue!==undefined?v.booleanValue:v.integerValue!==undefined?Number(v.integerValue):v.doubleValue!==undefined?v.doubleValue:v.nullValue!==undefined?null:v.timestampValue??(v.arrayValue?(v.arrayValue.values||[]).map(decode):v.mapValue?Object.fromEntries(Object.entries(v.mapValue.fields||{}).map(([k,x])=>[k,decode(x)])):null));
const sources=[], observations=[];
const base='https://www.operationsacademia.org/';
async function get(url){const r=await fetch(url);if(!r.ok)throw Error(`Public source HTTP ${r.status}: ${url}`);return await r.text();}
async function collection(name){
 let token='',records=[],pages=0;
 do{const u=new URL(`https://firestore.googleapis.com/v1/projects/operations-academia/databases/(default)/documents/${name}`);u.searchParams.set('pageSize','1000');for(const f of fields)u.searchParams.append('mask.fieldPaths',f);if(token)u.searchParams.set('pageToken',token);const body=await get(u);const j=JSON.parse(body);for(const d of j.documents||[])records.push({sourceDocumentId:d.name.split('/').at(-1),...Object.fromEntries(Object.entries(d.fields||{}).map(([k,v])=>[k,decode(v)]))});token=j.nextPageToken||'';pages++;}while(token);
 return {records,pages};
}
const files=await Promise.allSettled(['directory','universities','jobs','past-postings'].map(async name=>{const url=base+`data/${name}.json`,body=await get(url),rows=JSON.parse(body);if(!Array.isArray(rows))throw Error(`Expected array: ${name}`);return {name,url,rows,sha256:hash(body)};}));
for(const r of files)if(r.status==='rejected')throw r.reason;
const data=Object.fromEntries(files.map(r=>[r.value.name,r.value]));
const corrections=await Promise.allSettled([collection('directoryEdits'),collection('rowOverrides')]);
for(const r of corrections)if(r.status==='rejected')throw r.reason;
const directoryEdits=corrections[0].value, overrides=corrections[1].value;
const dirById=new Map(directoryEdits.records.map(r=>[r.rowId||r.sourceDocumentId,r]));
const overrideByKey=new Map(overrides.records.filter(r=>['universities','past-postings'].includes(r.dataset)).map(r=>[r.dataset+'__'+r.rowId,r]));
function assertion(source,r,extra={}){if(!(r.institution||r.name))return;observations.push({source,sourceRecordId:r.id||r.rowId,name:r.institution||r.name,school:r.school||null,department:r.department||r.unit||r.schoolDept||null,countryAsListed:r.country||null,sourceUrl:r.adUrl||r.postedAtUrl||r.deptUrl||r.departmentUrl||r.facultyUrl||data[source.replace(/^oa-live-/, '')]?.url||base,...extra});}
for(const {name,url,rows,sha256} of Object.values(data)){
 sources.push({id:'oa-live-'+name,url,retrievedAt:date,records:rows.length,sha256,method:'Fresh public data-file retrieval; discovery assertions only.'});
 for(const r of rows){
  assertion('oa-live-'+name,r,{layer:'published-file'});
  const correction=name==='directory'?dirById.get(r.id):overrideByKey.get(name+'__'+r.id);
  if(correction)assertion('oa-live-'+name,{...r,...correction},{layer:'public-correction',hidden:!!correction.hidden,correctionId:correction.sourceDocumentId});
 }
}
for(const e of directoryEdits.records)if(e.add&&e.institution)assertion('oa-live-directory',{...e,id:e.rowId||e.sourceDocumentId},{layer:'public-addition',hidden:!!e.hidden,correctionId:e.sourceDocumentId});
for(const [name,c] of [['directoryEdits',directoryEdits],['rowOverrides',overrides]])sources.push({id:'oa-public-'+name,url:`https://firestore.googleapis.com/v1/projects/operations-academia/databases/(default)/documents/${name}`,retrievedAt:date,records:c.records.length,pages:c.pages,sha256:hash(JSON.stringify(c.records)),method:'Unauthenticated public read with field mask excluding editor identities, contact details and other personal fields.'});
const om=JSON.parse(fs.readFileSync(path.join(root,'research-handoff/priorities/omlist-schools-2026-10-21.json'),'utf8'));
sources.push({id:'omlist-schools',url:om.sourceUrl,retrievedAt:om.observedAt,records:om.records.length,method:'All displayed school rows captured in Chrome.'});
for(const r of om.records)observations.push({source:'omlist-schools',sourceRecordId:r.sourceId,name:r.name,school:null,department:r.departmentAsListed,countryAsListed:r.countryAsListed,sourceUrl:r.sourceUrl,layer:'displayed-school-row'});
const output={asOf:date,state:'discovery-only',sources,observations,publicDirectoryCorrections:directoryEdits.records,publicArchiveCorrections:overrides.records.filter(r=>['universities','past-postings'].includes(r.dataset)),limitation:'Source names, posting topics, aliases and community corrections are discovery assertions. Official university/unit reviews remain separate. Preserve hidden/corrected assertions for reconciliation; no frame-completeness or official-verification claim is made by this capture.'};
const file=path.join(root,`research-handoff/priorities/source-catalogue-live-${date}.json`);fs.writeFileSync(file,JSON.stringify(output,null,2)+'\n');console.log({file:path.relative(root,file),observations:observations.length,sourceCounts:sources.map(({id,records})=>({id,records}))});
