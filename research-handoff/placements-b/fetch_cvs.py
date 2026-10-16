import json,subprocess,concurrent.futures,time
from pathlib import Path
from pypdf import PdfReader
base=Path(__file__).parent
out=base/'cvs';out.mkdir(exist_ok=True)
done={r['facultyId'] for r in json.loads((base/'results.json').read_text(encoding='utf8')) if r['status']=='verified'}
rows=[]
for p in (base/'discovery').glob('*.json'):
 r=json.loads(p.read_text(encoding='utf8'))
 if r['facultyId'] in done:continue
 for link in r['links']:
  if link['label']=='CV' and '.pdf' in link['url'].lower() and 'drive.google' not in link['url']:
   rows.append(dict(r,url=link['url']));break

def fetch(r):
 f=out/(r['facultyId']+'.pdf'); t=f.with_suffix('.txt')
 if t.exists():return r['name'],'cached'
 try:
  u=r['url'].replace("'","''");dest=str(f.resolve()).replace("'","''")
  cmd="Invoke-WebRequest -Uri '"+u+"' -UseBasicParsing -TimeoutSec 20 -OutFile '"+dest+"'"
  result=subprocess.run(['powershell','-NoProfile','-Command',cmd],capture_output=True,timeout=30)
  if result.returncode:raise Exception(result.stderr.decode(errors='replace')[:200])
  pdf=PdfReader(f)
  text='SOURCE: '+r['url']+'\nNAME: '+r['name']+'\n'+'\n'.join(p.extract_text() or '' for p in pdf.pages)
  t.write_text(text,encoding='utf8')
  return r['name'],'ok'
 except Exception as e:
  f.with_suffix('.error.txt').write_text(str(e),encoding='utf8')
  return r['name'],'failed'

with concurrent.futures.ThreadPoolExecutor(3) as ex:
 for name,status in ex.map(fetch,rows):print(name,status,flush=True)
