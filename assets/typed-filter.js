import {fold} from './model.js';
const controls=[];
export function refreshTypedFilters(){for(const control of controls)control();}
export function enableTypedFilters(){
  for(const [id,label]of [['institution','Institution'],['phd','PhD institution'],['discipline','Discipline']]){
    const select=document.getElementById(id);if(!select||select.dataset.typedFilter)continue;
    select.dataset.typedFilter='true';select.hidden=true;
    const box=document.createElement('span');box.className='typed-filter';
    const input=document.createElement('input');input.type='search';input.autocomplete='off';input.setAttribute('role','combobox');input.setAttribute('aria-label',label);input.setAttribute('aria-autocomplete','list');input.setAttribute('aria-expanded','false');input.setAttribute('aria-controls',id+'-choices');
    const list=document.createElement('span');list.id=id+'-choices';list.className='typed-filter-choices';list.setAttribute('role','listbox');list.setAttribute('aria-label',label+' options');list.hidden=true;
    box.append(input,list);select.after(box);
    let active=-1,matched=[],lastValue=select.value;
    const close=()=>{list.hidden=true;input.setAttribute('aria-expanded','false');input.removeAttribute('aria-activedescendant');active=-1;};
    const sync=()=>{input.placeholder=select.options[0]?.textContent||'Type to search';input.disabled=select.disabled;if(select.value!==lastValue||document.activeElement!==input){input.value=select.value;lastValue=select.value;}if(!list.hidden)show();};
    const choose=value=>{select.value=value;lastValue=value;input.value=value;close();select.dispatchEvent(new Event('input',{bubbles:true}));select.dispatchEvent(new Event('change',{bubbles:true}));input.focus();close();};
    const show=()=>{
      const words=fold(input.value).split(/\s+/).filter(Boolean);
      matched=[...select.options].filter(o=>!o.disabled&&(!o.value||words.every(w=>fold(o.textContent).includes(w))));
      list.replaceChildren();active=-1;input.removeAttribute('aria-activedescendant');
      for(const [i,option]of matched.entries()){
        const item=document.createElement('span');item.id=id+'-choice-'+i;item.setAttribute('role','option');item.setAttribute('aria-selected',String(option.value===select.value));item.textContent=option.textContent;
        item.addEventListener('mousedown',e=>e.preventDefault());item.addEventListener('click',()=>choose(option.value));list.append(item);
      }
      if(!matched.some(o=>o.value)&&words.length){const empty=document.createElement('span');empty.textContent='No matching options';empty.setAttribute('role','status');list.append(empty);}
      list.hidden=false;input.setAttribute('aria-expanded','true');
    };
    input.addEventListener('focus',show);
    input.addEventListener('input',event=>{event.stopPropagation();show();if(!input.value&&select.value){select.value='';lastValue='';select.dispatchEvent(new Event('input',{bubbles:true}));}});
    input.addEventListener('blur',close);
    input.addEventListener('keydown',event=>{
      if(event.key==='Escape'){close();input.value=select.value;return;}
      if(event.key==='ArrowDown'||event.key==='ArrowUp'){
        event.preventDefault();if(list.hidden)show();active=Math.max(0,Math.min(matched.length-1,active+(event.key==='ArrowDown'?1:-1)));
        for(const [i,item]of [...list.children].entries())item.classList.toggle('active-option',i===active);
        const target=list.children[active];if(target){input.setAttribute('aria-activedescendant',target.id);target.scrollIntoView({block:'nearest'});}
      }else if(event.key==='Enter'&&!list.hidden){event.preventDefault();const exact=matched.find(o=>fold(o.value)===fold(input.value));const nonempty=matched.filter(o=>o.value);const selected=matched[active]||exact||(nonempty.length===1?nonempty[0]:null);if(selected)choose(selected.value);}
    });
    controls.push(sync);sync();
  }
}
