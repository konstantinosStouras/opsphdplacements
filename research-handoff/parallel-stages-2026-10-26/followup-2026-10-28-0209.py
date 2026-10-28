"""Idempotent, additive reviewed source observation; root integrator only."""
import pathlib,json
R=pathlib.Path(__file__).resolve().parents[2]
p=R/'data/employment-histories.json';d=json.loads(p.read_text(encoding='utf8'))
r=next(r for r in d['records'] if r['id']=='grad:massachusetts-institute-of-technology:ross-michael-anderson:2014')
u='https://business.columbia.edu/sites/default/files-efs/citation_file_upload/opre.2017.1644.pdf'
if not any(s.get('sourceUrl')==u for s in r['otherEmploymentMentions']):
 r['otherEmploymentMentions'].append(dict(employerAsWritten='Google',titleAsWritten='Software Engineer — historical author biography',sourceUrl=u,checkedAt='2026-10-28',evidenceNote='The 2017 Operations Research article Efficient Dynamic Barter Exchange identifies Anderson as a Google software engineer and MIT ORC PhD. The title page dates online publication September 14, 2017. This is a dated affiliation observation, not an appointment start; the article received date in 2014 does not date the employer biography. Coauthors Ashlagi and Gamarnik and the kidney-exchange research match the reviewed identity.'))
 p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print('Historical Google observation integrated; first-job assessment unchanged.')
