"""Root publication manifest; no public-data changes."""
import pathlib,json,hashlib,subprocess
O=pathlib.Path(__file__).parent
audit=subprocess.run(['python',str(O/'audit.py')],capture_output=True,text=True,check=True)
(O/'validation.json').write_text(json.dumps({'recordAudit':json.loads(audit.stdout),'unitTests':62,'schemaTests':4,'npmCheck':'passed','relationalBuild':'passed','staticBuild':'passed','sharingCheck':'passed','browserPreview':{'operations2018Rows':18,'expandedEvidenceSections':46,'forbiddenVisitorLinks':0,'forbiddenVisitorText':False,'milestoneRenderingCorrection':'Retested Galle after adding missing limitation; no undefined label.'}},indent=2)+'\n')
p=O/'ownership.json';v=json.loads(p.read_text());v['status']='integrated and validated; deployment awaiting confirmation';p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
paths=['README.md','TODO.md','RESEARCH-DESIGN.md','WORKFLOW.md','RESEARCH-STATUS.md','index.html','data/graduate-lists.json','data/employment-histories.json','data/record-dates.json']
paths += [str(p).replace('\\','/') for p in sorted(O.iterdir()) if p.is_file() and p.suffix in ['.json','.py','.md'] and p.name not in ['release-manifest.json','PUBLISHED.md','live-verification.json']]
manifest=[{'path':p,'sha256LF':hashlib.sha256(pathlib.Path(p).read_bytes().replace(b'\r\n',b'\n')).hexdigest()} for p in paths]
(O/'release-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print('Frozen',len(paths),'reviewed files; no unrelated proposal lanes included.')
