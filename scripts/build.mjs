import fs from 'node:fs';
import crypto from 'node:crypto';
import './update-website-copy.mjs';
fs.mkdirSync('_site',{recursive:true});
for(const file of ['index.html','.nojekyll','robots.txt','sitemap.xml','favicon.ico','site.webmanifest'])fs.copyFileSync(file,`_site/${file}`);
for(const dir of ['assets','data'])fs.cpSync(dir,`_site/${dir}`,{recursive:true});
// Keep the repository readable while reducing initial download size on the site.
for(const file of fs.readdirSync('_site/data').filter(name=>name.endsWith('.json'))){const target=`_site/data/${file}`;fs.writeFileSync(target,JSON.stringify(JSON.parse(fs.readFileSync(target,'utf8'))));}
const modules=fs.readdirSync('assets').filter(f=>f.endsWith('.js')).sort();
const hash=crypto.createHash('sha256');for(const f of modules)hash.update(fs.readFileSync(`assets/${f}`));hash.update(fs.readFileSync('assets/style.css'));const version=hash.digest('hex').slice(0,12);
const html=fs.readFileSync('_site/index.html','utf8').replace('href="assets/style.css"',`href="assets/style.css?v=${version}"`).replace('src="assets/app.js"',`src="assets/app.js?v=${version}"`);
fs.writeFileSync('_site/index.html',html);
// Version every local module import so returning visitors never mix old and new modules.
for(const f of modules){let code=fs.readFileSync(`assets/${f}`,'utf8').replace(/from '\.\/([a-z-]+\.js)'/g,(m,name)=>`from './${name}?v=${version}'`);if(f==='app.js')code=code.replace('fetch(`data/${name}.json`)','fetch(`data/${name}.json`, {cache: "no-cache"})');fs.writeFileSync(`_site/assets/${f}`,code);}
console.log(`Prepared static site; asset version ${version}`);
