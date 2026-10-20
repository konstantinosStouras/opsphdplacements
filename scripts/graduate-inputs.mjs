// Metadata only: no downloads and no inference of a degree or employment.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { isSourceUrl } from '../assets/model.js';

export const graduatePageKey = url => url.replace(/^https?:\/\//, '').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').slice(0, 80)
  + '-' + crypto.createHash('md5').update(url).digest('hex').slice(0, 6);

export function readGraduatePages(root) {
  const candidates = ['research/graduate-list-pages.json', 'research-handoff/graduates/graduate-list-pages.json'];
  const file = candidates.find(p => fs.existsSync(path.join(root, p)));
  if (!file) throw Error(`Missing graduate page catalogue. Provide ${candidates.join(' or ')}.`);
  const pages = JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
  if (!Array.isArray(pages)) throw Error(`Invalid graduate page catalogue: ${file}`);
  return pages;
}

export function resolveGraduateChunk(root, proposal, catalogue) {
  if (!Number.isInteger(proposal.chunk) || proposal.chunk < 1) throw Error('Proposal needs a positive integer chunk.');
  const local = path.join(root, `research/graduates/chunk-${proposal.chunk}.json`);
  if (fs.existsSync(local)) return JSON.parse(fs.readFileSync(local, 'utf8'));
  // Fresh clones have the reviewed page catalogue, but not the downloaded texts or chunk files.
  // Resolve only keys actually mentioned in the proposal; do not mark whole snapshots as read.
  const byKey = new Map();
  const keys = new Set([...proposal.records, ...(proposal.unreadable || [])].map(r => r.pageKey));
  for (const page of catalogue) {
    if (typeof page.url !== 'string' || !keys.has(graduatePageKey(page.url))) continue;
    if (!isSourceUrl(page.url) || !page.institution) throw Error('Invalid page URL or institution in graduate catalogue.');
    const key = graduatePageKey(page.url), previous = byKey.get(key);
    if (previous && (previous.url !== page.url || previous.institution !== page.institution
      || (previous.scope || 'program-list') !== (page.scope || 'program-list'))) {
      throw Error(`Conflicting graduate catalogue entries for ${key}; reconcile them before merging.`);
    }
    byKey.set(key, page);
  }
  return { chunk: proposal.chunk, pages: [...keys].map(key => {
    const page = byKey.get(key);
    if (!page) throw Error(`Unknown page ${key}; add its reviewed URL, institution and scope to the catalogue.`);
    return { ...page, key, texts: [] };
  }) };
}
