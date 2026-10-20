# Continuing graduate-list research from GitHub

Updated 20 October 2026. The user has resumed work. The proposals in this directory are historical extraction outputs already integrated into `data/graduate-lists.json`; they are not a queue of new graduates to import again.

The public dataset has 14,451 person-year listings from 117 institutions, including 2,161 listings under an operations area. These are source observations, not verified degrees, first jobs or a complete census. Preserve each sighting's date, year meaning and evidence.

## Preview without local downloads

From the repository root with Node 22 or later:

```powershell
node scripts/merge-graduate-lists.mjs --refield --dry-run
node scripts/merge-graduate-lists.mjs research-handoff/graduates/proposal-152.json --dry-run
```

Neither command writes public data or extraction state. The second should report zero new records and sightings. It retains the original exclusion of the one-word name in that proposal.

The collector and merger use the working `research/graduate-list-pages.json` if present, otherwise this directory's tracked `graduate-list-pages.json`. `--refield` needs neither. When a local chunk file is absent, the merger maps each proposal page key back to its reviewed catalogue URL and institution. It does not recreate downloaded text or mark unavailable snapshots as read. A `not-a-list` exclusion still applies.

## Contribute another reviewed proposal

1. Read `AGENTS.md`, `WORKFLOW.md` and `RESEARCH-DESIGN.md`. Check current public records and active assignments.
2. Read the actual primary page or archived capture. The catalogue and a successful preview do not verify its contents.
3. Preserve the existing proposal format: positive integer `chunk`, `extractedAt`, `records`, and optional `unreadable`. Each record supplies `pageKey`, institution, name, source URL/date, listed year and year meaning, with source-stated program, destination, degree and notes where available. The page key uses `graduatePageKey` in `scripts/graduate-inputs.mjs`.
4. Commit the reviewed proposal and relevant catalogue changes. Keep full page text and downloads out of Git. For a new page, its catalogue entry must include URL, institution and reviewed scope.
5. Run the merger with `--dry-run`, inspect the result, then merge without that flag if appropriate. Run `node scripts/update-research-status.mjs` after derived-data updates, followed by `npm run check`, schema/export checks and the publication checks in `WORKFLOW.md`.

The merger refuses unknown keys, institution mismatches, conflicting catalogue assignments and malformed or credential-bearing source URLs. Resolve these with evidence; do not rename the institution merely to pass validation. Existing local chunk files remain supported, including their extraction bookkeeping.

## Outstanding limitations

- The Rutgers alumni-page URL occurs twice in the tracked catalogue, under `Rutgers University` and `Rutgers University at Newark and New Brunswick`. A proposal that needs catalogue resolution for that URL is blocked pending institutional-scope review. Unrelated proposals remain usable.
- Older proposals use inconsistent first/closing years for job-market seasons and inconsistent meanings for some defense years. The existing sightings remain preserved; a reviewed normalization rule and migration are still needed.
- The extraction cache and archive scan state are not restored by these changes. A fresh collection run may rediscover previously read pages; compare with published sightings and do not mistake downloads for completed reviews.
- Graduate identity, degree eligibility, doctoral program history and subsequent jobs still require research. Neither a placement-table destination nor a field inferred from its page establishes an individual's first job or completed doctorate.
