import urllib.request,zipfile,io,json
from xml.etree import ElementTree as ET
from pathlib import Path
u='https://student.kedge.edu/content/download/164056/file/cv-justine-marty.docx'
b=urllib.request.urlopen(u,timeout=30).read()
z=zipfile.ZipFile(io.BytesIO(b));r=ET.fromstring(z.read('word/document.xml'))
ns={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
t='\n'.join(''.join(p.itertext()) for p in r.findall('.//w:p',ns))
Path('research/placements-a/marty-cv.txt').write_text(t,encoding='utf-8')
print(t[:10000])
