# First-job pass for the faculty-page people: unmerged work (snapshot of 17 October 2026, 07:30 UTC)

This folder makes the unfinished first-job pass for the 1,007 people in `data/faculty-roster-people.json` portable. **Nothing here is a finding.** Only verified proposals merged into `data/placements.json` and `data/research-status.json` are published results; at this snapshot chunks 1, 13, 21, 22 and 23 were merged (200 people: 45 verified first jobs, 153 unresolved, 2 without a completed doctorate).

## What is here

- `drafts/draft-N.json`: researcher drafts that have **not** been through the adversarial verification yet (results format of `scripts/merge-placement-research.mjs`). Complete (40 people): 2, 3, 4, 5, 10, 11, 12, 14, 19, 20, 24, 25. Partial: 6 (23 of 40), 9 (18 of 40), 17 (20 of 40). Not started at the snapshot: 7, 8, 15, 16, 18, 26. Later drafts in the live working folder may be further along.
- `drafts/verify-state-N.json`: rows a verifier had already checked (chunks 5 and 14), to be reused by the next verifier.
- `drafts/fj-summary-N.json`: the researcher's own summary of each complete draft, including the items it asked a verifier to double check.
- `tools/roster-first-jobs-chains.js`: the workflow script (research brief, adversarial verification brief, chain runner). Arguments: `chains` (lists of chunk numbers run one after another), `verifyOnly` (chunks whose draft is complete), `continueChunks` (partial drafts to continue), `date`.
- `tools/merge-first-job-chunks.sh` and `tools/scan-first-job-proposal.py`: the integrator's merge-and-publish routine and the structural scan run before every merge.

## Resume

1. Copy `drafts/*` into `research/placements-roster/` (ignored), unless the live folder already holds newer files. Regenerate the chunk files only if they are missing: `node scripts/write-placement-chunks.mjs --source faculty-page` (pending people only; it renumbers, so do it before any research starts).
2. Run the workflow script with `verifyOnly` for the complete drafts, `continueChunks` for the partial ones, and plain chains for the rest; edit the scratch and repository paths at the top of the script if the checkout lives elsewhere.
3. When `proposal-N.json` appears, scan it, apply the integrator rules in RESEARCH-DESIGN.md (study period is not a start year; a current affiliation is not a first job; overlaps recorded), then merge with the routine and publish. Update this README, the handoff and TODO.md as chunks are merged.
