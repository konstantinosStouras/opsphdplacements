# Remaining work and handoff priorities

**Resumed on 16 October 2026 at the user's explicit request after a low-credit pause.** The three saved agent result files were recovered from the user's Dropbox copy of the checkout, merged and published (see [PAUSED-HANDOFF.md](PAUSED-HANDOFF.md) for the historical pause record and the resume log). No scheduled research runner exists. The originating desktop thread remains paused; its current authorization covers publishing the portable archive and guides only. [research-handoff/README.md](research-handoff/README.md) now provides the saved work on GitHub. This archive upload does not resume research or trigger deployment.

See [RESEARCH-STATUS.md](RESEARCH-STATUS.md) for generated counts. This checklist describes unfinished deliverables, not a claim that work is already complete.

## Current research

Position after the sixth 16 October 2026 integration (published ledger): 863 verified, 1,145 unresolved, 140 pending and 1 not-yet-completed PhD, of 2,149. Remaining first-pass reviews by original shard (faculty index modulo 3): **A 140, B 0, C 0**. Next concrete item: finish shard A's 140 in batches of about 40 per agent with at most three agents per session, then start a second pass on the unresolved cases whose reasons name a blocked page (a human browser can open several).

- [ ] Individually review every pending imported profile (140 left; all in shard A). Do not bulk-label a retrieval as a review.
- [ ] Finish the audit of destination-only placement tables for omitted postdocs and earlier industry jobs; correct or downgrade unsupported first-job claims.
- [ ] Revisit unresolved cases using the specific gap recorded in the ledger. Separate ambiguous within-year chronology, missing degree completion, wrong-person matches and inaccessible evidence.
- [ ] Preserve independent field-level sources for degree dates, degree institutions, employer, role and job dates; older first-placement records often have a shared source list and review date.

## Step 1 — Historical doctoral program register

