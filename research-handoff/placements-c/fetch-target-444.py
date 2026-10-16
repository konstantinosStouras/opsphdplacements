import urllib.request,json,pathlib,io,concurrent.futures
from pypdf import PdfReader
p=pathlib.Path('research/placements-c');by={r['id']:r for r in json.loads((p/'assigned.json').read_text(encoding='utf-8-sig'))}
rows=[('omlist-6f895f4abbef60a1','https://junyucao.com/resource/Junyu_CV_Jan2026.pdf'),('omlist-7078b8be73363fbf','https://www.anderson.ucla.edu/sites/default/files/documents/areas/fac/bios/Felipe-Caro-CV.pdf'),('omlist-6e195c5ebe3a8e1f','https://business.smu.edu.sg/sites/business.smu.edu.sg/files/business/OperationsManagement/CV_Meichun_Aug2025.pdf'),('omlist-70b0e59f97e81a21','https://www.dropbox.com/scl/fi/1dswakwf69mu5063l3dje/CV_VivekChoudhary.pdf?rlkey=l8h5ctphpsqtv7tv7cbmu78c9&dl=1')]
def fetch(row):
 id,url=row;r=dict(facultyId=id,name=by[id]['name'],url=url,status='discovery-only')
 try:
  raw=urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'AcademicPlacementResearch/1.0'}),timeout=30).read();pdf=PdfReader(io.BytesIO(raw));r['text']='\n'.join(page.extract_text() or '' for page in pdf.pages[:5])
 except Exception as e:r['error']=str(e)
 (p/'cv-extra'/f'{id}.json').write_text(json.dumps(r,ensure_ascii=False,indent=2),encoding='utf8');print(r['name'],r.get('error','saved'))
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:list(pool.map(fetch,rows))
