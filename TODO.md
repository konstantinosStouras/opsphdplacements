# Remaining work and handoff priorities

**Resumed on 16 October 2026 at the user's explicit request after a low-credit pause.** The three saved agent result files were recovered from the user's Dropbox copy of the checkout, merged and published (see [PAUSED-HANDOFF.md](PAUSED-HANDOFF.md) for the historical pause record and the resume log). No scheduled research runner exists. The originating desktop thread remains paused; its current authorization covers publishing the portable archive and guides only. [research-handoff/README.md](research-handoff/README.md) now provides the saved work on GitHub. This archive upload does not resume research or trigger deployment.

See [RESEARCH-STATUS.md](RESEARCH-STATUS.md) for generated counts. This checklist describes unfinished deliverables, not a claim that work is already complete.

## Current research

Position after the fifth 16 October 2026 integration (published ledger): 842 verified, 1,126 unresolved, 180 pending and 1 not-yet-completed PhD, of 2,149. Remaining first-pass reviews by original shard (faculty index modulo 3): **A 180, B 0, C 0**. Shard A round-2 chunk r2-1 (40 people, 16 reviewed so far) was still being researched at the last integration. Next concrete item: integrate it, then finish shard A in batches of about 40 per agent with at most three agents per session.

- [ ] Individually review every pending imported profile (180 left; all in shard A). Do not bulk-label a retrieval as a review.
- [ ] Finish the audit of destination-only placement tables for omitted postdocs and earlier industry jobs; correct or downgrade unsupported first-job claims.
- [ ] Revisit unresolved cases using the specific gap recorded in the ledger. Separate ambiguous within-year chronology, missing degree completion, wrong-person matches and inaccessible evidence.
- [ ] Preserve independent field-level sources for degree dates, degree institutions, employer, role and job dates; older first-placement records often have a shared source list and review date.

## Step 1 — Historical doctoral program register

- [x] Import the Operations Academia universities directory as the first database, `data/universities.json` (16 October 2026): 656 universities, 1,133 department rows, 40 countries; 210 linked to PhD institutions in the people database (200 exact names, 4 shared Wikidata items, 6 campus qualifiers).
- [ ] Review the links between the two databases: the 6 campus-qualifier links, any Wikidata links added by `node scripts/geocode-institutions.mjs universities`, and the 446 directory universities with no link (most have no one in the people database; some are spelling differences such as abbreviations in brackets). Add the review outcome to the import script's rules rather than editing the file.
- [x] Show database 1 on the website: the Universities section lists every directory university with its departments, country, link to the people database and sources, with search, country and link filters and a by-country chart (16 October 2026).
- [ ] Let the program register cite the universities database as the discovery source for each program, and add a doctoral-provision flag to the universities database once a program is verified.
- [ ] Define the merged institution entity (Wikidata-keyed, with aliases, departments, graduates and programs) and the update path so that a change in either source reaches one record.

- [ ] Expand beyond the initial 13 program records. Verify candidates from Operations Academia, university catalogs, historical dissertation institutions and discipline associations.
- [ ] Freeze discovery-source versions. The Operations Academia website can overlay public edits on its static directory; a local JSON snapshot alone is not a complete snapshot of that live directory.
- [ ] Cover regions and institutions beyond currently visible faculty/hiring directories. Document search coverage; do not assume a list is globally exhaustive.
- [ ] Establish historical program names, specializations, campus/awarding relationships, predecessor/successor links and admissions/closure/last-award dates with official archival evidence.
- [ ] Keep Harvard's historical DBA predecessor separate from PhDs; decide and document whether equivalent research doctorates are included in a later analysis. Do not silently relabel them.
- [ ] Check each broad management/MS&E/analytics program's eligible tracks. Stanford administrative succession is not proof of historical OR degree closure.

## Step 2 — Graduate rosters

- [ ] Collect graduates by program and year independently of placement destination.
- [ ] Build cohort source inventories and reconcile names to official counts where available.
- [ ] Verify awarded degree and specialization, disambiguate names, and match existing imported people without creating duplicates.
- [ ] Publish coverage per program-year: partial, reconciled-complete, unavailable or pending. Keep unknown careers in the denominator.
- [ ] Include graduates who completed after their program stopped admissions, graduates who never entered academia, and historical cohorts absent from current web pages.

## Step 3 — Careers, advisors and publications

- [ ] Populate all supported employment periods with date precision, sector, role, primary/full-time status and sources. Separate first new job, employment at degree completion, first faculty job and first industry job.
- [ ] Research direct industry entrants and later academia-to-industry transitions; preserve concurrent roles and censoring after the last observation.
- [ ] Populate dissertation advisors/co-advisors and distinguish committee members.
- [ ] Populate publications, author identities, DOI/version links and publication dates; reconcile coverage before calling publication lists complete.
- [ ] Publish calendar-PhD-year and exact-degree-date publication snapshots with uncertainty labels.
- [ ] Add recheck histories that preserve prior values and distinguish failed checks from successful confirmations.

