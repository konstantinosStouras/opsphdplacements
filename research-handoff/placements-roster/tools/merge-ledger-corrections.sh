#!/bin/bash
# Merge reviewed correction files (full replacement rows for published ledger entries), rebuild, check, publish.
# Usage: merge-ledger-corrections.sh "<commit subject>" file.json [file.json ...]
set -e
cd "$(dirname "$0")/../../.."
subject="$1"; shift
node scripts/merge-placement-research.mjs "$@" | cut -c1-200
node scripts/geocode-institutions.mjs 2>&1 | tail -1
node scripts/geocode-institutions.mjs employers 2>&1 | tail -1
node scripts/wikidata-countries.mjs 2>&1 | tail -3 | head -2
node scripts/build-institutions.mjs | tail -1
node scripts/build-entities.mjs | tail -1
npm run check > /tmp/opsphd-check.log 2>&1 || { echo "CHECK FAILED:"; grep -E "Error" /tmp/opsphd-check.log | head -5; exit 1; }
# The publish workflow also runs these; a failure here means the live site would not update.
python3 scripts/test-research-schema.py > /tmp/opsphd-schema.log 2>&1 && python3 scripts/build-research-database.py > /tmp/opsphd-db.log 2>&1 || { echo "DATABASE CHECK FAILED:"; tail -3 /tmp/opsphd-schema.log /tmp/opsphd-db.log; exit 1; }
node scripts/update-research-status.mjs
node scripts/build.mjs | tail -1
node scripts/update-roster-notes.mjs --first-job-in-review "${INREVIEW:-}" | head -1
git add data/ RESEARCH-STATUS.md TODO.md PAUSED-HANDOFF.md DATA-PROVENANCE.md assets/logos/
git commit -q -F - <<MSG
$subject

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01PUoaBtan3V6ye4Pv3sNgDq
MSG
branch=$(git rev-parse --abbrev-ref HEAD)
for i in 1 2 3 4; do git push -q -u origin "$branch" && break || sleep $((2**i)); done
for i in 1 2 3 4; do git push -q origin HEAD:main && break || sleep $((2**i)); done
git log --oneline -1
python3 -c "import json;m=json.load(open('data/research-status.json'))['metadata'];print('ledger', m['counts'])"
