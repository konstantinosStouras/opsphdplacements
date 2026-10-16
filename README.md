# Operations PhD Placements

Public website: https://www.stouras.com/opsphdplacements/

An independent, static research directory for Operations Research, Operations Management and Industrial Engineering. The visual organization is inspired by Econ PhD Placements; all application code is original.

## Continue the project

| Guide | Purpose |
|---|---|
| [AGENTS.md](AGENTS.md) | Entry instructions for models and research agents |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Evidence requirements, task ownership and submitting findings |
| [WORKFLOW.md](WORKFLOW.md) | Research, integration, checks and publishing commands |
| [RESEARCH-STATUS.md](RESEARCH-STATUS.md) | Generated counts and links to the current evidence ledger |
| [TODO.md](TODO.md) | Remaining work and specific handoff priorities |
| [RESEARCH-DESIGN.md](RESEARCH-DESIGN.md) | Population definition, historical programs and longitudinal dataset design |

## Deployment

Push to `main` to run the GitHub Pages workflow. The project inherits the account site's custom domain; do not add a CNAME pointing the domain at this repository. The workflow publishes only `index.html`, `.nojekyll`, `assets/` and `data/`.

## Data

`data/faculty.json` holds all 2,149 profiles from the OM List all-faculty snapshot of 16 October 2026 across 202 institutions. Source status (active, industry, retired or deceased) is preserved. PhD information is joined by exact source profile URL. `data/placements.json` holds independently verified first placements and contains the reviewed first-employer records published so far. Never infer a first placement from a directory affiliation.

See [DATA-PROVENANCE.md](DATA-PROVENANCE.md) for source reconciliation, reproducible import commands and limitations. The source does not cover Industrial Engineering departments; its discipline labels do not verify the subject of someone's doctoral degree.

## Checks and publication

Run `npm run check` with Node 22 or later. There are no application dependencies. The publishing script copies public files and versions assets to prevent stale pages after updates. Checks cover dataset identity and provenance, filtering, missing years, grouped counts, and safe CSV export. Every production deployment runs these checks. Only public assets are deployed; research snapshots, import tools and test fixtures are excluded.

Preview with a static server, inspect changes and commit the reviewed data. A push to `main` validates and publishes the site. Roll back by reverting a commit and pushing; never overwrite history. No scheduled scraping is configured.

## Data contracts

Faculty records require a unique stable `id`, `name`, `sourceUrl`, and `retrievedAt`. Unknown degree facts are null; a future doctorate year is flagged. Retain original source labels and source URLs. Faculty affiliation is not a placement outcome.

First-placement records additionally require `verificationStatus: "verified-first-placement"`, `evidenceUrl`, `reviewedAt`, and an explicitly known `placementYear` or null. Review the explicit first-job evidence before adding any record. Imported degree fields remain source-reported unless the corresponding field verification status says otherwise; verifying a job does not verify every directory fact.

`data/doctoral-programs.json` holds the partial historical program register, with field-level sources/check dates and explicit unknown historical dates. It does not yet contain complete graduate rosters. Refresh `RESEARCH-STATUS.md` with `node scripts/update-research-status.mjs` when publishing data changes. Run `python scripts/test-research-schema.py` and `python scripts/build-research-database.py` for the relational evidence checks and reproducible snapshot.

## Features

Search by name, affiliation, PhD institution, discipline and research tags; filter by institutions, status, discipline or PhD years; sort and paginate; download the filtered CSV. Institution and PhD-program profiles, comparisons of up to four institutions, and cohort and source-status charts use the same data. CSV exports neutralize spreadsheet formulas. All displayed source text uses safe text nodes.

Source directory: https://omlist.edutool.org/faculty

## Graduate census and career histories

[RESEARCH-DESIGN.md](RESEARCH-DESIGN.md) specifies the subsequent expansion to all documented graduates of in-scope programs, including industry careers and sector transitions. [database/schema.sql](database/schema.sql) defines the relational schema. Run `python scripts/build-research-database.py` to produce the disposable local snapshot `research/operations-careers.sqlite` from the public JSON, including people, source-reported doctorates, reviewed first-job events and evidence. JSON remains the source of truth during current collection; the generated database does not yet serve the website. Rebuilding replaces that derived snapshot, so do not edit it directly. No later appointments or degree programs are inferred. A historical program register, including closed and renamed programs, starts the graduate census; existing first-placement verification continues in parallel. The schema also supports advisor relationships, publication/authorship records, PhD-year publication assessments and per-fact check histories. These tables are infrastructure, not claims that all graduates or career histories have already been collected.

## Local preview

Serve the repository with any static HTTP server, for example `python -m http.server 8765`, then visit http://localhost:8765.
