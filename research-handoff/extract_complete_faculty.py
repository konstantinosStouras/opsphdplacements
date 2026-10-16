"""Reconcile the downloaded public all-faculty directory with its PhD table.

This script performs no network requests and imports no contact details.
"""
import collections
import hashlib
import json
import re
from pathlib import Path
from urllib.parse import urljoin
from bs4 import BeautifulSoup

BASE = Path(__file__).parent
SOURCE = "https://omlist.edutool.org/faculty"
PHD_SOURCE = "https://omlist.edutool.org/phd/by-year.html"
RETRIEVED = "2026-10-16"
raw = (BASE / "omlist-faculty.html").read_text(encoding="utf-8-sig")
soup = BeautifulSoup(raw, "html.parser")
phd_data = json.loads((BASE / "omlist-phd-faculty.json").read_text(encoding="utf-8"))
phd_by_profile = {r["sourceProfileUrl"]: r for r in phd_data["faculty"]}
records = []
conflicts = []
status_counts = {}
for section in soup.select(".faculty-section"):
    status = section["data-section"]
    rows = section.select("tr.faculty-row")
    stated_count = int(re.search(r"\((\d+)\)", section.h2.get_text()).group(1))
    assert len(rows) == stated_count, (status, len(rows), stated_count)
    status_counts[status] = len(rows)
    for row in rows:
        profile = urljoin(SOURCE, row["data-profile-url"])
        phd = phd_by_profile.get(profile)
        year = int(row.get("data-phdyear", 0)) or None
        name = row.select_one(".name-medal-wrap strong").get_text(" ", strip=True)
        school_link = row.select_one(".subline-school")
        school = school_link.get_text(" ", strip=True)
        title_line = row.select_one(".faculty-subline")
        title = title_line.get_text(" ", strip=True).split("·", 1)[0].strip()
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
            "phdCompletionStatus": "unknown" if not year else "future-year-in-source" if year > 2026 else "reported-by-source",
        })
assert len({r["id"] for r in records}) == len(records)
assert all(r["name"] and r["currentInstitution"] for r in records)
metadata = {
    "source": "OM/SCM Faculty Directory — All Faculty",
    "sourceUrl": SOURCE,
    "downloadedFromUrl": "https://omlist.edutool.org/faculty.html",
    "additionalSourceUrls": [PHD_SOURCE],
    "retrievedAt": RETRIEVED,
    "recordCount": len(records),
    "statusCounts": status_counts,
    "disciplineCounts": dict(collections.Counter(r["discipline"] for r in records)),
    "currentInstitutionCount": len({r["currentInstitution"] for r in records}),
    "phdInstitutionCount": len({r["phdInstitution"] for r in records if r["phdInstitution"]}),
    "withPhdYearCount": sum(r["phdYear"] is not None for r in records),
    "withPhdInstitutionCount": sum(r["phdInstitution"] is not None for r in records),
    "withTenureYearCount": sum(r["tenureYear"] is not None for r in records),
    "futurePhdYearCount": sum(bool(r["phdYear"] and r["phdYear"] > 2026) for r in records),
    "phdYearRange": [min(r["phdYear"] for r in records if r["phdYear"]), max(r["phdYear"] for r in records if r["phdYear"])],
    "sourceSnapshotSha256": hashlib.sha256(raw.encode()).hexdigest(),
    "reconciliation": {
        "matchedPhdTableProfiles": sum(bool(r["additionalSourceUrls"]) for r in records),
        "unmatchedDirectoryProfiles": sum(not r["additionalSourceUrls"] for r in records),
        "phdTableProfilesOutsideFacultyDirectory": len(set(phd_by_profile) - {r["sourceProfileUrl"] for r in records}),
        "conflicts": conflicts,
    },
    "limitations": [
        "Complete coverage of every faculty row in the downloaded all-faculty directory; not complete coverage of the profession.",
        "Institution is the directory affiliation, not a verified first placement. For retired/deceased/industry entries it must not be described as a current active faculty appointment.",
        "Doctorate institution is reconciled from the separate PhD table using the exact source profile URL; 22 entries have unknown doctorate year and institution.",
        "The source excludes Industrial Engineering departments and does not establish doctoral degree subject.",
        "First placement and first-placement year are unknown for all records and intentionally null.",
        "One future doctorate year is retained as reported, not represented as a completed PhD.",
        "Public professional facts are source-imported and not independently verified against university biographies.",
        "No school/profile pages were crawled; no private contact details or demographic inferences were imported.",
    ],
}
(BASE / "omlist-complete-faculty.json").write_text(json.dumps({"metadata": metadata, "faculty": records}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(json.dumps(metadata, ensure_ascii=False, indent=2))
