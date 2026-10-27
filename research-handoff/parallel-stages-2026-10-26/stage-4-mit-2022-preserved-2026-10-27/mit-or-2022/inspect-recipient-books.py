"""Read official recipient books in memory; retain metadata and OR entry contexts only."""
import io,json,re,hashlib,urllib.request,datetime
from pathlib import Path
from pypdf import PdfReader
p=Path(__file__).resolve().parent
sources=[(2022,'https://commencement.mit.edu/sites/default/files/MIT.Commencement.2022.Graduates.Name.Book.pdf'),(2023,'https://commencement.mit.edu/sites/default/files/2023-06/MIT.Commencement.2023.Graduates.Name.Book.pdf')]
metadata=[]
for year,url in sources:
 with urllib.request.urlopen(url,timeout=45) as response:raw=response.read()
 reader=PdfReader(io.BytesIO(raw));found=[]
 for n,page in enumerate(reader.pages):
  text=re.sub(r'\s+',' ',page.extract_text() or '')
  hits=list(re.finditer(r'Thesis in the field of Operations\s+Research\s*:',text,re.I))
  if hits:
   contexts=[text[max(0,m.start()-95):m.start()+200] for m in hits]
   found.append({'pdfPageOneBased':n+1,'contexts':contexts})
 meta={'bookYear':year,'url':url,'pages':len(reader.pages),'sha256':hashlib.sha256(raw).hexdigest(),'checkedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'orFieldPages':[r['pdfPageOneBased'] for r in found]};metadata.append(meta)
 print(json.dumps({'source':meta,'fieldContexts':found},ensure_ascii=True),flush=True)
(p/'recipient-source-metadata.json').write_text(json.dumps({'sources':metadata,'method':'Read official PDFs in memory; relevant OR doctoral entries individually inspected after text extraction; no full source documents saved.','fullBookHumanRead':False},indent=2)+'\n',encoding='utf-8')
