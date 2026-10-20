import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { graduatePageKey } from './graduate-inputs.mjs';

const repo = path.resolve(import.meta.dirname, '..');
function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ops-graduate-test-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  for (const dir of ['scripts', 'assets', 'data', 'research-handoff/graduates']) fs.mkdirSync(path.join(root, dir), { recursive: true });
  for (const file of ['scripts/merge-graduate-lists.mjs', 'scripts/graduate-inputs.mjs', 'assets/model.js']) fs.copyFileSync(path.join(repo, file), path.join(root, file));
  const write = (p, value) => fs.writeFileSync(path.join(root, p), JSON.stringify(value));
  write('package.json', { type: 'module' });
  for (const file of ['faculty', 'placements']) write(`data/${file}.json`, { records: [] });
  const url = 'https://example.edu/operations/graduates', key = graduatePageKey(url);
  const page = { url, institution: 'Example University', scope: 'program-list' };
  const record = { institution: page.institution, pageKey: key, sourceUrl: url, sourceDate: '2026-10-18',
    name: 'Example Graduate', listedYear: 2020, yearMeaning: 'graduation', program: 'Operations Research' };
  const proposal = { chunk: 1, extractedAt: '2026-10-20', records: [record] };
  write('research-handoff/graduates/graduate-list-pages.json', [page]);
  write('proposal.json', proposal);
  const run = (...args) => spawnSync(process.execPath, ['scripts/merge-graduate-lists.mjs', ...args], { cwd: root, encoding: 'utf8' });
  const read = p => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
  return { root, write, read, run, page, proposal };
}

test('fresh clone can preview and merge a proposal without downloaded chunks; replay is idempotent', t => {
  const f = fixture(t);
  let r = f.run('proposal.json', '--dry-run');
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /1 new, 1 new sightings/);
  assert.equal(fs.existsSync(path.join(f.root, 'data/graduate-lists.json')), false);
  assert.equal(fs.existsSync(path.join(f.root, 'research')), false);
  r = f.run('proposal.json'); assert.equal(r.status, 0, r.stderr);
  const first = f.read('data/graduate-lists.json');
  assert.equal(first.records[0].sightings[0].pageUrl, f.page.url);
  assert.equal(first.records[0].facultyId, null);
  // Resolving a catalogue entry never claims that unavailable snapshot text has been read.
  assert.deepEqual(f.read('research/graduates/extracted.json'), []);
  r = f.run('proposal.json'); assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(f.read('data/graduate-lists.json'), first);
});

test('refield needs neither a catalogue nor a workbench, and dry run leaves bytes unchanged', t => {
  const f = fixture(t);
  assert.equal(f.run('proposal.json').status, 0);
  fs.rmSync(path.join(f.root, 'research'), { recursive: true });
  fs.unlinkSync(path.join(f.root, 'research-handoff/graduates/graduate-list-pages.json'));
  const target = path.join(f.root, 'data/graduate-lists.json'), before = fs.readFileSync(target);
  const r = f.run('--refield', '--dry-run');
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(fs.readFileSync(target), before);
  assert.equal(fs.existsSync(path.join(f.root, 'research')), false);
});

test('invalid or ambiguous proposal inputs never change published data or extraction state', t => {
  const f = fixture(t);
  assert.equal(f.run('proposal.json').status, 0);
  const files = ['data/graduate-lists.json', 'research/graduates/extracted.json'];
  const before = files.map(p => fs.readFileSync(path.join(f.root, p)));
  for (const change of [
    { pageKey: 'unknown' }, { institution: 'Wrong University' },
    { sourceUrl: 'https://user:secret@example.edu/page' }, { sourceUrl: 'https://' },
  ]) {
    f.write('proposal.json', { ...f.proposal, records: [f.proposal.records[0], { ...f.proposal.records[0], ...change }] });
    assert.notEqual(f.run('proposal.json').status, 0);
    files.forEach((p, i) => assert.deepEqual(fs.readFileSync(path.join(f.root, p)), before[i]));
  }
  f.write('proposal.json', f.proposal);
  f.write('research-handoff/graduates/graduate-list-pages.json', [f.page, { ...f.page, scope: 'not-a-list' }]);
  assert.notEqual(f.run('proposal.json').status, 0);
  files.forEach((p, i) => assert.deepEqual(fs.readFileSync(path.join(f.root, p)), before[i]));
});

test('reviewed exclusions still apply when resolving pages from the tracked catalogue', t => {
  const f = fixture(t);
  f.write('research-handoff/graduates/graduate-list-pages.json', [{ ...f.page, scope: 'not-a-list' }]);
  const r = f.run('proposal.json');
  assert.equal(r.status, 0, r.stderr);
  assert.equal(f.read('data/graduate-lists.json').records.length, 0);
});

test('local chunks retain extraction bookkeeping and local catalogue exclusions', t => {
  const f = fixture(t);
  fs.mkdirSync(path.join(f.root, 'research/graduates'), { recursive: true });
  f.write('research/graduate-list-pages.json', [f.page]);
  f.write('research/graduates/chunk-1.json', { pages: [{ ...f.page, key: graduatePageKey(f.page.url), texts: ['snapshots/live.txt'] }] });
  const r = f.run('proposal.json');
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(f.read('research/graduates/extracted.json'), [`${graduatePageKey(f.page.url)}/live.txt`]);
});

test('status updater executes record stamping from a path containing spaces', t => {
  const f = fixture(t);
  const root = path.join(f.root, 'checkout with spaces');
  fs.mkdirSync(path.join(root, 'scripts'), { recursive: true });
  fs.mkdirSync(path.join(root, 'data'), { recursive: true });
  fs.copyFileSync(path.join(repo, 'scripts/update-research-status.mjs'), path.join(root, 'scripts/update-research-status.mjs'));
  fs.writeFileSync(path.join(root, 'scripts/record-dates.mjs'), "import fs from 'node:fs'; fs.writeFileSync('stamp-ran', 'yes');");
  for (const name of ['research-status', 'placements', 'doctoral-programs']) {
    fs.writeFileSync(path.join(root, `data/${name}.json`), JSON.stringify({ metadata: { counts: {}, updatedAt: '2026-10-20' }, records: [] }));
  }
  const r = spawnSync(process.execPath, ['scripts/update-research-status.mjs'], { cwd: root, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  assert.equal(fs.readFileSync(path.join(root, 'stamp-ran'), 'utf8'), 'yes');
});

test('record stamping preserves Windows JSON formatting and dates on an unchanged rerun', t => {
  const f = fixture(t);
  fs.copyFileSync(path.join(repo, 'scripts/record-dates.mjs'), path.join(f.root, 'scripts/record-dates.mjs'));
  const target = path.join(f.root, 'data/faculty.json');
  fs.writeFileSync(target, JSON.stringify({ records: [{ id: 'test-person', name: 'Example Graduate' }] }, null, 2).replace(/\n/g, '\r\n') + '\r\n');
  const run = () => spawnSync(process.execPath, ['scripts/record-dates.mjs'], { cwd: f.root, encoding: 'utf8' });
  let r = run(); assert.equal(r.status, 0, r.stderr);
  const first = fs.readFileSync(target, 'utf8');
  assert.match(first, /^\{\r\n  "records":/);
  assert.ok(!first.replace(/\r\n/g, '').includes('\n'));
  assert.ok(JSON.parse(first).records[0].addedAt);
  r = run(); assert.equal(r.status, 0, r.stderr);
  assert.equal(fs.readFileSync(target, 'utf8'), first);
});
