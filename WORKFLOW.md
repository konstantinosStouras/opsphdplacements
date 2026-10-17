# Research, review and publication workflow

## 1. Establish the program population

Build a register of historical OR/OM/IE doctoral programs. Operations Academia is a discovery source, not proof of degree provision or a complete historical frame. Add official catalogs and archives, dissertation repositories, predecessor departments and closed programs. Distinguish university, school, department, program, specialization and campus. A department merger does not establish a degree's closure date.

Public register: `data/doctoral-programs.json`. Every non-null fact has source IDs and `lastCheckedAt`. Dates of first intake, admission cessation, closure and last degree award are separate. Partial field eligibility and historical non-PhD credentials remain explicit. The initial register is only a pilot; its size must not be described as the worldwide program total.

## 2. Enumerate graduates before selecting careers

Work program by program and graduation year by graduation year. Reconcile official graduate rosters, dissertation records, commencement lists and alumni reports. Distinguish candidacy, defense, submission and awarded degree. Keep the actual degree title and specialization evidence. Link to existing people only after identity review.

For each program-year, record known official total, identified names, degree verification, missing names, source coverage and reconciliation status. A complete outcome list is not evidence of a complete graduate roster. People entering industry immediately must enter through these rosters, not through faculty directories.

## 3. Research a person

Open the public profile/CV and relevant institutional sources. Record degree, advisors, each dated employment period and publication metadata as separate facts. Preserve concurrent roles, missing dates and conflicting evidence. Identify the first new job only after checking for postdocs, visits and industry employment. Record later sector changes without treating every consultancy or adjunct role as a primary-job transition.

For publications, distinguish journal articles, conference papers, preprints and accepted work. Link versions and disambiguate authors. Default snapshot: publications through the end of the PhD calendar year. Separately assess publication by the actual degree date when chronology allows. Do not reconstruct historical citations from today's citation counts.

## 4. Submit a first-job proposal

The current merger accepts an array (or `records`/`results` array) of records with:

| Field | Requirement |
|---|---|
| `facultyId`, `name` | Exact existing ID and imported name |
| `status` | `verified`, `unresolved` or `not-yet-completed-phd` |
| `checkedAt`, `reason` | Date and substantive review explanation |
| `sources` | Nonempty list of `{url, title, notes}` for opened/attempted evidence; failures described honestly |
| `employer`, `evidenceUrl`, `evidenceNote` | Required for verified first employment; primary URL must be in sources |
| `position`, `placementYear` | Explicitly known value or null |
| `category` | `tenure-track`, `postdoc`, `other-academic`, `industry`, `government`, `nonprofit` or `unknown` |
| `phdYearVerified`, `phdInstitutionVerified` | Independently supported value or null; do not copy directory values and call them verified |
| `phdYearResolution`, `phdInstitutionResolution` | Required explanation when correcting an imported value |

The current `category` is a legacy placement display field. The relational schema separates sector and appointment type: a corporate postdoc can be industry and postdoc simultaneously. Do not lose that distinction in expanded career data.

## 5. Integrate and validate

Inspect `git status`, review the proposal and reconcile any newer published changes first. The merger preserves prior nonpending reviews, but an input row overrides a prior row for that ID. Never feed it stale results without reviewing conflicts.

```powershell
node scripts/merge-placement-research.mjs proposals/batch-name.json
npm run check
python scripts/test-research-schema.py
python scripts/build-research-database.py
node scripts/update-research-status.mjs
node scripts/build-institutions.mjs
node scripts/build-entities.mjs
node scripts/collect-faculty-rosters.mjs build
node scripts/build-roster-people.mjs
node scripts/build.mjs
```

`node scripts/import-operations-academia.mjs` refreshes `data/universities.json` from the Operations Academia directory (pass `--input` with a saved snapshot to re-run without fetching); run it after `build-institutions.mjs` so the links use current counts. `node scripts/geocode-institutions.mjs universities` matches the directory names to Wikidata items and writes `data/university-locations.json`; the import reads that file for its links by shared item and the geocode reads the import's names, so when names change run the import, the geocode and the import again. `node scripts/build-entities.mjs` merges `data/institutions.json`, `data/universities.json`, `data/employers.json`, the program register and the three location files into `data/entities.json`; run it after every other derived file, because `npm run check` fails when it is stale or when an organisation is missing or attached twice. A wrong name match (the search returned another organisation's item) is corrected in `data/location-review.json`, with the right QID or `null` for an ambiguous name plus the reason and date, never by editing a generated file; re-run `geocode-institutions.mjs` for the affected mode (it only fetches what the correction needs), then `wikidata-countries.mjs`, `build-institutions.mjs`, the import and `build-entities.mjs`. `build-institutions.mjs` regenerates `data/institutions.json` and `data/employers.json` from the public files, grouping spellings that differ only in accents, punctuation, spacing or case into one row; `npm run check` fails when they are stale.

