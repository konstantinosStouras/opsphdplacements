import {loadJson} from './analytics.js';
import {fold,displayText} from './model.js';
import {organisationRows,distinctNames} from './organisation-model.js';
import {renderUniversityUnits} from './university-view.js';
import {isCurrentPhdProgramme,programmeLabel} from './program-model.js';

const node=(tag,text)=>{const n=document.createElement(tag);if(text!=null)n.textContent=displayText(text);return n;};
const button=(text,action)=>{const b=node('button',text);b.type='button';b.className='text-button';b.addEventListener('click',action);return b;};
const programmeFields={university:'University',programName:'Programme',degree:'Degree',specialization:'Specialization',school:'School or faculty',department:'Academic unit',fields:'Relevant fields',status:'Programme status',eligibilityScope:'Scope of inclusion',establishedYear:'Programme established',admissionsEndedAt:'Admissions ended',lastDegreeAwardedAt:'Last degree awarded',closureDate:'Programme closed'};
function renderProgramme(parent,p){
 parent.append(node('h4',programmeLabel(p)),node('p',[p.degree,p.status==='active'?'Currently offered':p.status.replaceAll('-',' '),'Checked '+p.lastCheckedAt].filter(Boolean).join(' · ')));
 if(p.programmeType==='dual-title')parent.append(node('p','Dual-title option taken alongside a primary doctorate. '+p.overlapNote));
 if(p.programmeType==='research-training')parent.append(node('p','Research training route; not an additional doctoral award. '+p.overlapNote));
 if(p.school||p.department)parent.append(node('p',[p.school,p.department].filter(Boolean).join(' · ')));
 if(p.phdEligibility==='credential-unresolved')parent.append(node('p','Doctoral provision is documented; the exact awarding credential still needs confirmation.'));
 for(const limitation of p.limitations||[])parent.append(node('p',limitation));
 const facts=node('details');facts.append(node('summary','Programme evidence and history'));
 for(const fact of (p.facts||[]).filter(f=>!['primaryProgrammeIds','programmeType'].includes(f.field)))facts.append(node('p',(programmeFields[fact.field]||'Programme detail')+': '+(fact.value==null?'Unknown':Array.isArray(fact.value)?fact.value.join('; '):String(fact.value))+' · Checked '+fact.lastCheckedAt));
 for(const h of p.history||[])facts.append(node('p',(h.year?h.year+': ':'')+h.event+' · Checked '+h.lastCheckedAt));
 for(const s of p.sources){const a=node('a','Official programme evidence ↗');a.href=s.url;a.target='_blank';a.rel='noopener noreferrer';facts.append(a,node('small','Checked '+s.lastCheckedAt),node('p',s.notes||s.title));}
 parent.append(facts);
}

