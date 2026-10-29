import {CATEGORIES} from './analytics.js';
import {cohortStats} from './cohort-stats.js';

const el=(tag,text)=>{const e=document.createElement(tag);if(text!=null)e.textContent=text;return e;};
export function renderCohortStory(host,idx){
 host.replaceChildren();
 const years=idx.years;if(!years.length){host.textContent='No dated cohorts are available yet.';return;}
 const heading=el('div');heading.className='cohort-story-heading';
 const title=el('h2','Where did each cohort go first?'),yearText=el('output');yearText.className='cohort-year';heading.append(title,yearText);
 const controls=el('div');controls.className='cohort-playback';
 const prev=el('button','←'),play=el('button','Play'),pause=el('button','Pause'),auto=el('button','Auto-play'),next=el('button','→');
 for(const b of [prev,play,pause,auto,next])b.type='button';prev.setAttribute('aria-label','Previous PhD cohort');next.setAttribute('aria-label','Next PhD cohort');
 const yearLabel=el('label','PhD cohort '),year=el('select');year.setAttribute('aria-label','Animation PhD cohort');for(const y of years)year.append(new Option(String(y),String(y)));yearLabel.append(year);
 const slider=el('input');slider.type='range';slider.min='0';slider.max=String(years.length-1);slider.step='1';slider.setAttribute('aria-label','Choose PhD cohort on timeline');
 controls.append(prev,play,pause,auto,next);const timeline=el('div');timeline.className='cohort-timeline';timeline.append(el('span',String(years[0])),slider,el('span',String(years.at(-1))));
 const table=el('table');table.className='cohort-distribution';const caption=el('caption','First-job types among verified first jobs');table.append(caption);
 const head=el('thead'),hr=el('tr');for(const text of ['First-job type','Share of verified jobs','Jobs','Share']){const th=el('th',text);th.scope='col';hr.append(th);}head.append(hr);table.append(head);
 const body=el('tbody'),cells=[];
 for(const c of CATEGORIES){const tr=el('tr'),label=el('th',c.label);label.scope='row';const graph=el('td'),track=el('div'),bar=el('span');track.className='cohort-track';bar.className='cohort-bar';bar.style.background=c.color;track.setAttribute('aria-hidden','true');track.append(bar);graph.append(track);const count=el('td'),share=el('td');tr.append(label,graph,count,share);body.append(tr);cells.push({bar,count,share});}
 table.append(body);
 const totals=el('p');totals.className='cohort-totals';
 const note=el('p','Each frame shows one PhD cohort, not cumulative jobs. Bar lengths use a fixed 0–100% scale. Shares use verified first jobs only; unresolved outcomes are excluded. Only years represented in the sample are shown. Small early cohorts can change sharply. This faculty-based sample is not a graduate census.');note.className='map-note';
 const unknown=idx.people.filter(p=>p.placement&&!p.phdYear).length;if(unknown)note.append(` ${unknown} verified first jobs without a known PhD year are outside the animation.`);
 const links=el('a','Inspect verified first jobs in this cohort →');links.href='#people';links.className='text-button';
 let pos=0,timer=null,visible=true;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');let mode=reduced.matches?'paused':'auto';
 const stopTimer=()=>{if(timer!==null){clearInterval(timer);timer=null;}};
 const schedule=()=>{stopTimer();if(mode!=='paused'&&visible&&!document.hidden)timer=setInterval(()=>{if(pos===years.length-1){if(mode==='auto')pos=0;else{mode='paused';schedule();return;}}else pos++;draw();},1100);for(const [button,value]of [[play,'play'],[pause,'paused'],[auto,'auto']]){button.classList.toggle('active',mode===value);button.setAttribute('aria-pressed',String(mode===value));}};
 const draw=()=>{
  const stats=cohortStats(idx.people,years[pos]);yearText.value=String(stats.year);yearText.textContent=String(stats.year);year.value=String(stats.year);slider.value=String(pos);slider.setAttribute('aria-valuetext','PhD cohort '+stats.year);
  caption.textContent='First-job types for the PhD cohort of '+stats.year;
  stats.categories.forEach((c,i)=>{cells[i].bar.style.transform=`scaleX(${c.share||0})`;cells[i].count.textContent=String(c.count);cells[i].share.textContent=c.share==null?'—':(100*c.share).toFixed(1)+'%';});
  totals.textContent=`${stats.verified} verified first jobs among ${stats.people} people in this cohort · ${stats.unresolved} unresolved · ${stats.other} pending or doctorate unconfirmed.`;
  if(!stats.verified)totals.append(' No verified outcomes: shares are unavailable.');
  prev.disabled=pos===0;next.disabled=pos===years.length-1;links.href=`?mode=placements&cohort=${stats.year}#people`;
 };
 const manual=to=>{mode='paused';pos=Math.max(0,Math.min(years.length-1,to));draw();schedule();};
 prev.addEventListener('click',()=>manual(pos-1));next.addEventListener('click',()=>manual(pos+1));year.addEventListener('change',()=>manual(years.indexOf(Number(year.value))));slider.addEventListener('input',()=>manual(Number(slider.value)));
 play.addEventListener('click',()=>{mode='play';if(pos===years.length-1){pos=0;draw();}schedule();});
 pause.addEventListener('click',()=>{mode='paused';schedule();});
 auto.addEventListener('click',()=>{mode='auto';schedule();});
 links.addEventListener('click',()=>{mode='paused';schedule();});
 document.addEventListener('visibilitychange',schedule);
 reduced.addEventListener('change',()=>{if(reduced.matches){mode='paused';schedule();}});
 if('IntersectionObserver' in window){visible=false;new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;schedule();},{threshold:0.1}).observe(host);}
 host.append(heading,yearLabel,table,timeline,controls,totals,links,note);draw();schedule();
}
