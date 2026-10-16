import json,urllib.request,urllib.parse,concurrent.futures,time,io
from pathlib import Path
from pypdf import PdfReader
from bs4 import BeautifulSoup
p=Path(__file__).resolve().parent;d=p/'bio-text';d.mkdir(exist_ok=True)
done={r['facultyId'] for r in json.loads((p/'results.json').read_text(encoding='utf8'))}
rows=[]
for f in (p/'discovery').glob('*.json'):
 r=json.loads(f.read_text(encoding='utf8'))
 if r['facultyId'] in done:continue
 links=[l for l in r.get('links',[]) if l['label'] in ['Profile','Website']]
 rows.append((r,links))
def fetch(pair):
 r,links=pair;target=d/(r['facultyId']+'.json')
 if target.exists():return
 result={'facultyId':r['facultyId'],'name':r['name'],'status':'discovery-only','checkedAt':'2026-10-16','sources':[]}
 for l in links:
  s={'url':l['url'],'label':l['label']}
  try:
   req=urllib.request.Request(l['url'],headers={'User-Agent':'AcademicPlacementResearch/1.0'})
   with urllib.request.urlopen(req,timeout=18) as resp:raw=resp.read(6_000_000);s['finalUrl']=resp.url
   if raw.startswith(b'%PDF'):
    pdf=PdfReader(io.BytesIO(raw));s['pages']=len(pdf.pages);s['text']='\n'.join(page.extract_text() or '' for page in pdf.pages[:4])
   else:
    soup=BeautifulSoup(raw,'html.parser');s['cvLinks']=[{'text':a.get_text(' ',strip=True),'url':urllib.parse.urljoin(s['finalUrl'],a['href'])} for a in soup.select('a[href]') if any(w in a.get_text(' ',strip=True).lower() for w in ['curriculum','vitae','resume']) or a.get_text(' ',strip=True).lower() in ['cv','vita','download cv']]
    for t in soup(['script','style','nav','footer','header']):t.decompose()
    s['text']=soup.get_text(' ',strip=True)[:30000]
  except Exception as e:s['error']=str(e)
  result['sources'].append(s);time.sleep(.4)
 target.write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf8')
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
 for i,_ in enumerate(pool.map(fetch,rows),1):
  if i%25==0:print('Biographies downloaded',i,'/',len(rows),flush=True)
print('Finished',len(rows),flush=True)
