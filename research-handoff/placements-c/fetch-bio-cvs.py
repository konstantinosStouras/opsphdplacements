import json,urllib.request,concurrent.futures,time,io
from pathlib import Path
from pypdf import PdfReader
from bs4 import BeautifulSoup
p=Path(__file__).resolve().parent; d=p/'bio-cvs';d.mkdir(exist_ok=True)
rows=[]
done={r['facultyId'] for r in json.loads((p/'results.json').read_text(encoding='utf8'))}
for f in (p/'bio-text').glob('*.json'):
 r=json.loads(f.read_text(encoding='utf8'))
 if r['facultyId'] in done:continue
 links=[]
 for source in r.get('sources',[]):
  for l in source.get('cvLinks',[]):
   if l['text'].lower() in ['cv','vita','curriculum vitae','download cv'] and '.pdf' in l['url'].lower():links.append(l['url'])
 if links:rows.append((r,links[0]))
def fetch(pair):
 r,url=pair;target=d/(r['facultyId']+'.json')
 if target.exists():return
 result={'facultyId':r['facultyId'],'name':r['name'],'url':url,'status':'discovery-only','checkedAt':'2026-10-16'}
 try:
  req=urllib.request.Request(url,headers={'User-Agent':'AcademicPlacementResearch/1.0'})
  with urllib.request.urlopen(req,timeout=25) as resp:
   raw=resp.read(8_000_000);result['finalUrl']=resp.url
  if raw.startswith(b'%PDF'):
   pdf=PdfReader(io.BytesIO(raw));result['pages']=len(pdf.pages);result['text']='\n'.join(page.extract_text() or '' for page in pdf.pages[:5])
  else:
   soup=BeautifulSoup(raw,'html.parser')
   for t in soup(['script','style','nav','footer','header']):t.decompose()
   result['text']=soup.get_text(' ',strip=True)[:18000]
 except Exception as e: result['error']=str(e)
 target.write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8');time.sleep(.5)
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
 for i,_ in enumerate(pool.map(fetch,rows),1):
  if i%15==0:print('CV sources downloaded',i,'/',len(rows),flush=True)
print('Finished',len(rows),flush=True)
