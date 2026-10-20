import fs from 'node:fs';
const root = 'research-handoff/universities';
const assignments = JSON.parse(fs.readFileSync(`${root}/assignments.json`, 'utf8'));
const published = JSON.parse(fs.readFileSync('data/university-reviews.json', 'utf8'));
const publicById = new Map(published.records.map(r => [r.id, r]));
const canon = value => Array.isArray(value) ? value.map(canon) : value && typeof value === 'object'
  ? Object.fromEntries(Object.keys(value).filter(k => !['addedAt', 'updatedAt'].includes(k)).sort().map(k => [k, canon(value[k])])) : value;
const same = (a, b) => JSON.stringify(canon(a)) === JSON.stringify(canon(b));
const shards = {};
for (const [shard, rows] of Object.entries(assignments.shards)) {
  const proposed = [], unattempted = [], unmerged = [], incomplete = [];
  for (const row of rows) {
    const owner = assignments.overrides?.[row.id] || shard;
    const path = `${root}/proposals/${owner}/${row.id}.json`;
    if (!fs.existsSync(path)) { unattempted.push(row); continue; }
    const proposal = JSON.parse(fs.readFileSync(path, 'utf8'));
    proposed.push({ ...row, status: proposal.status });
    if (!same(proposal, publicById.get(row.id))) unmerged.push(row.id);
    if (proposal.status !== 'reviewed') incomplete.push({ ...row, status: proposal.status, limitations: proposal.limitations });
  }
  shards[shard] = { assigned: rows.length, saved: proposed.length, reviewed: proposed.filter(r => r.status === 'reviewed').length,
    partial: proposed.filter(r => r.status === 'partial').length, blocked: proposed.filter(r => r.status === 'blocked').length,
    nextUnattempted: unattempted[0] || null, unattempted: unattempted.map(r => r.id), unmerged, incomplete };
}
const result = {
  note: 'A proposal is integrated only when its content matches the public observation (record stamps excluded). Incomplete reviews still require follow-up; attempted is not completed.',
  public: published.metadata, shards
};
if (process.argv.includes('--write')) fs.writeFileSync(`${root}/progress.json`, JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify({ public: published.metadata, shards: Object.fromEntries(Object.entries(shards).map(([s, r]) =>
  [s, { assigned: r.assigned, saved: r.saved, reviewed: r.reviewed, partial: r.partial, blocked: r.blocked, unmerged: r.unmerged.length, nextUnattempted: r.nextUnattempted }])) }, null, 2));
