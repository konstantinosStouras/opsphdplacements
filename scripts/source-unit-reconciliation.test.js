import test from 'node:test';
import assert from 'node:assert/strict';
import {reconcileSourceUnit} from './source-unit-reconciliation.mjs';
const universities=[{id:'a',departments:[{id:'old',school:'Business',department:'Operations'}]}];
const review={id:'a',canonicalName:'A University',checkedAt:'2026-10-20',decisions:[{sourceDepartmentId:'old',disposition:'replaced',unitIds:['a--ops'],reason:'Official full name read.'}],units:[{id:'a--ops',sourceUrl:'https://a.edu/ops',checkedAt:'2026-10-19'}],sources:[{url:'https://a.edu/ops',checkedAt:'2026-10-19',outcome:'read'}]};
test('exact repeated source assertion reuses dated decision without rechecking facts',()=>{
 const r=reconcileSourceUnit({school:'Business',department:'Operations'},['a'],universities,[review]);
 assert.equal(r.state,'accounted-for-by-existing-decision');assert.equal(r.priorDecisions[0].unitEvidence[0].checkedAt,'2026-10-19');
});
test('changed school or department never inherits a decision from a reused source ID',()=>{
 assert.equal(reconcileSourceUnit({sourceRecordId:'old',school:'Business',department:'Operations and AI'},['a'],universities,[review]).state,'pending-source-reconciliation');
});
test('unresolved or unsupported decisions remain unresolved',()=>{
 const unresolved=structuredClone(review);unresolved.decisions[0].disposition='unresolved';
 assert.equal(reconcileSourceUnit({school:'Business',department:'Operations'},['a'],universities,[unresolved]).state,'unresolved-existing-decision');
 assert.equal(reconcileSourceUnit({school:'Business',department:'Operations'},['a'],universities,[{...review,sources:[]}]).state,'unresolved-existing-decision');
});
test('institution-only rows do not claim unit verification; wrong institution cannot reuse evidence',()=>{
 assert.equal(reconcileSourceUnit({},['a'],universities,[review]).state,'no-unit-assertion');
 assert.equal(reconcileSourceUnit({school:'Business',department:'Operations'},['b'],universities,[review]).state,'pending-source-reconciliation');
});
test('exact imported source ID disambiguates school aliases but a changed label stays pending',()=>{
 const otherU={id:'b',departments:[{id:'other',school:'Business',department:'Operations'}]};
 const otherR={...structuredClone(review),id:'b',decisions:[{sourceDepartmentId:'other',disposition:'not-a-unit',unitIds:[],reason:'Subject only.'}]};
 const args=[['a','b'],[...universities,otherU],[review,otherR]];
 assert.equal(reconcileSourceUnit({sourceRecordId:'old',school:'Business',department:'Operations'},...args).state,'accounted-for-by-existing-decision');
 assert.equal(reconcileSourceUnit({school:'Business',department:'Operations'},...args).state,'conflicting-existing-decisions');
 assert.equal(reconcileSourceUnit({sourceRecordId:'old',school:null,department:'Operations'},...args).state,'pending-source-reconciliation');
});
