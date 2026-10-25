import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {displayText} from '../../../assets/model.js';
const read=p=>JSON.parse(fs.readFileSync(p)), before=p=>JSON.parse(execFileSync('git',['show','HEAD:'+p],{maxBuffer:50e6}));
const clean=r=>Object.fromEntries(Object.entries(r).filter(([k])=>!['addedAt','updatedAt'].includes(k)));
const old=before('data/doctoral-programs.json').records,current=read('data/doctoral-programs.json').records,byId=new Map(current.map(p=>[p.id,p]));
const changed=old.filter(p=>JSON.stringify(clean(p))!==JSON.stringify(clean(byId.get(p.id))));
assert.deepEqual(changed.map(p=>p.id),['university-of-science-and-technology-of-china--mathematics-operations-research-cybernetics-phd']);
for(const field of ['degree','programName','school','department','specialization','fields'])assert.deepEqual(changed[0].facts.find(f=>f.field===field),byId.get(changed[0].id).facts.find(f=>f.field===field),'Original USTC fact changed: '+field);
for(const p of ['data/faculty.json','data/faculty-roster-people.json','data/placements.json','data/employment-histories.json','data/linkedin-histories.json'])assert.deepEqual(read(p),before(p),'Held people data changed');
const violations=[];function scan(v,p){if(typeof v==='string'){const text=displayText(v);if(/\.json\b|github\.com\/[^/]+\/opsphdplacements|raw\.githubusercontent\.com\/[^/]+\/opsphdplacements/i.test(text))violations.push(p);}else if(Array.isArray(v))v.forEach((x,i)=>scan(x,p+'['+i+']'));else if(v&&typeof v==='object')for(const [k,x]of Object.entries(v))scan(x,p+'.'+k);}
for(const p of ['data/university-reviews.json','data/doctoral-programs.json'])scan(read(p),p);
assert.equal(violations.length,0,JSON.stringify(violations));
console.log({oldProgrammesPreserved:old.length-1,statusOnlyUpdated:changed[0].id,newObservations:current.length-old.length,heldPeopleDataUnchanged:true,displayTextViolations:violations.length});
