"""Reconcile the downloaded public all-faculty directory with its PhD table.

This script performs no network requests and imports no contact details.
"""
import argparse
import collections
from datetime import date
import hashlib
import json
import re
from pathlib import Path
from urllib.parse import urljoin
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--input-dir", type=Path, default=ROOT / "research", help="Directory containing omlist-faculty.html and doctorate JSON")
parser.add_argument("--retrieved-date", type=date.fromisoformat, required=True, help="Actual source retrieval date, YYYY-MM-DD")
parser.add_argument("--phd-data", type=Path, help="Doctorate JSON from extract_phd.py (default: INPUT_DIR/omlist-phd-faculty.json)")
parser.add_argument("--output", type=Path, default=ROOT / "data" / "faculty.json", help="Normalized website JSON output")
args = parser.parse_args()
BASE = args.input_dir
SOURCE = "https://omlist.edutool.org/faculty"
PHD_SOURCE = "https://omlist.edutool.org/phd/by-year.html"
RETRIEVED = args.retrieved_date.isoformat()
raw = (BASE / "omlist-faculty.html").read_text(encoding="utf-8-sig")
soup = BeautifulSoup(raw, "html.parser")
phd_data = json.loads((args.phd_data or BASE / "omlist-phd-faculty.json").read_text(encoding="utf-8"))
if phd_data.get("version") != 1 or "records" not in phd_data:
    raise ValueError("Run scripts/extract_phd.py first to produce a version 1 doctorate dataset")
if phd_data["metadata"]["retrievedAt"] != RETRIEVED:
    raise ValueError("Doctorate and faculty snapshots must use the same retrieval date")
phd_by_profile = {r["sourceProfileUrl"]: r for r in phd_data["records"]}
records = []
conflicts = []
status_counts = {}
for section in soup.select(".faculty-section"):
    status = section["data-section"]
    rows = section.select("tr.faculty-row")
    stated_count = int(re.search(r"\((\d+)\)", section.h2.get_text()).group(1))
    if len(rows) != stated_count:
        raise ValueError(f"Faculty section {status}: expected {stated_count}, found {len(rows)}")
    status_counts[status] = len(rows)
    for row in rows:
        profile = urljoin(SOURCE, row["data-profile-url"])
        phd = phd_by_profile.get(profile)
        year = int(row.get("data-phdyear", 0)) or None
        name = row.select_one(".name-medal-wrap strong").get_text(" ", strip=True)
        school_link = row.select_one(".subline-school")
        school = school_link.get_text(" ", strip=True)
        title_line = row.select_one(".faculty-subline")
        # Read only the text before the affiliation/first separator. Later text can
        # be an obituary link or departure year, neither of which is a role.
        title_parts = []
        for node in title_line.contents:
            if node is school_link or (getattr(node, "name", None) and "subline-sep" in node.get("class", [])):
                break
            title_parts.append(node.get_text(" ", strip=True) if getattr(node, "name", None) else str(node))
        title = " ".join(" ".join(title_parts).split())
        if phd:
            for key, value in (("name", name), ("phdYear", year), ("currentInstitution", school)):
                if value != phd[key]:
                    conflicts.append({"sourceProfileUrl": profile, "field": key, "facultyValue": value, "phdTableValue": phd[key]})
        records.append({
            "id": "omlist-" + hashlib.sha256(profile.encode()).hexdigest()[:16],
            "name": name,
            "discipline": row["data-discipline"],
            "sourceDisciplineLabel": row.select_one('[data-label="Discipline"]').get_text(" ", strip=True),
            "title": title or None,
            "facultyStatus": status,
            "phdYear": year,
            "phdInstitution": phd["phdInstitution"] if phd else None,
            "phdInstitutionSourceUrl": phd["phdInstitutionSourceUrl"] if phd else None,
            "currentInstitution": school,
            "currentInstitutionSourceUrl": urljoin(SOURCE, school_link["href"]),
            "tenureYear": int(row.get("data-tenureyear", 0)) or None,
            "topicalTags": list(filter(None, row.get("data-topical", "").split("|"))),
            "methodologicalTags": list(filter(None, row.get("data-method", "").split("|"))),
            "sourceProfileUrl": profile,
            "sourceUrl": SOURCE,
            "additionalSourceUrls": [PHD_SOURCE] if phd else [],
            "retrievedAt": RETRIEVED,
            "firstPlacement": None,
            "firstPlacementYear": None,
            "verificationStatus": "source-imported",
            "phdCompletionStatus": "unknown" if not year else "future-year-in-source" if year > args.retrieved_date.year else "reported-by-source",
        })
        if phd and "sourceRawPhdInstitution" in phd:
            records[-1]["sourceRawPhdInstitution"] = phd["sourceRawPhdInstitution"]
