import fs from 'node:fs';
import crypto from 'node:crypto';
fs.mkdirSync('_site',{recursive:true});
for(const file of ['index.html','.nojekyll','robots.txt','sitemap.xml','favicon.ico','site.webmanifest'])fs.copyFileSync(file,`_site/${file}`);
for(const dir of ['assets','data'])fs.cpSync(dir,`_site/${dir}`,{recursive:true});
// Keep the repository readable while reducing initial download size on the site.
for(const file of fs.readdirSync('_site/data').filter(name=>name.endsWith('.json'))){const target=`_site/data/${file}`;fs.writeFileSync(target,JSON.stringify(JSON.parse(fs.readFileSync(target,'utf8'))));}
const version=crypto.createHash('sha256').update(fs.readFileSync('assets/app.js')).update(fs.readFileSync('assets/model.js')).update(fs.readFileSync('assets/style.css')).digest('hex').slice(0,12);
const html=fs.readFileSync('_site/index.html','utf8').replace('href="assets/style.css"',`href="assets/style.css?v=${version}"`).replace('src="assets/app.js"',`src="assets/app.js?v=${version}"`);
fs.writeFileSync('_site/index.html',html);
fs.writeFileSync('_site/assets/app.js',fs.readFileSync('assets/app.js','utf8').replace("from './model.js'",`from './model.js?v=${version}'`).replace('fetch(`data/${name}.json`)','fetch(`data/${name}.json`, {cache: "no-cache"})'));
console.log(`Prepared static site; asset version ${version}`);
