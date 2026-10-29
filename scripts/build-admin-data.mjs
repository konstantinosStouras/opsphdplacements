import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildCatalog} from '../admin/catalog.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const names = ['faculty','faculty-roster-people','placements','research-status','employment-histories','linkedin-histories','entities','universities','university-reviews','doctoral-programs','graduate-lists'];
const data = Object.fromEntries(names.map(name => [name, JSON.parse(fs.readFileSync(path.join(root, 'data', name+'.json'), 'utf8'))]));
// Never place private snapshots inside assets/, data/, or the published _site/.
const output = path.join(root, 'research', 'admin', 'catalog.json');
fs.mkdirSync(path.dirname(output), {recursive: true});
const catalog = buildCatalog(data);
fs.writeFileSync(output, JSON.stringify(catalog));
console.log('Private local catalog prepared: '+Object.entries(catalog.tables).map(([name, rows]) => `${rows.length} ${name}`).join(', '));
