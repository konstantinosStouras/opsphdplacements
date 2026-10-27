# Reviewed Stage 2–3 release — 27 October 2026

Sole-integrator release from the 63 frozen proposal files in `inputs/`, identified by `frozen-inputs.json`. The dated one-shot integration scripts must not be replayed over newer public data. Publication confirmation is recorded separately after deployment.

## Integrated findings

- Added 52 individually evidenced Cornell faculty identities. Preserved nine links to existing people, held 17 candidates (16 graduate-field-only identities and one Maxwell Fellow), and excluded 11 administrative staff from the people register.
- Reviewed 11 OM List career follow-ups and seven degree-evidence updates. Abderrahmane Abbou's November 2020 doctorate and March 2021 Delaware postdoc support one additional earliest documented post-PhD job. No claim excludes unlisted employment.
- Added 57 partial career-observation records and enriched Andrea Lodi's existing record. The 58 Cornell-linked records include 17 linked-career follow-ups; 41 remain biography/source-note observations. These are not complete careers.
- Reconciled five source institution aliases without rewriting imported names. Kept ambiguous historical/campus identities separate.
- Public totals: 3,213 people, 2,088 verified first jobs, 237 career-review records. OM List remains a separate denominator of 2,149 people. The first-job ledger has 1,083 unresolved, four degree-unconfirmed and 38 pending records.

## Limits and remaining work

The 17 held identities need qualifying faculty evidence before public inclusion. Of the 52 new people, 14 have unresolved first-job investigations and 38 await review. All added histories remain partial. Muntaka's provisional LinkedIn role, unreadable Roy CV details, Doikov's defence/postdoc timing, Dietrich's conflicting degree chronology, Elidrissi's defence-versus-conferral distinction and Chaturvedi's cross-source dates remain explicit limitations. Affiliations, fellowships and service are not silently counted as jobs. Three institution labels still need precise identity/location resolution.

Stage 1 and Stage 4 public facts were not changed. Later proposals arriving after the frozen cut require another review; they are not included merely because a contributor reported them. No automation was resumed.

## Validation and provenance

`audit-result.json` records preservation of imported facts, all existing people, unrelated histories and prior role assertions, plus verification of frozen input hashes. All 58 JavaScript tests passed after adding the newly required history dataset to the status-updater test fixture. Dataset, history, university, sharing and record-date validators passed; the relational build and four Python tests also passed during release preparation. The organisation audit found zero exact duplicate display names.

Browser preview checked Abbou's expanded eight-role chronology, the source-note-only presentation, person search and visitor-facing evidence links. Generic source-note wording was corrected to avoid contradicting separately verified first-job reviews. No repository, dataset export or raw JSON links were exposed in the inspected expanded state. Original evidence dates remain separate from integration dates.

Changed paths are recorded in `release-files.txt`; reviewed public-file hashes are recorded in `approved-public-hashes.json`. See `identity-decisions.json`, `placement-and-degree-updates.json` and `refinement-decisions.json` for the exact adjudications. Full source downloads and working caches remain ignored.