export async function renderOrganisations(section,actions){
 const count=section.querySelector('#organisation-count');
 try{
  const [entities,universities,reviews,programs,faculty,roster,histories,linkedin]=await Promise.all(['entities','universities','university-reviews','doctoral-programs','faculty','faculty-roster-people','employment-histories','linkedin-histories'].map(n=>loadJson('data/'+n+'.json')));
  const rows=organisationRows(entities,universities,reviews,programs,faculty,roster,histories,linkedin);
  const controls=section.querySelector('#organisation-controls'),body=section.querySelector('#organisation-records'),more=section.querySelector('#organisation-more');
  const label=node('label','Search organisations');label.className='search-label';const q=node('input');q.type='search';q.placeholder='Name, alias, country or department';q.setAttribute('aria-label','Search organisations');label.append(q);
  const roleLabel=node('label','Connection');const role=node('select');role.setAttribute('aria-label','Organisation connection');
  for(const [v,t]of [['','All organisations'],['program','Universities with verified Ops doctorates'],['phd',"People’s PhD institutions"],['employer','First employers'],['career','Observed career employers'],['affiliation','Directory affiliations'],['units','With reviewed operations units']])role.append(new Option(t,v));roleLabel.append(role);
  const countryLabel=node('label','Country');const country=node('select');country.setAttribute('aria-label','Organisation country');country.append(new Option('All countries',''));for(const c of [...new Set(rows.flatMap(r=>r.countries))].sort())country.append(new Option(c,c));countryLabel.append(country);
  const reviewLabel=node('label','Department review');const review=node('select');review.setAttribute('aria-label','Organisation department review');for(const [v,t]of [['','All review states'],['reviewed','Completed'],['partial','Partial'],['blocked','Blocked'],['pending','Pending'],['unlisted','Not in the university review queue']])review.append(new Option(t,v));reviewLabel.append(review);
  const rm=reviews.metadata,phdProviders=rows.filter(r=>r.programs.some(isCurrentPhdProgramme)).length,doctoralRoutes=programs.records.filter(isCurrentPhdProgramme).length;
  const scopeNotes=[
   `The full directory contains ${rows.length.toLocaleString('en-GB')} organisations: universities, companies, government bodies and other employers found across our sources. A directory entry does not mean its identity or doctoral programmes have been verified.`,
   `Verified doctoral provision: ${doctoralRoutes} relevant PhD or equivalent research-doctorate routes at ${phdProviders} institutions. One institution can have several programmes or specializations. Some programmes may not currently admit students; coverage remains incomplete. Choose “Universities with verified Ops doctorates” below to view these institutions.`,
   `University review progress: ${rm.sourceRecords} university entries from our source lists, including aliases and school-level entries; ${rm.reviewed} identity and department reviews complete, ${rm.partial} partial, ${rm.blocked} blocked and ${rm.pending} pending. Doctoral eligibility and branch coverage are checked separately, so this is not a count of verified PhD providers.`
  ];
  for(const text of scopeNotes){const note=node('p',text);note.className='map-note';controls.before(note);}
  const reset=button('Reset',()=>{q.value='';role.value='';country.value='';review.value='';filter();});controls.replaceChildren(label,roleLabel,countryLabel,reviewLabel,reset);
  let selected=[],shown=0;
  function filter(){const words=fold(q.value).split(/\s+/).filter(Boolean);selected=rows.filter(r=>words.every(w=>r.search.includes(w))&&(!country.value||r.countries.includes(country.value))&&(!review.value||(review.value==='unlisted'?!r.reviews.length:review.value==='reviewed'?r.reviews.length&&r.reviews.every(u=>u.reviewStatus==='reviewed'):r.reviews.some(u=>u.reviewStatus===review.value)))&&(!role.value||(role.value==='phd'?r.phd.length:role.value==='employer'?r.employers.length:role.value==='program'?r.programs.some(isCurrentPhdProgramme):role.value==='career'?r.careers?.size:role.value==='affiliation'?r.affiliations?.size:r.reviews.some(u=>u.units.length))));shown=0;body.replaceChildren();draw();}
  function draw(){
   for(const r of selected.slice(shown,shown+40)){
    const tr=node('tr'),identity=node('td'),people=node('td'),evidence=node('td');
    identity.append(node('strong',r.name),node('small',r.countries.join(' · ')||'Country not established'));
    const currentPhds=r.programs.filter(isCurrentPhdProgramme);if(currentPhds.length)identity.append(node('small',currentPhds.length+' verified current doctoral route'+(currentPhds.length===1?'':'s')));
    const aliases=distinctNames(r.names,r.name);if(aliases.length){const d=node('details');d.append(node('summary','Other names in sources'),node('p',aliases.join('; ')));identity.append(d);}
    if(r.phd.length){people.append(node('p',r.phd.reduce((s,p)=>s+p.people,0).toLocaleString('en-GB')+' people earned doctorates here'));for(const p of r.phd)people.append(button('Doctoral outcomes: '+p.name,()=>actions.openInstitution(p.name)));}
    if(r.employers.length){people.append(node('p',r.employers.reduce((s,p)=>s+p.verifiedFirstJobs,0).toLocaleString('en-GB')+' verified first jobs started here'));for(const e of r.employers)people.append(button('First hires: '+e.name,()=>actions.openEmployer(e.name)));}
    // Directory affiliations remain observations, never promoted into current jobs.
    for(const name of distinctNames(r.names).filter(n=>actions.hasAffiliation(n)))people.append(button('People listed at '+name,()=>actions.openAffiliation(name)));
    if(r.careers?.size)people.append(button(r.careers.size+' people with observed roles here',()=>actions.openCareers(r.name)));if(!people.childNodes.length)people.textContent='No matched people or first hires yet';
    const detail=node('details');detail.append(node('summary','Organisation evidence and departments'));
    const sourceSeen=new Set();
    for(const u of r.reviews){
     const doctoral=(u.reviews.find(review=>review.id===u.id)||u.reviews.find(review=>review.doctoralReview))?.doctoralReview;
     if(doctoral){const coverage=node('details');coverage.append(node('summary','Doctoral programme coverage: '+(doctoral.coverageComplete?'current branch checks complete':'incomplete')),node('p','Checked '+doctoral.checkedAt));for(const b of doctoral.branches)coverage.append(node('p',b.branch.charAt(0).toUpperCase()+b.branch.slice(1)+': '+b.conclusion));for(const limitation of doctoral.limitations)coverage.append(node('p',limitation));detail.append(coverage);}
     renderUniversityUnits(detail,u);for(const review of u.reviews)for(const s of review.sources){const key=[s.url,s.checkedAt,s.outcome,s.note].join('|');if(sourceSeen.has(key))continue;sourceSeen.add(key);const a=node('a','Official evidence ↗');a.href=s.url;a.target='_blank';a.rel='noopener noreferrer';detail.append(a,node('small',(s.outcome==='read'?'Checked ':'Attempted ')+s.checkedAt),node('p',s.note));}
    }
    if(!r.reviews.length)detail.append(node('p','Operations departments have not been reviewed for this organisation.'));
    for(const p of r.programs)renderProgramme(detail,p);
    if(!r.programs.length)detail.append(node('p','No doctoral program has been entered in the initial register. This does not establish that none exists.'));
    evidence.append(detail);tr.append(identity,people,evidence);body.append(tr);
   }
   shown=Math.min(shown+40,selected.length);count.textContent=`${shown.toLocaleString('en-GB')} of ${selected.length.toLocaleString('en-GB')} matching organisations shown`;more.hidden=shown>=selected.length;
   if(!selected.length){const tr=node('tr'),td=node('td','No matching organisations. Try another name or reset the filters.');td.colSpan=3;tr.append(td);body.append(tr);}
  }
  q.addEventListener('input',filter);role.addEventListener('change',filter);country.addEventListener('change',filter);review.addEventListener('change',filter);more.addEventListener('click',draw);filter();
 }catch(error){count.textContent='Organisation records could not be loaded. Please reload and try again.';console.error(error);}
}
