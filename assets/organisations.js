import {loadJson} from './analytics.js';
import {fold,displayText} from './model.js';
import {organisationRows,distinctNames} from './organisation-model.js';
import {renderUniversityUnits} from './university-view.js';

const node=(tag,text)=>{const n=document.createElement(tag);if(text!=null)n.textContent=displayText(text);return n;};
const button=(text,action)=>{const b=node('button',text);b.type='button';b.className='text-button';b.addEventListener('click',action);return b;};

export async function renderOrganisations(section,actions){
 const count=section.querySelector('#organisation-count');
 try{
  const [entities,universities,reviews,programs,faculty,roster,histories,linkedin]=await Promise.all(['entities','universities','university-reviews','doctoral-programs','faculty','faculty-roster-people','employment-histories','linkedin-histories'].map(n=>loadJson('data/'+n+'.json')));
  const rows=organisationRows(entities,universities,reviews,programs,faculty,roster,histories,linkedin);
  const controls=section.querySelector('#organisation-controls'),body=section.querySelector('#organisation-records'),more=section.querySelector('#organisation-more');
  const label=node('label','Search organisations');label.className='search-label';const q=node('input');q.type='search';q.placeholder='Name, alias, country or department';q.setAttribute('aria-label','Search organisations');label.append(q);
  const roleLabel=node('label','Connection');const role=node('select');role.setAttribute('aria-label','Organisation connection');
  for(const [v,t]of [['','All organisations'],['phd','PhD institutions'],['employer','First employers'],['career','Observed career employers'],['affiliation','Directory affiliations'],['units','With reviewed operations units'],['program','With registered doctoral programs']])role.append(new Option(t,v));roleLabel.append(role);
  const countryLabel=node('label','Country');const country=node('select');country.setAttribute('aria-label','Organisation country');country.append(new Option('All countries',''));for(const c of [...new Set(rows.flatMap(r=>r.countries))].sort())country.append(new Option(c,c));countryLabel.append(country);
  const reviewLabel=node('label','Department review');const review=node('select');review.setAttribute('aria-label','Organisation department review');for(const [v,t]of [['','All review states'],['reviewed','Completed'],['partial','Partial'],['blocked','Blocked'],['pending','Pending'],['unlisted','Not in the university review queue']])review.append(new Option(t,v));reviewLabel.append(review);
  const rm=reviews.metadata;const scope=node('p',`${rm.reviewed} of ${rm.sourceRecords} imported university records have completed official-source reviews; ${rm.partial} partial, ${rm.blocked} blocked and ${rm.pending} pending. Other organisations retain their observed names; identity and country coverage remain incomplete.`);scope.className='map-note';controls.before(scope);
  const reset=button('Reset',()=>{q.value='';role.value='';country.value='';review.value='';filter();});controls.replaceChildren(label,roleLabel,countryLabel,reviewLabel,reset);
  let selected=[],shown=0;
  function filter(){const words=fold(q.value).split(/\s+/).filter(Boolean);selected=rows.filter(r=>words.every(w=>r.search.includes(w))&&(!country.value||r.countries.includes(country.value))&&(!review.value||(review.value==='unlisted'?!r.reviews.length:review.value==='reviewed'?r.reviews.length&&r.reviews.every(u=>u.reviewStatus==='reviewed'):r.reviews.some(u=>u.reviewStatus===review.value)))&&(!role.value||(role.value==='phd'?r.phd.length:role.value==='employer'?r.employers.length:role.value==='program'?r.programs.length:role.value==='career'?r.careers?.size:role.value==='affiliation'?r.affiliations?.size:r.reviews.some(u=>u.units.length))));shown=0;body.replaceChildren();draw();}
  function draw(){
   for(const r of selected.slice(shown,shown+40)){
    const tr=node('tr'),identity=node('td'),people=node('td'),evidence=node('td');
    identity.append(node('strong',r.name),node('small',r.countries.join(' · ')||'Country not established'));
    const aliases=distinctNames(r.names,r.name);if(aliases.length){const d=node('details');d.append(node('summary','Other names in sources'),node('p',aliases.join('; ')));identity.append(d);}
    if(r.phd.length){people.append(node('p',r.phd.reduce((s,p)=>s+p.people,0).toLocaleString('en-GB')+' people earned doctorates here'));for(const p of r.phd)people.append(button('Doctoral outcomes: '+p.name,()=>actions.openInstitution(p.name)));}
    if(r.employers.length){people.append(node('p',r.employers.reduce((s,p)=>s+p.verifiedFirstJobs,0).toLocaleString('en-GB')+' verified first jobs started here'));for(const e of r.employers)people.append(button('First hires: '+e.name,()=>actions.openEmployer(e.name)));}
    // Directory affiliations remain observations, never promoted into current jobs.
    for(const name of distinctNames(r.names).filter(n=>actions.hasAffiliation(n)))people.append(button('People listed at '+name,()=>actions.openAffiliation(name)));
    if(r.careers?.size)people.append(button(r.careers.size+' people with observed roles here',()=>actions.openCareers(r.name)));if(!people.childNodes.length)people.textContent='No matched people or first hires yet';
    const detail=node('details');detail.append(node('summary','Organisation evidence and departments'));
    for(const u of r.reviews){renderUniversityUnits(detail,u);for(const review of u.reviews)for(const s of review.sources){const a=node('a','Official evidence ↗');a.href=s.url;a.target='_blank';a.rel='noopener noreferrer';detail.append(a,node('small',(s.outcome==='read'?'Checked ':'Attempted ')+s.checkedAt),node('p',s.note));}}
    if(!r.reviews.length)detail.append(node('p','Operations departments have not been reviewed for this organisation.'));
    for(const p of r.programs){detail.append(node('h4',p.programName),node('p',[p.degree,p.status,p.statusAsOf].filter(Boolean).join(' · ')));for(const fact of p.facts||[])detail.append(node('p',fact.field+': '+(fact.value==null?'Unknown':Array.isArray(fact.value)?fact.value.join('; '):String(fact.value))+' · Checked '+fact.lastCheckedAt));for(const h of p.history||[])detail.append(node('p',(h.year?h.year+': ':'')+h.event+' · Checked '+h.lastCheckedAt));for(const s of p.sources){const a=node('a',s.title+' ↗');a.href=s.url;a.target='_blank';a.rel='noopener noreferrer';detail.append(a,node('small','Checked '+s.lastCheckedAt));}}
    if(!r.programs.length)detail.append(node('p','No doctoral program has been entered in the initial register. This does not establish that none exists.'));
    evidence.append(detail);tr.append(identity,people,evidence);body.append(tr);
   }
   shown=Math.min(shown+40,selected.length);count.textContent=`${shown.toLocaleString('en-GB')} of ${selected.length.toLocaleString('en-GB')} matching organisations shown`;more.hidden=shown>=selected.length;
   if(!selected.length){const tr=node('tr'),td=node('td','No matching organisations. Try another name or reset the filters.');td.colSpan=3;tr.append(td);body.append(tr);}
  }
  q.addEventListener('input',filter);role.addEventListener('change',filter);country.addEventListener('change',filter);review.addEventListener('change',filter);more.addEventListener('click',draw);filter();
 }catch(error){count.textContent='Organisation records could not be loaded. Please reload and try again.';console.error(error);}
}
