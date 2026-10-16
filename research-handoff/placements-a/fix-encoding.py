import json
from pathlib import Path
p=Path('research/placements-a/results.json')
r=json.loads(p.read_text(encoding='utf-8'))
def fix(v):
 if isinstance(v,str):
  for _ in range(5):
   try:s=v.encode('cp1252').decode('utf-8')
   except (UnicodeEncodeError,UnicodeDecodeError):break
   if s==v:break
   v=s
  return v
 if isinstance(v,list):return [fix(x) for x in v]
 if isinstance(v,dict):return {k:fix(x) for k,x in v.items()}
 return v
r=fix(r)
p.write_text(json.dumps(r,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
print('cleaned',len(r))
