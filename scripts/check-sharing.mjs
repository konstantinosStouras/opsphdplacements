import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const root=process.argv[2]?path.resolve(process.argv[2]):path.resolve(import.meta.dirname,'..');
const canonical='https://www.stouras.com/opsphdplacements/';
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const head=html.split('</head>')[0];
const attributes=tag=>Object.fromEntries([...tag.matchAll(/([\w:-]+)="([^"]*)"/g)].map(m=>[m[1],m[2]]));
const tags=[...head.matchAll(/<meta\b[^>]*>/g)].map(m=>attributes(m[0]));
function meta(name){const matches=tags.filter(t=>t.name===name||t.property===name);assert.equal(matches.length,1,`Expected one ${name}`);assert.ok(matches[0].content,`Empty ${name}`);return matches[0].content;}
function localFile(value){const url=new URL(value,canonical);assert.equal(url.origin,new URL(canonical).origin);assert.ok(url.pathname.startsWith('/opsphdplacements/'));const file=path.resolve(root,url.pathname.slice('/opsphdplacements/'.length));assert.ok(file.startsWith(root+path.sep));assert.ok(fs.existsSync(file),`Missing asset ${file}`);return file;}
function pngSize(file){const b=fs.readFileSync(file);assert.equal(b.subarray(0,8).toString('hex'),'89504e470d0a1a0a');return[b.readUInt32BE(16),b.readUInt32BE(20)];}
for(const name of ['description','author','og:title','og:description','og:site_name','og:locale','og:image:alt','twitter:title','twitter:description','twitter:image:alt'])meta(name);
assert.equal(meta('og:type'),'website');assert.equal(meta('og:url'),canonical);
assert.equal(meta('twitter:card'),'summary_large_image');assert.equal(meta('twitter:title'),meta('og:title'));
assert.equal(meta('twitter:image'),meta('og:image'));assert.equal(meta('og:image:secure_url'),meta('og:image'));
assert.ok(meta('og:image').startsWith('https://'));assert.equal(meta('og:image:type'),'image/png');
const image=localFile(meta('og:image'));
assert.deepEqual(pngSize(image),[1200,630]);assert.equal(meta('og:image:width'),'1200');assert.equal(meta('og:image:height'),'630');
assert.ok(fs.statSync(image).size<600_000,'Keep the shared preview lightweight');
const links=[...head.matchAll(/<link\b[^>]*>/g)].map(m=>attributes(m[0]));
assert.equal(links.find(l=>l.rel==='canonical')?.href,canonical);
for(const link of links.filter(l=>['icon','apple-touch-icon','manifest'].includes(l.rel)))localFile(link.href);
const touch=links.find(l=>l.rel==='apple-touch-icon');assert.ok(touch);assert.deepEqual(pngSize(localFile(touch.href)),[180,180]);
const manifest=JSON.parse(fs.readFileSync(localFile(links.find(l=>l.rel==='manifest').href),'utf8'));
assert.equal(manifest.scope,'/opsphdplacements/');assert.equal(manifest.start_url,manifest.scope);
for(const icon of manifest.icons)assert.deepEqual(pngSize(localFile(icon.src)),icon.sizes.split('x').map(Number));
const structured=JSON.parse(head.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
assert.equal(structured['@type'],'WebSite');assert.equal(structured.url,canonical);
console.log('Sharing: static metadata, canonical URL, 1200×630 preview, favicon and mobile icons valid.');