Faculty rosters: `node scripts/collect-faculty-rosters.mjs fetch` downloads the faculty pages linked from `data/universities.json` into `research/rosters/` (ignored; add `--render` to retry refused or script-drawn pages with the pre-installed Chromium, `--refresh` to re-download everything), `node scripts/collect-faculty-rosters.mjs build` extracts the listed people, matches them to OM List through the merged entities and writes `data/faculty-rosters.json` (reviews already merged are kept by id), and `node scripts/collect-faculty-rosters.mjs chunks` writes `research/rosters/chunk-N.json` for reviewers, faculty-titled people first. Merge reviewer proposals with `node scripts/merge-roster-research.mjs research/rosters/proposal-N.json`; `npm run check` validates every OM List link, every review's evidence and that no doctorate is recorded without its source page. After every merge run `node scripts/update-roster-notes.mjs --in-review 87,88` (naming the chunks whose reviewers have not saved a row yet), which rewrites the review position (people reviewed, outcomes, merged chunks, chunks in review, people left in the queue) in TODO.md, PAUSED-HANDOFF.md and DATA-PROVENANCE.md from the published roster and the chunk files, and commit the guides with the data.

Second source of people: `node scripts/build-roster-people.mjs` rebuilds `data/faculty-roster-people.json` (the confirmed roster people in an operations area) after every roster merge; then `node scripts/merge-placement-research.mjs` with no arguments re-syncs the research ledger and the placements file to the people files (new people start as pending), `node scripts/geocode-institutions.mjs`, `node scripts/wikidata-countries.mjs` and `node scripts/fetch-institution-logos.mjs` give new PhD institution names a location (review new name-based matches and written forms first: wrong matches go into `data/location-review.json`, aliases of an existing institution into `data/institution-aliases.json`, each with a reason and a second reviewer; then rebuild the people file), and `node scripts/build-institutions.mjs`, `node scripts/build-entities.mjs`, `npm run check` and `node scripts/update-research-status.mjs` follow. First-job research for these people: `node scripts/write-placement-chunks.mjs --source faculty-page --start N --skip research/placements-roster/chunk-A.json ...` writes `research/placements-roster/chunk-N.json` (pending people, those with a stated doctorate and year first); reviewers write `research/placements-roster/proposal-N.json` in the results format; merge with `node scripts/merge-placement-research.mjs research/placements-roster/proposal-N.json`, then rebuild the derived files, run the checks, regenerate RESEARCH-STATUS.md and build. Each chunk is researched into `draft-N.json` and then adversarially verified into `proposal-N.json` by the workflow script in `research-handoff/placements-roster/tools/` (only proposals are merged); Before merging, run `python3 research-handoff/placements-roster/tools/scan-first-job-proposal.py N` (structural scan) and `python3 research-handoff/placements-roster/tools/normalize-institutions.py N` (stores a verified doctorate that names the record's own university in another form under the record's name, keeping the written form in `phdInstitutionVerifiedAsWritten`; it prints DECIDE for pairs it cannot settle, which the integrator records with `--same <ids>` or `--differs <ids>`, one flag per run); `research-handoff/placements-roster/tools/merge-first-job-chunks.sh` then runs the merge, rebuild, checks (it stops on any failed check), guide refresh and publication for one or more proposals. The same workflow script, scan, institution-name step and merge routine serve the OM List people: write their chunks with `node scripts/write-placement-chunks.mjs --source omlist` (into `research/placements-omlist/`), pass `dir: "placements-omlist"` to the workflow script, and prefix the three tools with `FJ_DIR=placements-omlist`. Audits of published rows use `research-handoff/placements-roster/tools/first-job-audit.js` over batch files in `research/audit/` (`batch-N.json`, written from `data/placements.json` and the ledger); its fixers write full replacement rows to `research/audit/audit-proposal-N.json`, which the integrator reads row by row and merges with `node scripts/merge-placement-research.mjs research/audit/audit-proposal-N.json ...`, then rebuilds as above (run the location scripts when a corrected PhD institution or employer name is new). A merge replaces each person's row with the file's version, so never re-merge an older proposal after a later correction. Re-checks of unresolved roster rows use `tools/roster-recheck.js` (`research/rosters/recheck-N.json` in, `recheck-proposal-N.json` out) and merge with `node scripts/merge-roster-research.mjs`, followed by `node scripts/build-roster-people.mjs`, `node scripts/merge-placement-research.mjs` with no arguments (new operations people start as pending) and the usual rebuild; queue the new people with `node scripts/write-placement-chunks.mjs --source faculty-page --start <next number>`. Run `build` after `build-entities.mjs`, because the matching reads the entities; rerun `build` after a merge only when pages were re-fetched. When a merge adds a new verified PhD institution or employer name, also run `node scripts/geocode-institutions.mjs`, `node scripts/geocode-institutions.mjs employers`, `node scripts/fetch-institution-logos.mjs` and `node scripts/wikidata-countries.mjs` before building, so the new names get a location.

