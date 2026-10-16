import json,subprocess,concurrent.futures,time
from pathlib import Path
from pypdf import PdfReader
base=Path(__file__).parent
out=base/'cvs';out.mkdir(exist_ok=True)
done={r['facultyId'] for r in json.loads((base/'results.json').read_text(encoding='utf8')) if r['status']=='verified'}
rows=json.loads((base/'table-cv-queue2.json').read_text(encoding='utf8'))

def fetch(r):
 f=out/(r['facultyId']+'.pdf'); t=f.with_suffix('.txt')
 if t.exists():return r['name'],'cached'
 try:
  u=r['url'].replace("'","''");dest=str(f.resolve()).replace("'","''")
  cmd="Invoke-WebRequest -Uri '"+u+"' -UseBasicParsing -TimeoutSec 20 -OutFile '"+dest+"'"
  result=subprocess.run(['powershell','-NoProfile','-Command',cmd],capture_output=True,timeout=30)
  if result.returncode:raise Exception(result.stderr.decode(errors='replace')[:200])
  pdf=PdfReader(f)
  text='SOURCE: '+r.get('originalUrl',r['url'])+'\nNAME: '+r['name']+'\n'+'\n'.join(p.extract_text() or '' for p in pdf.pages)
  t.write_text(text,encoding='utf8')
  return r['name'],'ok'
 except Exception as e:
  f.with_suffix('.error.txt').write_text(str(e),encoding='utf8')
  return r['name'],'failed'

with concurrent.futures.ThreadPoolExecutor(3) as ex:
 for name,status in ex.map(fetch,rows):print(name,status,flush=True)
