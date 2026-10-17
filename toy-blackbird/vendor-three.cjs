#!/usr/bin/env node
'use strict';
// Copy EXACT Three.js 0.160.0 modules needed by the untouched GLTF model pipeline.
// Called by the GitHub Actions packager, not by the browser.
const fs=require('node:fs'), path=require('node:path');
const root=process.env.THREE_PACKAGE_DIR;
if(!root||!fs.existsSync(path.join(root,'build/three.module.js')))throw new Error('THREE_PACKAGE_DIR must point at npm three@0.160.0');
const dest=path.resolve('toy-blackbird/vendor');
const visited=new Set();
function copy(rel) {
  rel=rel.replace(/\\/g,'/');
  if(visited.has(rel))return;
  if(!rel.endsWith('.js'))throw new Error('Unexpected module type: '+rel);
  const from=path.resolve(root,rel);
  if(!from.startsWith(path.resolve(root)+path.sep))throw new Error('Unsafe dependency: '+rel);
  const data=fs.readFileSync(from,'utf8');
  const out=path.resolve(dest,rel);
  fs.mkdirSync(path.dirname(out),{recursive:true});
  fs.writeFileSync(out,data);
  visited.add(rel);
  const re=/(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s*)['"](\.{1,2}\/[^'"]+)['"]/gm;
  let m;
  while((m=re.exec(data))) {
    let dep=path.posix.normalize(path.posix.join(path.posix.dirname(rel),m[1]));
    if(!path.posix.isAbsolute(dep)&&!dep.startsWith('..')&&dep.endsWith('.js'))copy(dep);
  }
}
copy('build/three.module.js');
copy('examples/jsm/loaders/GLTFLoader.js');
copy('examples/jsm/exporters/GLTFExporter.js');
fs.copyFileSync(path.join(root,'LICENSE'),path.join(dest,'THREE-LICENSE.txt'));
console.log('Bundled modules:',[...visited].sort());
