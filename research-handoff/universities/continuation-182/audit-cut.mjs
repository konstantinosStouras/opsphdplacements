import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {displayText} from '../../../assets/model.js';
const read=p=>JSON.parse(fs.readFileSync(p)),before=p=>JSON.parse(execFileSync('git',['show','753e78c:'+p],{maxBuffer:50e6}));
const clean=r=>Object.fromEntries(Object.entries(r).filter(([k])=>!['addedAt','updatedAt'].includes(k)));
for(const file of ['data/doctoral-programs.json','data/universities.json']){
 const old=before(file).records,current=read(file).records,byId=new Map(current.map(r=>[r.id,r]));
 for(const r of old)assert.deepEqual(clean(byId.get(r.id)),clean(r),'Prior observation changed: '+r.id);
 console.log(file,{preserved:old.length,added:current.length-old.length});
}
for(const p of ['data/faculty.json','data/faculty-roster-people.json','data/placements.json','data/employment-histories.json','data/linkedin-histories.json'])assert.deepEqual(read(p),before(p),'Held people dataset changed: '+p);
const violations=[];function scan(v,p){if(typeof v==='string'){if(/\.json\b|github\.com\/[^/]+\/opsphdplacements|raw\.githubusercontent\.com\/[^/]+\/opsphdplacements/i.test(displayText(v)))violations.push(p);}else if(Array.isArray(v))v.forEach((x,i)=>scan(x,p+'['+i+']'));else if(v&&typeof v==='object')for(const[k,x]of Object.entries(v))scan(x,p+'.'+k);}
for(const p of ['data/university-reviews.json','data/doctoral-programs.json'])scan(read(p),p);
assert.equal(violations.length,0,JSON.stringify(violations));console.log({heldPeopleDataUnchanged:true,displayTextViolations:0});
