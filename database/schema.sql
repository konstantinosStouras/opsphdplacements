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
-- A closure of admissions does not imply that degree awards ended that year.
CREATE TABLE program_period (
  period_id TEXT PRIMARY KEY,
  program_id TEXT NOT NULL REFERENCES program(program_id),
  status TEXT NOT NULL CHECK(status IN ('active','admissions-suspended','admissions-ended','closed','unknown')),
  start_lower TEXT,
  start_upper TEXT,
  end_lower TEXT,
  end_upper TEXT,
  date_original TEXT,
  CHECK(start_lower IS NULL OR start_upper IS NULL OR start_lower <= start_upper),
  CHECK(end_lower IS NULL OR end_upper IS NULL OR end_lower <= end_upper)
);
CREATE TABLE program_relationship (
  relationship_id TEXT PRIMARY KEY,
  predecessor_id TEXT NOT NULL REFERENCES program(program_id),
  successor_id TEXT NOT NULL REFERENCES program(program_id),
  relationship_type TEXT NOT NULL CHECK(relationship_type IN ('renamed','merged','split','transferred','successor')),
  effective_lower TEXT,
  effective_upper TEXT,
  CHECK(predecessor_id <> successor_id),
  CHECK(effective_lower IS NULL OR effective_upper IS NULL OR effective_lower <= effective_upper)
);
-- Advisors are people, but their presence does not make them a graduate in scope.
CREATE TABLE advising (
  advising_id TEXT PRIMARY KEY,
  doctorate_id TEXT NOT NULL REFERENCES doctorate(doctorate_id),
  advisor_person_id TEXT NOT NULL REFERENCES person(person_id),
  role TEXT NOT NULL CHECK(role IN ('advisor','co-advisor','committee-chair','committee-member','unknown')),
  UNIQUE(doctorate_id,advisor_person_id,role)
);
CREATE TABLE publication (
  publication_id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  doi TEXT UNIQUE,
  venue TEXT,
  work_type TEXT NOT NULL CHECK(work_type IN ('journal-article','conference-paper','book','chapter','dissertation','preprint','other','unknown')),
  version_of_id TEXT REFERENCES publication(publication_id),
  CHECK(version_of_id IS NULL OR version_of_id <> publication_id)
);
CREATE TABLE publication_date (
  date_id TEXT PRIMARY KEY,
  publication_id TEXT NOT NULL REFERENCES publication(publication_id),
  date_type TEXT NOT NULL CHECK(date_type IN ('first-online','print','accepted','preprint-posted','unknown')),
  date_lower TEXT,
  date_upper TEXT,
  precision TEXT NOT NULL CHECK(precision IN ('day','month','year','interval','unknown')),
  original_text TEXT,
  CHECK(date_lower IS NULL OR date_upper IS NULL OR date_lower <= date_upper)
);
CREATE TABLE authorship (
  authorship_id TEXT PRIMARY KEY,
  publication_id TEXT NOT NULL REFERENCES publication(publication_id),
  person_id TEXT NOT NULL REFERENCES person(person_id),
  author_name_as_published TEXT NOT NULL,
  author_order INTEGER CHECK(author_order > 0),
  UNIQUE(publication_id,person_id)
);
-- A calendar-year cutoff must not be confused with the actual degree date.
CREATE TABLE degree_publication (
  assessment_id TEXT PRIMARY KEY,
  doctorate_id TEXT NOT NULL REFERENCES doctorate(doctorate_id),
  publication_id TEXT NOT NULL REFERENCES publication(publication_id),
  cutoff_rule TEXT NOT NULL CHECK(cutoff_rule IN ('through-phd-calendar-year','by-degree-date')),
  inclusion_status TEXT NOT NULL CHECK(inclusion_status IN ('included','excluded','uncertain')),
  date_id TEXT REFERENCES publication_date(date_id),
  rationale TEXT NOT NULL,
  checked_at TEXT NOT NULL,
  UNIQUE(doctorate_id,publication_id,cutoff_rule)
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
  period_id TEXT REFERENCES program_period(period_id),
  relationship_id TEXT REFERENCES program_relationship(relationship_id),
  advising_id TEXT REFERENCES advising(advising_id),
  publication_id TEXT REFERENCES publication(publication_id),
  publication_date_id TEXT REFERENCES publication_date(date_id),
  authorship_id TEXT REFERENCES authorship(authorship_id),
  publication_assessment_id TEXT REFERENCES degree_publication(assessment_id),
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
  CHECK(review_status NOT IN ('verified','contradicted','superseded') OR reviewed_at IS NOT NULL),
  CHECK((person_id IS NOT NULL)+(doctorate_id IS NOT NULL)+(event_id IS NOT NULL)+(program_id IS NOT NULL)+(organization_id IS NOT NULL)+(period_id IS NOT NULL)+(relationship_id IS NOT NULL)+(advising_id IS NOT NULL)+(publication_id IS NOT NULL)+(publication_date_id IS NOT NULL)+(authorship_id IS NOT NULL)+(publication_assessment_id IS NOT NULL)=1)
);
-- Rechecking an unchanged fact adds a row; it does not erase earlier reviews.
CREATE TABLE claim_check (
  check_id TEXT PRIMARY KEY,
  claim_id TEXT NOT NULL REFERENCES claim(claim_id),
  source_id TEXT NOT NULL REFERENCES source(source_id),
  checked_at TEXT NOT NULL,
  result TEXT NOT NULL CHECK(result IN ('confirmed','contradicted','unresolved','source-unavailable')),
  note TEXT NOT NULL,
  reviewer TEXT NOT NULL
);
CREATE VIEW claim_last_check AS
  SELECT claim_id, MAX(checked_at) AS last_checked_at FROM (
    SELECT claim_id, reviewed_at AS checked_at FROM claim WHERE reviewed_at IS NOT NULL
    UNION ALL SELECT claim_id, checked_at FROM claim_check
  ) GROUP BY claim_id;
CREATE VIEW claim_last_confirmation AS
  SELECT claim_id, MAX(checked_at) AS last_confirmed_at FROM (
    SELECT claim_id, reviewed_at AS checked_at FROM claim WHERE review_status='verified'
    UNION ALL SELECT claim_id, checked_at FROM claim_check WHERE result='confirmed'
  ) GROUP BY claim_id;
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
