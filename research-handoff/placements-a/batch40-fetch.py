import urllib.request,re,json,io
from pathlib import Path
from pypdf import PdfReader
jobs=[('omlist-4432cbcadd238004','https://nicoleadler.huji.ac.il/sites/default/files/nicoleadler/files/cv_adler_2024.pdf'),('omlist-45579156a692dc41','https://mays.tamu.edu/wp-content/uploads/2026/08/Antonio-Arreola-Risa-CV-3-2026.pdf')]
for id,u in jobs:
 try:
  b=urllib.request.urlopen(u,timeout=30).read();t='\n'.join(p.extract_text() or '' for p in PdfReader(io.BytesIO(b)).pages)
  p=Path(__file__).parent/'documents'/f'{id}.json';d=json.loads(p.read_text(encoding='utf-8'));d['documents'].insert(0,dict(url=u,kind='pdf',text=t));p.write_text(json.dumps(d,ensure_ascii=False),encoding='utf-8');print(id,t[:7500])
 except Exception as e: print(id,type(e).__name__,str(e)[:150])
u='https://sites.google.com/view/mehdifarahani/'
s=urllib.request.urlopen(u,timeout=30).read().decode()
print('MEHDI CV links',list(dict.fromkeys(re.findall(r'https://drive.google.com/[^" <>]+',s))))
