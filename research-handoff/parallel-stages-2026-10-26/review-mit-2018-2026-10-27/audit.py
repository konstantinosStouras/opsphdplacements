"""Read-only MIT 2018 release verifier. Prints JSON; never writes public or audit files.

Run from repository root after integration and record-stamp regeneration:
  python research-handoff/parallel-stages-2026-10-26/review-mit-2018-2026-10-27/audit.py
The frozen pre-integration backup is mandatory; missing inputs fail closed.
"""
import collections
import json
import pathlib

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[2]
BACKUP = ROOT / 'research/mit-2018-before'


def read(path):
    return json.loads(path.read_text(encoding='utf-8-sig'))


def require(condition, message):
    if not condition:
        raise AssertionError(message)


def index(records, label):
    counts = collections.Counter(r['id'] for r in records)
    require(all(n == 1 for n in counts.values()), label + ': duplicate stable IDs')
    return {r['id']: r for r in records}


def main():
    require(BACKUP.is_dir(), 'Missing frozen pre-integration backup: ' + str(BACKUP))
    applied = read(HERE / 'applied.json')
    grads = read(ROOT / 'data/graduate-lists.json')
    histories = read(ROOT / 'data/employment-histories.json')
    gi = index(grads['records'], 'graduates')
    hi = index(histories['records'], 'histories')
    added = applied['graduateRecordsAdded']
    history_ids = applied['newPartialHistoryIds']
    verified = set(applied['verifiedFirstJobIds'])
    held = set(applied['remainingFirstJobIds'])
    require(len(added) == len(set(added)) == 18, 'Expected exactly 18 new MIT OR graduate IDs')
    require(len(history_ids) == len(set(history_ids)), 'Duplicate applied history IDs')
    require(set(history_ids) <= set(added), 'New history not linked to new cohort record')
    require(not verified & held and verified | held == set(history_ids), 'First-job/held partition mismatch')
    before_g = read(BACKUP / 'graduate-lists.json')
    before_h = read(BACKUP / 'employment-histories.json')
    result = {}
    for name, before, after, expected in [
        ('graduate-lists.json', before_g, grads, set(added)),
        ('employment-histories.json', before_h, histories, set(history_ids)),
    ]:
        old = index(before['records'], name + ' backup')
        now = index(after['records'], name)
        require(all(now.get(pid) == record for pid, record in old.items()), name + ': older record changed/deleted')
        require(set(now) - set(old) == expected, name + ': unexpected additions')
        result[name] = {'olderRecordsUnchanged': len(old), 'added': len(expected)}
    # Only the two reviewed data tables and derived record stamps may change.
    unrelated = []
    for path in sorted(BACKUP.glob('*.json')):
        if path.name not in {'graduate-lists.json', 'employment-histories.json', 'record-dates.json'}:
            require(read(ROOT / 'data' / path.name) == read(path), 'Unrelated public dataset changed: ' + path.name)
            unrelated.append(path.name)
    cohort = read(HERE / 'cohort-observations.json')['records']
    require({gi[pid]['name'] for pid in added} == {r['name'] for r in cohort}, 'Names differ from frozen 18-person cohort')
    # Name duplicates within the same new programme cohort are errors; cross-source
    # observations in older datasets are intentionally preserved, not auto-merged.
    require(len({gi[pid]['name'].casefold().strip() for pid in added}) == 18, 'Duplicate new cohort names')
    proposal_ids = {read(p)['personId'] for p in HERE.glob('*.history-proposal.json')}
    require(proposal_ids == set(history_ids), 'Saved history proposals not all adjudicated/integrated')
    for pid in added:
        gr = gi[pid]
        require(gr['institution'] == 'Massachusetts Institute of Technology' and gr['listedYear'] == 2018, 'Wrong cohort: ' + pid)
        require(gr['degreeReview'].get('checkedAt') and gr['degreeReview'].get('sourceUrl'), 'Degree provenance missing: ' + pid)
        require(gr['degreeReview'].get('awardDay') is None, 'Unsupported exact award day: ' + pid)
        require(gr.get('sightings'), 'Missing source sightings: ' + pid)
    for pid in history_ids:
        gr, hr = gi[pid], hi[pid]
        require(hr.get('careerComplete') is False and hr.get('reviewStatus') == 'partial', 'History completeness overclaim: ' + pid)
        require(hr.get('degreeReview') == gr.get('degreeReview'), 'Degree history mirror mismatch: ' + pid)
        require(hr.get('firstJobAssessment') == gr.get('firstJobReview'), 'First-job mirror mismatch: ' + pid)
        if pid in verified:
            first = gr['firstJobReview']
            require(first['status'] == 'verified' and first.get('sources') and first.get('reason'), 'Incomplete verified assessment: ' + pid)
            require(not gr.get('facultyId'), 'Faculty first job counted as graduate first job: ' + pid)
        else:
            require(not gr.get('firstJobReview') and hr.get('parkedCase'), 'Held outcome not explicit: ' + pid)
        for job in hr['jobs']:
            require(job.get('sourceUrl') and job.get('checkedAt'), 'Job provenance missing: ' + pid)
    roles = sum(len(hi[pid]['jobs']) for pid in history_ids)
    mentions = sum(len(hi[pid].get('otherEmploymentMentions', [])) for pid in history_ids)
    require(roles == applied['newStructuredRoles'], 'Applied role count mismatch')
    require(mentions == applied['newSupportingMentions'], 'Applied supporting-mention count mismatch')
    meta, rows = grads['metadata'], grads['records']
    require(meta['records'] == len(rows), 'Metadata graduate count mismatch')
    require(meta['sightings'] == sum(len(r['sightings']) for r in rows), 'Metadata sightings mismatch')
    require(meta['linkedToPeople'] == sum(bool(r.get('facultyId')) for r in rows), 'Metadata faculty-link count mismatch')
    require(meta['verifiedGraduateFirstJobs'] == sum(bool(r.get('firstJobReview')) and not r.get('facultyId') for r in rows), 'Metadata graduate outcomes mismatch')
    require(meta['byField'] == dict(collections.Counter(r['field'] for r in rows)), 'Metadata field totals mismatch')
    archive = collections.Counter(s.get('archive', 'live') for r in rows for s in r['sightings'])
    require(all(meta['byArchive'].get(k) == n for k, n in archive.items()), 'Metadata archive totals mismatch')
    coverage = [r for r in meta['coverage'] if r['institution'] == 'Massachusetts Institute of Technology' and r['listedYear'] == 2018]
    require(len(coverage) == 1, 'Missing/duplicate MIT 2018 coverage')
    current_cohort = [r for r in rows if r['institution'] == 'Massachusetts Institute of Technology' and r['listedYear'] == 2018]
    require(coverage[0]['names'] == len(current_cohort), 'Coverage includes incorrect source-bounded count')
    require(coverage[0]['linked'] == sum(bool(r.get('facultyId')) for r in current_cohort), 'Coverage link count mismatch')
    require(coverage[0]['rosterStatus'] == 'partial', 'Cohort census overclaim')
    result.update(status='passed', unrelatedPublicDatasetsUnchanged=unrelated,
                  newGraduateRecords=18, newPartialHistories=len(history_ids),
                  verifiedFirstJobs=len(verified), heldFirstJobs=len(held),
                  structuredRoles=roles, supportingMentions=mentions,
                  exactFirstJobMirrors=True, metadataConsistent=True)
    print(json.dumps(result, indent=2))


if __name__ == '__main__':
    main()
