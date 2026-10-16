import json,urllib.request,io
from pathlib import Path
from pypdf import PdfReader
p=Path(__file__).parent/'documents/omlist-6d32a173d5776c3c.json'
r=json.loads(p.read_text(encoding='utf-8'))
u=r['documents'][0]['url'].replace('dl=0','dl=1')
with urllib.request.urlopen(u,timeout=30) as resp:raw=resp.read(8000000)
t='\n'.join(x.extract_text() or '' for x in PdfReader(io.BytesIO(raw)).pages)
r['documents'].insert(0,dict(url=u,kind='pdf',text=t))
p.write_text(json.dumps(r,ensure_ascii=False),encoding='utf-8')
print(t[:3500])
