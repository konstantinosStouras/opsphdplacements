# Multi-source career histories — 20 October 2026

Owner: current Codex chat, sole integrator for the presentation update. No parallel research assignments. This batch implements the interface and one CV sample, not a complete population history pass.

Public CV/official-page records live in data/employment-histories.json. Knemeyer's dated observation file here is integrated in that dataset. The category audit is integrated into placements and the research ledger; original source review dates remain unchanged. Existing LinkedIn observations stay in data/linkedin-histories.json and follow their own capture contract. Do not duplicate a person across stores: consolidate reviewed evidence in one record before adding an overlapping stable ID.

Each history has id, name, recordIds (only reviewed identities), identityBasis, reviewer, checkedAt, coverageNote, jobs, otherEmploymentMentions, remainingUnknowns and accessLimitations. Each job has employerAsWritten, titleAsWritten, start/end objects (asWritten, year, month, precision), isCurrent, sourceType, sourceUrl, checkedAt and evidenceNote. Follow the LinkedIn contract's date precision and exhaustive section-capture rules. Capture all accessible employment entries, not just first/current jobs. An old source's Present stays tied to that source's age. Never publish source documents or contact details.

Optional postPhdPeriods require verifiedPhdYear with degreeSourceUrl, and chronological non-overlapping primary-sector intervals: startYear, endYear (or currentThroughCheck true), sector, checkedAt, sourceUrls and evidenceNote. Supply summaryLimitations for missing coverage. Approximate year differences are a presentation convention, not fabricated exact dates. Coarse same-year transitions can touch; simultaneous employment remains in jobs and must be adjudicated before primary-sector intervals are used. Unknown chronology gets no manufactured interval.

Validation: npm run check; python scripts/test-research-schema.py; python scripts/build-research-database.py; node scripts/build.mjs. Record dates are assigned by the ledger. The SQLite snapshot still imports first-job events only; the history JSON is the public source of truth for these new observations.

Next: review mixed teaching/research classification cases, then collect additional disambiguated full histories and supported sector periods. Knemeyer needs a newer dated chronology before a continuous duration through the current check can be claimed. The existing global LinkedIn identity gate remains incomplete. No new automation is configured by this change.

## Current coordinated continuation — 20 October 2026

The owner requested the columns be finished first, then all main people researched in alphabetical batches. Generate research-handoff/careers/alphabetical-queue.json with node scripts/build-career-queue.mjs: 3,161 people, 25 per batch, displayed-name English collation and stable-ID tie-break. Save explicit outcomes under research-handoff/careers/reviews/ (pending, partial, blocked, completed are distinct); fully captured older sources can remain partial. Next unattempted person is A. Mehrotra, followed by the existing partial Knemeyer review and Aadhaar Chaturvedi.

The coordinating LinkedIn chat confirmed the owner's authorization for this five-history release (four LinkedIn histories plus one CV history) and changed the existing four-times-daily automation to alphabetical histories, with per-person identity checks before employment checks. The global graduate duplicate audit remains unresolved separately; unknown-year graduate sightings stay unlinked. This supersedes earlier global-gate and pilot-only restrictions for current individually identity-matched reviews. Future unattended batches still save reviewed proposals to the research branch, without automatic main deployment. Runtime availability remains dependent on the app, computer and Chrome connection.

## Alphabetical batch 1 started — 20 October 2026

The first three queue positions now have partial career reviews: A. Mehrotra (identity confirmed as Anuj; all 12 LinkedIn Experience roles captured), A. Michael Knemeyer (nine CV roles), and Aadhaar Chaturvedi (eight main CV jobs, six concurrent university administrative roles and five industry/public-sector projects). These are integrated source observations, not completed real-world careers. Anuj has a supported approximate academia interval from 1993 through the profile check; the 1992 degree/job order and undated IBM visit still block an unrestricted first-job conclusion. Aadhaar retains overlapping Present appointments and an unresolved degree-conferral boundary. No first-placement conclusions or population counts changed.

Next unattempted: Aaron Anvuur (omlist-8190a06eee7eb70d), then Aaron Tenenbein. The rest of batch 1 is pending. Follow up the three partial cases separately without treating them as complete. Seven public history records now exist across the two history stores; five are LinkedIn observations and two are CV/official-page observations.

The Anuj Mehrotra OM List row also links to the same opened official Scheller profile, named chair and doctorate. Both stable IDs now share one reviewed history; imported rows/counts remain intact. Four queue records (three distinct people) are partial, and the later Anuj entry must not be researched as a different person.

## Daily profile target — effective 20 October 2026

