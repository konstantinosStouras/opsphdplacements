import urllib.request
from pathlib import Path
urls={'duke':'https://areas.fuqua.duke.edu/operations-management/ph-d-program/placement/','stanford':'https://www.gsb.stanford.edu/programs/phd/placement/academic-placements','psu':'https://www.smeal.psu.edu/phd/scis/placements'}
for name,url in urls.items():
 try:
  text=urllib.request.urlopen(url,timeout=25).read().decode()
  Path(f'research/placements-a/{name}.html').write_text(text,encoding='utf-8')
  print(name,len(text))
 except Exception as e: print(name,str(e))
