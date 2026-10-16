import json,time,urllib.request,urllib.parse,re,io,concurrent.futures
from pathlib import Path
from bs4 import BeautifulSoup
from pypdf import PdfReader
base=Path(__file__).resolve().parent
def fetch(p):
 r=json.loads(p.read_text(encoding='utf-8'))
 if any(d.get('kind')=='pdf' for d in r['documents']):return
 known={d['url'] for d in r['documents']}
 links=[l for d in r['documents'] for l in d.get('cvLinks',[]) if l['url'] not in known]
 for l in links[:2]:
  url=l['url'];doc={'url':url,'label':'Linked CV'}
  try:
   with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'AcademicPlacementResearch/1.0'}),timeout=22) as resp:raw=resp.read(8000000);doc['resolvedUrl']=resp.url
   if raw.startswith(b'%PDF'):
    doc['kind']='pdf';doc['text']='\n'.join(x.extract_text() or '' for x in PdfReader(io.BytesIO(raw)).pages)[:100000]
   else:
    soup=BeautifulSoup(raw,'html.parser')
    for x in soup(['script','style','nav','footer','header']):x.decompose()
    doc['kind']='html';doc['text']=soup.get_text('\n',strip=True)[:100000]
  except Exception as e:doc['error']=str(e)
  r['documents'].append(doc);time.sleep(.6)
 if links:p.write_text(json.dumps(r,ensure_ascii=False),encoding='utf-8')
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
 for i,_ in enumerate(pool.map(fetch,list((base/'documents').glob('*.json'))),1):
  if i%100==0:print('Checked linked CV retrieval',i,flush=True)
print('Complete',flush=True)
