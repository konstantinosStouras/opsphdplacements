# Operations PhD careers: collection and analysis design

Version: 16 October 2026. This describes the planned graduate census and career-history extension. The published directory is currently a partial first-placement study of the imported OM List faculty; it is not yet a graduate census.

## Population and collection order

1. Finish individual first-job review of every imported faculty profile. Publish verified outcomes and separately record unresolved cases with the sources examined. A complete review is not the same as complete outcome ascertainment.
2. Freeze the [Operations Academia university directory](https://www.operationsacademia.org/universities) as a dated sampling frame. Its cards combine schools and departments from postings and curated records; listing does not prove a department awards an in-scope PhD. Verify the doctoral programs and distinguish university, school, department and program identities.
3. Enumerate **graduates by program and graduation cohort**, independently of subsequent employment. Combine official graduate/alumni lists, placement reports, commencement lists and dissertation repositories. Keep partial cohorts; do not present them as complete. A dissertation submission or a job-market candidacy alone does not establish that a degree was awarded.
4. Research each graduate's initial outcome and subsequent career, including direct industry entry, corporate postdocs, academia-to-industry moves, industry-to-academia moves and returns. Retain people with unknown outcomes in the denominator.

Use all publicly documented cohorts, recording the actual start/end of coverage for each program. Do not silently impose a common historical window or discard programs with missing placements. Freeze a study-specific balanced cohort window for comparative analyses when needed.

The [Econ PhD Placements methodology](https://www.econphdplacements.com/#methodology) provides a useful collection pattern: official departmental placement reports, archived pages, structured extraction, checks and versioned publication. This project's career histories count the actual first post-PhD appointment, including a postdoc before a faculty appointment, and leave unreported appointment types unknown. A university-only employer entry is not sufficient evidence of tenure-track status.

## Units of observation

| Table | One row represents | Essential facts |
|---|---|---|
| Person | A disambiguated individual | Stable ID, public professional name; aliases and linked source identifiers |
| Organization | A university, school, department, company, agency or nonprofit | Stable ID, official name, parent organization, historical aliases |
| Program | A doctorate-granting program | Organization, program name, official field, scope decision and evidence |
| Doctorate | A person's doctoral degree | Program, degree title, field, award/defense dates, completion status and evidence |
| Career event | An appointment or documented nonemployment interval | Employer, role, start/end bounds, sector, appointment type, full-time/primary status where explicit |
| Source | A public document or dated version | URL, title, publisher, document date, retrieval date, optional archive URL and content hash |
| Claim | One asserted fact about a record | Field, source assertion, locator, review decision, normalized value and rationale |
| Cohort coverage | A program in a graduation year | Published total if known, identified graduates, completeness assessment and sources |
| Research review | A documented investigation | Target, reviewer, date, disposition, sources examined and next step |
| Revision | An auditable change | Record ID, prior/new value, rationale, source and release |

Person IDs survive name changes and employer changes. Name similarity alone never merges two people. Degree institution, dates, advisors and public identifiers are corroborating signals. Record competing claims when sources disagree; preserve the imported value and the adjudication rather than erasing the discrepancy.

## Dates and job definitions

Store source date text alongside normalized **lower and upper bounds** and precision (`day`, `month`, `year`, `interval`, `unknown`). A year-only date spans that calendar year; January 1 is not an observed start date. Graduation, defense and job-market cohort years are distinct fields. Store unknown bounds as null.

Keep these outcomes distinct:

- **Employment at doctorate completion:** may have begun before the degree.
- **First new post-PhD job:** the earliest documented new appointment following completion. An explicit official initial-placement list can establish the employer without establishing its exact start date.
- **First faculty appointment:** may follow a postdoc, visiting role or industry role.
- **First industry appointment:** may be the first job or occur many years later.
- **Latest observed appointment:** tied to its source observation date; it is not automatically current forever.

An appointment that begins before completion is retained in the career history. It is not silently relabeled a newly obtained post-PhD job. If within-year order is unresolved, preserve the ambiguity. Maintain the original department-reported placement separately if it describes an intended faculty destination after a postdoc.

Sector and appointment type are separate. For example, an IBM postdoc can have `sector=industry` and `appointment_type=postdoc`. Sectors are academia, industry, government, nonprofit, self-employment and unknown. Appointment types include tenure-track, tenured, fixed-term faculty, teaching, research staff, postdoc, professional employee, founder, consultant and unknown. Do not infer a tenure contract from a generic title when the source or institutional context is insufficient.

Retain concurrent roles. An adjunct appointment, consulting project or advisory board role does not establish a primary-job change or an exit from academia. An academia-to-industry transition requires supported sequence and evidence about the primary employment transition; otherwise label it an observed cross-sector overlap or unresolved transition.

## Evidence and review

Prefer original university placement reports, dated CVs, institutional appointment announcements and employer biographies. Dissertation repositories establish degree facts, not later employment. Search snippets and aggregators are discovery aids; open and inspect the underlying source before verification.

For every published job, record evidence for identity, employer, dates where available, and why the appointment is first or later. Scope verification to individual fields: an employer can be verified while role, sector or exact start date remains unknown. Use `verified`, `unresolved`, `contradicted` and `pending` claim states, with explanatory notes rather than unsupported numeric confidence scores.

Record document date and retrieval date separately. A CV retrieved today may be years old. Preserve short supporting paraphrases and page/section locators in public data; retain permitted source snapshots and hashes in the research cache. Never publish entire downloaded CVs, private contact details or unpublished source files.

Collection runs should cache responses, avoid repeated requests, record failures and retry conservatively. Do not bypass sign-in requirements, CAPTCHAs, paywalls or certificate warnings. A failed retrieval is not an unresolved substantive review until the attempted evidence and specific barrier are recorded.

## Coverage and empirical interpretation

For each program-year, report separately: official graduate total (if available), named graduates identified, graduates with verified degree completion, initial outcomes verified, and later-career follow-up available. Document how an official total is reconciled to names before calling a roster complete. An omitted name does not imply a non-graduate; an omitted outcome does not imply unemployment.

Publish observed counts first. Any share must show its denominator and missingness: verified outcomes among named graduates differs from the share among a reconciled complete cohort. The OM List import samples people appearing in a faculty directory and is unsuitable for estimating the overall probability that graduates enter or remain in academia.

Career analyses can compare sector at 1, 3, 5 and 10 years after graduation only for cohorts with sufficient follow-up. Track last observation and censoring; do not impute continued academic employment after the last source. Interval-censored transitions and competing exits need appropriate estimators and sensitivity checks. Descriptive associations are not causal effects of attending a program. Do not rank programs using unequal or incomplete coverage without clearly justified adjustments.

## Website and storage

Keep the current static website and versioned JSON/CSV downloads. Add cohort coverage, initial outcomes, career timelines, latest observed employment and transitions as separate views. Each view links to field-level sources and its inclusion rules. Offer a correction/removal route and keep sensitive information out of public issue submissions.

The relational schema in `database/schema.sql` defines the next-stage canonical store. SQLite is sufficient for a single maintainer and reproducible offline builds. Move to PostgreSQL only when concurrent review/editing warrants a server. Keep editing and extraction out of the public site; publish reviewed snapshots through the existing validation and deployment process.

Data flow: public sources → cached extraction proposals → identity/chronology review → canonical records and claims → validation → versioned public exports → website. Agents propose sourced facts; publication checks reject missing provenance and inconsistent IDs. An export never promotes unresolved claims simply because a source was downloaded.

Use immutable release identifiers and change logs, with corrections superseding prior assertions. Do not overwrite accepted career history when refreshing an employer biography. Back up the canonical store, validate referential integrity and retain reproducible export scripts. Revisit full-text search or a hosted API only if measured dataset size or user needs exceed the static approach.
