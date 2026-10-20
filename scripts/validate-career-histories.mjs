import fs from 'node:fs';
import {validateCareerHistories} from '../assets/career-history.js';
const read = name => JSON.parse(fs.readFileSync(`data/${name}.json`, 'utf8'));
const ids = new Set(['faculty','faculty-roster-people','graduate-lists'].flatMap(name => read(name).records.map(r => r.id)));
const data = validateCareerHistories(read('employment-histories'), ids);
console.log(`Employment histories: ${data.records.length} sourced reviews.`);
