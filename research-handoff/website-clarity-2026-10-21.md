# Website clarity and animated cohort summary — 21 October 2026

Owner-authorized interface release. Research collection and its automation remain paused. No public research records, source imports, reviewed facts, stable IDs or check dates were changed.

## Delivered

- Two visitor directories: People and Organisations. People join first-job and career observations by stable ID. The organisation view joins existing entities, reviewed university aliases, units, programs, source affiliations and career employer names. Observed names without reviewed identity/country remain explicit; no fuzzy identity resolution.
- Supporting graduate source lists remain inside People with unverified-degree/identity limitations. The redundant LinkedIn-only table, separate university/program navigation and repeated employer chart are removed. Program facts/sources are inside organisation evidence.
- Exact typed profile matches open immediately; partial matches expose clickable choices and a filtered select, no matches explain the empty state, and Enter selects a sole match. Affiliation profiles use the same search. Hero/chart links clear stale filters; initial mode deep links survive initialization.
- Four distinct outcome trend views; Coverage has only the map and cohort review grid. Sequential large section numbers 01–07.
- Centred subtitle and author details using Konstantinos I. Stouras. Subtitle, sample size and abstract counts regenerate at build time from the public data. Cohort headline 1953–2026 refers to known PhD years among verified placements, not job start dates. Coverage explicitly identifies future-year source entries.
- An animated summary table under the hero search shows category counts and fixed-scale percentage bars for one PhD cohort. Year slider sits below the plot, followed by Play, Pause and Auto-play (default looping). Manual year/slider/previous/next pauses. Visibility and reduced-motion rules suppress unwanted playback. Unknown job categories remain in verified denominators; unresolved outcomes stay separate. 21 verified jobs without known degree years are excluded from frames, with a visible note.

## Validation

All 31 JavaScript tests and the data/date/sharing validators pass; four relational schema tests and reproducible database export passed. Static build passes. Added meaningful tests for merged-person first-job search and cohort denominator/missingness. Every public data file is unchanged.

Browser checks on the built preview: INSEAD typing opens 19 first hires; affiliation typing returns 24 directory profiles; comparison with Stanford works. Employer/title intersection yields 10 INSEAD Assistant Professor rows; reset restores 2,087; history filtering and Andrea Patrucco's expanded eight-role evidence work. Abhijeet Ghadge's 13 LinkedIn entries remain integrated. Organisation exact/empty searches, country+employer filter, reviewed-unit filter, IBM records, Behrend official evidence, program facts and sources tested. Graduate search/area controls and all four trend views and coverage grid exercised.

Cohort 2020 shows 87 verified outcomes among 107 people, with 20 unresolved, matching its corrected deep link (87 rows). Playback advanced to 2026; previous, selected year, default Auto-play, separate controls and manual Pause states checked. Mobile 390×844 check found an 8px year-select overflow and corrected it. Body has no horizontal overflow; wide evidence tables retain their intentional local scrolling.

Visitor audit: no visible internal data filenames, export controls or project-repository links in checked initial, selected and expanded views. Original external evidence and Operations Academia/OM List attribution remain. Fallback/error templates were inspected; network-failure and browser reduced-motion preference emulation were not exercised. Full graduate/person duplicate reconciliation and complete career/program coverage remain unresolved research work.

## Files

README.md; RESEARCH-DESIGN.md; TODO.md; WORKFLOW.md; index.html; assets/app.js; assets/charts.js; assets/graduates.js; assets/insights.js; assets/model.js; assets/style.css; new assets/organisations.js, assets/picker.js, assets/cohort-stats.js, assets/cohort-story.js; scripts/build.mjs; scripts/model.test.js; new scripts/update-website-copy.mjs; this report.

## Publication

Published interface release `8a8f55289d4b742d3ed4c2c39222635501e586ae`; Pages run 39571523528 succeeded. Final search-state fix `1c67ac2db047f9d313b614177ab9ff09f7734a2d` also published; Pages run 39571808836 succeeded. Both main and the research branch contain the changes.

Live browser verification confirmed the updated subtitle/name/counts, default Auto-play selected, all three controls, 1,291 observed organisation rows, INSEAD’s 19 first hires and clearing a selected profile on a no-match search. The final live mobile chart is 335px wide with 335px scroll width, so the year selector no longer overflows. The live 2020 screenshot is saved locally at `research/website-clarity/live-cohort-2020.png` (ignored, not a source document). Temporary viewport overrides were reset and the successful preview tab was closed. The live chart’s 87 verified /107 sample /20 unresolved denominator was rechecked. No data files changed.

Next concrete work: owner review of the clearer layout and any further requested interface improvements. Research collection remains paused; identity reconciliation and incomplete graduate/program/career coverage are unchanged.
