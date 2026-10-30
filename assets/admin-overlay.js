// Private verification is joined only after Firebase has authorised the owner.
import {authorised,watchUser,login,logout,readCatalog,watchColumns,saveColumn,readPeopleAliases,savePeopleAliases} from '../admin/firebase-client.js';
import {PILOT_PERSON,pilotSource} from './people-presentation.js';
const tables=[
  {name:'people',body:'#records',columns:['name','year','phd','affiliation','history','sectors','checked']},
  {name:'organisations',body:'#organisation-records',columns:['name','people','programmes']},
  {name:'graduates',body:'#graduate-table tbody',columns:['year','name','institution','destination']},
];
let owner=false,indices=null,revision=0,visibility={},saving=false,aliases=null;
const button=document.querySelector('#admin-session');
const status=document.querySelector('#admin-session-status');
const observers=[];
const node=(tag,text)=>{const el=document.createElement(tag);if(text!=null)el.textContent=text;return el;};
function aliasCell(ids){
  const cell=node('td');cell.dataset.adminVerification='';
  const id=ids[0];
  if(id!==PILOT_PERSON){cell.textContent='—';return cell;}
  if(!aliases){cell.textContent='Loading aliases…';return cell;}
  const form=node('form'),input=node('textarea'),save=node('button','Save aliases');
  input.setAttribute('aria-label','Aliases for Anuj Mehrotra');input.placeholder='One verified name per line';input.rows=2;
  input.value=(aliases[id]?.aliases||[]).join('\n');save.type='submit';
  form.append(input,save);cell.append(form);
  form.addEventListener('submit',async event=>{
    event.preventDefault();save.disabled=true;const current=revision;
    const values=input.value.split('\n').map(v=>v.trim()).filter(Boolean);
    try{await savePeopleAliases(id,values);if(current!==revision)return;aliases[id]={aliases:values};status.textContent='Aliases saved privately for Anuj Mehrotra.';}
    catch(error){if(current===revision)status.textContent='Aliases were not saved. '+error.message;}
    finally{save.disabled=false;}
  });return cell;
}
function verification(ids,index){
  const cell=node('td');cell.dataset.adminVerification='';
  const sources=new Map();
  for(const id of ids)for(const source of index?.get(id)?.sources||[]){
    let url;try{url=new URL(source.url);}catch{continue;}
    if(!['http:','https:'].includes(url.protocol)||url.username||url.password)continue;
    const existing=sources.get(url.href)||{...source,url:url.href,observations:[]};
    existing.observations.push(...source.observations);sources.set(url.href,existing);
  }
  if(!sources.size){cell.textContent=indices?'No recorded links':'Loading verification…';return cell;}
  const details=node('details');details.append(node('summary',`${sources.size} recorded sources`));
  const ordered=ids.includes(PILOT_PERSON)?[...sources.values()].map(pilotSource).sort((a,b)=>a.priority-b.priority):[...sources.values()];
  for(const source of ordered){
    const p=node('p'),a=node('a',source.label);a.href=source.url;a.target='_blank';a.rel='noopener noreferrer';p.append(a);
    const dates=[...new Set([...source.observations.map(o=>o.checkedAt),...(source.priority===0?['2026-10-30']:[])].filter(Boolean))];
    if(dates.length)p.append(node('small','Checked '+dates.join(', ')));
    details.append(p);
  }
  cell.append(details);return cell;
}
function decorate(){
  for(const observer of observers)observer.disconnect();observers.length=0;
  for(const config of tables){
    const body=document.querySelector(config.body),table=body?.closest('table');if(!table)continue;
    for(const el of table.querySelectorAll('[data-admin-verification]'))el.remove();
    for(const el of table.querySelectorAll('.column-visibility'))el.remove();
    for(const [i,key]of config.columns.entries()){
      const id=config.name+'-'+key,visible=visibility[id]!==false;
      for(const row of [...table.tHead.rows,...body.rows]){
        if(row.cells.length<config.columns.length)continue;
        row.cells[i].hidden=!owner&&!visible;
        row.cells[i].classList.toggle('admin-private-column',owner&&!visible);
      }
      if(owner){
        const th=table.tHead.rows[0].cells[i],label=th.textContent.replace('↕','').trim();
        const toggle=node('button',visible?'◉':'⊘');toggle.type='button';toggle.className='column-visibility';toggle.disabled=saving;
        toggle.title=visible?'Hide '+label+' from public tables':'Show '+label+' in public tables';
        toggle.setAttribute('aria-label',toggle.title);toggle.setAttribute('aria-pressed',String(!visible));
        toggle.addEventListener('click',async event=>{
          event.stopPropagation();saving=true;decorate();
          try{await saveColumn(id,!visible);status.textContent=label+(!visible?' is shown in public tables.':' is hidden from public tables. You can still see it.');}
          catch(error){status.textContent='Visibility was not saved. '+error.message;}
          finally{saving=false;decorate();}
        });th.append(toggle);
      }
    }
    for(const row of body.rows)if(!row.dataset.verificationIds&&row.cells.length===1)row.cells[0].colSpan=Math.max(1,config.columns.filter(key=>owner||visibility[config.name+'-'+key]!==false).length+(owner?(config.name==='people'?2:1):0));
    if(owner){
      for(const [i,row]of [...table.tHead.rows].entries()){
        if(config.name==='people'){const alias=node('th',i===0?'Aliases 🔒':'');alias.dataset.adminVerification='';alias.title='Verified alternative names; always admin-only';row.append(alias);}
        const th=node('th',i===0?'Verification':'');th.dataset.adminVerification='';
        if(i===0){const lock=node('span',' 🔒');lock.title='Verification links are always admin-only';th.append(lock);}row.append(th);
      }
      for(const row of body.rows){
        if(!row.dataset.verificationIds)continue;
        if(config.name==='people')row.append(aliasCell(JSON.parse(row.dataset.verificationIds)));
        row.append(verification(JSON.parse(row.dataset.verificationIds),indices?.[config.name]));
      }
    }
    const observer=new MutationObserver(decorate);observer.observe(body,{childList:true});observers.push(observer);
  }
}
// Graduate table is recreated when its filters change.
const graduateHost=document.querySelector('#graduate-table');
if(graduateHost)new MutationObserver(decorate).observe(graduateHost,{childList:true});
watchColumns(value=>{visibility=value;decorate();},()=>{if(owner)status.textContent='Column settings are unavailable. Please reload before changing visibility.';});
button?.addEventListener('click',async()=>{
  button.disabled=true;
  try{if(owner)await logout();else await login();}
  catch(error){status.textContent='Sign-in could not finish. '+error.message;}
  finally{button.disabled=false;}
});
if(button)button.disabled=false;
watchUser(async user=>{
  const current=++revision;owner=authorised(user);indices=null;aliases=null;
  document.documentElement.classList.toggle('admin-signed-in',owner);
  if(button)button.textContent=owner?'Sign out of admin':'Admin sign-in';
  status.textContent=owner?'Admin view · Loading private verification…':user?'This Google account does not have admin access.':'';
  decorate();
  if(user&&!owner){await logout();return;}
  if(!owner)return;
  try{
    const [catalog,privateAliases]=await Promise.all([readCatalog(),readPeopleAliases()]);if(current!==revision)return;
    aliases=privateAliases;
    indices=Object.fromEntries(tables.map(t=>[t.name,new Map((catalog?.tables[t.name]||[]).map(r=>[r.id,r]))]));
    status.textContent='Admin view · Use ◉ / ⊘ in column headings to change public table visibility. Aliases and Verification stay private.';decorate();
  }catch(error){if(current===revision)status.textContent='Private verification could not load. '+error.message;}
});
// Main datasets can arrive after Firebase's first auth callback.
document.addEventListener('admin-tables-ready',decorate);
