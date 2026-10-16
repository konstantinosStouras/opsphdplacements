# Operations PhD Placements

Public website: https://www.stouras.com/opsphdplacements/

An independent, static research directory for Operations Research, Operations Management and Industrial Engineering. The visual organization is inspired by Econ PhD Placements; all application code is original.

## Deployment

Push to `main` to run the GitHub Pages workflow. The project inherits the account site's custom domain; do not add a CNAME pointing the domain at this repository. The workflow publishes only `index.html`, `.nojekyll`, `assets/` and `data/`.

## Data

`data/faculty.json` holds source-reported faculty appointments. `data/placements.json` holds independently verified first placements. Never infer a first placement from a current faculty appointment. No records are included in the initial prototype.

Source directory: https://omlist.edutool.org/faculty

## Local preview

Serve the repository with any static HTTP server, for example `python -m http.server 8765`, then visit http://localhost:8765.