The owner requests 100 unique profiles searched/researched per London calendar day. The existing tracker now runs at **11:17, 14:17, 17:17 and 20:17 Europe/London**, up to 25 people per run, replacing the earlier times. All four slots are upcoming when activated today. Read `research-handoff/careers/daily/YYYY-MM-DD.json` with the alphabetical queue and outcomes; deduplicate aliases and rechecks, record actual source URLs/check times and distinguish full source capture, partial, blocked and unmatched. Seeded today’s tracker with seven already reviewed profiles, leaving 93 to target. Do not infer career completeness or fabricate throughput. The final daily run reports actual totals and any shortfall. Runtime/Chrome availability and challenge handoffs still apply; automatic future publication remains research-branch-only.

## Next 25 source checks — 20 October 2026

The batch from Aaron Anvuur through Adem Orsdemir adds 24 partial career observations with 154 distinct role entries. Abhijeet Ghadge has all 13 accessible LinkedIn Experience roles captured; the other 23 observations use official profiles, personal academic pages or institutional CVs, with their limitations explicit. Adams B. Steven is blocked by a missing official profile; no employment facts were invented. The 25 outcomes and source URLs are in `batches/2026-10-20-next25.json`, with portable observations under `histories/` and the LinkedIn proposal directory. These are 25 attempted source checks, not 25 completed full careers. Daily attempted unique people total 32, leaving 68 to the search target. Next pending person is derived from the queue; partial cases retain follow-up work.

The owner explicitly requested database and website publication of this manual batch. Future unattended publication remains restricted to the research branch. The transcription script is a historical construction record and intentionally refuses to add an already-present history; do not rerun it as a refresh.

The 11:17 London scheduled run subsequently stopped after one partial Aditya Jain check when the linked CV destination was blocked by the browser URL policy. See `batches/2026-10-20-1117-checkpoint.md`. Jain's official identity/current-role observation is an unpublished proposal; the remaining 24 selected people were not attempted. Daily unique attempts are 33, not completed histories. Next unattempted is Aditya Vedantam; no automatic main publication occurred.


## Individual source blockers — 20 October 2026

The owner clarified that an unavailable individual CV/profile must be recorded as a per-person limitation while the remaining alphabetical batch continues. Do not work around a blocked destination. Live CAPTCHA/human-verification/login challenges, platform-wide restrictions and disconnected Chrome still require a user handoff; never claim to be human or bypass checks. The scheduled tracker prompt now follows this distinction.

The resumed 11:17 run saved 24 additional partial histories (131 roles, 65 other mentions), completing attempts for its 25 allocated people including Jain. See `batches/2026-10-20-1117-continuation.md`. Daily attempts are 57; public histories remain unchanged by this continuation. The earlier stop paragraph is a historical checkpoint, superseded by the owner’s explicit resume instruction. Positions 54–78 belong to the coordinating presentation chat.

## Coordinated positions 54–78 — 20 October 2026

Alan Scheller-Wolf through Alexander Shapiro: 25 partial histories and 143 role entries integrated into the public career store, with seven bounded academic summaries and a visible Partial history label. See batches/2026-10-20-54-78-report.md and its exact-ID assignment. The other workflow's positions 29–53 remain research-only proposals; they are not implicitly published by this integration. Daily unique attempts are 82, with 18 remaining to target; all 25 histories in this batch retain gaps. Next unassigned order is 79, subject to current assignment checks.

## Positions 30–53 reviewed for publication — 20 October 2026

The owner subsequently explicitly authorized review and publication of the24 saved continuation histories. The reviewed output has126 role entries and70 other mentions after moving five ambiguous/overlapping entries out of job counts, without dropping their evidence. All24 remain partial. See `batches/2026-10-20-30-53-publication.md` and `batches/2026-10-20-30-53-reviewed.json`. This supersedes research-only statements for these24 records only; Jain remains unpublished and future unattended publication is not authorized. No new daily unique attempts are added by publication/review.

## Positions 79–103 — 20 October 2026

The owner authorized the next unassigned batch beginning Alexander Stolyar. Coordination confirmed these 25 positions free through Allyson Joy Heumann. The batch adds 124 role observations and 27 mentions, all 25 histories partial, with four bounded summaries. See `batches/2026-10-20-79-103-report.md` for sources, limitations and publication checks. Public stores now contain 105 histories; daily unique source-check attempts total 107, not complete careers. No new LinkedIn profile was accessed. Next unassigned is 104, Alok Baveja, after checking live assignments. Earlier partial cases and the unpublished Jain proposal still require follow-up.

Publication of positions79–103 was explicitly requested on21 October2026; their evidence-check dates remain20 October2026. All25 remain partial.
