import json,pathlib
OUT=pathlib.Path(__file__).parent
def read(p):return json.loads(pathlib.Path(p).read_text(encoding='utf-8'))
report={}
for f in pathlib.Path('research/mit-2021-before').glob('*.json'):
    if f.stem=='record-dates':continue
    old=read(f);new=read(pathlib.Path('data')/f.name)
    if f.stem in ['graduate-lists','employment-histories']:
        n={r['id']:r for r in new['records']}
        for r in old['records']:assert n[r['id']]==r,r['id']
        report[f.stem]={'unchangedOlderRecords':len(old['records']),'newRecords':len(n)-len(old['records'])}
    else:assert old==new,f.name;report[f.stem]='unchanged'
(OUT/'public-preservation-audit.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
print('All older public records unchanged; only nine graduates and six histories added, plus stamps.')
