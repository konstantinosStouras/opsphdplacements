import json,time,urllib.request,re,html,concurrent.futures,threading
from pathlib import Path
from html.parser import HTMLParser
root=Path(__file__).resolve().parents[2]
base=root/'research/placements-b/discovery';base.mkdir(exist_ok=True)
records=json.loads((root/'data/faculty.json').read_text(encoding='utf-8-sig'))['records'][1::3]
class Links(HTMLParser):
 def __init__(self):super().__init__();self.links=[];self.href=None;self.text=''
 def handle_starttag(self,t,a):
  if t=='a':self.href=dict(a).get('href');self.text=''
 def handle_data(self,s):
  if self.href:self.text+=s
 def handle_endtag(self,t):
  if t=='a' and self.href:
   self.links.append((self.text.strip(),self.href));self.href=None

def fetch(p):
 cache=base/(p['id']+'.json')
 if cache.exists():return json.loads(cache.read_text(encoding='utf-8'))
 row={'facultyId':p['id'],'name':p['name'],'sourceProfileUrl':p['sourceProfileUrl'],'checkedAt':'2026-10-16','status':'discovery-only','links':[]}
 try:
  req=urllib.request.Request(p['sourceProfileUrl'],headers={'User-Agent':'AcademicPlacementResearch/1.0'})
  with urllib.request.urlopen(req,timeout=20) as resp:s=resp.read().decode('utf-8',errors='replace')
  parser=Links();parser.feed(s)
  row['links']=[{'label':n,'url':u} for n,u in parser.links if n in ['Profile','Website','CV'] and u.startswith('http')]
 except Exception as e:row['error']=str(e)
 cache.write_text(json.dumps(row,ensure_ascii=False),encoding='utf-8');time.sleep(.6)
 return row
rows=[]
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
 for row in pool.map(fetch,records):
  rows.append(row)
  if len(rows)%30==0:print('Discovered',len(rows),'of',len(records),flush=True)
(base.parent/'discovery-index.json').write_text(json.dumps(rows,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
print('Complete',len(rows),'with links',sum(bool(r['links']) for r in rows),flush=True)

