import re,html
from pathlib import Path
for name in ['duke','stanford','psu']:
 s=Path(f'research/placements-a/{name}.html').read_text(encoding='utf-8')
 s=re.sub(r'<script\b[^>]*>.*?</script>','',s,flags=re.S|re.I)
 s=re.sub(r'<[^>]+>','\n',s)
 s=html.unescape(s)
 s='\n'.join(x.strip() for x in s.splitlines() if x.strip())
 Path(f'research/placements-a/{name}.txt').write_text(s,encoding='utf-8')
 print(name)
 if name=='duke': print(s[s.find('Below is a list'):s.find('Below is a list')+3500])
 if name=='stanford':
  i=s.rfind('Xavier Sebastian'); print(s[i-300:i+400])
 if name=='psu':
  for who in ['Chen,','Gao,','Saldanha']:
   for match in re.finditer(re.escape(who),s): print(s[match.start():match.start()+600])
