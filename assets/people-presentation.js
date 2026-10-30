// Reviewed presentation pilot. Imported records and historical checks stay intact.
export const PILOT_PERSON='roster:georgia-institute-of-technology:a-mehrotra';
export const isPilot = record => (record.facultyId||record.id)===PILOT_PERSON;
export function presentPerson(record){
  return isPilot(record)?{...record,name:'Anuj Mehrotra'}:record;
}
export function renderPilotHistory(record,historyCell,checkedCell){
  if(!isPilot(record))return false;
  const make=(tag,text)=>{const node=document.createElement(tag);node.textContent=text;return node;};
  const history=record.careerHistory;
  if(!history){historyCell.textContent='Not yet researched';return true;}
  const details=make('details','');
  details.append(make('summary',`${history.jobs.length} recorded roles`));
  let employer,section;
  for(const job of history.jobs){
    if(job.employerAsWritten!==employer){
      employer=job.employerAsWritten;section=make('div','');
      section.append(make('strong',employer||'Employer not recorded'));details.append(section);
    }
    section.append(make('p',`${job.start?.asWritten||'Start not recorded'} – ${job.end?.asWritten||'End not recorded'}: ${job.titleAsWritten||'Role not recorded'}`));
  }
  const mentions=(history.otherEmploymentMentions||[]).map(j=>[j.employerAsWritten,j.titleAsWritten].filter(Boolean).join(' — ')).filter(Boolean);
  if(mentions.length){const other=make('details','');other.append(make('summary','Other appointments and service · dates not recorded'));for(const text of mentions)other.append(make('p',text));details.append(other);}
  historyCell.append(details);
  checkedCell.append(make('span','Career history: '+history.checkedAt),make('small','Name and current role: 2026-10-30'));
  return true;
}
// Applied only to the pilot; URLs still come exclusively from the private catalog.
export function pilotSource(source){
  const url=new URL(source.url);
  if(url.hostname==='www.scheller.gatech.edu'&&url.pathname.includes('/directory/faculty/'))return {...source,label:'Academic biography',priority:0};
  if(url.hostname==='linkedin.com'||url.hostname.endsWith('.linkedin.com'))return {...source,label:'LinkedIn',priority:1};
  return {...source,priority:2};
}
