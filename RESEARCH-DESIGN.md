# Operations PhD careers: collection and analysis design

Version: 16 October 2026. This describes the planned graduate census and career-history extension. The published directory is currently a partial first-placement study of the imported OM List faculty; it is not yet a graduate census.

## Population and collection order

1. Build a worldwide register of universities and **historical doctoral programs** in Operations Management, Operations Research and Industrial Engineering, including programs that closed, suspended admissions, merged or changed names. Use the [Operations Academia university directory](https://www.operationsacademia.org/universities) as a dated discovery source, not an exhaustive population frame. Its cards combine schools and departments from postings and curated records; listing does not prove a department awards an in-scope PhD. Supplement it with official catalogs, archived university pages, dissertation repositories and documented predecessor programs. Distinguish university, school, department and program identities.
2. Enumerate **all documented graduates by program and graduation cohort**, independently of subsequent employment. Combine official graduate/alumni lists, placement reports, commencement lists and dissertation repositories. Keep partial cohorts; do not present them as complete. A dissertation submission or a job-market candidacy alone does not establish that a degree was awarded. Include graduates who finished after admissions ceased and people never employed in academia.
3. Enrich each graduate with sourced degree facts, advisors, publications through the PhD year, initial employment and subsequent career events, including direct industry entry, corporate postdocs, academia-to-industry moves, industry-to-academia moves and returns. Keep a last-checked date for each fact, not just the profile. Retain people with unknown outcomes in the denominator.

Existing first-job review of the imported faculty directory continues in parallel and feeds these records. It is an enrichment stream, not the census sampling frame. A complete individual review is not the same as a verified outcome, and a complete-looking directory is not evidence of population coverage.

Record program opening, admissions suspension/end and program closure separately, with date bounds and sources. Link predecessor and successor programs explicitly rather than overwriting old names or assigning old graduates to a new program. An absent current webpage is not evidence of closure. Historical graduate lists remain eligible even when the university no longer offers the degree. Broad degrees (for example a management PhD with an OM specialization) need explicit specialization evidence; research interests or the current department alone do not establish eligibility.

Use all publicly documented cohorts, recording the actual start/end of coverage for each program. Do not silently impose a common historical window or discard programs with missing placements. Freeze a study-specific balanced cohort window for comparative analyses when needed.

The [Econ PhD Placements methodology](https://www.econphdplacements.com/#methodology) provides a useful collection pattern: official departmental placement reports, archived pages, structured extraction, checks and versioned publication. This project's career histories count the actual first post-PhD appointment, including a postdoc before a faculty appointment, and leave unreported appointment types unknown. A university-only employer entry is not sufficient evidence of tenure-track status.

## Units of observation

| Table | One row represents | Essential facts |
|---|---|---|
| Person | A disambiguated individual | Stable ID, public professional name; aliases and linked source identifiers |
| Organization | A university, school, department, company, agency or nonprofit | Stable ID, official name, parent organization, historical aliases |
| Program | A doctorate-granting program | Organization, program name, official field, scope decision and evidence |
| Program period / relationship | A documented operating period or predecessor/successor link | Admissions/closure status, date bounds, rename/merge/split and evidence |
| Doctorate | A person's doctoral degree | Program, degree title, field, award/defense dates, completion status and evidence |
| Advising | An advisor's relationship to a particular doctorate | Advisor identity, advisor/co-advisor/committee role and supporting source |
| Publication / authorship | A distinct scholarly work and a person's authorship | DOI where available, title, venue, work type, dates, versions and disambiguated authors |
| Degree publication | A work's eligibility for a PhD-year snapshot | Cutoff rule, date evidence, included/excluded/uncertain decision and check date |
| Career event | An appointment or documented nonemployment interval | Employer, role, start/end bounds, sector, appointment type, full-time/primary status where explicit |
| Source | A public document or dated version | URL, title, publisher, document date, retrieval date, optional archive URL and content hash |
| Claim | One asserted fact about a record | Field, source assertion, locator, review decision, normalized value and rationale |
| Claim check | A subsequent check of an existing assertion | Source version, check date, confirmation/conflict/unavailable outcome and reviewer |
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

Every fact displayed as checked must have its own review timestamp. Pending imported assertions retain their retrieval dates but must not be labeled independently checked. Rechecking an unchanged assertion appends a check event; changing a fact creates a revised claim and retains the old assertion. Failed access records a failed check, not renewed confirmation. Show both the latest check attempt and latest successful confirmation when they differ. A profile-level last-update date is only a convenience summary.

## Advisors and publications at graduation

Use dissertation front matter, official repository metadata, graduate records or an explicit CV statement to identify advisors. Preserve multiple co-advisors and distinguish them from committee members. Advisor names are independently disambiguated; being an advisor does not automatically put someone in the graduate census.

The default requested publication snapshot is **works published through 31 December of the PhD award year**, labeled as a calendar-year measure. Also support a stricter **published by the actual degree date** measure where dates permit. Do not claim that a same-year article preceded graduation when only years are known. Keep accepted papers, preprints, journal articles and conference papers distinguishable; accepted or submitted work is not automatically published. Preserve first-online and print dates separately, using first formal publication for the main published-work measure and stating the convention.

Resolve author identity using the person's CV, publisher records and public scholarly identifiers where available. A name match alone is insufficient. Record DOI, title, venue, author list/order, work type, source date and last check. Link preprint and published versions to prevent double counting. Keep uncertain identity and timing assessments out of confirmed counts. A current CV can reconstruct a historical publication list using dated works; it cannot establish historical citation counts. Publication-list coverage must be labeled partial unless reconciled against appropriate sources.

For each graduate, the eventual profile presents education and advisors, a chronological career timeline, publications with year and PhD-cutoff filters, and expandable field-level sources/check dates. Downloads separate people, degrees, programs, jobs, advisors, works and evidence, with stable IDs linking them. Researchers can join them without parsing a single biography text field.

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

## Decision: employment that overlaps the degree date (16 October 2026)

Reviews keep finding three overlap patterns. They are treated as follows, and the overlap must be stated in the evidence note or reason.

1. A regular job that began well before the degree and simply continued afterwards (for example an assistant professorship or a company role held throughout the doctorate) is **not** the first post-PhD job. The first *new* job after the degree is; if none is documented, the person stays unresolved with the overlap recorded.
2. An explicitly post-doctoral appointment that starts in the final months before the formal degree date, after the dissertation was completed, **is** the first post-PhD job. Formal conferral often lags the defence by a term; the start month and the degree month are both recorded.
3. A prospective announcement or hiring notice written before the degree does **not** establish a first job. A dated CV, an appointment record or a later profile that confirms the job began is required.

The published `placementYear` remains the documented start year of the first new post-PhD job, never the cohort year.

## Two databases and how they link (16 October 2026)

The project maintains two databases that will be merged into one entity model.

1. **Universities with operations departments** (`data/universities.json`, imported by `scripts/import-operations-academia.mjs` from the [Operations Academia](https://www.operationsacademia.org/universities) directory, the project owner's own site). One row per university, with its schools and departments, country, faculty pages, coordinates where the directory has them, and the directory's own source tags. Listing in the directory records that a university has an operations department; it does not establish that the university awards a doctorate in the field. Doctoral provision stays in `data/doctoral-programs.json`. Corrections made by signed-in users on the Operations Academia site are overlaid there at read time and are not in the committed file, so an import is a snapshot of the committed table.
2. **People** (`data/faculty.json`, `data/placements.json`, `data/research-status.json`, derived `data/institutions.json` and `data/employers.json`): the OM List faculty directory import with source-reported doctorates and the researched first jobs.

**Link key.** A university in database 1 is linked to a PhD institution in database 2 when both names resolve to the same Wikidata item, or when the names are identical after normalising spelling, or when the people-database name is the directory name plus a campus qualifier (at Ann Arbor, College Park). The match type is stored with every link so it can be reviewed; unmatched universities are left unlinked rather than guessed.

**Spelling rule.** In the derived databases and on the site, names that differ only in accents, punctuation, spacing or case ("Koç University" and "Koc University", "University of California, Berkeley" and "University of California Berkeley") are one organisation: the most used spelling stands for the group and the other spellings are listed with the record. The source files keep every spelling as written.

**Merged entity (16 October 2026).** `data/entities.json`, built by `scripts/build-entities.mjs`, holds one record per organisation that appears in either database or the program register, so that an update in any source reaches one place. The rules:

1. The key is the Wikidata item when any source matched one (`wd:Q49108`), otherwise a slug of the name (`name:...`). An entity keyed by an item is named by the item's English label; otherwise the first source name stands. Every spelling from every source is an alias of the record.
2. A source row attaches to an entity through the import's recorded link, a shared Wikidata item, or an identical name after normalising (accents, punctuation, small words and a trailing all-caps abbreviation such as "(NUS)" are ignored; a trailing campus or school name such as "(Guangzhou)" or "(Kelley)" is kept, because it marks a different organisation). How each row was attached is stored under `review.matches`.
3. When two rows of one source land on one entity (two spellings of an employer that share an item, or a university and its statistics department in the directory), both rows stay listed and their figures are added.
4. A disagreement between a row's own Wikidata item and the entity's is recorded under `review.conflicts`, never resolved silently.
5. Nothing is inferred across sources. A university with no match in the people database has null people figures, which says nothing about whether it awards doctorates; an employer that is not in the directory simply has no departments listed.

**Reviewed matches.** Wikidata matches are name-based search results and remain unreviewed unless `data/location-review.json` records a correction. The merges that rest on a shared item were reviewed on 16 October 2026 and nine corrections recorded: York University is the Toronto university (Q849751), not the University of York; University of Houston–Downtown (Q7895509), Nevada State University (Q1658675, the former Nevada State College) and the University of Navarra (Q926068, the search had returned its IESE Business School) get their own items; Minnesota State University, the three HKUST Guangzhou names and a bare "Indian Institute of Management" are left unmatched, because the name alone does not identify one organisation or no item exists for it. A correction is a QID or null with the reason and date; it is applied by the geocode script, never by editing a generated file.

## Faculty rosters from the universities database (16 October 2026)

The people database began as the OM List import. A second source of people is the set of faculty pages that the universities database links (one per department row where the Operations Academia directory records one). The rule chain:

1. **Collection.** `scripts/collect-faculty-rosters.mjs fetch` downloads every linked faculty page (plain fetch, then a headless browser for pages that refused or draw their list with scripts) into the ignored `research/rosters/` cache, with the status and retrieval date of every page. `build` extracts the people listed (a name-like line next to a title line, or a name whose link leads to a profile page carrying the surname) and the title shown. Extraction is heuristic: a listed name is a lead, never a fact, and pages that are dead links, refuse automated readers or render with scripts contribute nothing and are reported as such.
2. **What a listing establishes.** Only that the page showed the name under that title on the retrieval date. It does not establish a doctorate, a field, a first job or even that the person is operations faculty (a whole-college directory lists everyone). The title is classified as faculty, postdoc, student, staff or unknown from its words, for ordering review work only.
3. **Matching to OM List.** A listed person is the same as an OM List profile when the names are identical (or identical in first and last name) and the OM List affiliation is the same university, read through the merged entities so that every spelling counts (`om-list`). A name match at a different institution (`om-list-name-only`) may be a namesake and is reviewed, never assumed. Matched people carry the OM List profile's source-reported doctorate, research status and verified first job; nothing else is copied.
4. **Unverified people.** Everyone else is `unverified`: doctorate null, first job null, until a reviewer opens the person's own page and records the outcome in a proposal file (`research/rosters/proposal-N.json`): confirmed faculty (with the title and area shown, and the doctorate only when an opened page states it, with that page's URL), extraction noise, not listed (gone, or a student or staff member), the same person as an OM List profile, or unresolved with the reason. The merge (`scripts/merge-roster-research.mjs`) refuses a review without a reason, a check date and an opened source, and a doctorate without its source page. A confirmed doctorate from a roster review is still a self-reported or institution-reported fact, not a verified degree.
5. **Integrator rules applied in the one-by-one pass (16 October 2026).** A study period (2009-2013) is not a conferral year, so the year stays null. A degree the page calls pending, expected, ABD or in progress is not recorded. A professional degree (MD, JD, LLM) is not a doctorate for this field; a DBA, EdD, ScD or other research doctorate is recorded with its type in the reason. The awarding institution is kept as the page writes it (one Georgia Tech page names only "ISyE"). A page that only says someone finished doctoral studies somewhere does not state an awarded degree. A directory entry whose only title is at another university, or that shows a name with no title, biography or degree, stays unresolved. A person listed with a faculty rank on the school's own directory page but without an individual page is confirmed from that listing, with the directory page as the profile URL. A prize biography is not evidence of a current appointment. Reviewers may read a public page through a plain request or the page's own public data endpoint when the fetch tool is refused or receives an empty script-drawn template; the row says so. A name-only OM List candidate is linked only when the opened page shows the same person; otherwise the roster row is confirmed on its own and the candidate stays unlinked.
6. **Not yet decided.** How confirmed roster people enter the people database proper (a second source in `data/faculty.json` with its own ids and ledger entries, so that first-job research proceeds as for OM List people) is recorded as an open task; until then they live in `data/faculty-rosters.json` and are not counted in the coverage, trends or profiles.

## Decisions on evidence types (16 October 2026)

- A permanent UK or Commonwealth lectureship is the entry grade of the permanent faculty track and is recorded as tenure-track unless the source states a fixed-term or teaching-only contract; teaching fellows, adjuncts and fixed-term lecturers are other academic.
- An internal promotion at the employer where the person already worked before the degree is not a first new post-PhD job; the person stays unresolved with the employer at completion noted, until a new employer is documented.
- An ORCID employment record is a self-maintained dated chronology, like a CV, and may establish a first job when it carries the known degree and employer affiliations of the person; it is cited as ORCID in the sources.
- When a page could only be read through a reader proxy because the site blocks automated fetches, the original URL is cited and the note says how it was read.
