export const meta = {
  name: 'unresolved-triage',
  description: 'Sort every unresolved first-job review by the kind of gap and by whether a retry with newer access routes is likely to settle it',
  phases: [{ title: 'Triage', detail: 'one reader per batch of about 145 unresolved reviews (no browsing)' }],
}
const ROOT = '/home/user/opsphdplacements'
const SCHEMA = {
  type: 'object',
  properties: {
    batch: { type: 'integer' }, rowsRead: { type: 'integer' },
    rows: { type: 'array', items: { type: 'object', properties: {
      facultyId: { type: 'string' },
      gap: { type: 'string', enum: ['blocked-page', 'no-dated-chronology', 'degree-date-missing', 'pre-degree-job-continued', 'internal-promotion', 'gap-between-degree-and-job', 'identity-unclear', 'no-doctorate-or-out-of-scope', 'conflicting-sources', 'other'] },
      retry: { type: 'string', enum: ['high', 'medium', 'low', 'none'] },
      nextStep: { type: 'string' },
    }, required: ['facultyId', 'gap', 'retry', 'nextStep'] } },
    notes: { type: 'string' },
  },
  required: ['batch', 'rowsRead', 'rows'],
}
const prompt = n => `You are triaging unresolved first-job reviews in the Operations PhD Placements dataset (checkout ${ROOT}). ${ROOT}/research/second-pass/triage-${n}.json holds about 145 reviews whose first post-PhD job could not be established (fields: facultyId, name, source, currentInstitution, phdInstitution, phdYear, checkedAt, reason, sourcesTried). Read EVERY row's reason and classify it. Do not browse the web and do not edit any file.

gap (the main thing missing): blocked-page (the decisive page refused the reader: 403, 503, Cloudflare, bot check, certificate error, script-drawn page, timeout); no-dated-chronology (pages opened but none dates or orders the jobs); degree-date-missing (the job is known but the degree year or month is not, so the order cannot be told); pre-degree-job-continued (a job begun before the degree simply continued); internal-promotion (only promotions at the pre-degree employer are documented); gap-between-degree-and-job (a dated job exists but an unexplained gap of a year or more before it may hide another job); identity-unclear; no-doctorate-or-out-of-scope (no doctorate, a degree outside the population, or a pending degree); conflicting-sources; other.

retry (how likely a second attempt is to settle it with routes that now work in this environment: many sites that refused the fetch tool serve the same page to plain curl with a browser user-agent, through the reader proxy https://r.jina.ai/<URL>, or in a headless browser; HKUST pages answer over plain http; ORCID has a public API; university repositories, Mathematics Genealogy and advisors' CVs listing their students often date degrees and first posts; OpenAlex is often rate-limited and web.archive.org is unreachable): high when the reason names a specific page that refused and that page very likely holds a CV or dated chronology, or names a concrete lead not yet followed; medium when a different kind of source (advisor CV, dissertation repository, ORCID, appointment announcement) could plausibly settle it; low when many sources were already tried and nothing points to a dated record; none for pre-degree-job-continued and internal-promotion cases with no later new employer to research, and for no-doctorate cases.

nextStep: one short sentence naming the concrete thing to try (for example "read the CV link on the Ross profile through r.jina.ai", "date the degree from the ProQuest or university repository record", "check the advisor's CV student list"). Return every row.`
const results = await parallel(args.batches.map(n => () => agent(prompt(n), { label: `triage:${n}`, phase: 'Triage', schema: SCHEMA })))
return results.filter(Boolean)