## Database and website

- [x] Rebuild the website around the Econ PhD Placements structure with plain SVG charts (16 October 2026): coverage map and by-year grid, trends (over time, by PhD institution, by field, top employers, directory counts), profiles (PhD institution, head-to-head comparison, employer, directory affiliation), explorer column filters and shareable URLs, a six-part methodology section with live availability counts, and derived institution and employer databases. Every share shown is a share of verified first jobs with unresolved and unreviewed counts beside it.
- [ ] Map matching gaps: 12 PhD institution names and 63 first-employer names have no Wikidata match yet (ambiguous, renamed or absent items); they are counted on the map note and left unplaced. Review `research/geocode-cache.json` and `research/geocode-employers-cache.json` and add `rejected` notes or manual matches with a source.
- [ ] Employer countries exist only for matched employers, so the "countries of first employers" panel undercounts; say so until matching is complete.
- [x] Group nearby institutions on the map into count circles that split on click or tap (16 October 2026); the grouping distance is 32px on desktop and 24px on phones, recomputed at every zoom level.
- [x] Rebuild the map on the Econ PhD Placements pattern (16 October 2026): viewport-sized SVG, logo discs with coverage rings, animated zoom with re-spreading circles, pinch and pan, labels, legend, hover card on pointer devices and tap-to-card on touch screens. Pitfall fixed: a tap fires emulated mouse events on whichever circle is drawn on top, so hover handlers must be ignored on touch devices and taps resolved to the nearest circle. 358 of 369 imported PhD institution names are placed; 11 are unmatched or ambiguous (for example "Ecole Polytechnique", Montréal or Palaiseau) and need a person-level check.
- [x] Add static social-sharing metadata, a branded preview image, browser/mobile icons and reproducible asset checks; maintenance is documented in `SHARING.md`.

- [ ] Implement a reviewed migration to a persistent canonical database before editing longitudinal data there. The present SQLite output is regenerated from JSON.
- [ ] Add proposal intake/validation/export for new graduates, advisors, publications and later career events; schema support alone is not a finished ingestion pipeline.
- [ ] Add graduate profiles with linked education, advisors, timeline, publications and fact-level evidence/check dates.
- [ ] Add program-year graduate coverage and career filters. Directory cohort counts must remain distinct from actual graduating class sizes.
- [ ] Add versioned public releases and reproducible historical snapshots, then link the citation version to an immutable release.
- [ ] Add a conservative recurring recheck process only if the user authorizes scheduling; none exists now.

## Known pitfalls to retain

- Parallel research agents share one web-search budget per session. Ten agents at once exhausted it, so most shard A chunks stopped after 7 to 30 people. Run fewer agents per session, or give each a smaller chunk, and let agents leave unreached people out of their proposal rather than writing empty reviews.
- Many university sites (HBS, MSU, UCL, Cardiff, Technion and others) block automated fetches with 403 or bot pages. Unresolved reasons record those failed attempts; a human browser may resolve several quickly.
- Jobs that began before the degree and continued afterwards (Moritz Fleischmann, Silvia Padron, Gongbing Bi, Hao Xiao) are recorded as unresolved, not as first jobs. The rule is now documented in RESEARCH-DESIGN.md: such a job is not the first post-PhD job, and the next new job is; a post-doctoral appointment that starts in the final months before the formal degree date (Vijay Kamble) counts, with the overlap stated in the evidence note. Prospective announcements written before the degree (Simone Peinkofer) do not establish a first job.
- Imported degree values flagged as doubtful in unresolved reasons: Harvey Wagner (MIT 1960, not Stanford), Enver Yucesan (Cornell, not Stanford), Ivana Ljubić (TU Wien 2004; the imported 2013 Vienna entry looks like a habilitation), Stefan Scholtes (Karlsruhe, not Bonn), Alvares (no doctorate shown), LaDonna Thornton (2013 vs 2012), Bagchi (1985 vs 1982). None were changed; each needs a primary record.

- OM List samples faculty-listed people and excludes IE departments; it cannot estimate the share of all graduates entering academia.
- University placement tables sometimes show a later faculty destination. Yue Hu's earlier Chicago Booth postdoc was found after a Stanford destination had initially been recorded.
- Historical degrees can differ from directory imports; retain both original assertions and sourced corrections.
- Public CV links can point to a namesake in another discipline. Name matches alone are unsafe.
- The main search previously failed because a button named `reset` shadowed the form's reset method. Keep the distinct `reset-filters` ID and prototype-based reset call.

## Handoff template

Record: scope and assigned IDs/programs; files changed; sources opened; verified findings; unresolved gaps; checks run; published revision or unpublished state; active collaborators; and the next specific item. Update the generated status file before each data release. Do not write a generic “continue research” handoff without the IDs and outstanding evidence needs.
