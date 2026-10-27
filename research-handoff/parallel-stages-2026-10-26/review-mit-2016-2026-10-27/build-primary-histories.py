"""Research-only proposals; reads public histories solely for identity/conflict review."""
import json,re,unicodedata
from pathlib import Path
OUT=Path(__file__).resolve().parent
ROOT=OUT.parents[2]
def norm(s): return re.sub(r"[^a-z0-9]", "", unicodedata.normalize("NFKD",s).encode("ascii","ignore").decode().lower())
def date(s):
 r={"asWritten":s,"year":None,"month":None,"precision":"unknown"}
 if not s or s.lower()=="present":return r
 m=re.search(r"(19|20)\d{2}",s)
 if m:r.update(year=int(m.group()),precision="year")
 m=re.fullmatch(r"(\d{4})-(\d{2})",s)
 if m:r.update(month=int(m[2]),precision="month")
 return r
def main():
 existing=json.loads((ROOT/"data/employment-histories.json").read_text(encoding="utf-8"))["records"]
 outputs=[]
 for fn in ["primary-a.json","primary-b.json","primary-c.json"]:
  data=json.loads((OUT/fn).read_text(encoding="utf-8"))
  for person in data["people"]:
   name=person["name"]
   slug=re.sub(r"[^a-z0-9]+","-",unicodedata.normalize("NFKD",name).encode("ascii","ignore").decode().lower()).strip("-")
   identifier=person.get("existingFacultyId") or person.get("existingIdentityId") or person.get("existingGraduateId") or "grad:massachusetts-institute-of-technology:"+slug+":2016"
   matches=[x for x in existing if x["id"]==identifier or norm(x["name"])==norm(name)]
   sources=person.get("sources",[])
   default=person.get("sourceUrl") or (sources[0] if sources and isinstance(sources[0],str) else sources[0]["url"] if sources else None)
   rows=[(x,x.get("sourceUrl",default)) for x in person.get("roles",[])]
   for src in sources:
    if isinstance(src,dict):rows.extend((x,x.get("sourceUrl",src["url"])) for x in src.get("roles",[]))
   # Remorov's contributor saved all chronology as prose. Explicit transcription,
   # preserving aggregate VP rank and seasonal internship precision.
   if name=="Alexander Remorov":
    u=sources[1]["url"]
    for e,t,s,n in [("BlackRock","Vice President, Systematic Active Equities (aggregate CV rank)","2016","present"),("Massachusetts Institute of Technology","Research Assistant, Sloan","2012","2016"),("Goldman Sachs","STS Summer Associate","Summer2014","Summer2014"),("Goldman Sachs","STS Summer Associate","Summer2015","Summer2015"),("Manulife Asset Management","Portfolio Solutions Group Analyst","2011","2012"),("University of Waterloo","Undergraduate Research Assistant","Summer2011","Summer2011")]:
     rows.append((dict(employer=e,title=t,start=s,end=n),sources[0]["url"] if e=="University of Waterloo" else u))
   jobs=[];mentions=[]
   for row,url in rows:
    # MiÅ¡iÄ‡ roles all derive from CV; Dunning all from homepage.
    if name=="Velibor V. Misic":url=sources[0]
    if name=="Paul Grigas":url=sources[2] if row["title"].startswith("Assistant") else sources[1]
    # He Wang roles derive from the single CV.
    entry=dict(employerAsWritten=row.get("employer"),titleAsWritten=row.get("title"),employmentTypeAsWritten=None,locationAsWritten=None,start=date(row.get("start")),end=date(row.get("end")),isCurrent=False,sourceUrl=url,checkedAt="2026-10-27",sourceType="primary-source",sourceSection="Reviewed employment/biography",evidenceNote="Source date precision retained. Unknown end and historical present are not a current-employment assertion.")
    if not row.get("employer") or "Dockson" in row.get("title",""):mentions.append(entry)
    else:jobs.append(entry)
   for key in ["otherMentions","service","serviceMentions"]:
    val=person.get(key,[])
    if not isinstance(val,list):val=[val]
    for v in val:mentions.append(dict(observation=v,sourceUrl=default,checkedAt="2026-10-27",classificationNote="Supporting mention only; no inferred employer/date or continuous employment."))
   record=dict(personId=identifier,name=name,recordIds=[],careerOwner="stage-2" if identifier.startswith("omlist-") else "stage-3" if identifier.startswith("roster:") else "stage-4",reviewer="Codex primary research contributor",checkedAt="2026-10-27",profileUrl=None,identityBasis=person.get("identityEvidence") or person.get("identity") or person.get("ownership") or "See attached primary source observations; root must review identity before integration.",experienceAccess="primary-sources-reviewed",profileHistoryComplete=False,careerComplete=False,coverageNote="Accessible primary sources reviewed; no LinkedIn capture. Additive proposal only, preserve existing public history and identity.",jobs=jobs,otherEmploymentMentions=mentions,remainingUnknowns=person.get("limits",person.get("limitations",[])),accessLimitations=[],firstJobAssessment=None,integrationStatus="proposal-only",sourceObservations=person,existingHistoryReview=[dict(id=x["id"],jobs=len(x.get("jobs",[])),checkedAt=x.get("checkedAt"),warning="Existing public history must be retained and reconciled; do not overwrite with this proposal.") for x in matches])
   target=OUT/(slug+".history-proposal.json")
   if target.exists():raise FileExistsError(target)
   outputs.append((target,record))
 for p,r in outputs:p.write_text(json.dumps(r,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
 print("Created",len(outputs),"research-only proposals")
if __name__=="__main__":main()
