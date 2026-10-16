# Paused handoff — 16 October 2026 (historical record; work resumed, see the resume log at the end)

The user explicitly paused all work in this thread because credits are low. All three research agents were interrupted. Do not resume research, reviews, merges or deployment until the user requests resumption. No automatic research schedule is configured.

The user's standing requirement remains: update affected Markdown guides as new information becomes available during future authorized work. See AGENTS.md and WORKFLOW.md.

## State at the original pause

Latest website feature release: `c381ac3` (social metadata, preview image and icons), deployed successfully. Citation redesign and contributor guides are also live. At that pause the public research ledger reported **689 verified, 670 unresolved and 790 pending**, across 2,149 imported profiles. The program register contains 13 initial records across 10 institutions. Public graduate census, advisors, comprehensive career histories and publication datasets remain incomplete.

## Saved research snapshot — now available on GitHub

These are the saved-file counts at the original pause. The results were subsequently integrated by commit `9fbf00d` (see resume log), and the complete portable handoff is now tracked in [research-handoff/](research-handoff/README.md). Full source documents are represented by source URLs, retrieval metadata and file hashes rather than republished copies.

| Shard | Reviewed | Verified | Unresolved | Saved results |
|---|---:|---:|---:|---|
| A | 362 | 229 | 133 | `research-handoff/placements-a/results.json` |
| B | 716 | 284 | 432 | `research-handoff/placements-b/results.json` |
| C | 583 | 241 | 342 | `research-handoff/placements-c/results.json` |

## Resume safely

1. Read AGENTS.md, WORKFLOW.md, TODO.md and RESEARCH-STATUS.md. Inspect Git status and preserve local changes.
2. Confirm there are no overlapping active assignments before restarting agents. Original faculty-array index modulo 3 identifies A/B/C ownership; use stable IDs for merging.
3. Inspect the tracked snapshot and current ledger; these saved results have already been integrated. For older helpers, see the optional restoration utility in `research-handoff/README.md`. Inspect any partial batches; interruption may leave unsaved work incomplete. Do not assume a completed review from a downloaded document.
4. Review new corrections and source evidence before merging. Recent audits found hidden postdocs in destination lists, including Yue Hu, Mengzhenyu Zhang and Jerry Anunrojwong. Even an advisor's “position upon graduation” list can omit an earlier postdoc (Shining Wu); a full dated CV can supersede it.
5. Integrate only reviewed findings, run the documented checks, regenerate the public status summary and update affected guides. Publish only when resuming within the user's authorization.
6. Continue the historical program register, program-year graduate census, then sourced careers/advisors/publications with fact-level check dates. Maintain honest coverage and unresolved labels.

The current desktop-thread instruction is to publish relevant continuation files and update the GitHub guides, while keeping other work paused. This upload uses `[skip ci]`, introduces no research-data changes and does not authorize further research or deployment. The separate integration below is preserved as repository history.

## Resume log — 16 October 2026

The user explicitly authorized resuming. What happened:

- The ignored `research-handoff/placements-{a,b,c}/results.json` files were absent from the fresh cloud clone. They were recovered from the user's Dropbox copy of the checkout. Counts and file sizes matched this handoff exactly (A 362/229/133, B 716/284/432, C 583/241/342).
- Conflict review before merging: 1,661 unique IDs, no duplicates, no unknown IDs or name mismatches. 1,359 overlapped the published ledger, with no verified row downgraded and no employer changed. 23 previously unresolved people became verified (including Jerry Anunrojwong's University of Washington postdoc). 302 people were newly reviewed (42 verified, 260 unresolved). Yue Hu, Mengzhenyu Zhang and Shining Wu keep their earlier postdocs.
- Merged with `scripts/merge-placement-research.mjs`. Published totals are now 754 verified, 907 unresolved and 488 pending of 2,149.
- Remaining first-pass reviews: A 355, B 0, C 133. At that integration, other local material had not been copied. The subsequent archive publication below supplies the relevant continuation material.
- Not done in this session: new individual research, program register expansion, graduate census, advisors and publications.

## Portable archive publication — 16 October 2026

The originating desktop thread subsequently published `research-handoff/`: saved results, audits, pending lists, research helpers, the program pilot, 4,180 source discovery/retrieval metadata records and an inventory of 4,910 original files. A fresh clone contains all relevant continuation work. Full downloaded CVs/pages, duplicate imports, bytecode and the reproducible SQLite export are not republished. Their disposition and recovery paths are recorded in the archive.

GitHub commit `9fbf00d` was discovered during this upload and preserved. Current committed data contain **754 verified, 907 unresolved and 488 pending**, with 1,661 reviewed people. The archive totals overlap those data; they are not additional placements. This desktop thread remains paused after uploading the handoff. No research or website deployment was started by the archive publication.

### Second integration, later on 16 October 2026

- Ten parallel research agents reviewed the remaining pending people of shards C and A, each writing its own proposal file (`research/placements-{a,c}/proposal-N.json`, ignored). The shared web-search budget ran out, so shard A reached only 95 of 355 people; shard C's chunk 4 (33 people) produced no proposal at all.
- Integrated 195 reviews: 43 verified, 151 unresolved, 1 not-yet-completed PhD. One agent record (Spyros Zoumpoulis) was downgraded to unresolved by the integrator because the postdoc-first order rested on list order only. Published totals: 797 verified, 1,058 unresolved, 293 pending, 1 not-yet-completed, of 2,149.
- Remaining first-pass reviews: A 260, C 33, B 0.
- Shard C's chunk 4 arrived later and was integrated (13 verified, 20 unresolved after one integrator downgrade, Simone Peinkofer). Published totals: 810 verified, 1,078 unresolved, 260 pending, 1 not-yet-completed. Shard C's first pass is complete; shard A has 260 left.

### Fourth integration, later on 16 October 2026

- Shard A round 2, chunk 2 (40 people, 17 verified, 23 unresolved) integrated after one integrator downgrade (Marianne Jahre: internal promotion at the pre-degree employer is not a first new job). Two shard C records (Joern Meissner, Ilkka Leppänen) relabelled from other-academic to tenure-track under the new lectureship rule. Published totals: 826 verified, 1,102 unresolved, 220 pending, 1 not-yet-completed. Chunks r2-1 and r2-3 (80 people) were still running.
- The Operations Academia directory was imported as `data/universities.json` (database 1) and linked to the people database by name and Wikidata item; the website does not show it yet.
