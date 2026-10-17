export const meta = {
  name: 'apply-integrator-fixes',
  description: 'Apply confirmed integrator-check fixes to published ledger rows as full replacement rows, then check every fix was applied exactly',
  phases: [
    { title: 'Apply', detail: 'build replacement rows from the current ledger entries' },
    { title: 'Check', detail: 'an independent reader compares each row with its fix' },
  ],
}
const ROOT = '/home/user/opsphdplacements'
const FIXES = args.fixes
const OUT = args.out
const DATE = args.date
phase('Apply')
const applied = await agent(`You are applying confirmed corrections to published rows of the Operations PhD Placements dataset (checkout ${ROOT}). ${FIXES} is a JSON list of judge decisions; use ONLY those with "flagStands": true. Each has facultyId, name and "fix" (the exact change: field old -> new, text to replace in evidenceNote or reason, sentences to append, sources to add, or a downgrade to unresolved).

For each, find the person's CURRENT record in ${ROOT}/data/research-status.json (records list, match facultyId), copy it completely (every field, including sources, phdYearVerified, phdInstitutionVerified, phdInstitutionVerifiedAsWritten, phdYearResolution, phdInstitutionResolution), apply the fix exactly as written, set checkedAt to "${DATE}", and append to evidenceNote (verified rows) or reason (downgraded rows) the sentence "Integrator check (${DATE}): <one-line summary of the change>." When a fix says to replace text that is not found word for word in the current record, apply the closest faithful edit and say so in your return value. "field -> null" means remove the field. For a downgrade, set status "unresolved", remove employer, position, placementYear, category, evidenceUrl, evidenceNote, phdYearVerified, phdInstitutionVerified, phdInstitutionVerifiedAsWritten, phdYearResolution and phdInstitutionResolution, keep sources, and write the reason the fix gives. When a fix keeps every field and only rewrites a resolution or adds a source or sentence, still write the row. Write all rows as a JSON array to ${OUT}. Never change facultyId or name, never add people. Validate with node: every facultyId exists in the ledger with the same name; status verified or unresolved; reason, checkedAt and nonempty http(s) sources with titles on every row; verified rows have employer, an allowed category (tenure-track, other-academic, postdoc, industry, government, nonprofit, unknown), evidenceNote and an evidenceUrl present in sources; placementYear integer or null; if placementYear equals the doctorate year minus 1 (phdYearVerified, else the people file's phdYear in data/faculty.json or data/faculty-roster-people.json) the evidenceNote contains the word "overlap". Do not edit any other file. Return a short list: facultyId, name, what was changed, and any fix you could not apply word for word.`, { label: 'apply', phase: 'Apply' })
phase('Check')
const check = await agent(`You are an independent checker for the Operations PhD Placements dataset (checkout ${ROOT}). ${OUT} holds replacement rows built from the current ledger (${ROOT}/data/research-status.json) by applying the confirmed fixes in ${FIXES} (entries with "flagStands": true). For EVERY fix, compare the replacement row with the current ledger row and the fix text: is every requested change made, is nothing else changed apart from checkedAt and the appended "Integrator check" sentence, and does the row still read consistently (fields agree with the note)? Do not edit any file. Return one line per fix: facultyId, name, OK or the exact discrepancy.`, { label: 'check', phase: 'Check' })
return { applied, check }
