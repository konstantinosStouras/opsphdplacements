import json,urllib.request,urllib.parse,io,re,zipfile,xml.etree.ElementTree as ET,time
from pathlib import Path
from pypdf import PdfReader
from bs4 import BeautifulSoup
p=Path(__file__).resolve().parent;d=p/'cv-extra';d.mkdir(exist_ok=True)
done={r['facultyId'] for r in json.loads((p/'results.json').read_text(encoding='utf8'))}
for f in sorted((p/'cv-text').glob('*.json')):
 r=json.loads(f.read_text(encoding='utf8'));url=r['url']
 if r['facultyId'] in done or r.get('pages') or not r.get('text') or (d/f.name).exists():continue
 s={'facultyId':r['facultyId'],'name':r['name'],'url':url,'status':'discovery-only','checkedAt':'2026-10-16'}
 try:
  if 'drive.google.com/file/d/' in url:
   fid=url.split('/d/')[1].split('/')[0];fetchurl='https://drive.google.com/uc?export=download&id='+fid
  elif 'dropbox.com/' in url:fetchurl=url.replace('dl=0','dl=1')
  else:fetchurl=url
  def get(u):
   with urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'AcademicPlacementResearch/1.0'}),timeout=20) as resp:return resp.read(8_000_000),resp.url
  raw,final=get(fetchurl)
  if not raw.startswith(b'%PDF') and not raw.startswith(b'PK'):
   soup=BeautifulSoup(raw,'html.parser');urls=[]
   for a in soup.select('a[href],iframe[src]'):
    u=urllib.parse.urljoin(final,a.get('href',a.get('src','')))
    if '.pdf' in u.lower() or 'drive.google.com/file/d/' in u:urls.append(u)
   if urls:
    fetchurl=urls[0]
    if 'drive.google.com/file/d/' in fetchurl:fetchurl='https://drive.google.com/uc?export=download&id='+fetchurl.split('/d/')[1].split('/')[0]
    raw,final=get(fetchurl);s['url']=urls[0]
  s['finalUrl']=final
  if raw.startswith(b'%PDF'):
   pdf=PdfReader(io.BytesIO(raw));s['pages']=len(pdf.pages);s['text']='\n'.join(x.extract_text() or '' for x in pdf.pages[:4])
  elif raw.startswith(b'PK'):
   root=ET.fromstring(zipfile.ZipFile(io.BytesIO(raw)).read('word/document.xml'));s['text']='\n'.join(x.text or '' for x in root.iter() if x.tag.endswith('}t'))[:30000]
  else:s['error']='No directly linked readable PDF or DOCX found.'
 except Exception as e:s['error']=str(e)
 (d/f.name).write_text(json.dumps(s,ensure_ascii=False,indent=2),encoding='utf8');print(r['name'].encode('ascii','backslashreplace').decode(),len(s.get('text','')),s.get('error',''),flush=True);time.sleep(.5)
