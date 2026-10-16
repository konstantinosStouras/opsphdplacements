# Paused handoff — 16 October 2026

The user explicitly paused all work in this thread because credits are low. All three research agents were interrupted. Do not resume research, reviews, merges or deployment until the user requests resumption. No automatic research schedule is configured.

The user's standing requirement remains: update affected Markdown guides as new information becomes available during future authorized work. See AGENTS.md and WORKFLOW.md.

## Published state

Latest website feature release: `c381ac3` (social metadata, preview image and icons), deployed successfully. Citation redesign and contributor guides are also live. The public research ledger still reports **689 verified, 670 unresolved and 790 pending**, across 2,149 imported profiles. The program register contains 13 initial records across 10 institutions. Public graduate census, advisors, comprehensive career histories and publication datasets remain incomplete.

## Saved local research — not yet integrated or published

These ignored files contain newer findings than the public ledger. Counts below are saved-file counts at pause, not published totals. Research caches and source documents remain locally under `research/` and are absent from a fresh clone.

| Shard | Reviewed | Verified | Unresolved | Saved results |
|---|---:|---:|---:|---|
| A | 362 | 229 | 133 | `research/placements-a/results.json` |
| B | 716 | 284 | 432 | `research/placements-b/results.json` |
| C | 583 | 241 | 342 | `research/placements-c/results.json` |

## Resume safely

1. Read AGENTS.md, WORKFLOW.md, TODO.md and RESEARCH-STATUS.md. Inspect Git status and preserve local changes.
2. Confirm there are no overlapping active assignments before restarting agents. Original faculty-array index modulo 3 identifies A/B/C ownership; use stable IDs for merging.
3. Inspect saved results and any partial batches; interruption may leave unsaved work incomplete. Do not assume a completed review from a downloaded document.
4. Review new corrections and source evidence before merging. Recent audits found hidden postdocs in destination lists, including Yue Hu, Mengzhenyu Zhang and Jerry Anunrojwong. Even an advisor's “position upon graduation” list can omit an earlier postdoc (Shining Wu); a full dated CV can supersede it.
5. Integrate only reviewed findings, run the documented checks, regenerate the public status summary and update affected guides. Publish only when resuming within the user's authorization.
6. Continue the historical program register, program-year graduate census, then sourced careers/advisors/publications with fact-level check dates. Maintain honest coverage and unresolved labels.

This handoff was saved during shutdown and is now being published to GitHub at the user's request so another model can access it. This documentation-only publication does not authorize resuming research or development. The ignored local research files listed above are not included. No new research data were published as part of pausing.
