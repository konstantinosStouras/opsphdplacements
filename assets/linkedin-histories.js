import {dataUrl} from './data-url.js';
import {isSourceUrl, fold} from './model.js';

export function isLinkedInProfileUrl(value) {
  if (!isSourceUrl(value)) return false;
  const url = new URL(value);
  return url.protocol === 'https:' && (url.hostname === 'linkedin.com' || url.hostname.endsWith('.linkedin.com')) && /^\/in\/[^/]+\/?$/.test(url.pathname);
}
export function checkedDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z)?$/.test(value)) return 'Unknown';
  const date = new Date(value);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0,10) === value.slice(0,10) ? value.replace('T',' ').replace('Z',' UTC') : 'Unknown';
}
export function historyStatus(record) {
  return record.profileHistoryComplete === true ? 'All accessible profile entries checked' : 'Partial review — full profile history not confirmed';
}
export function roleDates(job) {
  return `${job.start?.asWritten || 'Start date unknown'} – ${job.isCurrent === true ? 'Present (as reported)' : job.end?.asWritten || 'End date unknown'}`;
}
export function validateHistories(data) {
  if (data?.version !== 1 || !Array.isArray(data.records)) throw Error('Invalid LinkedIn history dataset');
  const ids = new Set();
  for (const record of data.records) {
    if (!record.id || ids.has(record.id) || !record.name || !Array.isArray(record.recordIds) || !record.recordIds.length || !isLinkedInProfileUrl(record.profileUrl) || checkedDate(record.checkedAt) === 'Unknown' || checkedDate(record.updatedAt) === 'Unknown' || typeof record.profileHistoryComplete !== 'boolean' || !Array.isArray(record.jobs)) throw Error('Invalid LinkedIn history record');
    ids.add(record.id);
    for (const job of record.jobs) if (!job.employerAsWritten || !job.titleAsWritten || !isSourceUrl(job.sourceUrl) || checkedDate(job.checkedAt) === 'Unknown') throw Error('Invalid LinkedIn role evidence');
  }
  return data;
}
const node = (tag, text, cls) => { const element = document.createElement(tag); if (text != null) element.textContent = text; if (cls) element.className = cls; return element; };
const sourceLink = (label, url) => { const element = node('a', label); if (isSourceUrl(url)) { element.href = url; element.target = '_blank'; element.rel = 'noopener noreferrer'; } return element; };

export async function renderLinkedInHistories(section) {
  const note = section.querySelector('[data-history-note]'), results = section.querySelector('[data-history-results]'), query = section.querySelector('input');
  let records;
  try {
    const response = await fetch(dataUrl('data/linkedin-histories.json'), {cache:'no-cache'});
    if (!response.ok) throw Error('Unavailable');
    records = validateHistories(await response.json()).records;
  } catch { note.textContent = 'LinkedIn histories are currently unavailable. A profile opening alone does not establish a completed history review.'; return; }
  query.disabled = false;
  function render() {
    const terms = fold(query.value).split(' ').filter(Boolean);
    const shown = records.filter(record => terms.every(term => fold([record.name, ...record.jobs.flatMap(job => [job.employerAsWritten, job.titleAsWritten])].join(' ')).includes(term)));
    note.textContent = `${shown.length} of ${records.length} profile reviews shown. ${records.filter(record => record.profileHistoryComplete).length} have all accessible entries checked. LinkedIn information is self-reported; missing jobs and dates remain unknown.`;
    results.replaceChildren();
    for (const record of shown) {
      const card = node('article', null, 'profile-box'); card.id = `linkedin-${record.id}`;
      card.append(node('h3', record.name), sourceLink('Open LinkedIn profile ↗', record.profileUrl), node('p', `Last checked: ${checkedDate(record.checkedAt)} · Last updated: ${checkedDate(record.updatedAt)}`, 'record-dates'), node('p', historyStatus(record), 'notice'));
      card.append(node('p', 'Completion describes the accessible profile entries on the check date. It does not establish a complete real-world career or a first job.'));
      const list = node('ol');
      for (const job of record.jobs) {
        const item = node('li'); item.append(node('strong', `${job.titleAsWritten} — ${job.employerAsWritten}`), node('p', roleDates(job)), node('p', job.evidenceNote || ''), sourceLink('Role source ↗', job.sourceUrl), node('small', `Checked ${checkedDate(job.checkedAt)}`)); list.append(item);
      }
      card.append(list);
      if (!record.jobs.length) card.append(node('p','No role entries captured yet.'));
      if (record.otherEmploymentMentions?.length) card.append(node('h4','Other employment mentioned on the profile'));
      for (const mention of record.otherEmploymentMentions || []) {
        if (typeof mention === 'string') { card.append(node('p', mention)); continue; }
        const item = node('div');
        item.append(node('strong', `${mention.titleAsWritten || 'Title unknown'} — ${mention.employerAsWritten || 'Employer unknown'}`), node('p',roleDates(mention)), node('p',mention.evidenceNote || ''));
        if (mention.sourceUrl) item.append(sourceLink('Mention source ↗',mention.sourceUrl));
        item.append(node('small',`Checked ${checkedDate(mention.checkedAt)}`)); card.append(item);
      }
      for (const [label, values] of [['Unknowns',record.remainingUnknowns],['Access limitations',record.accessLimitations]]) if (values?.length) card.append(node('p', `${label}: ${values.join(' · ')}`));
      results.append(card);
    }
  }
  query.addEventListener('input', render); render();
}
