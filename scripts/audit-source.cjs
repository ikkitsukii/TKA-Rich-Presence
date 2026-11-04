const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const files=execFileSync('git',['ls-files','--cached','--others','--exclude-standard','-z'],{cwd:root,encoding:'utf8'}).split('\0').filter(Boolean);
const patterns=[
 /github_pat_[A-Za-z0-9_]{20,}/,
 /gh[pousr]_[A-Za-z0-9]{20,}/,
 /sk-[A-Za-z0-9_-]{24,}/,
 /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
 /[A-Za-z]:[\\/]+Users[\\/]+[^\\/\s"'<>]+/
];
const findings=[];
for(const file of files){
 if(/(?:^|\/)(?:\.env(?:\..*)?|credentials?|secrets?)(?:\/|$)|\.(?:exe|dll|zip|log|pem|pfx|key)$/i.test(file))findings.push(file+': forbidden filename');
 const text=fs.readFileSync(path.join(root,file),'utf8');
 for(const pattern of patterns)if(pattern.test(text))findings.push(file+': possible credential or personal path (value not printed)');
}
const config=JSON.parse(fs.readFileSync(path.join(root,'rpc/config.json'),'utf8'));
if(config.logPath!=='')findings.push('rpc/config.json: logPath must be empty in public source');
if(findings.length){console.error(findings.join('\n'));process.exitCode=1;}
else console.log('PASS: '+files.length+' selected files; no supported secret-pattern matches or private log path. This is not an exhaustive secret detector.');
