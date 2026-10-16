"""Extract only public professional facts from the permitted OMList PhD table."""
import collections
import hashlib
import json
from pathlib import Path
from urllib.parse import urljoin
from bs4 import BeautifulSoup

BASE = Path(__file__).parent
SOURCE = "https://omlist.edutool.org/phd/by-year.html"
RETRIEVED = "2026-10-16"
raw = (BASE / "omlist-phd.html").read_text(encoding="utf-8-sig")
soup = BeautifulSoup(raw, "html.parser")
records = []
for section in soup.select(".year-section"):
    year = int(section["data-year"])
    for row in section.select("tr.phd-row"):
        cells = row.find_all("td", recursive=False)
        assert len(cells) == 5
        name_link = cells[1].find("a")
        profile = urljoin(SOURCE, name_link["href"])
        phd_link = cells[3].find("a")
        institution_link = cells[4].find("a")
        records.append({
            "id": "omlist-" + hashlib.sha256(profile.encode()).hexdigest()[:16],
            "name": cells[1].get_text(" ", strip=True),
            "discipline": row["data-discipline"],
            "sourceDisciplineLabel": cells[2].get_text(" ", strip=True),
            "phdYear": year,
            "phdInstitution": cells[3].get_text(" ", strip=True),
            "phdInstitutionSourceUrl": urljoin(SOURCE, phd_link["href"]) if phd_link else None,
            "currentInstitution": cells[4].get_text(" ", strip=True),
            "currentInstitutionSourceUrl": urljoin(SOURCE, institution_link["href"]) if institution_link else None,
            "sourceProfileUrl": profile,
            "sourceUrl": SOURCE,
            "retrievedAt": RETRIEVED,
            "firstPlacement": None,
            "firstPlacementYear": None,
            "verificationStatus": "source-imported",
            "phdCompletionStatus": "future-year-in-source" if year > 2026 else "reported-by-source",
        })
assert len({r["id"] for r in records}) == len(records), "Duplicate profile records"
counts = collections.Counter(r["discipline"] for r in records)
metadata = {
    "source": "OM/SCM Faculty Directory",
    "sourceUrl": SOURCE,
    "retrievedAt": RETRIEVED,
    "recordCount": len(records),
    "disciplineCounts": dict(counts),
    "currentInstitutionCount": len({r["currentInstitution"] for r in records}),
    "phdInstitutionCount": len({r["phdInstitution"] for r in records}),
    "phdYearRange": [min(r["phdYear"] for r in records), max(r["phdYear"] for r in records)],
    "sourceSnapshotSha256": hashlib.sha256(raw.encode()).hexdigest(),
    "limitations": [
        "The source reports current institutions, not first placements; first-placement fields are intentionally null.",
        "The PhD-by-year page includes multiple disciplines, and excludes faculty for whom no PhD year is shown.",
        "Operations is a source subject classification, not proof of an Operations Research, Operations Management, or Industrial Engineering doctorate.",
        "A future PhD year is retained as reported and is not presented as a completed doctorate.",
        "Records are imported from OMList and have not been independently verified against university biographies.",
        "The source robots.txt disallows /faculty.html and /schools/ for general crawlers; no automated school/profile crawling was performed.",
    ],
}
(BASE / "omlist-phd-faculty.json").write_text(json.dumps({"metadata": metadata, "faculty": records}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(json.dumps(metadata, ensure_ascii=False, indent=2))
