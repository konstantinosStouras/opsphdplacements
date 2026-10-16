-- Planned canonical schema. Does not infer career events from current affiliations.
PRAGMA foreign_keys = ON;

CREATE TABLE person (
  person_id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE person_identifier (
  person_id TEXT NOT NULL REFERENCES person(person_id),
  namespace TEXT NOT NULL,
  value TEXT NOT NULL,
  PRIMARY KEY(namespace,value)
);
CREATE TABLE organization (
  organization_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  kind TEXT NOT NULL CHECK(kind IN ('university','school','department','company','government','nonprofit','other','unknown')),
  parent_id TEXT REFERENCES organization(organization_id),
  CHECK(parent_id IS NULL OR parent_id <> organization_id)
);
CREATE TABLE organization_alias (
  organization_id TEXT NOT NULL REFERENCES organization(organization_id),
  name TEXT NOT NULL,
  valid_from TEXT,
  valid_to TEXT,
  PRIMARY KEY(organization_id,name)
);
CREATE TABLE source (
  source_id TEXT PRIMARY KEY,
  url TEXT NOT NULL CHECK(url LIKE 'https://%' OR url LIKE 'http://%'),
  title TEXT NOT NULL,
  publisher TEXT,
  document_date TEXT,
  retrieved_at TEXT NOT NULL,
  archive_url TEXT,
  content_sha256 TEXT,
  UNIQUE(url,retrieved_at)
);
CREATE TABLE program (
  program_id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organization(organization_id),
  name TEXT NOT NULL,
  official_field TEXT,
  scope_status TEXT NOT NULL CHECK(scope_status IN ('pending','in-scope','out-of-scope','unresolved')),
  scope_note TEXT,
  scope_source_id TEXT REFERENCES source(source_id)
);
CREATE TABLE doctorate (
  doctorate_id TEXT PRIMARY KEY,
  person_id TEXT NOT NULL REFERENCES person(person_id),
  program_id TEXT REFERENCES program(program_id),
  awarding_organization_id TEXT REFERENCES organization(organization_id),
  degree_title TEXT,
  field TEXT,
  completion_status TEXT NOT NULL CHECK(completion_status IN ('verified-completed','source-reported','candidate','unresolved')),
  award_lower TEXT,
  award_upper TEXT,
  award_precision TEXT NOT NULL DEFAULT 'unknown' CHECK(award_precision IN ('day','month','year','interval','unknown')),
  award_original TEXT,
  defense_lower TEXT,
  defense_upper TEXT,
  market_year INTEGER,
  CHECK(award_lower IS NULL OR award_upper IS NULL OR award_lower <= award_upper),
  CHECK(defense_lower IS NULL OR defense_upper IS NULL OR defense_lower <= defense_upper)
);
CREATE TABLE career_event (
  event_id TEXT PRIMARY KEY,
  person_id TEXT NOT NULL REFERENCES person(person_id),
  organization_id TEXT REFERENCES organization(organization_id),
  event_type TEXT NOT NULL CHECK(event_type IN ('employment','self-employment','education','nonemployment','unknown')),
  title TEXT,
  sector TEXT NOT NULL DEFAULT 'unknown' CHECK(sector IN ('academia','industry','government','nonprofit','self-employment','unknown')),
  appointment_type TEXT NOT NULL DEFAULT 'unknown' CHECK(appointment_type IN ('tenure-track','tenured','fixed-term-faculty','teaching','research-staff','postdoc','professional-employee','founder','consultant','unknown')),
  start_lower TEXT,
  start_upper TEXT,
  start_precision TEXT NOT NULL DEFAULT 'unknown' CHECK(start_precision IN ('day','month','year','interval','unknown')),
  start_original TEXT,
  end_lower TEXT,
  end_upper TEXT,
  end_precision TEXT NOT NULL DEFAULT 'unknown' CHECK(end_precision IN ('day','month','year','interval','unknown')),
  end_original TEXT,
  primary_role INTEGER CHECK(primary_role IN (0,1)),
  full_time INTEGER CHECK(full_time IN (0,1)),
  last_observed_at TEXT NOT NULL,
  observation_date_basis TEXT NOT NULL CHECK(observation_date_basis IN ('dated-source','retrieval-only')),
  review_status TEXT NOT NULL CHECK(review_status IN ('pending','verified','unresolved','contradicted')),
  CHECK(start_lower IS NULL OR start_upper IS NULL OR start_lower <= start_upper),
  CHECK(end_lower IS NULL OR end_upper IS NULL OR end_lower <= end_upper),
  CHECK(start_lower IS NULL OR end_upper IS NULL OR start_lower <= end_upper)
);
-- Adjudicated outcome, not MIN(start_year): overlaps and missing dates matter.
CREATE TABLE degree_outcome (
  doctorate_id TEXT NOT NULL REFERENCES doctorate(doctorate_id),
  outcome_type TEXT NOT NULL CHECK(outcome_type IN ('employment-at-completion','first-new-job','first-faculty-job','first-industry-job','department-reported-placement')),
  event_id TEXT REFERENCES career_event(event_id),
  review_status TEXT NOT NULL CHECK(review_status IN ('pending','verified','unresolved','contradicted')),
  rationale TEXT NOT NULL,
  reviewed_at TEXT NOT NULL,
  PRIMARY KEY(doctorate_id,outcome_type)
);
CREATE TABLE claim (
  claim_id TEXT PRIMARY KEY,
  person_id TEXT REFERENCES person(person_id),
  doctorate_id TEXT REFERENCES doctorate(doctorate_id),
  event_id TEXT REFERENCES career_event(event_id),
  program_id TEXT REFERENCES program(program_id),
  organization_id TEXT REFERENCES organization(organization_id),
  field_name TEXT NOT NULL,
  asserted_value TEXT,
  normalized_value TEXT,
  source_id TEXT NOT NULL REFERENCES source(source_id),
  locator TEXT,
  evidence_note TEXT NOT NULL,
  review_status TEXT NOT NULL CHECK(review_status IN ('pending','verified','unresolved','contradicted','superseded')),
  reviewed_at TEXT,
  reviewer TEXT,
  resolution_note TEXT,
  supersedes_claim_id TEXT REFERENCES claim(claim_id),
  CHECK((person_id IS NOT NULL)+(doctorate_id IS NOT NULL)+(event_id IS NOT NULL)+(program_id IS NOT NULL)+(organization_id IS NOT NULL)=1)
);
CREATE TABLE cohort_coverage (
  program_id TEXT NOT NULL REFERENCES program(program_id),
  graduation_year INTEGER NOT NULL,
  official_graduate_total INTEGER CHECK(official_graduate_total >= 0),
  roster_status TEXT NOT NULL CHECK(roster_status IN ('pending','partial','reconciled-complete','unavailable')),
  reconciliation_note TEXT NOT NULL,
  reviewed_at TEXT NOT NULL,
  PRIMARY KEY(program_id,graduation_year)
);
CREATE TABLE cohort_source (
  program_id TEXT NOT NULL,
  graduation_year INTEGER NOT NULL,
  source_id TEXT NOT NULL REFERENCES source(source_id),
  PRIMARY KEY(program_id,graduation_year,source_id),
  FOREIGN KEY(program_id,graduation_year) REFERENCES cohort_coverage(program_id,graduation_year)
);
CREATE TABLE research_review (
  review_id TEXT PRIMARY KEY,
  person_id TEXT REFERENCES person(person_id),
  program_id TEXT REFERENCES program(program_id),
  task TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('pending','verified','unresolved','out-of-scope')),
  rationale TEXT NOT NULL,
  next_step TEXT,
  reviewer TEXT NOT NULL,
  reviewed_at TEXT NOT NULL,
  CHECK((person_id IS NOT NULL)+(program_id IS NOT NULL)=1)
);
CREATE TABLE review_source (
  review_id TEXT NOT NULL REFERENCES research_review(review_id),
  source_id TEXT NOT NULL REFERENCES source(source_id),
  PRIMARY KEY(review_id,source_id)
);
CREATE TABLE revision (
  revision_id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  field_name TEXT NOT NULL,
  previous_value TEXT,
  replacement_value TEXT,
  rationale TEXT NOT NULL,
  source_id TEXT REFERENCES source(source_id),
  changed_at TEXT NOT NULL,
  release_id TEXT NOT NULL
);
CREATE INDEX career_person_dates ON career_event(person_id,start_lower,start_upper);
CREATE INDEX claim_source ON claim(source_id);
CREATE INDEX doctorate_cohort ON doctorate(program_id,award_lower,award_upper);
