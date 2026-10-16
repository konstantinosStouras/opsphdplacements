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
node scripts/build.mjs
```

On this machine, the three existing agent files can be passed together instead of a proposal. They are local caches and unavailable in a fresh clone. On 16 October 2026 they were recovered into a cloud clone from the user's Dropbox copy of the checkout; compare counts with the handoff and run a conflict check against the published ledger (no duplicate or unknown IDs, no silent downgrades) before merging.

`data/faculty.json` preserves the original import. `data/placements.json` contains reviewed first jobs. `data/research-status.json` covers every imported person exactly once and retains unresolved findings. The generated SQLite file, `research/operations-careers.sqlite`, is a disposable snapshot: **do not edit it as the canonical store**. Public JSON remains the source of truth until a reviewed migration introduces a persistent canonical database. New schema tables for advisors/publications/career histories do not imply these facts have been populated.

## 6. Test and publish

Run a local static server against `_site` and check the changed website interactions, source links and mobile layout. For search changes, verify both Enter and the arrow button and clear/reset behavior. For citation changes, test both copy buttons and BibTeX syntax. The program register loads independently so it cannot block the main search.

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
