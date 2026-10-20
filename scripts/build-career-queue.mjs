import fs from 'node:fs';
const read = file => JSON.parse(fs.readFileSync(file,'utf8'));
const people = ['faculty','faculty-roster-people'].flatMap(name => read(`data/${name}.json`).records)
  .sort((a,b) => a.name.localeCompare(b.name,'en') || a.id.localeCompare(b.id,'en'));
const reviewDirectory = 'research-handoff/careers/reviews';
const reviews = new Map();
if (fs.existsSync(reviewDirectory)) for (const name of fs.readdirSync(reviewDirectory).filter(n=>n.endsWith('.json'))) {
  const review=read(`${reviewDirectory}/${name}`);
  if (reviews.has(review.id)) throw Error(`Duplicate review for ${review.id}`);
  if (!['partial','blocked','completed'].includes(review.status) || !review.checkedAt || !review.reason) throw Error(`Invalid review ${name}`);
  reviews.set(review.id, review);
}
const records=people.map((p,i)=>{
  const review=reviews.get(p.id);
  return {order:i+1,batch:Math.floor(i/25)+1,id:p.id,name:p.name,status:review?.status||'pending',checkedAt:review?.checkedAt||null};
});
fs.writeFileSync('research-handoff/careers/alphabetical-queue.json',JSON.stringify({
  version:1,
  scope:'All current faculty and faculty-page people, sorted by displayed name (English collation), stable ID tie-break. Graduate-only histories stay separate until identity reconciliation.',
  batchSize:25,
  note:'Queue status comes from explicit per-person review outcomes, never a successful download. Preserve partial and blocked cases for follow-up; continue to the next unattempted person without treating them as completed.',
  records
},null,2)+'\n');
console.log(`Career queue: ${records.length} people in ${Math.ceil(records.length/25)} batches.`);
