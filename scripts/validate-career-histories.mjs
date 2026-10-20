import fs from 'node:fs';
import {validateCareerHistories} from '../assets/career-history.js';
const read = name => JSON.parse(fs.readFileSync(`data/${name}.json`, 'utf8'));
const ids = new Set(['faculty','faculty-roster-people','graduate-lists'].flatMap(name => read(name).records.map(r => r.id)));
const data = validateCareerHistories({records:[
  ...read('employment-histories').records,
  ...read('linkedin-histories').records.map(h=>({...h,coverageNote:h.coverageNote||'Accessible LinkedIn observations; see profileHistoryComplete and limitations.'}))
]}, ids);
console.log(`Combined career histories: ${data.records.length} sourced reviews with unique identity links.`);
