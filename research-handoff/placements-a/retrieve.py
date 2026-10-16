import json,time,urllib.request,re,html,concurrent.futures,io
from pathlib import Path
from bs4 import BeautifulSoup
from pypdf import PdfReader
base=Path(__file__).resolve().parent
out=base/'documents';out.mkdir(exist_ok=True)
def fetch(row):
 id=row['facultyId']; dest=out/(id+'.json')
 if dest.exists():return
 result={'facultyId':id,'name':row['name'],'checkedAt':'2026-10-16','status':'retrieved-not-reviewed','documents':[]}
 links=sorted(row['links'],key=lambda l:{'CV':0,'Profile':1,'Website':2}.get(l['label'],3))
 for link in links[:2]:
  doc={'url':link['url'],'label':link['label']}
  try:
   req=urllib.request.Request(link['url'],headers={'User-Agent':'Mozilla/5.0 AcademicPlacementResearch'})
   with urllib.request.urlopen(req,timeout=18) as resp:
    raw=resp.read(8000000);doc['resolvedUrl']=resp.url
   if raw.startswith(b'%PDF'):
    reader=PdfReader(io.BytesIO(raw)); text='\n'.join(p.extract_text() or '' for p in reader.pages)
    doc['kind']='pdf'
   else:
    soup=BeautifulSoup(raw,'html.parser')
    for el in soup(['script','style','nav','footer','header']):el.decompose()
    doc['cvLinks']=[{'text':a.get_text(' ',strip=True),'url':urllib.parse.urljoin(doc['resolvedUrl'],a.get('href',''))} for a in soup.find_all('a',href=True) if re.search(r'\bcv\b|curriculum vitae',a.get_text(' ',strip=True),re.I)]
    text=soup.get_text('\n',strip=True);doc['kind']='html'
   doc['text']=text[:100000]
  except Exception as e:doc['error']=str(e)
  result['documents'].append(doc);time.sleep(.7)
 dest.write_text(json.dumps(result,ensure_ascii=False),encoding='utf-8')
seen=set()
while True:
 rows=[]
 for p in (base/'discovery').glob('*.json'):
  if p.stem not in seen:
   rows.append(json.loads(p.read_text(encoding='utf-8')));seen.add(p.stem)
 if rows:
  with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:list(pool.map(fetch,rows))
  print('Retrieved public documents for',len(list(out.glob('*.json'))),'profiles',flush=True)
 if (base/'discovery-index.json').exists():
  if len(seen)>=len(json.loads((base/'discovery-index.json').read_text(encoding='utf-8'))):break
 time.sleep(3)
print('Retrieval complete',flush=True)
