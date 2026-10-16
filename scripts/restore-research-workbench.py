"""Preview or restore saved work products after an authorized resumption.

No networking or script execution. Never overwrite an existing differing file.
Downloaded documents are deliberately not restored as fake empty source caches.
"""
import argparse
import hashlib
import json
from pathlib import Path
import shutil

root = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--apply', action='store_true', help='Copy missing work products; default is preview only.')
args = parser.parse_args()
inventory = json.loads((root / 'research-handoff/file-inventory.json').read_text(encoding='utf-8'))
workbench = (root / 'research').resolve()
counts = {'missing': 0, 'identical': 0, 'different_preserved': 0}
for entry in inventory['files']:
    if entry['disposition'] != 'published-work-product':
        continue
    source = (root / entry['githubPath']).resolve()
    destination = (workbench / entry['path']).resolve()
    if not source.is_relative_to(root / 'research-handoff') or not destination.is_relative_to(workbench):
        raise ValueError('Invalid archive path')
    if destination.exists():
        same = hashlib.sha256(source.read_bytes()).digest() == hashlib.sha256(destination.read_bytes()).digest()
        counts['identical' if same else 'different_preserved'] += 1
        continue
    counts['missing'] += 1
    if args.apply:
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(source, destination)
print(('Restoration' if args.apply else 'Preview') + ': ' + json.dumps(counts))
print('Existing files preserved. Source documents must be retrieved from the catalogue as needed.')
