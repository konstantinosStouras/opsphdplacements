"""Extract public professional facts from a locally saved OMList PhD table."""
import argparse
import collections
from datetime import date
import hashlib
import json
from pathlib import Path
from urllib.parse import urljoin
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--input-dir", type=Path, default=ROOT / "research", help="Directory containing omlist-phd.html")
parser.add_argument("--retrieved-date", type=date.fromisoformat, required=True, help="Actual source retrieval date, YYYY-MM-DD")
parser.add_argument("--output", type=Path, help="Output JSON (default: INPUT_DIR/omlist-phd-faculty.json)")
args = parser.parse_args()
BASE = args.input_dir
OUTPUT = args.output or BASE / "omlist-phd-faculty.json"
SOURCE = "https://omlist.edutool.org/phd/by-year.html"
RETRIEVED = args.retrieved_date.isoformat()
raw = (BASE / "omlist-phd.html").read_text(encoding="utf-8-sig")
soup = BeautifulSoup(raw, "html.parser")
records = []
source_year_counts = {}
PLACEHOLDERS = {"", "-", "—", "–", "n/a", "na", "unknown", "not available"}
for section in soup.select(".year-section"):
    year = int(section["data-year"])
    rows = section.select("tr.phd-row")
    stated_count = int(section.select_one("h2 .badge").get_text(strip=True))
    if len(rows) != stated_count:
        raise ValueError(f"PhD section {year}: expected {stated_count}, found {len(rows)}")
    source_year_counts[str(year)] = stated_count
    for row in rows:
        cells = row.find_all("td", recursive=False)
        assert len(cells) == 5
        name_link = cells[1].find("a")
        profile = urljoin(SOURCE, name_link["href"])
        phd_link = cells[3].find("a")
        institution_link = cells[4].find("a")
        raw_phd_institution = cells[3].get_text(" ", strip=True)
        phd_institution = None if raw_phd_institution.casefold() in PLACEHOLDERS else raw_phd_institution
        records.append({
            "id": "omlist-" + hashlib.sha256(profile.encode()).hexdigest()[:16],
            "name": cells[1].get_text(" ", strip=True),
            "discipline": row["data-discipline"],
            "sourceDisciplineLabel": cells[2].get_text(" ", strip=True),
            "phdYear": year,
            "phdInstitution": phd_institution,
            "phdInstitutionSourceUrl": urljoin(SOURCE, phd_link["href"]) if phd_link else None,
            "currentInstitution": cells[4].get_text(" ", strip=True),
            "currentInstitutionSourceUrl": urljoin(SOURCE, institution_link["href"]) if institution_link else None,
            "sourceProfileUrl": profile,
            "sourceUrl": SOURCE,
            "retrievedAt": RETRIEVED,
            "firstPlacement": None,
            "firstPlacementYear": None,
            "verificationStatus": "source-imported",
            "phdCompletionStatus": "future-year-in-source" if year > args.retrieved_date.year else "reported-by-source",
        })
        if phd_institution is None:
            records[-1]["sourceRawPhdInstitution"] = raw_phd_institution
assert len({r["id"] for r in records}) == len(records), "Duplicate profile records"
if not records:
    raise ValueError("No PhD rows found; source HTML structure may have changed")
counts = collections.Counter(r["discipline"] for r in records)
metadata = {
    "source": "OM/SCM Faculty Directory",
    "sourceUrl": SOURCE,
    "retrievedAt": RETRIEVED,
    "recordCount": len(records),
    "sourceYearCounts": source_year_counts,
    "sourceDeclaredRecordCount": sum(source_year_counts.values()),
    "disciplineCounts": dict(counts),
    "currentInstitutionCount": len({r["currentInstitution"] for r in records}),
    "phdInstitutionCount": len({r["phdInstitution"] for r in records if r["phdInstitution"]}),
    "withPhdInstitutionCount": sum(r["phdInstitution"] is not None for r in records),
    "missingPhdInstitutionCount": sum(r["phdInstitution"] is None for r in records),
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
OUTPUT.parent.mkdir(parents=True, exist_ok=True)
OUTPUT.write_text(json.dumps({"version": 1, "metadata": metadata, "records": records}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(json.dumps({"output": str(OUTPUT.resolve()), "records": len(records), "sourceDeclaredRecords": sum(source_year_counts.values()), "missingPhdInstitution": metadata["missingPhdInstitutionCount"]}, ensure_ascii=False))
