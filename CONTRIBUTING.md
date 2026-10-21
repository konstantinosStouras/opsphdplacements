# Contributing to Operations PhD Placements

The aim is a historical graduate census covering Operations Management, Operations Research and Industrial Engineering, independent of employment destination. The existing OM List import is one faculty-based research input. It is not the graduate population.

## Start here

1. Read [current status](RESEARCH-STATUS.md) and [remaining work](TODO.md).
2. Read the [research design](RESEARCH-DESIGN.md) and [workflow](WORKFLOW.md).
3. Inspect the public research ledger before researching a person. Use `facultyId` or program ID, not a name alone.
4. Choose a bounded task: a named set of pending people, one unresolved issue, a university's historical programs, or a particular program/cohort. Record ownership in your task handoff before starting.
5. Submit evidence and limitations alongside the change. A useful unresolved review is welcome; an unsupported answer is not.

## Evidence requirements

- Prefer official catalogs, dissertation repositories, commencement records, dated CVs, university appointment announcements and employer biographies.
- Search snippets, directories and aggregators help discover sources. Open the underlying page or document before treating a claim as verified.
- Check names against degree institution/year, advisors, professional identifiers and chronology. Do not merge people by name alone. Preserve name variants.
- Record the degree as awarded. A department's name or a person's present research interests do not establish doctoral specialization. A historical DBA remains a DBA pending an explicit scope decision.
- A first job requires chronology or explicit unrestricted initial-employment evidence. A generic destination table can skip a postdoc; an initial **academic** placement can skip an industry job. Preserve reported destinations separately when sequence is unresolved.
- Keep unknown dates, job titles and appointment types null. A PhD cohort year is not an observed employment start year. Employment that began before graduation is not automatically a new post-PhD job.
- Keep the source publication date, retrieval date and fact review date separate. A failed recheck must not refresh a successful confirmation date.
- Use brief paraphrases and page/section locators. Do not publish complete CVs, large copyrighted extracts or private details.

## Roster reviews

People listed on the faculty pages linked from the universities database (`data/faculty-rosters.json`) are verified one by one. A reviewer takes a chunk file (`research/rosters/chunk-N.json`, written by `node scripts/collect-faculty-rosters.mjs chunks`), opens each person's own page, and writes `research/rosters/proposal-N.json`: one row per person with `id` and `name` copied exactly, a `status` (`confirmed-faculty`, `extraction-noise`, `not-listed`, `same-as-om-list`, `unresolved`), `checkedAt`, a plain `reason`, and the `sources` actually opened. Confirmed faculty need the `profileUrl`, the `titleConfirmed` and `areaConfirmed` as shown, and the doctorate only when an opened page states it (`phdInstitution`, `phdYear`, `phdSourceUrl` among the sources). Never infer a doctorate from a title or affiliation, never record a first job in a roster review, and leave people you did not reach out of the file rather than writing placeholders. Rules the integrator applies before merging: a study period is not a conferral year; a degree the page calls pending, expected, ABD or "in progress" is not recorded; a professional degree (MD, JD, LLM) is not a doctorate; a DBA, EdD, ScD or other research doctorate is recorded with its type in the reason; an awarding institution is kept as the page writes it; a page that only says someone finished doctoral studies somewhere does not state an awarded degree; a directory entry whose only title is at another university, or that shows a name without any title, stays unresolved; a person listed with a faculty rank on the school's own directory but without an individual page may be confirmed from the directory listing, with the directory page as the profile URL and the reason saying so; when a site answers the fetch tool with an error or an empty script-drawn template but serves the same public page to a plain request or through the page's own data endpoint, read it that way and say so in the reason and sources. One integrator merges with `node scripts/merge-roster-research.mjs`, reruns `npm run check` and refreshes the guides with `node scripts/update-roster-notes.mjs`. Confirmed people in an operations area then enter the people database through `data/faculty-roster-people.json` (see RESEARCH-DESIGN.md), and their first jobs are researched exactly like OM List people: take a chunk from `research/placements-roster/chunk-N.json` (written by `node scripts/write-placement-chunks.mjs --source faculty-page`), write `research/placements-roster/proposal-N.json` in the first-job results format with `facultyId` equal to the person's roster id, and treat the doctorate given in the chunk as what the person's own page states, not as a verified degree (record `phdYearVerified` and `phdInstitutionVerified` from the evidence you open).

Do not set or edit `addedAt` or `updatedAt` in proposals or data files; the integrator's `scripts/record-dates.mjs` stamps them from `data/record-dates.json` when a change is merged.

## Safe collaboration

Existing agents have used three disjoint shards of the original faculty array: index modulo 3 equals 0, 1 or 2. Those are scheduling assignments, not permanent scientific identifiers. Check for active ownership before reusing a shard. New contributors can instead claim small explicit ID lists.