First-job research and corrections (tools in `research-handoff/placements-roster/tools/`, described in its README): research chunks run as workflows (`roster-first-jobs-chains.js` for the first pass, `second-pass-chains.js` for unresolved reviews) and write `proposal-N.json` after an adversarial verifier; before a merge run `scan-first-job-proposal.py N`, `normalize-institutions.py N` and the `integrator-check.js` workflow (two rule readers, then a skeptic who tests each flag), write confirmed fixes into the rows as "Integrator" notes, then `FJ_DIR=<folder> bash merge-first-job-chunks.sh "<chunks in review>" N`. Corrections to rows that are already published are written as full replacement rows built from the current ledger entry (`apply-integrator-fixes.js` writes them from confirmed check decisions; the consistency workflows `predegree-title-consistency.js` and `degree-year-consistency.js` write their own), read by the integrator, and merged with `bash merge-ledger-corrections.sh "<commit subject>" file.json ...`, which runs the same rebuild, checks and publication steps. A replacement row replaces the whole ledger entry, so build it from the ledger as it stands at merge time: a row built before another merge touched the same person must be rebuilt (Ashley Carreras, 17 October 2026). Unresolved rows may keep `phdYearVerified` and `phdInstitutionVerified` when the degree evidence is sound.

The three saved agent result files, audit histories, scripts and source metadata are tracked under `research-handoff/` and available in a fresh clone. Their 1,661 reviews were already integrated in commit `9fbf00d`; do not merge them again blindly. Read `research-handoff/README.md` for evidence recovery and optional workbench restoration. Compare proposals against current public corrections before merging; full source documents remain excluded.

`data/faculty.json` preserves the original import. `data/placements.json` contains reviewed first jobs. `data/research-status.json` covers every imported person exactly once and retains unresolved findings. The generated SQLite file, `research/operations-careers.sqlite`, is a disposable snapshot: **do not edit it as the canonical store**. Public JSON remains the source of truth until a reviewed migration introduces a persistent canonical database. New schema tables for advisors/publications/career histories do not imply these facts have been populated.

## 6. Test and publish

Run a local static server against `_site` and check the changed website interactions, source links and mobile layout. For search changes, verify both Enter and the arrow button, clear/reset behavior (including the per-column filters) and that `?q=`, `?phd=`, `?employer=`, `?compare=`, `?coverage=` and `?trend=` links reopen the right view. For citation changes, test both copy buttons and BibTeX syntax. The program register loads independently so it cannot block the main search.

For the coverage map, `data/institution-locations.json` and `assets/logos/` are generated by `node scripts/geocode-institutions.mjs` and `node scripts/fetch-institution-logos.mjs` (caches under `research/`). Review name matches before publishing: the script keeps each Wikidata ID and description, and a wrong or ambiguous match should be set to `qid: null` in the cache with a `rejected` note rather than guessed. Run `node scripts/geocode-institutions.mjs employers` for `data/employer-locations.json` and then `node scripts/wikidata-countries.mjs` to add countries to both files. Test the map's hover card (move the pointer from a circle onto its card and click a link: the card must stay open while the pointer crosses the gap and close shortly after it leaves), zoom buttons, region tabs and the click-through to the explorer after changes, and the profile, comparison and trend views (period selectors, tooltips, table views, click-through between profiles).

For social metadata or icon changes, follow `SHARING.md` and run `node scripts/check-sharing.mjs _site` after the build. Verify the raw public HTML and referenced image/icon URLs after deployment; do not claim in-app preview testing from metadata checks alone. Keep social preview images versioned when the artwork changes.

Commit only reviewed source files and public data. The existing GitHub Pages workflow deploys a push to `main` after validation. Publication must be within user authorization. Check the workflow result and the live page; a push alone does not establish deployment success. The project inherits `www.stouras.com` from the account site. Do not add a CNAME or change the separate personal-site repository.

Record the deployed revision and unresolved work in a handoff. Use a new corrective commit for rollback; do not rewrite published history. No automatic research schedule is configured.

## 7. Keep the documentation current

Documentation maintenance is a standing user requirement. Before completing a batch, handing work to another model or publishing a release:

- Update `TODO.md` with completed tasks, new evidence gaps, changed priorities and newly discovered pitfalls.
- Update `RESEARCH-DESIGN.md` when population definitions, source interpretation or analysis conventions change. Record the reason for substantive changes.
- Update `WORKFLOW.md`, `CONTRIBUTING.md`, `AGENTS.md` and `README.md` when commands, contracts, storage, collaboration rules or website capabilities change.
- After integrating public data, regenerate `RESEARCH-STATUS.md` with `node scripts/update-research-status.mjs`. Its counts describe the public dataset snapshot; unmerged local research belongs in an explicitly labeled handoff, not those totals.
- Check that remaining-work descriptions and completion claims agree across the affected documents. Preserve unresolved questions and useful decision history. Commit documentation alongside the relevant data/code changes.

Only edit files affected by new information. Future agents should follow this maintenance step without needing a separate reminder. It does not imply an automatic scheduled update service.
