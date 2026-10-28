"""Root additive source review for Angie King; no appointment dates inferred."""
import json,pathlib,copy
R=pathlib.Path(__file__).resolve().parents[2];O=pathlib.Path(__file__).parent
p=R/'data/employment-histories.json';h=json.loads(p.read_text(encoding='utf8'))
r=next(x for x in h['records'] if x['id']=='grad:massachusetts-institute-of-technology:angela-king:2015')
def save(p,x):p.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
save(O/'followup-2026-10-28-0339-before.json',r)
pdf='https://www.sas.com/content/dam/SAS/documents/marketing-whitepapers-ebooks/third-party-whitepapers/en/cx-champions-share-strategies-112896.pdf'
conference='https://events.hubilo.com/retail-and-consumer-goods-conference/register?agendaDate=2022-02-11'
j=next(x for x in r['jobs'] if x['titleAsWritten']=='Analytics Innovation Senior Principal')
assert conference not in j['additionalSourceUrls'];j['additionalSourceUrls'] += [conference,pdf]
j['evidenceNote']+=' Later corroboration: conference speaker listing repeats Analytics Innovation Senior Principal at E2E; MIT SMR Connections report (copyright 2022), printed pages 7 and 20, names Angie King as Principal at End-to-End Analytics (Accenture). These source observations do not establish a new appointment, promotion, employment interval or present-day affiliation.'
r['otherEmploymentMentions'].append(dict(employerAsWritten='End-to-End Analytics (Accenture)',titleAsWritten='Principal — historical report observation',sourceUrl=pdf,checkedAt='2026-10-28',evidenceNote='MIT SMR Connections 2022 report, printed pages 7 and 20, identifies interview participant Angie King as Principal, End-to-End Analytics (Accenture). Name and employer match the established MIT2015 identity and prior MIT Sloan interview. Publication year is not an employment start/end date; shorter title is not treated as a different job.'))
save(p,h)
