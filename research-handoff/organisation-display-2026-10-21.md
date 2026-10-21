# Organisation display audit and People alignment — 21 October 2026

Owner-requested presentation cleanup, reusing accepted identity observations. No new university/history research was run; no public datasets, original labels, sources, stable IDs or fact-check dates were edited. Research remains paused.

## Findings and change

The preceding interface displayed 1,291 rows and contained eight pairs of repeated normalized display names. Its raw source-name disclosures also repeated the primary name or a formatting-equivalent variant 111 times. These are presentation counts, not claims that global identity research is complete.

The pure organisation model now connects entity views through existing published official-name reviews, with geographic conflicts and ambiguous candidates kept separate. Existing entities can carry multiple geographic label levels; their original labels remain intact. Verified parent identities connect school/department evidence to the university while preserving the units and source IDs. Canonical reviewed names are registered before additional observed affiliations/employers are joined, preventing creation of a second row under an already reviewed name.

The resulting 1,283 rows contain zero repeated normalized display names. Formatting-only aliases are omitted from disclosures in the directory, profile panels and map cards; meaningful alternate names remain visible/searchable and every raw spelling remains in the source data. A’Sharqiyah University no longer expands into two equivalent names. The model also connects existing reviewed identities for Baruch, City St George's, TUM, Arizona, Kansas, West Point, Católica and Warwick where supported; distinct campuses such as CUHK Shenzhen remain distinct.

People-table cells and all nested details are left-aligned, overriding shared justification. This includes names, university names, badges, summaries, evidence and dates; other tables retain their existing styles.

## Validation and limits

34 JavaScript tests plus all dataset/date/sharing validators pass. The build succeeds. Regression checks cover the full organisation view, unique source entity assignment, preserved doctorate/first-job totals, meaningful versus formatting aliases, separate CUHK/Shenzhen and conflicting-country namesakes. The reproducible audit is scripts/audit-organisation-display.mjs; its saved result is organisation-display-audit-2026-10-21.json. It checks all rows, not only the first visible page.

Browser preview confirmed the A’Sharqiyah row without redundant alias disclosure and left computed alignment across all text elements of the Knemeyer row. Source university/department review limitations remain explicit. This does not complete unresolved same-person/org identities, historical succession, source geography review or graduate census coverage. No underlying research data changed.

## Changed files

README.md, TODO.md, RESEARCH-DESIGN.md, WORKFLOW.md; assets/style.css, assets/organisations.js, new assets/organisation-model.js, assets/insights.js, assets/map.js; scripts/model.test.js, new scripts/audit-organisation-display.mjs; this report and its audit result.

## Publication

Pending final browser audit and live deployment.
