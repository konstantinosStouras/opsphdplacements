# Contributing to Operations PhD Placements

The aim is a historical graduate census covering Operations Management, Operations Research and Industrial Engineering, independent of employment destination. The existing OM List import is one faculty-based research input. It is not the graduate population.

## Start here

1. Read [current status](RESEARCH-STATUS.md) and [remaining work](TODO.md).
2. Read the [research design](RESEARCH-DESIGN.md) and [workflow](WORKFLOW.md).
3. Inspect the public research ledger before researching a person. Use `facultyId` or program ID, not a name alone.
4. Choose a bounded task: a named set of pending people, one unresolved issue, a university's historical programs, or a particular program/cohort. Record ownership in your task handoff before starting.
5. Submit evidence and limitations alongside the change. A useful unresolved review is welcome; an unsupported answer is not.

## Evidence requirements

- Prefer official catalogs, dissertation repositories, commencement records, dated CVs, university appointment announcements and employer biographies.
- Search snippets, directories and aggregators help discover sources. Open the underlying page or document before treating a claim as verified.
- Check names against degree institution/year, advisors, professional identifiers and chronology. Do not merge people by name alone. Preserve name variants.
- Record the degree as awarded. A department's name or a person's present research interests do not establish doctoral specialization. A historical DBA remains a DBA pending an explicit scope decision.
- A first job requires chronology or explicit unrestricted initial-employment evidence. A generic destination table can skip a postdoc; an initial **academic** placement can skip an industry job. Preserve reported destinations separately when sequence is unresolved.
- Keep unknown dates, job titles and appointment types null. A PhD cohort year is not an observed employment start year. Employment that began before graduation is not automatically a new post-PhD job.
- Keep the source publication date, retrieval date and fact review date separate. A failed recheck must not refresh a successful confirmation date.
- Use brief paraphrases and page/section locators. Do not publish complete CVs, large copyrighted extracts or private details.

## Safe collaboration

Existing agents have used three disjoint shards of the original faculty array: index modulo 3 equals 0, 1 or 2. Those are scheduling assignments, not permanent scientific identifiers. Check for active ownership before reusing a shard. New contributors can instead claim small explicit ID lists.

The writable research cache lives under ignored `research/placements-a/`, `research/placements-b/` and `research/placements-c/`. The saved pause snapshot is tracked under `research-handoff/`, including all three result files, audit histories, scripts, discovery indexes and a source catalogue. A fresh clone therefore contains the relevant continuation work. Read `research-handoff/README.md` before resuming, and compare these historical findings with the public ledger; their 1,661 saved reviews were integrated in commit `9fbf00d`. Never assume a missing document cache means a person has not been reviewed. To exchange proposals through Git, use a dedicated branch and a small `proposals/<batch-name>.json` containing public facts and source references only. Do not commit caches or full documents.

Research agents should not publish directly or edit the shared public JSON concurrently. An integrator reviews proposals, reconciles conflicts, runs checks and publishes the combined result. If an existing verified claim turns out to be wrong, correct or downgrade it with a reason; do not preserve it just to keep totals rising.

## Pull request or handoff contents

Include the research scope/IDs, proposed facts, primary sources, check dates, unresolved gaps, changes to previously published facts and validation results. For code changes, explain the user-visible behavior and test the relevant interaction. Record the next unfinished item in your handoff. Link any new schema or methodology decisions in the documentation.

Keep the Markdown guides current with your contribution, as required by the user. Follow the documentation-maintenance step in `WORKFLOW.md`: revise affected instructions and remaining tasks, preserve important decisions, and regenerate the status summary after integrating public data. Distinguish unmerged research from the published dataset. Documentation updates belong with the change they explain, not in an unspecified future cleanup.
