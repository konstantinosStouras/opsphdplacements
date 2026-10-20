import fs from 'node:fs';
import {validateHistories} from '../assets/linkedin-histories.js';

const data = validateHistories(JSON.parse(fs.readFileSync('data/linkedin-histories.json','utf8')));
const knownIds = new Set(['faculty','faculty-roster-people','graduate-lists'].flatMap(name => JSON.parse(fs.readFileSync(`data/${name}.json`,'utf8')).records.map(row => row.id)));
for (const record of data.records) {
  if (!knownIds.has(record.id) || record.recordIds.some(id => !knownIds.has(id))) throw Error('Unknown history person identifier');
  if (record.profileHistoryComplete && record.experienceAccess !== 'read-all-visible') throw Error('Complete history requires a full accessible Experience review');
}
console.log(`Validated ${data.records.length} individually reviewed LinkedIn histories`);
