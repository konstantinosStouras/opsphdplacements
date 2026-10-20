# Identity cleanup and LinkedIn continuation — 20 October 2026

Owner: this Codex chat, one integrator. No parallel ownership is assigned.

**Identity cleanup gate: incomplete.** The audit is metadata screening, not verification of names and universities against every source. Resolve the graduate candidates and Rutgers public sightings before marking this gate complete. Record each decision with stable IDs, opened sources, check dates, reason and remaining unknowns. Never merge by name alone.

`identity-audit.json` contains the reproducible screening results. `queue.json` snapshots all 3,161 current people records; it deliberately excludes graduate-list-only people until their identity reconciliation is finished. Their later addition remains required. `rutgers-catalogue-review.json` preserves the repaired catalogue conflict and the outstanding public-data reconciliation. No employment findings have been integrated in this change.

Regenerate metadata with `node scripts/audit-linkedin-inputs.mjs`. Queue states are initial snapshots, not mutable progress: save decisions in separate files under `reviews/<stable-id-safe-filename>.json`, retaining `facultyId`, name, `checkedAt`, actual profile URL, identity basis, access outcome, supported facts, unknowns and integration status/commit. Check existing reviews before selecting another person; do not overwrite newer findings. For first-job proposals use WORKFLOW.md's complete proposal contract. Keep later jobs separate; no whole-history public importer exists yet. No private contact details or full profile copies belong here.

The owner accepts identity-matched LinkedIn chronology as self-reported evidence, without compulsory corroboration. Read one profile at a time in Chrome through the supported browser agent. Confirm identity with the doctorate and professional chronology. A missing earlier job is not proof none existed; education ranges do not prove degree dates. A title over a long employment span may be the final title rather than the starting title.

The local heartbeat `review-placement-identities-then-linkedin-careers` is active daily at 09:17, 12:17, 16:17 and 20:17 Europe/London. Its first phase finishes identity cleanup; only after the gate is explicitly completed does it review up to 25 unchecked people per run, targeting 100 distinct completed checks per day. Chrome was connected and LinkedIn was signed in on 20 October 2026; two individual profiles were opened successfully in the supervised pilot on the same date, without challenges. Execution requires the app/computer and browser connection to be available. Stop on challenges, restrictions or disconnection and record the blocker; inaccessible profiles are not completed. No outreach, account interaction, bulk scraping or bypass is authorized.

Save reviewed continuation work on GitHub branch `codex/linkedin-review-workflow`; preserve other contributors' edits. Do not push main or deploy. Public integration requires conflict review, current evidence, derived rebuilds and project checks. Notify only for meaningful progress, failure, required user action or completion; avoid repetitive unchanged updates.

## Supervised pilot and revised target — 20 October 2026

Two identity checks are saved in `reviews/debora-gilliard.json` and `reviews/kristie-rogers.json`. Both profile pages opened without a challenge; neither is a completed employment review. The global identity gate remains incomplete. The target of 100 checks/day is a target, not guaranteed throughput. Runs use fixed distributed times, not randomized behavior. Human-verification challenges must be completed by the owner; the agent stops and leaves the page for handoff rather than claiming to be human or bypassing restrictions.

## Entire profile job histories — owner instruction, 20 October 2026

For every person accessed, capture all employment entries mentioned on LinkedIn, including prior jobs, grouped promotions, concurrent appointments and later transitions. Follow [history-contract.md](history-contract.md) and save separate history files. Expand the accessible Experience section and employer groups. Missing dates stay unknown; absent/inaccessible sections are not proof of no jobs. Both pilot profiles remain queued for full-history follow-up. The automation now requires this; quality takes precedence over the 100/day target.

## Full-history pilot published — 20 October 2026

At the owner’s explicit request, the two pilot profiles were revisited for full Experience histories. `histories/kristie-rogers.json` records four Experience roles plus About mentions; `histories/debora-gilliard.json` records three Experience roles plus undated industry mentions. They are integrated into `data/linkedin-histories.json`, displayed at #linkedin-histories with checkedAt and ledger-managed updatedAt and direct profile links. Historical identity-only files remain historical. No first-placement/degree records were changed. Both accessible Experience sections were fully read; the broader identity gate remains incomplete. Reviewed publication is now authorized after checks, replacing the earlier blanket no-main-publication restriction for this requested website feature.

## Scheduled identity-audit batch — 20 October 2026

`identity-reviews/2026-10-20-asu-01.json` records 15 current official ASU alumni name/year confirmations (Yiwen Zhang through Eunyoung Park in the audit order), after opening the current university table. These are unmerged audit findings, not LinkedIn history reviews. Unknown-year historical sightings remain intact; their identity links are provisional because those source captures were not reopened. Global cleanup is incomplete. Next: inspect the historical sightings/person-specific primary evidence before merging identities. Future automated batches remain on the research branch; only the supervised pilot was approved for live publication.

## Additional observed profiles — 20 October 2026

The owner requested more LinkedIn checks now. Brooke Buckman’s six Experience entries and Han Jiang’s nine were read in Chrome (Han’s Show all list included earlier jobs); no challenge appeared. Proposals are `histories/brooke-buckman.json` and `histories/han-jiang.json`. They are NOT integrated into public data: automatic approval review rejected public integration while the explicit global identity gate remains incomplete. Ask the owner to lift that prerequisite before further dependent employment work/integration. Paid employment is not inferred from student/candidate entries. The unknown-year graduate sightings remain unlinked. A Yiwen Zhang search was initiated but no profile was opened or reviewed.

## Coordinated integration — 20 October 2026

The owner explicitly requested coordinating all project workflows and adding the newly found information to the database and website. Brooke Buckman (six Experience entries) and Han Jiang (nine) are now integrated into `data/linkedin-histories.json`; only their dated graduate IDs are linked, preserving the unknown-year sightings for reconciliation. This supersedes their earlier blocked/unmerged state for this batch, not the unresolved global audit. The separate “Update employment data presentation” chat owns shared UI/CV/classification changes and is sole final integrator for the combined rebuild, validation, commit and deployment. This chat owns LinkedIn evidence; avoid concurrent edits to its proposals. Future automatic main publication has not been enabled. Main people research follows alphabetical order, with explicit ID ownership before any overlapping research.

## Current coordinated continuation — 20 October 2026

The owner requested the columns be finished first, then all main people researched in alphabetical batches. Generate research-handoff/careers/alphabetical-queue.json with node scripts/build-career-queue.mjs: 3,161 people, 25 per batch, displayed-name English collation and stable-ID tie-break. Save explicit outcomes under research-handoff/careers/reviews/ (pending, partial, blocked, completed are distinct); fully captured older sources can remain partial. Next unattempted person is A. Mehrotra, followed by the existing partial Knemeyer review and Aadhaar Chaturvedi.

The coordinating LinkedIn chat confirmed the owner's authorization for this five-history release (four LinkedIn histories plus one CV history) and changed the existing four-times-daily automation to alphabetical histories, with per-person identity checks before employment checks. The global graduate duplicate audit remains unresolved separately; unknown-year graduate sightings stay unlinked. This supersedes earlier global-gate and pilot-only restrictions for current individually identity-matched reviews. Future unattended batches still save reviewed proposals to the research branch, without automatic main deployment. Runtime availability remains dependent on the app, computer and Chrome connection.
