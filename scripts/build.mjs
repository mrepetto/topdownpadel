import fs from 'node:fs';
import crypto from 'node:crypto';
import {readableCSS} from './readable-css.mjs';
const assets={};
const mime={'.js':'text/javascript','.css':'text/css','.html':'text/html','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.webmanifest':'application/manifest+json','.mp4':'video/mp4'};
for(const file of fs.readdirSync('web')){
 const ext=file.slice(file.lastIndexOf('.')),binary=['.webp','.png','.mp4'].includes(ext),data=fs.readFileSync('web/'+file);
 const content=ext==='.css'?Buffer.from(readableCSS(data.toString('utf8'))):data;
 assets['/'+(file==='index.html'?'':file)]={body:content.toString(binary?'base64':'utf8'),type:mime[ext]||'application/octet-stream',binary,etag:'"'+crypto.createHash('sha256').update(content).digest('hex').slice(0,20)+'"'};
}
// Stable entry points share source and save data, but choose their own presentation.
const target=process.argv[2];
if(target&&!['desktop','mobile'].includes(target))throw Error('Unknown layout: '+target);
const index=assets['/'];
// A root base keeps legacy game assets and API URLs stable under /game/.
const gameBody=index.body.replace('<head>','<head><base href="/">').replace('</head>','<script src="/telemetry.js" defer data-context="game"></script></head>');
const gameEntry={...index,body:gameBody,etag:'"'+crypto.createHash('sha256').update(gameBody).digest('hex').slice(0,20)+'"'};
assets['/game/']=gameEntry;
assets['/generaladmin']=assets['/generaladmin.html'];
assets['/privacy']=assets['/privacy.html'];
assets['/support']=assets['/support.html'];

for(const layout of target?[target]:['desktop','mobile']){
 const body=gameBody.replace('<html lang="en">','<html lang="en" data-layout="'+layout+'">');
 const entry={...index,body,etag:'"'+crypto.createHash('sha256').update(body).digest('hex').slice(0,20)+'"'};
 assets['/'+layout]=entry;
 if(target===layout)assets['/']=entry;
}
if(!target)assets['/']=assets['/website.html'];
const out=target?'builds/'+target:'dist';
fs.mkdirSync(out+'/server',{recursive:true});fs.mkdirSync(out+'/.openai',{recursive:true});
fs.writeFileSync(out+'/server/index.js','const ASSETS='+JSON.stringify(assets)+';\n'+fs.readFileSync('worker/analytics.js','utf8').replace(/^export \{[^}]+\};?$/gm,'').replace(/^export /gm,'')+'\n'+fs.readFileSync('worker/api.js','utf8'));
fs.copyFileSync('.openai/hosting.json',out+'/.openai/hosting.json');
console.log('Built Worker with embedded game assets');
