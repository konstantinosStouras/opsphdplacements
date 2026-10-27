# Release validation

- Final npm check: all 62 tests passed; dataset, graduate first-job, history, identity, derived-organisation and record-stamp validators passed. Earlier baseline test run hit the known restricted temporary-file issue; rerun with normal filesystem access passed. The first new-data validation identified seven supporting mentions using proposal `note` fields; finish.py maps those to public evidence/name fields without dropping originals.
- Four relational schema tests passed; relational snapshot rebuilt with unchanged faculty denominator (3,215 people, 2,097 first-job events).
- Static build and sharing checks passed. Record dates and whitespace checked before commit.
- All 14,465 older graduate rows and 242 older employment-history rows unchanged. Other public research datasets unchanged except record stamps; audit saved alongside the release.
- Chrome local preview: Ioannis Amazon finding and expanded evidence/history; Coey unknown appointment start; Emma BSC; Wilde February 2023 award; Na defence milestone retaining unresolved first job; Xu nonemployment relocation break. Expanded text/links contained no forbidden dataset filenames, export links or project-repository links.
- Source UI corrected February month rendering and added separately labelled nonemployment entries. Existing source dates preserved. No all-career or cohort-census completeness claim.

Live deployment proof follows in PUBLICATION.md.
