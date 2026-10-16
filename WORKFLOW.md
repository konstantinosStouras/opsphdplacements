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
node scripts/build.mjs
```

`node scripts/import-operations-academia.mjs` refreshes `data/universities.json` from the Operations Academia directory (pass `--input` with a saved snapshot to re-run without fetching); run it after `build-institutions.mjs` so the links use current counts. `node scripts/geocode-institutions.mjs universities` matches the directory names to Wikidata items and writes `data/university-locations.json`; the import reads that file for its links by shared item and the geocode reads the import's names, so when names change run the import, the geocode and the import again. `node scripts/build-entities.mjs` merges `data/institutions.json`, `data/universities.json`, `data/employers.json`, the program register and the three location files into `data/entities.json`; run it after every other derived file, because `npm run check` fails when it is stale or when an organisation is missing or attached twice. A wrong name match (the search returned another organisation's item) is corrected in `data/location-review.json`, with the right QID or `null` for an ambiguous name plus the reason and date, never by editing a generated file; re-run `geocode-institutions.mjs` for the affected mode (it only fetches what the correction needs), then `wikidata-countries.mjs`, `build-institutions.mjs`, the import and `build-entities.mjs`. `build-institutions.mjs` regenerates `data/institutions.json` and `data/employers.json` from the public files, grouping spellings that differ only in accents, punctuation, spacing or case into one row; `npm run check` fails when they are stale. When a merge adds a new verified PhD institution or employer name, also run `node scripts/geocode-institutions.mjs`, `node scripts/geocode-institutions.mjs employers`, `node scripts/fetch-institution-logos.mjs` and `node scripts/wikidata-countries.mjs` before building, so the new names get a location.

The three saved agent result files, audit histories, scripts and source metadata are tracked under `research-handoff/` and available in a fresh clone. Their 1,661 reviews were already integrated in commit `9fbf00d`; do not merge them again blindly. Read `research-handoff/README.md` for evidence recovery and optional workbench restoration. Compare proposals against current public corrections before merging; full source documents remain excluded.

`data/faculty.json` preserves the original import. `data/placements.json` contains reviewed first jobs. `data/research-status.json` covers every imported person exactly once and retains unresolved findings. The generated SQLite file, `research/operations-careers.sqlite`, is a disposable snapshot: **do not edit it as the canonical store**. Public JSON remains the source of truth until a reviewed migration introduces a persistent canonical database. New schema tables for advisors/publications/career histories do not imply these facts have been populated.

## 6. Test and publish

Run a local static server against `_site` and check the changed website interactions, source links and mobile layout. For search changes, verify both Enter and the arrow button, clear/reset behavior (including the per-column filters) and that `?q=`, `?phd=`, `?employer=`, `?compare=`, `?coverage=` and `?trend=` links reopen the right view. For citation changes, test both copy buttons and BibTeX syntax. The program register loads independently so it cannot block the main search.

For the coverage map, `data/institution-locations.json` and `assets/logos/` are generated by `node scripts/geocode-institutions.mjs` and `node scripts/fetch-institution-logos.mjs` (caches under `research/`). Review name matches before publishing: the script keeps each Wikidata ID and description, and a wrong or ambiguous match should be set to `qid: null` in the cache with a `rejected` note rather than guessed. Run `node scripts/geocode-institutions.mjs employers` for `data/employer-locations.json` and then `node scripts/wikidata-countries.mjs` to add countries to both files. Test the map's hover card, zoom buttons, region tabs and the click-through to the explorer after changes, and the profile, comparison and trend views (period selectors, tooltips, table views, click-through between profiles).

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
