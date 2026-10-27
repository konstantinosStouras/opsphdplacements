"""Read official recipient name books in memory; retain metadata and narrow OR entry contexts only."""
import io,json,re,hashlib,urllib.request
from pypdf import PdfReader
from pathlib import Path
sources=[(2023,'https://commencement.mit.edu/sites/default/files/2023-06/MIT.Commencement.2023.Graduates.Name.Book.pdf'),(2024,'https://commencement.mit.edu/sites/default/files/2024-05/MIT.Commencement.2024.Graduates.Name.Book.pdf')]
for year,url in sources:
 with urllib.request.urlopen(url,timeout=45) as response: raw=response.read()
 reader=PdfReader(io.BytesIO(raw)); hits=[]
 for n,page in enumerate(reader.pages):
  t=re.sub(r'\s+',' ',page.extract_text() or '')
  if 'SLOAN SCHOOL OF MANAGEMENT, DOCTORAL' in t.upper():
   hits.append({'pdfPageOneBased':n+1,'printedPage':re.findall(r'Advanced Degrees (\d+)',t),'text':t})
 print(json.dumps({'bookYear':year,'url':url,'pages':len(reader.pages),'sha256':hashlib.sha256(raw).hexdigest(),'doctoralSectionPages':hits},ensure_ascii=True))
