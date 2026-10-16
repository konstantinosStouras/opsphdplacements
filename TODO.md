# Remaining work and handoff priorities

See [RESEARCH-STATUS.md](RESEARCH-STATUS.md) for generated counts. This checklist describes unfinished deliverables, not a claim that work is already complete.

## Current research

- [ ] Individually review every pending imported profile. Do not bulk-label a retrieval as a review.
- [ ] Finish the audit of destination-only placement tables for omitted postdocs and earlier industry jobs; correct or downgrade unsupported first-job claims.
- [ ] Revisit unresolved cases using the specific gap recorded in the ledger. Separate ambiguous within-year chronology, missing degree completion, wrong-person matches and inaccessible evidence.
- [ ] Preserve independent field-level sources for degree dates, degree institutions, employer, role and job dates; older first-placement records often have a shared source list and review date.

## Step 1 — Historical doctoral program register

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

- [x] Add static social-sharing metadata, a branded preview image, browser/mobile icons and reproducible asset checks; maintenance is documented in `SHARING.md`.

- [ ] Implement a reviewed migration to a persistent canonical database before editing longitudinal data there. The present SQLite output is regenerated from JSON.
- [ ] Add proposal intake/validation/export for new graduates, advisors, publications and later career events; schema support alone is not a finished ingestion pipeline.
- [ ] Add graduate profiles with linked education, advisors, timeline, publications and fact-level evidence/check dates.
- [ ] Add program-year graduate coverage and career filters. Directory cohort counts must remain distinct from actual graduating class sizes.
- [ ] Add versioned public releases and reproducible historical snapshots, then link the citation version to an immutable release.
- [ ] Add a conservative recurring recheck process only if the user authorizes scheduling; none exists now.

## Known pitfalls to retain

- OM List samples faculty-listed people and excludes IE departments; it cannot estimate the share of all graduates entering academia.
- University placement tables sometimes show a later faculty destination. Yue Hu's earlier Chicago Booth postdoc was found after a Stanford destination had initially been recorded.
- Historical degrees can differ from directory imports; retain both original assertions and sourced corrections.
- Public CV links can point to a namesake in another discipline. Name matches alone are unsafe.
- The main search previously failed because a button named `reset` shadowed the form's reset method. Keep the distinct `reset-filters` ID and prototype-based reset call.

## Handoff template

Record: scope and assigned IDs/programs; files changed; sources opened; verified findings; unresolved gaps; checks run; published revision or unpublished state; active collaborators; and the next specific item. Update the generated status file before each data release. Do not write a generic “continue research” handoff without the IDs and outstanding evidence needs.
