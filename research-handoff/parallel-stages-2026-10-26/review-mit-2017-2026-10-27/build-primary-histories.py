"""Build four review-only primary histories. Never reads/writes public datasets."""
import json
from pathlib import Path

OUT = Path(__file__).resolve().parent
CHECKED = '2026-10-27'

def read(name):
    return json.loads((OUT / name).read_text(encoding='utf-8'))

def date(value):
    if not value or value.lower() == 'present':
        return dict(asWritten=value, year=None, month=None, precision='unknown')
    parts = value.split('-')
    return dict(asWritten=value, year=int(parts[0]), month=int(parts[1]) if len(parts) > 1 else None,
                precision='month' if len(parts) > 1 else 'year')

def job(role, url, note, section, source_date=None):
    result = dict(employerAsWritten=role['employer'], titleAsWritten=role['title'],
        employmentTypeAsWritten=None, locationAsWritten=None,
        start=date(role.get('start')), end=date(role.get('end')), isCurrent=False,
        sourceUrl=url, sourceType='primary-cv-or-official-biography', checkedAt=CHECKED,
        sourceSection=section, evidenceNote=note)
    if source_date:
        result['sourceDate'] = source_date
    if role.get('end', '') == 'present' or role.get('currentAsObserved'):
        result['evidenceNote'] += ' Present/current is tied to this source observation; no continuing employment through the check date is inferred.'
    return result

def mention(text, url, section):
    return dict(text=text, sourceUrl=url, checkedAt=CHECKED, sourceSection=section,
                evidenceNote='Supporting professional mention; not an independently dated employment appointment.')

def record(slug, name, url, identity, jobs, mentions, unknowns, person_id=None):
    return dict(personId=person_id or 'grad:massachusetts-institute-of-technology:' + slug + ':2017',
        name=name, recordIds=[], careerOwner='stage-2' if person_id else 'stage-4',
        reviewer='Codex primary-source contributor; pending integrator review', checkedAt=CHECKED,
        profileUrl=url, identityBasis=identity, experienceAccess='partial',
        profileHistoryComplete=False, careerComplete=False,
        coverageNote='Primary CV/biography observations only. All supplied professional roles retained; career remains partial. Historical present does not establish current employment.',
        jobs=jobs, otherEmploymentMentions=mentions, remainingUnknowns=unknowns,
        accessLimitations=[], firstJobAssessment=None, integrationStatus='proposal-only')

def build():
    primary = {p['name']: p for p in read('primary-c.json')['people']}
    results = {}
    p = primary['Christopher E. Marks']
    url = p['sourceUrl']
    results['christopher-e-marks'] = record('christopher-e-marks', p['name'], url,
        'MIT official testimonial connects MIT OR SM2009/PhD2017, advisers and Army career; excludes Wright State2011 namesake.',
        [job(r, url, r['evidence'], 'Christopher Marks testimonial') for r in p['roles']],
        [mention('Assigned US Southern Command, Doral, Florida, leading a small analyst team at testimonial time; no separate assignment start date.', url, 'Christopher Marks testimonial')],
        [p['firstJobAssessment'], p['limitations']])

    p = primary['Charles Mark Thraves Cortés-Monroy']
    url = p['sources'][1]['url']
    jobs = [job(r, r.get('sourceUrl', p['roleSourceDefault']),
        r.get('kind', 'Role and original date precision retained from CV.') + ' No missing end dates supplied.',
        'CV biography' if i == 0 else 'Contemporary CV professional experience / education')
        for i, r in enumerate(p['roles'])]
    results['charles-mark-thraves-cortes-monroy'] = record('charles-mark-thraves-cortes-monroy', p['name'], url,
        'Personal and UChile CVs connect Charles Thraves Cortés-Monroy to MIT OR PhD2017 and UChile Industrial Engineering.', jobs,
        [mention(p['otherMentions'], url, 'Research projects, teaching and service')],
        [p['firstJobAssessment'], p['degree']['limitation']])

    p = next(p for p in read('primary-b.json')['people'] if p['name'] == 'Swati Gupta')
    source = p['sources'][0]
    url = source['url']
    results['swati-gupta'] = record('swati-gupta', p['name'], url,
        'Existing OM List identity matched MIT OR doctorate2017, Goemans/Jaillet and CV academic chronology.',
        [job(r, url, 'Appointment explicitly listed in CV. Overlapping courtesy, endowed and visiting roles retained.',
             'CV appointments', source['sourceDate']) for r in source['roles']],
        [mention(p['sources'][1]['evidence'], p['sources'][1]['url'], 'Contemporaneous 2018 seminar biography')],
        p['limitations'] + [p['firstJobAssessment']], p['existingFacultyId'])

    p = read('boundary-a.json')['wangChiCheung']
    url = p['sourceUrl']
    rows = []
    for r in p['employment']:
        original = dict(r)
        original['employer'] = original['employer'].replace('Institute of High Performance Computing', 'Institute of Higher Performance Computing')
        rows.append(job(original, url,
            'CV appointment and month precision retained. Source spells Institute of Higher Performance Computing; canonical institution is Institute of High Performance Computing.',
            'CV page1 Employment'))
    results['wang-chi-cheung'] = record('wang-chi-cheung', 'Wang Chi Cheung', url,
        'Personal homepage CV lists MIT Operations Research PhD February2017 and matching NUS/A*STAR chronology; excludes unrelated Cheung faculty.', rows,
        [mention(p['conflict']['evidence'], p['conflict']['sourceUrl'], p['conflict']['locator'])],
        [p['recommendation'], p['otherSections'], 'CV present appointment end remains unknown; no continuity calculation.'])
    return results

if __name__ == '__main__':
    results = build()
    for slug, content in results.items():
        (OUT / (slug + '.history-proposal.json')).write_text(json.dumps(content, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({'proposals': len(results), 'roles': sum(len(x['jobs']) for x in results.values()),
                      'supportingMentions': sum(len(x['otherEmploymentMentions']) for x in results.values()),
                      'perPerson': {k: len(v['jobs']) for k, v in results.items()}}))
