import {authorised,watchUser,login,logout,readCatalog,importCatalog} from './firebase-client.js';
const $ = selector => document.querySelector(selector);
const node = (tag, text) => {const element = document.createElement(tag); if(text !== undefined) element.textContent = text; return element;};
let catalog, page = 0, sessionRevision = 0;
const size = 25;
function link(source) {
  const anchor = node('a', source.label);
  const url = new URL(source.url);
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) return node('span', 'Invalid source');
  anchor.href = url.href; anchor.target = '_blank'; anchor.rel = 'noopener noreferrer'; return anchor;
}
function profiles(sources, label) {
  const cell = node('td'); const matches = sources.filter(source => {
    if(source.label !== label) return false;
    const url = new URL(source.url);
    return label === 'LinkedIn' ? /^\/(in|pub)\//.test(url.pathname) : url.pathname === '/citations' && url.searchParams.has('user');
  });
  if (!matches.length) cell.textContent = 'Not recorded';
  for(const source of matches) {cell.append(link(source), node('br'));}
  return cell;
}
function render() {
  const term = $('#search').value.toLocaleLowerCase(); const source = $('#source').value;
  const rows = catalog.tables[$('#table').value].filter(row => [row.name,row.institution].join(' ').toLocaleLowerCase().includes(term)
    && (!source || (source === 'missing' ? !row.sources.length : row.sources.some(item => item.label === source))));
  page = Math.max(0, Math.min(page, Math.ceil(rows.length / size)-1));
  $('#rows').replaceChildren();
  for (const record of rows.slice(page*size, (page+1)*size)) {
    const tr = node('tr'); const name = node('td', record.name); name.append(node('small', record.id));
    const verification = node('td'); const details = node('details'); details.append(node('summary', `${record.sources.length} recorded sources`));
    for (const source of record.sources) {
      const item = node('p'); item.append(link(source));
      for(const observation of source.observations) item.append(node('small', `${observation.field} · ${observation.checkedAt || 'Check date not recorded'}`));
      details.append(item);
    }
    verification.append(details);
    tr.append(name,node('td',record.institution || 'Unknown'),node('td',record.year ?? 'Unknown'),node('td',record.status),verification);
    $('#rows').append(tr);
  }
  $('#count').textContent = `${rows.length.toLocaleString()} matching records`;
  $('#page').textContent = `Page ${rows.length ? page+1 : 0} of ${Math.ceil(rows.length/size)}`;
  $('#previous').disabled = page === 0; $('#next').disabled = (page+1)*size >= rows.length;
}
for(const id of ['table','search','source']) $('#'+id).addEventListener('input', () => {page=0; render();});
$('#previous').addEventListener('click',()=>{page--;render();}); $('#next').addEventListener('click',()=>{page++;render();});
$('#login').addEventListener('click',()=>login().catch(error=>{$('#status').textContent=error.message;}));
$('#logout').addEventListener('click',()=>logout());
$('#import').addEventListener('change',async event=>{
  const file=event.target.files[0];if(!file)return;
  event.target.disabled=true;
  try{catalog=await importCatalog(file,message=>{$('#status').textContent=message;});$('#workspace').hidden=false;$('#status').textContent=catalog.note;render();}
  catch(error){$('#status').textContent=error.message;}
  finally{event.target.disabled=false;event.target.value='';}
});
watchUser(async user=>{
  const revision=++sessionRevision;
  catalog=null;$('#rows').replaceChildren();$('#workspace').hidden=true;
  const allowed=authorised(user);$('#login').hidden=!!user;$('#logout').hidden=!user;$('#import-control').hidden=!allowed;
  $('#identity').textContent=user?`Signed in as ${user.email}`:'Private administration';
  if(!allowed){$('#status').textContent=user?'This account is not authorised. Sign out and use the owner account.':'Sign in with the authorised Google account to access research records.';return;}
  try{const loaded=await readCatalog();if(revision!==sessionRevision)return;catalog=loaded;
    if(!catalog){$('#status').textContent='No private catalog imported yet.';return;}
    $('#workspace').hidden=false;$('#status').textContent=catalog.note;render();
  }catch(error){$('#status').textContent='Private records could not be loaded: '+error.message+' '+await accessSummary();}
});
