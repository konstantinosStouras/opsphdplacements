# Current research priorities — owner instruction, 21 October 2026

This supersedes the earlier collection order and blanket pause for manual Stage 1 work. It does not resume the paused automation, authorize outreach, or start graduate research. The current chat is the sole integrator; earlier university researchers and companion career chats are stopped. Frozen shard assignments remain historical ownership records, not active work.

## 1. University and operations-unit register — first

Reconcile OM List's school directory with Operations Academia's Universities directory and job postings, including relevant archived postings. Freeze dated source versions and their scope. Use those lists for discovery; official university pages verify each university's official name, campus/parent identity and actual OM/OR/IE/logistics/supply-chain units. Check business and engineering branches; retain department/school/group/area/centre types exactly. A faculty listing, ad subject or degree name does not establish a department. Verify doctorate provision separately where encountered, without beginning graduate enumeration.

One university identity with sourced aliases and subordinate units; no duplicate rows. Retain distinct campuses where identities differ, historical names and all original source IDs. Resolve non-university and out-of-scope candidates explicitly. Do not fuzzy-merge names or treat the website's duplicate-label audit as a completed institutional identity census.

Baseline public review overlay: 645 imported records, 360 completed official-source reviews, 36 partial, one blocked, 248 pending. Thus 285 imported records still need completion. This is 55.8% of the OLD import reviewed, not 55.8% of the newly specified source union.

Source reconciliation started in this chat: all 202 live OM List school-table rows were read in Chrome and saved as compact assertions. Operations Academia currently displays 629 university cards and 1,025 departments; its current jobs page shows 376 listings. These live summaries use different grouping/filtering and community overlays from the older import and local source files; they are not directly comparable denominators. The compact source-checkout catalogue contains 2,586 observations from directory, university seeds, jobs, past postings and OM List schools. Existing reviewed/entity aliases resolve most labels; 14 labels remain candidates for reconciliation. These are not 14 proven new universities. The live-overlay/pagination coverage gate remains INCOMPLETE.

Next concrete step: reconcile the 14 flagged labels and current live overlays/postings against the existing IDs, create reviewed proposals for genuinely additional universities/units, then finish the 285 existing follow-ups. Also reconcile department/school assertions at already matched institutions: an old completed review does not automatically verify a newly encountered label. The queue includes these source comparisons separately from the 285 unfinished old records. Keep the public import intact. The queue does not itself verify any new fact.

Acceptance gate: all records in the frozen requested sources are accounted for; eligible institutions and units have official evidence, check dates and identity decisions; exclusions/duplicates are documented. Material inaccessible/ambiguous cases prevent a complete verified-list claim. Move to Stage 2 after this gate is met, or after the owner explicitly accepts documented residual exceptions.

## 2. OM List faculty — after Stage 1

Priority population is the 2,149 OM List profiles, not the broader 3,161-person mixed-source queue. Keep faculty-page-only records and earlier proposals, but hold their new career research during this priority phase. Start from each OM List profile and follow its available CV, university/personal-site, ORCID and LinkedIn links; use individual identity checks and focused official searches when links fail or chronology remains unclear. URLs alone do not verify their contents.

Record separately: doctorate institution/year/completion and evidence; first new post-PhD job and why it is first; every accessible mentioned employment role, original dates/precision, sector/type, concurrency, sources, check dates, and remaining gaps. Do not infer the first job from current affiliation, copy cohort years into job dates, or extend an old CV's Present to today. A complete accessible source read can still leave the real career incomplete. Individual source failures remain per-person limitations; challenge/login/platform barriers require handoff under existing rules. No scraping or outreach.

Baseline: all 2,149 had an initial first-job review; 1,524 have verified first jobs (70.9%), leaving 625 without a verified first-job conclusion. Within the verified-placement rows, 1,435 doctorate-year fields are independently marked verified and 89 remain source-reported; these are not an all-person doctorate-year coverage count. Accepted history ID links connect 118 OM List rows to a review record, but only 116 rows have sourced role observations and none is marked a completed full career. These counts are profile-ID coverage, subject to the outstanding identity/alias audit.

Use stage-2-omlist-queue.json after Stage 1. Do not restart the old all-person alphabetical sequence at position 179 as the default next action. Preserve it as historical progress. Measure link/source review, degree verification, first-job verification and full-history completeness separately. Do not mark the phase complete merely because every profile was attempted; preserve material exceptions for explicit owner acceptance before Stage 3.

## 3. All PhD graduates and historical careers — deferred

After both earlier stages meet their gates, establish which institutions actually award in-scope doctorates, then enumerate historical graduates by program/cohort using official alumni/dissertation/placement/commencement records, Wayback Machine or comparable archives. Identity-match each named graduate before career/LinkedIn searches, including people who never entered or later left academia. Reconcile repeated listings and program-year totals. Preserve existing graduate observations but do not start new archive/graduate collection now.

## Portable files and regeneration

- omlist-schools-2026-10-21.json: 202 live directory assertions, captured in Chrome; not official unit verification.
- source-entrypoint-checks-2026-10-21.json: limited live source-summary checks and coverage caveats.
- source-catalogue-2026-10-21.json: compact discovery rows and source-file hashes; local OA snapshots are explicitly distinguished from live overlays.
- stage-1-university-queue.json: 285 existing follow-ups, source gate and 14 unreconciled labels.
- stage-2-omlist-queue.json: every OM List stable ID exactly once, with separate existing job/year/history states; held for Stage 1.

Run `node scripts/build-priority-queues.mjs` from a fresh clone using the portable catalogue. Use `--refresh-source-catalogue` only to intentionally re-read the adjacent OperationsAcademia.github.io source checkout; record that this is not a live-overlay export. These commands write research handoffs only and never integrate public facts. Public counts remain those in the public datasets and generated RESEARCH-STATUS.md. No automation was enabled or changed.
