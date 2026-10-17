#!/bin/bash
# Merge first-job proposals for faculty-page chunks, rebuild, check, publish. Usage: merge-fj.sh "IN_REVIEW_LIST" N [N...]
set -e
cd /home/user/opsphdplacements
inreview="$1"; shift
# FJ_DIR=placements-omlist merges OM List proposals; the default is the faculty-page folder.
dir="${FJ_DIR:-placements-roster}"; who=$(case "$dir" in placements-omlist) echo "OM List people";; second-pass) echo "the second pass on unresolved reviews";; *) echo "faculty-page people";; esac)
files=(); for n in "$@"; do files+=("research/$dir/proposal-$n.json"); done
node scripts/merge-placement-research.mjs "${files[@]}"
node scripts/build-institutions.mjs | tail -1
node scripts/build-entities.mjs | tail -1
npm run check > /tmp/opsphd-check.log 2>&1 || { echo "CHECK FAILED:"; grep -E "Error" /tmp/opsphd-check.log | head -5; exit 1; }
grep -E "ledger|placement" /tmp/opsphd-check.log | head -3
node scripts/update-research-status.mjs
node scripts/build.mjs | tail -1
if [ -n "$inreview" ]; then node scripts/update-roster-notes.mjs --first-job-in-review "$inreview" | head -1; else node scripts/update-roster-notes.mjs | head -1; fi
git add data/placements.json data/research-status.json data/institutions.json data/employers.json data/entities.json RESEARCH-STATUS.md TODO.md PAUSED-HANDOFF.md DATA-PROVENANCE.md
git commit -q -F - <<MSG
Merge first-job research for $who, chunk(s) $* (verified by an adversarial second reviewer before merging)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01PUoaBtan3V6ye4Pv3sNgDq
MSG
for i in 1 2 3 4 5; do git push -u origin claude/loving-hawking-o7kge0 2>&1 | tail -1 && break || sleep $((2**i)); done
for i in 1 2 3 4 5; do git push origin HEAD:main 2>&1 | tail -1 && break || sleep $((2**i)); done
python3 -c "import json;m=json.load(open('data/research-status.json'))['metadata'];print('ledger', m['counts'], 'faculty-page', m['bySource']['faculty-page'])"
