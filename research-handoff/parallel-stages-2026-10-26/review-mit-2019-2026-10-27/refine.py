"""Final prepublication adjudication; preserve original proposals as audit history."""
import json,pathlib
O=pathlib.Path(__file__).parent
def read(p):return json.loads(pathlib.Path(p).read_text(encoding='utf8'))
def write(p,v,n=2):pathlib.Path(p).write_text(json.dumps(v,ensure_ascii=False,indent=n)+'\n',encoding='utf8')
h=read('data/employment-histories.json');g=read('data/graduate-lists.json');dec=read(O/'decisions.json')
replacements={
'christopher-george-mccord':['Princeton establishes doctorate-before-trading sequence; exact completion and formal award dates remain unknown.','Employment May 2024–January 2025 and June–November 2025 unknown.','Real-world career remains partial.'],
'konstantina-mellou':['Official June 7, 2019 graduation announcement establishes completion before September postdoc; individual formal award month/day remains unknown.','Real-world career remains partial.'],
'michael-francis-beeler':['Advisor reports graduation August 2019 and Athanor starts August 2019; within-month order unknown. Formal September 2019 award retained separately.','Full real-world career remains partial.'],
'joel-tay':['Profile study range ends 2017, adviser thesis lists 2018 and ORC thesis lists February 2019; completion before October 2018 employment unestablished.','Headline Deputy Head differs from aggregate Research Scientist title; promotion dates unknown.','Complete real-world career remains unknown.'],
'yee-sian-ng':['Personal biography confirms 2019 degree; candidate role ending May does not establish completion before August Google start. Focused primary follow-up did not resolve this.','Career remains partial.']}
for slug,notes in replacements.items():
 r=next(x for x in h['records'] if x['id']=='grad:massachusetts-institute-of-technology:'+slug+':2019');r['remainingUnknowns']=notes
 if r.get('parkedCase'):r['parkedCase']['reason']=notes[0]
for d in dec:d['remainingUnknowns']=next(r for r in h['records'] if r['id']==d['id'])['remainingUnknowns']
write('data/employment-histories.json',h);write(O/'decisions.json',dec)