assert len({r["id"] for r in records}) == len(records)
assert all(r["name"] and r["currentInstitution"] for r in records)
if not records:
    raise ValueError("No faculty rows found; source HTML structure may have changed")
if conflicts:
    raise ValueError("Resolve source reconciliation conflicts before publishing: " + json.dumps(conflicts, ensure_ascii=False))
missing_phd_year = sum(r["phdYear"] is None for r in records)
missing_phd_institution = sum(r["phdInstitution"] is None for r in records)
future_phd_count = sum(bool(r["phdYear"] and r["phdYear"] > args.retrieved_date.year) for r in records)
metadata = {
    "source": "OM/SCM Faculty Directory — All Faculty",
    "sourceUrl": SOURCE,
    "downloadedFromUrl": "https://omlist.edutool.org/faculty.html",
    "additionalSourceUrls": [PHD_SOURCE],
    "retrievedAt": RETRIEVED,
    "recordCount": len(records),
    "sourceDeclaredRecordCount": sum(status_counts.values()),
    "statusCounts": status_counts,
    "disciplineCounts": dict(collections.Counter(r["discipline"] for r in records)),
    "currentInstitutionCount": len({r["currentInstitution"] for r in records}),
    "phdInstitutionCount": len({r["phdInstitution"] for r in records if r["phdInstitution"]}),
    "withPhdYearCount": sum(r["phdYear"] is not None for r in records),
    "withPhdInstitutionCount": sum(r["phdInstitution"] is not None for r in records),
    "knownPhdInstitutionCount": sum(r["phdInstitution"] is not None for r in records),
    "missingPhdYearCount": missing_phd_year,
    "missingPhdInstitutionCount": missing_phd_institution,
    "withTenureYearCount": sum(r["tenureYear"] is not None for r in records),
    "futurePhdYearCount": future_phd_count,
    "phdYearRange": [min(r["phdYear"] for r in records if r["phdYear"]), max(r["phdYear"] for r in records if r["phdYear"])],
    "sourceSnapshotSha256": hashlib.sha256(raw.encode()).hexdigest(),
    "sourceSnapshots": [
        {"url": SOURCE, "file": "omlist-faculty.html", "retrievedAt": RETRIEVED, "recordCount": len(records), "declaredRecordCount": sum(status_counts.values()), "sha256": hashlib.sha256(raw.encode()).hexdigest()},
        {"url": PHD_SOURCE, "file": "omlist-phd.html", "retrievedAt": phd_data["metadata"]["retrievedAt"], "recordCount": phd_data["metadata"]["recordCount"], "declaredRecordCount": phd_data["metadata"]["sourceDeclaredRecordCount"], "sha256": phd_data["metadata"]["sourceSnapshotSha256"]},
    ],
    "reconciliation": {
        "matchedPhdTableProfiles": sum(bool(r["additionalSourceUrls"]) for r in records),
        "unmatchedDirectoryProfiles": sum(not r["additionalSourceUrls"] for r in records),
        "phdTableProfilesOutsideFacultyDirectory": len(set(phd_by_profile) - {r["sourceProfileUrl"] for r in records}),
        "conflicts": conflicts,
    },
    "limitations": [
        "Complete coverage of every faculty row in the downloaded all-faculty directory; not complete coverage of the profession.",
        "Institution is the directory affiliation, not a verified first placement. For retired/deceased/industry entries it must not be described as a current active faculty appointment.",
        f"Doctorate institution is reconciled by exact source profile URL; {missing_phd_year} entries lack a doctorate year and {missing_phd_institution} lack a doctorate institution.",
        "The source excludes Industrial Engineering departments and does not establish doctoral degree subject.",
        "First placement and first-placement year are unknown for all records and intentionally null.",
        f"{future_phd_count} future doctorate year(s) are retained as reported, not represented as completed PhDs.",
        "Public professional facts are source-imported and not independently verified against university biographies.",
        "No school/profile pages were crawled; no private contact details or demographic inferences were imported.",
    ],
}
args.output.parent.mkdir(parents=True, exist_ok=True)
args.output.write_text(json.dumps({"version": 1, "metadata": metadata, "records": records}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(json.dumps({"output": str(args.output.resolve()), "records": len(records), "statusCounts": status_counts, "missingPhdYear": missing_phd_year, "missingPhdInstitution": missing_phd_institution, "futureDoctorate": future_phd_count, "reconciliation": metadata["reconciliation"]}, ensure_ascii=False))
