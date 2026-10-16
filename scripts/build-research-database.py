"""Build a disposable, reproducible SQLite research snapshot from reviewed JSON.

The JSON files remain the source of truth during first-placement collection.
No new career or degree facts are inferred by this exporter.
"""
import hashlib
import json
from pathlib import Path
import sqlite3

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "research" / "operations-careers.sqlite"


def read(name):
    return json.loads((ROOT / "data" / f"{name}.json").read_text(encoding="utf-8"))


def key(prefix, *parts):
    return prefix + "-" + hashlib.sha256(json.dumps(parts, ensure_ascii=False).encode()).hexdigest()[:24]


def build():
    faculty = read("faculty")
    placements = read("placements")
    reviews = read("research-status")
    programs = read("doctoral-programs")
    con = sqlite3.connect(":memory:")
    con.executescript((ROOT / "database" / "schema.sql").read_text(encoding="utf-8"))

    def insert(table, **fields):
        columns = ",".join(fields)
        params = ",".join("?" for _ in fields)
        con.execute(f"INSERT INTO {table} ({columns}) VALUES ({params})", tuple(fields.values()))

    def source(url, title, retrieved):
        sid = key("source", url, retrieved)
        if not con.execute("SELECT 1 FROM source WHERE source_id=?", (sid,)).fetchone():
            insert("source", source_id=sid, url=url, title=title, retrieved_at=retrieved)
        return sid

    def organization(name):
        if not name:
            return None
        # Exact labels only. Similar names require explicit identity adjudication.
        oid = key("org", name)
        if not con.execute("SELECT 1 FROM organization WHERE organization_id=?", (oid,)).fetchone():
            insert("organization", organization_id=oid, name=name, kind="unknown")
        return oid

    def claim(target, entity_id, field, value, sid, note, status="pending", reviewed=None):
        insert("claim", claim_id=key("claim", target, entity_id, field, sid, value),
               **{target: entity_id}, field_name=field,
               asserted_value=json.dumps(value, ensure_ascii=False),
               normalized_value=json.dumps(value, ensure_ascii=False), source_id=sid,
               evidence_note=note, review_status=status, reviewed_at=reviewed,
               reviewer="source review" if reviewed else None)

    for p in programs["records"]:
        oid = organization(p["university"])
        # The university is explicit. A combined school/department label remains a sourced text claim.
        con.execute("UPDATE organization SET kind='university' WHERE organization_id=?", (oid,))
        source_ids = {s["id"]: source(s["url"], s["title"], s["lastCheckedAt"]) for s in p["sources"]}
        insert("program", program_id=p["id"], organization_id=oid, name=p["programName"],
               official_field="; ".join(p["fields"]),
               scope_status="in-scope" if p["degree"] == "PhD" else "unresolved",
               scope_note=p["scopeRationale"], scope_source_id=next(iter(source_ids.values())))
        for fact in p["facts"]:
            # Unknown fields retain investigation notes in the public register; no fact is manufactured.
            if fact["value"] is None:
                continue
            for sid in fact["sourceIds"]:
                claim("program_id", p["id"], fact["field"], fact["value"], source_ids[sid],
                      fact["evidenceNote"], "verified", fact["lastCheckedAt"])
        for i, event in enumerate(p.get("history", [])):
            for sid in event["sourceIds"]:
                claim("program_id", p["id"], f"history-{i}", event, source_ids[sid],
                      event["event"], "verified", event["lastCheckedAt"])
        # No invented opening/closure periods, graduate counts or links to directory doctorates.

    for f in faculty["records"]:
        pid = f["id"]
        insert("person", person_id=pid, display_name=f["name"], created_at=f["retrievedAt"])
        insert("person_identifier", person_id=pid, namespace="omlist-profile", value=f["sourceProfileUrl"])
        fsid = source(f["sourceUrl"], "OM List faculty directory snapshot", f["retrievedAt"])
        for field in ("currentInstitution", "title", "facultyStatus", "discipline"):
            if f.get(field):
                claim("person_id", pid, "directory_" + field, f[field], fsid,
                      "Source directory assertion; not an independently verified employment spell or degree field.")
        did = "doctorate-" + pid
        yr = f.get("phdYear")
        insert("doctorate", doctorate_id=did, person_id=pid,
               awarding_organization_id=organization(f.get("phdInstitution")),
               completion_status="source-reported", award_lower=f"{yr}-01-01" if yr else None,
               award_upper=f"{yr}-12-31" if yr else None,
               award_precision="year" if yr else "unknown", award_original=str(yr) if yr else None)
        dsid = source("https://omlist.edutool.org/phd/by-year.html", "OM List PhD graduates by year", f["retrievedAt"])
        for field in ("phdYear", "phdInstitution"):
            if f.get(field):
                claim("doctorate_id", did, field, f[field], dsid,
                      "Imported source assertion; original value retained even if later evidence corrects it.")

    for r in placements["records"]:
        pid = r["facultyId"]
        eid = r["id"]
        year = r.get("placementYear")
        category = r.get("category")
        # Corporate postdocs remain sector-unknown until a separate sector claim is reviewed.
        sector = category if category in ("industry", "government", "nonprofit") else "unknown"
        appointment = category if category in ("postdoc", "tenure-track") else "unknown"
        insert("career_event", event_id=eid, person_id=pid,
               organization_id=organization(r["employer"]), event_type="employment",
               title=r.get("position"), sector=sector, appointment_type=appointment,
               start_lower=f"{year}-01-01" if year else None,
               start_upper=f"{year}-12-31" if year else None,
               start_precision="year" if year else "unknown", start_original=str(year) if year else None,
               last_observed_at=r["reviewedAt"], observation_date_basis="retrieval-only", review_status="verified")
        # No end date/current flag: the first job may have ended long ago.
        for s in r["sources"]:
            source(s["url"], s["title"], r["retrievedAt"])
        sid = key("source", r["evidenceUrl"], r["retrievedAt"])
        for field in ("employer", "position", "placementYear"):
            if r.get(field) is not None:
                claim("event_id", eid, field, r[field], sid, r["evidenceNote"], "verified", r["reviewedAt"])
        if sector != "unknown":
            claim("event_id", eid, "sector", sector, sid, r["evidenceNote"], "verified", r["reviewedAt"])
        if appointment != "unknown":
            claim("event_id", eid, "appointment_type", appointment, sid, r["evidenceNote"], "verified", r["reviewedAt"])
        did = "doctorate-" + pid
        insert("degree_outcome", doctorate_id=did, outcome_type="first-new-job", event_id=eid,
               review_status="verified", rationale=r["evidenceNote"], reviewed_at=r["reviewedAt"])
        for field, explanation in (("phdYear", "phdYearResolution"), ("phdInstitution", "phdInstitutionResolution")):
            if r.get(explanation):
                claim("doctorate_id", did, field, r[field], sid, r[explanation], "verified", r["reviewedAt"])
                if field == "phdYear":
                    yr = r[field]
                    con.execute("UPDATE doctorate SET award_lower=?,award_upper=?,award_precision='year',award_original=? WHERE doctorate_id=?",
                                (f"{yr}-01-01", f"{yr}-12-31", str(yr), did))
                else:
                    con.execute("UPDATE doctorate SET awarding_organization_id=? WHERE doctorate_id=?", (organization(r[field]), did))

    for r in reviews["records"]:
        # Pending roster entries are inventory, not completed research reviews.
        if r["status"] == "pending":
            continue
        rid = key("review", r["facultyId"], r["checkedAt"])
        status = r["status"] if r["status"] in ("verified", "unresolved") else "unresolved"
        insert("research_review", review_id=rid, person_id=r["facultyId"], task="first post-PhD job",
               status=status, rationale=r["reason"], reviewer="source review", reviewed_at=r["checkedAt"])
        for s in r["sources"]:
            sid = source(s["url"], s["title"], r["checkedAt"])
            con.execute("INSERT OR IGNORE INTO review_source VALUES (?,?)", (rid, sid))
    con.commit()
    if con.execute("PRAGMA foreign_key_check").fetchall():
        raise ValueError("Broken evidence or entity reference")
    if con.execute("PRAGMA integrity_check").fetchone()[0] != "ok":
        raise ValueError("Invalid database")
    count = con.execute("SELECT COUNT(*) FROM career_event").fetchone()[0]
    if count != len(placements["records"]):
        raise ValueError("Career export lost verified placements")
    OUT.parent.mkdir(exist_ok=True)
    temporary = OUT.with_suffix(".build.sqlite")
    if temporary.exists():
        temporary.unlink()
    destination = sqlite3.connect(temporary)
    try:
        con.backup(destination)
    finally:
        destination.close()
    temporary.replace(OUT)
    print(f"Built {OUT}: {len(faculty['records'])} people, {count} first-job events, {len(programs['records'])} program records. No additional careers inferred.")
    con.close()


if __name__ == "__main__":
    build()