The writable research cache lives under ignored `research/placements-a/`, `research/placements-b/` and `research/placements-c/`. The saved pause snapshot is tracked under `research-handoff/`, including all three result files, audit histories, scripts, discovery indexes and a source catalogue. A fresh clone therefore contains the relevant continuation work. Read `research-handoff/README.md` before resuming, and compare these historical findings with the public ledger; their 1,661 saved reviews were integrated in commit `9fbf00d`. Never assume a missing document cache means a person has not been reviewed. To exchange proposals through Git, use a dedicated branch and a small `proposals/<batch-name>.json` containing public facts and source references only. Do not commit caches or full documents.

Facts a person reads on LinkedIn (scripts may not read it) go into `research/human-review/proposal-N.json` in the same record format, with the profile URL, who read it and the check date in the source note, and the identity check stated in the reason (matching photo, or the same doctorate and earlier employers as the university profile); copy each merged file to `research-handoff/human-review/`. A LinkedIn education range is not a degree date.

Research agents should not publish directly or edit the shared public JSON concurrently. An integrator reviews proposals, reconciles conflicts, runs checks and publishes the combined result. If an existing verified claim turns out to be wrong, correct or downgrade it with a reason; do not preserve it just to keep totals rising.

## Pull request or handoff contents

Include the research scope/IDs, proposed facts, primary sources, check dates, unresolved gaps, changes to previously published facts and validation results. For code changes, explain the user-visible behavior and test the relevant interaction. Record the next unfinished item in your handoff. Link any new schema or methodology decisions in the documentation.

Keep the Markdown guides current with your contribution, as required by the user. Follow the documentation-maintenance step in `WORKFLOW.md`: revise affected instructions and remaining tasks, preserve important decisions, and regenerate the status summary after integrating public data. Distinguish unmerged research from the published dataset. Documentation updates belong with the change they explain, not in an unspecified future cleanup.

## Agent browser reviews (20 October 2026)

The owner now authorizes individual LinkedIn reviews by Codex in Chrome, superseding the human-only restriction above. Accept identity-matched self-reported chronology under RESEARCH-DESIGN.md. Save separate stable-ID proposals and progress under `research-handoff/linkedin/`; retain historical human-review attribution. See that directory’s README for the identity cleanup gate, queue and schedule.

LinkedIn reviewers must capture every accessible employment entry for each person, under `research-handoff/linkedin/history-contract.md`, preserving original labels/date precision, overlapping roles, source URLs and check dates. Identity-only visits and unavailable Experience sections are not completed employment histories.

Reviewed history observations may now be published in `data/linkedin-histories.json`, with a copy under `research-handoff/linkedin/histories/`, using the public history contract and date ledger. A successful profile visit alone does not qualify: scroll to load Experience, inspect every accessible role/group and record limitations. Public history entries are not verified-first-placement records.

## Multi-source career reviews (20 October 2026)

University reviews use a separate [contract and shard ownership](research-handoff/universities/CONTRACT.md). Save one stable-ID proposal per university under `research-handoff/universities/proposals/<shard>/`; only the integrator merges public `data/university-reviews.json`. Check actual official pages in Chrome, classify every imported label, and preserve school/department/group/program distinctions. Source-check dates are independent of integration timestamps. Partial and blocked reviews remain distinct from completed reviews.

Use the contract in [research-handoff/careers/README.md](research-handoff/careers/README.md) for CV and official-page histories. Retain LinkedIn observations in their existing dataset. Never join a graduate history to a faculty record by name alone. Record every mentioned employment entry and explicit limitations. Summaries require separately reviewed primary-sector periods and a sourced degree boundary. Classification-only changes preserve original source-check dates and carry categoryReview metadata.

Chrome research lanes should reuse one tab where practical and close completed source/preview tabs. Keep only active work or genuine pending handoffs; never close unrelated user tabs.

## Required visitor-interface policy

Follow the standing public website presentation rule in AGENTS.md. Do not add dataset download/export controls or links, visible `.json` references, or links to this project's GitHub repository, raw files, guides or issue tracker. Check generated and expanded content as well as static markup. Keep original evidence and reference-site attribution, and direct corrections to `kostas.stouras@ucd.ie`. Preserve provenance in stored records; use plain-language labels in the interface. Internal loading paths and technical contributor documentation are outside this display restriction. Run the WORKFLOW.md visitor-interface audit before publication.

## Current research ownership and gates — 21 October 2026

Use research-handoff/priorities/README.md before choosing a task. One integrator currently owns Stage 1 source reconciliation; no prior shard researcher is automatically resumed. Reconcile source aliases and official university/unit identities first. OM List faculty linked-source work is Stage 2, held until Stage 1. Stage 3 expands the same people register from verified department rosters and institutions reached through faculty doctorate/employment histories, with per-person identity checks and sourced careers. Track each discovery edge, roster date, matched/new people and remaining frontier separately from the original OM List population. New graduate/Wayback collection is Stage 4 and deferred until the earlier gates. Preserve historical assignments/proposals and their former numbering; new names from discovery sources are candidates, not additions to the verified register.

## Stage 1 doctoral register — 21 October 2026

Stage 1 doctoral proposals now follow research-handoff/universities/DOCTORAL-CONTRACT.md. Researchers save programme evidence separately from unit proposals; one integrator updates the existing public doctoral register. Official unit observations alone do not qualify a university for the final PhD-university list.
