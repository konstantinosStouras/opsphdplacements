import {fold} from './model.js';

// A visible result list makes typing sufficient, without guessing an ambiguous match.
export function searchablePicker(labelText, values, current, onChange, placeholder='Type a name') {
  const box=document.createElement('label');box.className='pick-list';
  const label=document.createElement('span');label.textContent=labelText;
  const search=document.createElement('input');search.type='search';search.placeholder=placeholder;search.setAttribute('aria-label',labelText+': search');
  const select=document.createElement('select');select.setAttribute('aria-label',labelText);
  const status=document.createElement('small');status.setAttribute('role','status');
  const matches=document.createElement('div');matches.className='picker-matches';
  const choose=value=>{select.value=value;onChange(value);};
  const fill=(typed=false)=>{
    const words=fold(search.value).split(/\s+/).filter(Boolean);
    const shown=values.filter(([v,t])=>!v||words.every(w=>fold(t).includes(w)));
    select.replaceChildren(...shown.map(([v,t])=>new Option(t,v)));
    const found=shown.filter(([v])=>v);
    select.value=shown.some(([v])=>v===current())?current():'';
    matches.replaceChildren();
    status.textContent=words.length?`${found.length} matching ${found.length===1?'organisation':'organisations'}`:'';
    if(words.length)for(const [v,t] of found.slice(0,8)){
      const b=document.createElement('button');b.type='button';b.textContent=t;b.className='text-button';b.addEventListener('click',()=>choose(v));matches.append(b);
    }
    if(words.length&&!found.length)status.textContent='No matches. Try another name or spelling.';
    if(typed&&current()&&!shown.some(([v])=>v===current()))choose('');
    const exact=found.find(([v])=>fold(v)===fold(search.value));
    if(typed&&exact&&exact[0]!==current())choose(exact[0]);
    return found;
  };
  search.addEventListener('input',()=>fill(true));
  search.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();const found=fill();if(found.length===1)choose(found[0][0]);}});
  select.addEventListener('change',()=>onChange(select.value));
  fill();box.append(label,search,select,status,matches);return box;
}
