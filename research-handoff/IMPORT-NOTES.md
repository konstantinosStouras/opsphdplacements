# OMList source import

Retrieved 16 October 2026 from <https://omlist.edutool.org/phd/by-year.html>.

## Complete requested faculty directory

Use `omlist-complete-faculty.json` for the requested <https://omlist.edutool.org/faculty> directory. It contains every one of the 2,149 directory rows: 2,101 active, 2 industry/practice, 36 retired and 10 deceased. These span 202 directory-affiliation institutions. Disciplines are 1,853 Operations, 261 Supply Chain Management and 35 Decision Sciences. The site's section counts exactly match the extracted row counts, and all 2,149 profile URLs are unique.

`extract_complete_faculty.py` processes the already-downloaded public faculty HTML locally and joins the doctorate table by exact profile URL. There are 2,127 exact joins with no conflicting name, year or affiliation values. These provide 370 distinct doctorate institutions. The 22 unmatched profiles have missing doctorate year and institution, explicitly represented as `null`. There are 1,011 reported tenure years and one future doctorate year (2027). The separate doctorate table contains 477 additional profiles outside this all-faculty directory; those are intentionally not mixed into the complete requested directory import.

The complete dataset adds public professional title, source faculty status, tenure year, topical/methodological tags and per-record source links. Research tags retain source classifications and should not be treated as verified PhD subjects. For retired/deceased/industry entries, display the institution as a directory affiliation with the status visible, rather than asserting a current active appointment. First-placement fields remain `null` throughout.

The earlier 2,604-record doctorate-only import remains available below for provenance and broader optional coverage, but is not the primary website dataset.

## Initial doctorate table import

`omlist-phd-faculty.json` contains `metadata` and `faculty`. `extract_phd.py` reproduces this dataset from the saved `omlist-phd.html` page; it requires BeautifulSoup 4. No university biography/profile pages were crawled. The downloaded HTML is a research snapshot and should not be deployed as website content.

The import contains all 2,604 unique faculty profile links listed on the source PhD-by-year page, across 201 current institutions and 412 doctorate institutions. Source PhD years range from 1953 to 2027. The single future-year record is explicitly flagged. The source table contains 1,859 Operations, 263 Supply Chain Management and 36 Decision Sciences records; the other 446 entries retain their original discipline labels. Matching source section counts and HTML row counts both total 2,604.

Recommended website mapping:

* Name → person name, linked to `sourceProfileUrl`.
* PhD university/year → source-reported doctorate institution/year.
* Current institution → current affiliation, never relabeled as a first placement.
* Discipline → source area classification, not verified doctoral degree subject.
* First placement and first-placement year → unknown (`null`) until separately verified.
* All entries → source-imported, with source URL and retrieval date shown.
* Default operations filter → Operations, Supply Chain Management, Decision Sciences; provide an all-source-disciplines option.

Coverage is not complete for all people on the source's all-faculty table: its PhD-by-year table requires a reported year. The source's homepage currently advertises 2,115 tenure-track OM faculty and 202 schools, while its methodology page reports 2,101 tenure-track OM/SCM faculty. These figures have different scope from the 2,604 mixed-discipline doctorate records and should not be used as equivalent counts.

The [methodology](https://omlist.edutool.org/methodology.html) states that Industrial Engineering departments are not tracked. Therefore this source cannot, by itself, deliver complete OR/OM/IE coverage. It focuses on business schools, and its department/topic classifications are not proof of doctoral degree subject. Current positions are not initial placement histories.

The site's [robots.txt](https://omlist.edutool.org/robots.txt) disallows `/faculty.html` and `/schools/` for general crawlers. The source homepage, robots, all-faculty HTML, doctorate table and methodology were initially downloaded. Following the user's explicit request for the public faculty directory, the already-downloaded HTML was processed locally without additional page requests. No login, CAPTCHA or technical access controls were encountered or bypassed; no school/profile pages were crawled. Any future network refresh must account for this crawler guidance; the extraction scripts themselves perform no network requests. Do not deploy the raw source HTML.

No private contact information, inferred demographic characteristics, research scores, paper abstracts or copied biographies were imported.
