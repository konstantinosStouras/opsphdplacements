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
