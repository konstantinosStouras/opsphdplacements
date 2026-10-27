"""Read supervisor-hosted appointment evidence in memory, no full CV retention."""
import io, re, json, hashlib, urllib.request, sys
from pypdf import PdfReader
sys.stdout.reconfigure(encoding='utf-8')
url='https://teamcore.seas.harvard.edu/files/2025/01/CV_Harvard-1.pdf'
with urllib.request.urlopen(url,timeout=45) as response:
    raw=response.read()
reader=PdfReader(io.BytesIO(raw))
print(json.dumps({'url':url,'pages':len(reader.pages),'sha256':hashlib.sha256(raw).hexdigest()}))
for n,page in enumerate(reader.pages):
    lines=(page.extract_text(extraction_mode='layout') or '').splitlines()
    for k,line in enumerate(lines):
        if 'Adam Cheol Woo Kim' in line:
            print(json.dumps({'pdfPageOneBased':n+1,'context':'\n'.join(lines[max(0,k-6):k+2])}))
