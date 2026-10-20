# LinkedIn employment-history capture — 20 October 2026

The owner requests the entire job history mentioned on every accessed profile. Record every visible employment entry, not only first/current employment. This is a self-reported profile history observed on a date, not proof of a complete real-world career.

Save one JSON file per person under `histories/<stable-id-safe-filename>.json`:

- `personId` (existing stable ID), `recordIds` (other existing records when relevant), `name`, `profileUrl`, `checkedAt`, `reviewer`, `identityBasis`.
- `experienceAccess`: `read-all-visible`, `partial`, `not-visible`, or `blocked`.
- `profileHistoryComplete`: true only after reading the full accessible Experience section and expanding all accessible employer role groups and Show all controls. False for an identity-only visit, missing Experience section or access failure.
- `jobs`: one object for each distinct role, with `employerAsWritten`, `titleAsWritten`, `employmentTypeAsWritten`, `locationAsWritten`, `start`, `end`, `isCurrent`, `sourceUrl`, `checkedAt`, `evidenceNote`, `sourceSection`, and `employerGroup` (when LinkedIn groups promotions under one employer).
- Each `start`/`end`: `{ "asWritten": string|null, "year": number|null, "month": number|null, "precision": "month"|"year"|"unknown" }`. Never fill missing components. Preserve seasonal/range wording in `asWritten`; do not invent a normalized date. `isCurrent` is true only for explicit Present/current wording, false for explicit ended roles, otherwise null.
- `otherEmploymentMentions`: short supported paraphrases from About or other profile sections when no separate dated entry exists. Retain unknown dates and avoid duplicating the same role without noting the overlap.
- `remainingUnknowns`, `accessLimitations`, `integrationStatus` (proposal-only until reviewed), and `firstJobAssessment` (separate from the job list; null when not established).

Include pre-PhD jobs, postdocs, internships, promotions, part-time roles, simultaneous appointments and later sector transitions. Preserve overlapping dates. An employer-wide date span does not establish each title's dates. Record the displayed order if useful, but never infer chronological priority from it. Missing Experience means unavailable, not an empty career. Education ranges remain separate from degree conferral dates.

Capture concise professional facts and evidence paraphrases; do not copy full profile descriptions or personal contact details. Stop and hand challenges to the owner. The daily target cannot justify skipping roles or calling a partial capture complete. Both pilot profiles need full-history follow-up. This contract is a proposal storage format; no public whole-history importer has been implemented.
