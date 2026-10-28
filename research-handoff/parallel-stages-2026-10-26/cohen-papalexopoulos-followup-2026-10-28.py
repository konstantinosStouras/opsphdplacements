"""Add opened source observations; retain unresolved first-job chronology."""
import json,pathlib,copy
R=pathlib.Path(__file__).resolve().parents[2];O=pathlib.Path(__file__).parent
p=R/'data/employment-histories.json';h=json.loads(p.read_text(encoding='utf8'));before=[]
def save(p,x):p.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
for slug in ['peter-l-cohen','theodore-p-papalexopoulos']:
 r=next(x for x in h['records'] if x['id']==f'grad:massachusetts-institute-of-technology:{slug}:2022');before.append(copy.deepcopy(r))
 if slug=='peter-l-cohen':
  u='https://dimacs.rutgers.edu/reu-participant-details/cohen-peter'
  assert not any(x.get('sourceUrl')==u for x in r['otherEmploymentMentions'])
  r['otherEmploymentMentions'].append(dict(employerAsWritten='Rutgers University, DIMACS',titleAsWritten='Undergraduate research participant',sourceUrl=u,additionalSourceUrls=['https://archive.reu.dimacs.rutgers.edu/2015/pcohen/public_html/','https://peterlcohen.github.io/'],checkedAt='2026-10-28',evidenceNote='Official participant directory records Peter Cohen of Bowdoin College, mentor Alex Kontorovich, participant year 2015. Linked archived project describes research on Zaremba’s conjecture and circle packings, matching the number-theory work listed on his MIT professional homepage. Archive header says Class of 2017; retain directory participant year 2015 without inventing exact dates or paid-employment status. This is pre-doctoral research, not a post-PhD job.'))
  r['remainingUnknowns'].append('28 October follow-up: personal homepage remains a candidate-era biography; no identity-matched post-PhD employer found. Bowdoin 1995 school-principal namesake excluded; this person is Bowdoin Mathematics 2017.')
 else:
  u='https://web.mit.edu/nitric/www/lungAllocation.pdf'
  assert not any(x.get('sourceUrl')==u for x in r['otherEmploymentMentions'])
  r['otherEmploymentMentions'].append(dict(employerAsWritten='Massachusetts Institute of Technology',titleAsWritten='Published research affiliation and doctorate biography',sourceUrl=u,checkedAt='2026-10-28',evidenceNote='2023 INFORMS paper, PDF pages 1 and 9, lists MIT ORC affiliation and explicitly states that Theodore Papalexopoulos received his MIT Operations Research PhD. Organ-allocation thesis topic and coauthors match established identity. Publication affiliation does not establish an employment contract, job title or interval; biography does not supply a degree-conferral date or first-job sequence.'))
  r['remainingUnknowns'].append('28 October follow-up: publication-linked ORCID contains three works but no public employment chronology. The June 2022–May 2023 interval remains undocumented; it is not a verified postdoctoral appointment.')
  r['parkedCase']['reason']='Employment interval between the June 2022 doctoral research endpoint and May 2023 Dynamic Ideas start is undocumented. It must not be described as a verified postdoctoral appointment. MIT affiliation/attendance observations do not establish employment.'
save(O/'cohen-papalexopoulos-followup-2026-10-28-before.json',before);save(p,h)
