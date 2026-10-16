import urllib.request,re,json,io
from pathlib import Path
from pypdf import PdfReader
for id,url in [('omlist-33885b2ad0c11572','https://sites.google.com/view/baris-ata/bio-cv'),('omlist-32a455d1330ea309','https://sites.google.com/view/denizakturk/home/cv?authuser=0')]:
 raw=urllib.request.urlopen(url,timeout=30).read().decode()
 ids=list(dict.fromkeys(re.findall(r'drive.google.com/file/d/([A-Za-z0-9_-]+)',raw)))
 print(id,ids)
 for fid in ids:
  u='https://drive.google.com/uc?export=download&id='+fid
  try:
   raw=urllib.request.urlopen(u,timeout=30).read(6000000)
   t='\n'.join(p.extract_text() or '' for p in PdfReader(io.BytesIO(raw)).pages)
   p=Path(__file__).parent/'documents'/f'{id}.json';r=json.loads(p.read_text(encoding='utf8'))
   r['documents'].insert(0,dict(url=u,kind='pdf',text=t));p.write_text(json.dumps(r,ensure_ascii=False),encoding='utf8')
   print(t[:3000])
  except Exception as e:print(type(e).__name__,str(e)[:150])