- [x] Import the Operations Academia universities directory as the first database, `data/universities.json` (16 October 2026): 1,133 department rows under 656 directory names, grouped into 645 universities, 40 countries; after the Wikidata pass, 217 are linked to PhD institutions in the people database (194 identical names, 23 shared Wikidata items).
- [x] Review the links that rest on a shared Wikidata item (16 October 2026): nine wrong or ambiguous search results corrected in `data/location-review.json` (York University, University of Houston–Downtown, Nevada State University, University of Navarra, Minnesota State University, the HKUST Guangzhou names, a bare "Indian Institute of Management"), applied by the geocode script.
- [ ] Review the remaining name-based Wikidata matches (579 directory names, 361 PhD institutions and 243 employers are matched by search and unreviewed) and the 428 directory universities with no link to the people database; record each wrong match in `data/location-review.json` with its reason rather than editing a generated file.
- [x] Show database 1 on the website: the Universities section lists every directory university with its departments, country, link to the people database and sources, with search, country and link filters and a by-country chart (16 October 2026).
- [ ] Let the program register cite the universities database as the discovery source for each program, and add a doctoral-provision flag to the universities database once a program is verified.
- [x] Define and build the merged organisation entity (16 October 2026): `data/entities.json`, one record per organisation keyed by Wikidata item where known, with aliases, departments from the directory, people and first-employer figures from the people database and programs from the register; `npm run check` fails if a source row is missing or attached twice, and each PhD institution and first-employer profile on the site shows the record. Rules in RESEARCH-DESIGN.md.
- [x] Collect the people listed on the faculty pages linked from the universities database (16 October 2026): `data/faculty-rosters.json`, 4,101 people at 95 universities from the 104 pages that answered and could be read (119 of 247 answered at all), 252 matched to OM List at the same university, 3,814 unverified. Reviewed one by one through `research/rosters/chunk-N.json` and proposal files; by the end of 16 October 2026, 3,400 people in 85 chunks were reviewed: 2,931 confirmed faculty (many in other fields, from whole-college pages), 239 extraction noise, 163 staff, students, postdocs or former members, 41 unresolved, 26 the same as an OM List profile.
- [ ] Continue the roster reviews chunk by chunk in the queue order (people with an operations title, then department pages, then whole-college directories; faculty by title before untitled names); keep at most three agents per session and about 40 searches each. Confirmed people still only live in the roster file. Reviewers must record the area shown on the profile, because the directory row's department is not the person's own.
- [ ] Decide how confirmed roster people enter the people database proper: a second source in `data/faculty.json` (own id prefix, the faculty page as `sourceUrl`, doctorate as reported by the profile with its URL) with a pending ledger entry each, so that first-job research proceeds as for OM List people. Until then they are not counted in the coverage, trends or profiles.
- [ ] Send the dead and refused faculty-page links (77 dead, 31 refused, 10 unavailable, 9 without an answering host after the browser retry; listed under `pages` in `data/faculty-rosters.json`) back to the Operations Academia directory for correction; a corrected link needs `fetch --refresh` for that page. Several answering links also point at the wrong kind of page (an awards list at ASU, a faculty-tools page at CSU East Bay, a chairs page at Cal Poly Pomona).
- [ ] Whole-college directories (Clemson, Notre Dame Mendoza, Loyola and others) list every faculty member, so roster reviews must record the area shown on each profile; decide later which areas count as operations.
- [ ] Decide whether the 11 employer spelling variants in `data/placements.json` (University of California Berkeley / University of California, Berkeley and similar) should be normalised in the research ledger with a documented reason; the derived files and the site already count them as one organisation.

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
- [ ] Re-run `node scripts/geocode-institutions.mjs employers`, `node scripts/wikidata-countries.mjs` and the Operations Academia import once the universities Wikidata pass finishes: 85 of 319 first employers and the newest verified names have no location yet, and the universities file gains links as the pass completes.
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
- A Wikidata name search returns a plausible but wrong item for short or shared names: "York University" gave the University of York, "Minnesota State University" the University of Minnesota, "University of Navarra" its IESE Business School, "Nevada State University" the University of Nevada, Reno. Review every merge that rests on a shared item, and record corrections in `data/location-review.json` (the research caches are ignored and would lose them).
- A trailing bracketed campus or school name, "(Guangzhou)" or "(Kelley)", is not an abbreviation like "(NUS)": stripping it merged HKUST Guangzhou into HKUST. Name normalisation strips only all-caps brackets.
- Several derived files keyed records by a slug of the name, so two spellings of one organisation ("Koç" and "Koc") produced duplicate ids and the entity validator failed; spellings are now grouped before ids are assigned.
- Faculty-page links in the Operations Academia directory are often stale: 73 of 247 were dead and 30 refused automated readers at the first fetch, and some that answer are whole-college directories or script-drawn lists. Name extraction from arbitrary pages is heuristic (named professorships, navigation items and staff appear as people, and on pages that print the title before the name the extracted title can belong to the neighbour, as on the Cal Poly Pomona chairs page), so every roster row is a lead to review, and the review statuses include extraction-noise. The department shown with a roster row is the directory row that cites the page, not the person's own area; a whole-college directory therefore lists people from every department under it.
- Some profile pages hide their content from plain readers: merage.uci.edu answers the fetch tool with 503 but serves the same page to a plain curl request; Vanderbilt Owen bios and Ivey "Discovery" profiles are drawn by scripts from public JSON endpoints, so the fetch tool and curl see an empty template. Reviewers read the same public page through curl or the page's own data endpoint and said so in the reason and sources; no access control was bypassed. A directory entry that shows a name with no title (several Ivey stubs) stays unresolved, and a title in a chunk file can belong to the neighbouring directory entry.
- A directory link that carries a filter in its query string may not be filtered when fetched: the Yale SOM link asks for the Operations Management discipline, but the page answers with the whole school (236 people), so its roster rows are mostly faculty in other fields and the Yale operations group has to be read from its own group page in a later pass.
- The main search previously failed because a button named `reset` shadowed the form's reset method. Keep the distinct `reset-filters` ID and prototype-based reset call.

## Handoff template

Record: scope and assigned IDs/programs; files changed; sources opened; verified findings; unresolved gaps; checks run; published revision or unpublished state; active collaborators; and the next specific item. Update the generated status file before each data release. Do not write a generic “continue research” handoff without the IDs and outstanding evidence needs.
