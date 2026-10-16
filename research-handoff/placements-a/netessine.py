import json,urllib.request,io
from pathlib import Path
from pypdf import PdfReader
p=Path(__file__).parent/'documents/omlist-d51e3564cd5fb494.json'
r=json.loads(p.read_text(encoding='utf-8'))
u='https://www.dropbox.com/scl/fi/byvp386yvol224m3e0zb1/Serguei-Netessine-CV.pdf?rlkey=neg0ibqte0ii8yrk752hnsfaw&dl=1'
with urllib.request.urlopen(u,timeout=25) as resp:raw=resp.read(8000000)
t='\n'.join(x.extract_text() or '' for x in PdfReader(io.BytesIO(raw)).pages)
r['documents'].insert(0,dict(url=u,kind='pdf',text=t))
p.write_text(json.dumps(r,ensure_ascii=False),encoding='utf-8')
print(t[:18000])
