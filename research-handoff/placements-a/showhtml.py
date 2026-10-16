import json,re
from pathlib import Path
base=Path('research/placements-a');done={r['facultyId'] for r in json.loads((base/'results.json').read_text(encoding='utf-8'))}
n=0
for p in sorted((base/'documents').glob('*.json')):
 r=json.loads(p.read_text(encoding='utf-8'))
 if r['facultyId'] in done or any(d.get('kind')=='pdf' for d in r['documents']):continue
 docs=[d for d in r['documents'] if d.get('kind')=='html' and len(d.get('text',''))>100]
 if not docs:continue
 print('\nID',r['facultyId'],r['name'])
 for d in docs:
  print('URL',d['url']);t=d['text'];print(t[:4600] if '\x00' not in t[:100] and '\ufffd' not in t[:20] else '[binary document; requires separate extraction]');print('CVLINKS',d.get('cvLinks'))
 n+=1
 if n>=6:break
