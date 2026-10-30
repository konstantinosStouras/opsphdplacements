import fs from 'node:fs';
import crypto from 'node:crypto';
import {PUBLIC_DATA,projectPublicData} from './public-data.mjs';
import './update-website-copy.mjs';
fs.mkdirSync('_site',{recursive:true});
for(const file of ['index.html','.nojekyll','robots.txt','sitemap.xml','favicon.ico','site.webmanifest'])fs.copyFileSync(file,`_site/${file}`);
fs.cpSync('assets','_site/assets',{recursive:true});
fs.mkdirSync('_site/data',{recursive:true});
// Remove obsolete publication files, including earlier full-evidence copies.
for(const file of fs.readdirSync('_site/data'))if(fs.statSync(`_site/data/${file}`).isFile())fs.unlinkSync(`_site/data/${file}`);
for(const name of PUBLIC_DATA){const input=JSON.parse(fs.readFileSync(`data/${name}.json`,'utf8'));fs.writeFileSync(`_site/data/${name}.json`,JSON.stringify(projectPublicData(input,name)));}
fs.mkdirSync('_site/admin',{recursive:true});
for(const file of ['index.html','app.js','style.css','firebase-config.js','firebase-client.js'])fs.copyFileSync(`admin/${file}`,`_site/admin/${file}`);
const dataHash=crypto.createHash('sha256');for(const f of fs.readdirSync('_site/data').filter(f=>f.endsWith('.json')).sort()){dataHash.update(f);dataHash.update(fs.readFileSync(`_site/data/${f}`));}const dataRevision=dataHash.digest('hex').slice(0,16);
const modules=fs.readdirSync('assets').filter(f=>f.endsWith('.js')).sort();
const hash=crypto.createHash('sha256');for(const f of modules)hash.update(fs.readFileSync(`assets/${f}`));hash.update(fs.readFileSync('assets/style.css'));hash.update(dataRevision);const version=hash.digest('hex').slice(0,12);
// Version the shared Firebase client too, so old admin pages cannot mask updates.
for(const file of ['firebase-client.js','app.js']){const p='_site/admin/'+file;fs.writeFileSync(p,fs.readFileSync(p,'utf8').replace("from './firebase-client.js'","from './firebase-client.js?v="+version+"'"));}
const html=fs.readFileSync('_site/index.html','utf8').replace('href="assets/style.css"',`href="assets/style.css?v=${version}"`).replace('src="assets/app.js"',`src="assets/app.js?v=${version}"`);
fs.writeFileSync('_site/index.html',html);
// Version every local module import so returning visitors never mix old and new modules.
for(const f of modules){let code=fs.readFileSync(`assets/${f}`,'utf8').replace(/from '\.\/([a-z-]+\.js)'/g,(m,name)=>`from './${name}?v=${version}'`);code=code.replace("import('./admin-overlay.js')","import('./admin-overlay.js?v="+version+"')");code=code.replace("from '../admin/firebase-client.js'","from '../admin/firebase-client.js?v="+version+"'");if(f==='data-url.js')code=code.replace("const revision = '';",`const revision = '${dataRevision}';`);fs.writeFileSync(`_site/assets/${f}`,code);}
console.log(`Prepared static site; asset version ${version}`);
