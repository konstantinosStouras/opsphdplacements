import { html } from './charts.js';
import {hasNamedOperationsScope} from './program-model.js';

export const reviewLabels = {
  reviewed: 'Official-source review completed',
  partial: 'Partially reviewed',
  blocked: 'Source access blocked',
  pending: 'Not yet reviewed'
};
const link = (text, href) => {
  const a = html('a', undefined, text); a.href = href; a.target = '_blank'; a.rel = 'noopener noreferrer'; return a;
};
export function renderUniversityUnits(host, row) {
  host.append(html('span', 'badge', reviewLabels[row.reviewStatus]));
  if (row.units.length) {
    const list = html('ul', 'dept-list verified-units');
    for (const unit of row.units) {
      const item = html('li');
      item.append(link(unit.name, unit.sourceUrl));
      item.append(html('small', 'unit-parent', [hasNamedOperationsScope(unit.school)?unit.school:null, unit.type].filter(Boolean).join(' · ')));
      item.append(html('small', 'unit-check', `Checked ${unit.checkedAt}`));
      const evidence = html('details', 'unit-evidence');
      evidence.append(html('summary', undefined, 'Evidence'), html('p', undefined, unit.evidence));
      for (const s of unit.evidenceSources.slice(1)) evidence.append(link(`Additional source · checked ${s.checkedAt}`, s.sourceUrl));
      item.append(evidence); list.append(item);
    }
    host.append(list);
  } else {
    host.append(html('p', 'unit-empty', row.reviewStatus === 'pending' ? 'Department verification pending.'
      : 'No in-scope academic unit verified from the sources reviewed.'));
  }
  if (row.limitations.length) {
    const gaps = html('details', 'unit-evidence'); gaps.append(html('summary', undefined, 'Review limitations'));
    for (const gap of row.limitations) gaps.append(html('p', undefined, gap));
    host.append(gaps);
  }
  const originals = html('details', 'original-units');
  originals.append(html('summary', undefined, 'Original directory labels and decisions'));
  const list = html('ul', 'dept-list');
  const decisions = new Map(row.reviews.flatMap(r => r.decisions).map(d => [d.sourceDepartmentId, d]));
  for (const original of row.originals) for (const d of original.departments) {
    const namedParts=[d.school,d.department].filter(hasNamedOperationsScope);if(!namedParts.length)continue;
    const li = html('li'), decision = decisions.get(d.id);
    li.append(html('span', undefined, namedParts.join(' · ')));
    li.append(html('small', 'unit-parent', decision ? `${decision.disposition}: ${decision.reason}` : 'Unreviewed imported label'));
    list.append(li);
  }
  if(list.childNodes.length){originals.append(list);host.append(originals);}
}
