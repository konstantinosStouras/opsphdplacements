from pathlib import Path
p=Path('research/placements-a/batch.py')
s=p.read_text(encoding='utf-8-sig')
s=s[:s.index("url='https://fisher")]
Path('research/placements-a/helpers.py').write_text(s,encoding='utf-8')
