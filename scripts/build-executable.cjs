const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),build=path.join(root,'.tools','sea-build');
fs.mkdirSync(build,{recursive:true});
// Load adjacent source modules normally; config and logs remain beside the package.
fs.writeFileSync(path.join(build,'entry.cjs'),"const {createRequire}=require('node:module'); const path=require('node:path'); createRequire(process.execPath)(path.join(path.dirname(process.execPath),'rpc','bridge.cjs'));\n");
const output=path.join(root,'TKA-RPC.exe');
fs.writeFileSync(path.join(build,'sea.json'),JSON.stringify({main:path.join(build,'entry.cjs'),output,disableExperimentalSEAWarning:true,useSnapshot:false,useCodeCache:false,execArgvExtension:'none'}));
execFileSync(process.execPath,['--build-sea',path.join(build,'sea.json')],{stdio:'inherit'});
console.log('Built '+output);
