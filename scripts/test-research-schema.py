"""Integrity checks for longitudinal evidence; no network or production mutations."""
from pathlib import Path
import sqlite3
import unittest


class ResearchSchemaTests(unittest.TestCase):
    def setUp(self):
        self.db = sqlite3.connect(":memory:")
        self.db.executescript((Path(__file__).resolve().parents[1] / "database/schema.sql").read_text(encoding="utf-8"))
        self.db.execute("INSERT INTO person VALUES ('graduate','Graduate','2026-10-16')")
        self.db.execute("INSERT INTO source(source_id,url,title,retrieved_at) VALUES ('source','https://example.edu/cv','CV','2026-10-16')")

    def tearDown(self):
        self.db.close()

    def test_verified_fact_requires_date_and_exactly_one_target(self):
        with self.assertRaises(sqlite3.IntegrityError):
            self.db.execute("INSERT INTO claim(claim_id,person_id,field_name,source_id,evidence_note,review_status) VALUES ('undated','graduate','name','source','Named in CV','verified')")
        with self.assertRaises(sqlite3.IntegrityError):
            self.db.execute("INSERT INTO claim(claim_id,field_name,source_id,evidence_note,review_status) VALUES ('orphan','name','source','No target','pending')")

    def test_failed_recheck_does_not_renew_confirmation(self):
        self.db.execute("INSERT INTO claim(claim_id,person_id,field_name,source_id,evidence_note,review_status,reviewed_at) VALUES ('fact','graduate','name','source','Named in CV','verified','2026-10-16')")
        self.db.execute("INSERT INTO claim_check VALUES ('retry','fact','source','2026-11-01','source-unavailable','Page unavailable','reviewer')")
        self.assertEqual(self.db.execute("SELECT last_checked_at FROM claim_last_check").fetchone()[0], "2026-11-01")
        self.assertEqual(self.db.execute("SELECT last_confirmed_at FROM claim_last_confirmation").fetchone()[0], "2026-10-16")

    def test_historical_programs_allow_later_completions(self):
        self.db.execute("INSERT INTO organization VALUES ('uni','University','university',NULL)")
        self.db.execute("INSERT INTO program(program_id,organization_id,name,scope_status) VALUES ('old','uni','Former OR doctorate','in-scope')")
        self.db.execute("INSERT INTO program_period(period_id,program_id,status,start_lower,start_upper) VALUES ('end','old','admissions-ended','2010-01-01','2010-12-31')")
        self.db.execute("INSERT INTO doctorate(doctorate_id,person_id,program_id,completion_status,award_lower,award_upper,award_precision) VALUES ('degree','graduate','old','verified-completed','2014-01-01','2014-12-31','year')")
        self.assertEqual(self.db.execute("PRAGMA foreign_key_check").fetchall(), [])

    def test_duplicate_work_and_authorship_rejected(self):
        self.db.execute("INSERT INTO publication(publication_id,title,doi,work_type) VALUES ('work','Paper','10.1234/example','journal-article')")
        with self.assertRaises(sqlite3.IntegrityError):
            self.db.execute("INSERT INTO publication(publication_id,title,doi,work_type) VALUES ('duplicate','Paper','10.1234/example','journal-article')")
        self.db.execute("INSERT INTO authorship VALUES ('author','work','graduate','Graduate',1)")
        with self.assertRaises(sqlite3.IntegrityError):
            self.db.execute("INSERT INTO authorship VALUES ('duplicate-author','work','graduate','G. Graduate',2)")


if __name__ == '__main__':
    unittest.main()
