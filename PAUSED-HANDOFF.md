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

### Fifth integration, later on 16 October 2026

- Shard A round 2, chunk 3 (40 people, 16 verified after one integrator downgrade, 24 unresolved) integrated; two integrator relabels (Stefan Minner: postdoc; Ickhyun Nam: rank at start left null). Published totals: 842 verified, 1,126 unresolved, 180 pending, 1 not-yet-completed. Chunk r2-1 was still running with 16 of 40 people saved.
- The Universities section now shows database 1 on the site; the Wikidata pass over the directory names (`node scripts/geocode-institutions.mjs universities`) was still running and will add links when the import is re-run.

### Sixth integration, later on 16 October 2026

- Shard A round 2, chunk 1 (40 people, 21 verified after one integrator downgrade, 19 unresolved) integrated. Published totals: 863 verified, 1,145 unresolved, 140 pending, 1 not-yet-completed. All three round-2 proposals are merged; shard A has 140 people left.

### Merged organisation database, later on 16 October 2026

- The Wikidata pass over the directory names finished (579 of 645 universities matched after grouping spellings) and `data/university-locations.json` was published with countries.
- The two databases and the program register were merged into `data/entities.json` (868 organisations, 736 keyed by a Wikidata item, 177 in both databases, no conflicts), with a validator check that every PhD institution, directory university and first employer is attached exactly once. Each PhD institution and first-employer profile on the site now ends with the merged record.
- Reviewing the merges that rest on a shared Wikidata item found wrong search results; nine corrections were recorded in `data/location-review.json` (see RESEARCH-DESIGN.md) and the derived files rebuilt. The other name-based matches remain unreviewed.
- Spellings that differ only in accents, punctuation, spacing or case are now one organisation in the derived files and on the site (1 PhD institution, 11 employers and 11 directory names were affected). No research ledger data changed in this step.

### Faculty rosters, later on 16 October 2026

- At the user's request, the faculty pages linked from the universities database were read as a second source of people: `data/faculty-rosters.json` (after the plain fetch and a browser retry, 4,101 listed people at 95 universities from the 104 pages that answered and could be read; 252 the same as an OM List profile at the same university, 3,814 unverified with no doctorate or first job known). The rules are in RESEARCH-DESIGN.md; the Universities section shows the counts per university.
- A one-by-one verification was set up (chunk files under the ignored `research/rosters/`, proposal files merged by `scripts/merge-roster-research.mjs`, validated by `npm run check`) and run on the first three chunks: 120 people, 109 confirmed faculty, 5 extraction noise, 4 not faculty, 2 unresolved; one integrator correction (Peter Sarlin: a study period is not a conferral year). Most confirmed people in the pilot were not operations faculty, because two chunks came from whole-college directories, so the queue was reordered to put operations-titled people and department pages first; chunks 4 to 6 were started under that order. Confirmed roster people are not yet part of the people database proper (open task in TODO.md).
- 128 of the 247 faculty-page links gave nothing (77 dead, 31 refused automated readers, 10 unavailable, 9 without an answering host, 1 rejected); the per-page status is published in the roster file for the directory's maintenance.

### Roster review loop (active assignment, 16 October 2026)

The user asked for the roster reviews to continue chunk by chunk until every listed person is reviewed. Position when this entry was last updated: chunks 1 to 75 merged and published (3,000 of 4,101 people reviewed: 2,552 confirmed faculty, 160 not faculty, students, postdocs, former members or staff, 222 extraction noise, 26 the same as an OM List profile, 40 unresolved); chunks 76 to 81 (Ivey and Wilfrid Laurier whole-school pages) in review by six agents, with 547 people left in the queue after them (Laurier, Yale SOM, Tulane, Tuck and the remaining directory tails). From chunk 43 on the queue is the whole-college directories (Clemson, Dartmouth, Georgia Tech ISyE, Loyola, Notre Dame, Ivey, Laurier, Yale SOM, Tulane, Tuck), so most confirmed people from here are faculty outside operations. Integrator rules applied so far: a study period is not a conferral year; a prize biography is not evidence of a current appointment; professional degrees (MD, JD) are not recorded as doctorates, nor is a degree the page calls pending; DBAs, EdDs and other research doctorates are recorded with the degree type in the reason; an awarding institution is kept as the page writes it (one Georgia Tech page names only "ISyE"); a page that only says someone "finished doctoral studies" somewhere does not state an awarded degree (Ann Frost, chunk 71, left unrecorded); a directory entry whose only title is at another university stays unresolved (Francisco Perez-Gonzalez, chunk 70). Pages drawn by scripts (Vanderbilt Owen, Ivey Discovery) and a host that answers the fetch tool with 503 (merage.uci.edu) were read through curl or the page's own public data endpoint, stated in each row. A usage limit stopped six agents mid-chunk on 16 October 2026; their saved rows were merged and the interrupted chunks were resumed and finished. The queue regenerates from the next free number, so an interrupted chunk's unreviewed people simply return to it. Integrator corrections so far: two doctorate years set to null because the page gave a study period (Peter Sarlin, Joyce Low). Reviewers report that whole-college and whole-school pages (Clemson, Cornell Tech, Emory, Ivey, Alfaisal) list mostly faculty in other fields, which is why the queue puts operations titles and department pages first. The loop, for whoever continues (a reset session included):

1. When an agent reports, read its summary for rows that infer a year from a study period or a degree from a title; correct those rows in the proposal file (set the year null and append "Integrator: ..." to the reason), then `node scripts/merge-roster-research.mjs research/rosters/proposal-N.json`, `npm run check`, `node scripts/build.mjs`, commit (`data/faculty-rosters.json`) and push to the branch and to `main`.
2. Keep three to six agents in flight. Before launching the next ones, regenerate the queue from the next free number, leaving out the chunks still in review: `node scripts/collect-faculty-rosters.mjs chunks --start N --skip research/rosters/chunk-A.json --skip research/rosters/chunk-B.json ...`, then launch one agent per chunk with the standard brief (open the person's page, statuses confirmed-faculty / extraction-noise / not-listed / same-as-om-list / unresolved, doctorate only from an opened page with its URL, at most 25 searches, rewrite the proposal every 10 people). Never reuse a chunk number whose proposal file exists.
3. Every few batches, update this entry and the counts in TODO.md and DATA-PROVENANCE.md, and push. The proposal and chunk files live under the ignored `research/rosters/`; only the merged `data/faculty-rosters.json` is public, so merge before stopping.
4. The queue order is people with an operations title, then department pages, then whole-college directories; students and staff by title are left out of the queue. After the queue is exhausted, the remaining open items are in TODO.md (how confirmed people enter the people database, dead links to report, areas to count as operations).
