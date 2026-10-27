"""Research-only converter. Run explicitly after review; never edits public data.
Does not use capture.save because that function asserts a LinkedIn Chrome capture.
"""
import json
import re
from pathlib import Path

OUT = Path(__file__).resolve().parent
SLUGS = {
    "Joseph Andrew Huchette": "joseph-andrew-huchette",
    "Andrew A. Li": "andrew-a-li",
    "Rajan Udwani": "rajan-udwani",
}
MONTHS = {name: i + 1 for i, name in enumerate(
    ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"])}


def date(value):
    result = {"asWritten": value, "year": None, "month": None, "precision": "unknown"}
    if not value or value.lower() == "present":
        return result
    year = re.search(r"\b(19|20)\d{2}\b", value)
    if not year:
        return result
    result.update(year=int(year.group()), precision="year")
    first = value.split()[0][:3].lower()
    if first in MONTHS:
        result.update(month=MONTHS[first], precision="month")
    # Fall remains as-written; year precision never invents a season's start month.
    return result


def main():
    observations = json.loads((OUT / "faculty-primary-observations.json").read_text(encoding="utf-8"))
    outputs = []
    for source in observations["records"]:
        slug = SLUGS[source["name"]]
        target = OUT / (slug + ".history-proposal.json")
        if target.exists():
            raise FileExistsError(f"Refusing to overwrite another proposal: {target.name}")
        jobs, mentions = [], []
        for item in source["roles"]:
            entry = {
                "employerAsWritten": item["employerAsWritten"],
                "titleAsWritten": item["titleAsWritten"],
                "employmentTypeAsWritten": None,
                "locationAsWritten": None,
                "start": date(item["startAsWritten"]),
                "end": date(item["endAsWritten"]),
                "isCurrent": False,
                "sourceUrl": item["sourceUrl"],
                "checkedAt": item["checkedAt"],
                "sourceType": "personal-cv" if item["sourceUrl"].lower().endswith(".pdf") else "official-profile",
                "sourceSection": "Reviewed primary employment section or individual biography",
                "evidenceNote": item["evidenceNote"] or "Role and original date precision transcribed from reviewed primary source.",
            }
            if item["endAsWritten"] and item["endAsWritten"].lower() == "present":
                entry["evidenceNote"] += " Historical source Present retained as unknown end; not a current appointment claim."
            # Unknown employer cannot become a fabricated organization. Named chairs
            # are concurrent titles rather than separate employment intervals.
            if not item["employerAsWritten"] or "Chair" in item["titleAsWritten"] or "Rish Assistant" in item["titleAsWritten"]:
                mentions.append(entry)
            else:
                jobs.append(entry)
        for mention in source.get("otherMentions", []):
            if isinstance(mention, str):
                mentions.append({"evidenceNote": mention, "checkedAt": observations["checkedAt"], "classificationNote": "Service observation; not employment."})
            else:
                mentions.append({**mention, "checkedAt": observations["checkedAt"], "classificationNote": "Service or teaching-client mention; not a separate employment interval."})
        record = {
            "personId": "grad:massachusetts-institute-of-technology:" + slug + ":2018",
            "name": source["name"], "recordIds": [], "careerOwner": "stage-4",
            "reviewer": "Codex primary-source research contributor", "checkedAt": observations["checkedAt"],
            "profileUrl": None, "identityBasis": source["identityBasis"],
            "experienceAccess": "primary-sources-reviewed", "profileHistoryComplete": False,
            "careerComplete": False,
            "coverageNote": "Primary CV employment sections and individual biographies reviewed. No LinkedIn profile capture; historical Present and unknown transitions remain unresolved.",
            "jobs": jobs, "otherEmploymentMentions": mentions,
            "remainingUnknowns": source["remainingUnknowns"], "accessLimitations": [],
            "firstJobAssessment": None, "integrationStatus": "proposal-only",
            "degreeBoundaryObservation": source["degreeBoundary"],
            "sourceObservations": source["sources"],
        }
        outputs.append((target, record))
    # Validate all destination ownership before writing any output.
    for target, record in outputs:
        target.write_text(json.dumps(record, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Saved {len(outputs)} research-only proposals; public data untouched.")


if __name__ == "__main__":
    main()
