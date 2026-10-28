import fs from 'node:fs';
import assert from 'node:assert/strict';
const file='data/university-reviews.json';
const data=JSON.parse(fs.readFileSync(file));
const row=data.records.find(x=>x.id==='university-of-manchester');
assert.equal(row.doctoralReview.checkedAt,'2026-10-26');
const prior=structuredClone(row);
fs.writeFileSync(new URL('prior-record.json',import.meta.url),JSON.stringify(prior,null,2)+'\n');
const sources=[
 {url:'https://www.maths.manchester.ac.uk/research/themes/',checkedAt:'2026-10-28',outcome:'read',note:'Full seven-theme inventory read individually in Chrome. Algebra/logic/number theory; analysis/geometry/dynamical systems; continuum mechanics; mathematical life sciences; numerical analysis/scientific computing; probability/financial mathematics/actuarial science; statistics/inverse problems/uncertainty quantification/data science. None has an explicit qualifying Operations, Management Science or Industrial Engineering title. This resolves the earlier page-access gap, not all university doctoral provision.'},
 {url:'https://www.maths.manchester.ac.uk/research/expertise/',checkedAt:'2026-10-28',outcome:'read',note:'Full 23-area inventory read individually in Chrome: algebra; analysis and geometry; approximation theory; biomechanics and transport processes; dynamical systems; ergodic theory and dimension; financial and insurance mathematics; fluid dynamics; geophysics and planetary science; granular materials; inverse problems; logic; mathematical epidemiology; mathematical foundations of data science and AI; number theory; numerical linear algebra; probability; scientific computing; semigroups and semirings; solid mechanics and soft matter; statistics; uncertainty quantification; waves and metamaterials. No explicit qualifying named title. Earlier timeout observations retained as history.'}
];
row.sources.push(...sources);
row.doctoralReview.sources.push(...structuredClone(sources));
row.doctoralReview.checkedAt='2026-10-28';
row.limitations[1]='Doctoral coverage remains partial: mathematics themes and expertise inventories were read on 28 October, resolving their earlier access gap; broader technical programme checks are not all complete.';
row.doctoralReview.limitations[0]='Current administrative-unit inventory and mathematics themes/expertise inventories have been read. Other technical doctoral fields are not fully adjudicated, so institution-wide named-field coverage remains partial. Earlier mathematics timeout observations are superseded by successful 28 October reads.';
const branch=row.doctoralReview.branches.find(x=>x.branch==='engineering');
branch.conclusion=branch.conclusion.replace('Mathematics detailed fields did not load; remaining technical fields require completion, so institution-wide doctoral coverage remains partial.','Mathematics seven-theme and 23-area inventories read on 28 October establish no additional qualifying title. Remaining technical fields require completion, so institution-wide doctoral coverage remains partial.');
assert.equal(row.doctoralReview.coverageComplete,false);
assert.deepEqual(row.units,prior.units);
assert.deepEqual(row.doctoralReview.programmeIds,prior.doctoralReview.programmeIds);
fs.writeFileSync(file,JSON.stringify(data,null,2)+'\n');
