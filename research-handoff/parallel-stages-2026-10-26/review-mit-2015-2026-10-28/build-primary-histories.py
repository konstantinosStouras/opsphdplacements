"""Research-only additive proposals. Never mutates public datasets."""
import json,re,unicodedata
from pathlib import Path
OUT=Path(__file__).resolve().parent
ROOT=OUT.parents[2]
def normal(s):return re.sub(r"[^a-z0-9]","",unicodedata.normalize("NFKD",s).encode("ascii","ignore").decode().lower())
def date(s):
 r=dict(asWritten=s,year=None,month=None,precision="unknown")
 if not s or str(s).lower()=="present":return r
 m=re.search(r"(?:19|20)\d{2}",str(s))
 if m:r.update(year=int(m.group()),precision="year")
 m=re.fullmatch(r"(\d{4})-(\d{2})",str(s))
 if m:r.update(month=int(m[2]),precision="month")
 return r
def main():
 people=[]
 for f in ["primary-a.json","primary-b.json","primary-c.json"]:
  data=json.loads((OUT/f).read_text(encoding="utf-8-sig"))
  for x in data["people"]:
   x=dict(x)
   if data.get("sources"):
    x["documentSourceRegistry"]=data["sources"]
    if not x.get("sources"):x["sources"]=data["sources"]
   people.append((f,x))
 assert len(people)==11, "Expected all eleven source-bounded cohort people"
 histories=json.loads((ROOT/"data/employment-histories.json").read_text(encoding="utf-8-sig"))["records"]
 outputs=[];audit=[]
 for filename,p in people:
  name=p["name"]
  slug=re.sub(r"[^a-z0-9]+","-",unicodedata.normalize("NFKD",name).encode("ascii","ignore").decode().lower()).strip("-")
  pid=p.get("existingPersonId") or p.get("existingFacultyId") or p.get("existingIdentityId") or p.get("existingGraduateId") or "grad:massachusetts-institute-of-technology:"+slug+":2015"
  matches=[x for x in histories if x["id"]==pid or normal(x["name"])==normal(name)]
  sourceitems=p.get("sources",[])
  urls=[x if isinstance(x,str) else x.get("url") for x in sourceitems]
  default=p.get("roleSourceDefault") or p.get("sourceUrl") or next((u for u in urls if u),None)
  rows=[(x,x.get("sourceUrl") or default) for x in p.get("roles",[])]
  for src in sourceitems:
   if isinstance(src,dict):rows.extend((x,x.get("sourceUrl") or src.get("url")) for x in src.get("roles",[]))
  jobs=[]
  for role,url in rows:
   ids=role.get("sourceIds",[])
   byid={x.get("id"):x.get("url") for x in sourceitems if isinstance(x,dict)}
   facturls=[byid[i] for i in ids if i in byid]
   if facturls:url=facturls[0]
   assert url, (name,"Role has no source")
   end=role.get("end");ongoing=(end is None or str(end).lower()=="present")
   entry=dict(employerAsWritten=role.get("employer"),titleAsWritten=role.get("title"),employmentTypeAsWritten=role.get("employmentType"),locationAsWritten=role.get("location"),start=date(role.get("start")),end=date(end),isCurrent=None if ongoing else False,sourceUrl=url,checkedAt=role.get("checkedAt","2026-10-28"),sourceType="primary-source",sourceSection="Individually reviewed primary chronology",evidenceNote=role.get("evidence") or role.get("note") or "Role transcribed from primary observation with original precision.",sourceObservation=role)
   if ongoing:entry["evidenceNote"]+=" Unknown end or source-dated present does not establish current employment."
   if role.get("currentAsObserved") is True:entry["evidenceNote"]+=" Contributor explicitly observed current role on its dated source; observation preserved without asserting later continuity."
   entry["additionalSourceUrls"]=facturls[1:]
   jobs.append(entry)
  mentions=[]
  for key in ["otherMentions","service","serviceMentions"]:
   val=p.get(key,[])
   if not isinstance(val,list):val=[val]
   for v in val:
    url=v.get("sourceUrl") if isinstance(v,dict) else None
    mentions.append(dict(observation=v,sourceUrl=url,sourceUrls=urls,sourceObservationFile=filename,checkedAt="2026-10-28",classificationNote="Supporting mention only. For multi-source prose, retain source set and original observations; no fabricated one-source attribution."))
  unplaced=[j for j in jobs if not j["employerAsWritten"] or j["titleAsWritten"]=="Independent Director"]
  jobs=[j for j in jobs if j not in unplaced]
  mentions.extend(unplaced)
  record=dict(personId=pid,name=name,recordIds=[],careerOwner="stage-2" if pid.startswith("omlist-") else "stage-3" if pid.startswith("roster:") else "stage-4",reviewer="Codex primary research contributor",checkedAt="2026-10-28",profileUrl=None,identityBasis=p.get("identity") or p.get("identityEvidence") or p.get("ownership") or "Primary identity observations attached; root review required.",experienceAccess="primary-sources-reviewed",profileHistoryComplete=False,careerComplete=False,coverageNote="Additive primary-source proposal. No LinkedIn history captured. Preserve existing public roles and unresolved timing.",jobs=jobs,otherEmploymentMentions=mentions,remainingUnknowns=p.get("limitations",p.get("limits",[])),accessLimitations=[],firstJobAssessment=None,integrationStatus="proposal-only",sourceObservations=p,sourceObservationFile=filename,existingHistoryReview=[dict(id=x["id"],checkedAt=x.get("checkedAt"),jobCount=len(x.get("jobs",[])),instruction="Reconcile additively; never overwrite existing history.") for x in matches])
  target=OUT/(slug+".history-proposal.json")
  if target.exists():raise FileExistsError(target)
  outputs.append((target,record));audit.append(dict(name=name,personId=pid,existingHistoryIds=[x["id"] for x in matches],proposalJobs=len(jobs),review="Compare exact role dates and source check dates during root integration; no automatic replacement."))
 for f,r in outputs:f.write_text(json.dumps(r,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
 (OUT/"builder-identity-audit.json").write_text(json.dumps(audit,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
 print("Created",len(outputs),"research-only proposals")
if __name__=="__main__":main()
