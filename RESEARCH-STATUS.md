# Research status

Generated from committed-format public datasets by `node scripts/update-research-status.mjs`. Snapshot check date: 2026-10-17. Refresh this file with each data release. Git history identifies the published revision.

| Measure | Count |
|---|---:|
| People in the database | 3161 |
| of which OM List profiles | 2149 |
| of which operations faculty found on the linked faculty pages | 1012 |
| Individually reviewed profiles | 3161 |
| Verified first jobs | 2087 |
| Researched but unresolved | 1070 |
| Degree completion unconfirmed | 4 |
| Pending individual review | 0 |
| Initial program-register records | 13 |
| Institutions in the initial register | 10 |
| Names on program graduate and placement pages (person-years) | 14451 |
| of which listed under an operations area | 2161 |
| Institutions with such a page read | 117 |
| Listed names already in the people database | 406 |
| LinkedIn profiles with published history observations | 4 |
| of which all accessible Experience entries read | 4 |

The program register is partial. It includes historical/predecessor records; its total is not the number of active programs worldwide. The graduate lists are what the programs' own pages list (live and archived copies), with the year's meaning as each page gives it; they are partial rosters, not a census. No complete graduate census, comprehensive employment-history panel, advisor dataset or publication-at-graduation dataset has been collected yet. Their schema and research rules are prepared.

## Resume from evidence

- Pending and unresolved person IDs, reasons, dates and consulted sources: [research ledger](data/research-status.json).
- Published first-job evidence and degree corrections: [placements](data/placements.json).
- Program scope, history, fact checks and sources: [program register](data/doctoral-programs.json).
- Names listed by program pages, with every snapshot that listed them: [graduate lists](data/graduate-lists.json).
- Reviewed self-reported employment observations and source check dates: [LinkedIn histories](data/linkedin-histories.json).
- Priorities and incomplete deliverables: [TODO.md](TODO.md).
- Reproducible integration and publication: [WORKFLOW.md](WORKFLOW.md).

The tracked [research-handoff snapshot](research-handoff/README.md) contains historical agent results, audits, scripts and source metadata available in a fresh clone. Its 1,661 saved reviews were integrated in commit `9fbf00d` and overlap the public counts above. Do not add them again. Compare dates and corrections before merging; full source-document caches are not republished. The user resumed the originating desktop thread on 20 October 2026. See the latest handoff entry and TODO.md for completed maintenance and outstanding research. No scheduled research or future automatic update is implied by this status file.
