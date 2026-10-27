# Research status

Generated from committed-format public datasets by `node scripts/update-research-status.mjs`. People-ledger snapshot check date: 2026-10-27. Doctoral source checks run through 2026-10-26. Refresh this file with each data release. Git history identifies the published revision.

| Measure | Count |
|---|---:|
| People in the database | 3213 |
| of which OM List profiles | 2149 |
| of which operations faculty found on the linked faculty pages | 1064 |
| Individually reviewed profiles | 3175 |
| Verified first jobs | 2088 |
| Researched but unresolved | 1083 |
| Degree completion unconfirmed | 4 |
| Pending individual review | 38 |
| Named-scope doctoral register records, including historical and unresolved routes | 419 |
| Verified relevant doctoral routes (tracks may overlap; admissions may be suspended) | 410 |
| Institutions with verified relevant doctoral provision | 306 |
| Names on program graduate and placement pages (person-years) | 14465 |
| of which listed under an operations area | 2175 |
| Institutions with such a page read | 117 |
| Listed names already in the people database | 409 |
| Additional verified first jobs in graduate register (outside faculty sample) | 4 |
| LinkedIn profiles with published history observations | 16 |
| of which all accessible Experience entries read | 15 |
| University directory records with completed official-source reviews | 633 |
| University directory records partially reviewed | 197 |
| University directory records blocked by source access | 5 |
| University directory records awaiting review | 0 |
| Discovery source records with doctoral observations | 818 |
| of which current branch scope explicitly complete | 633 |

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
