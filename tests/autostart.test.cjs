const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {spawn}=require('node:child_process'),{once}=require('node:events');
const pause=ms=>new Promise(r=>setTimeout(r,ms));
test('automatic helper finds relative UE4SS log, prevents duplicate process and exits with game process',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'tka-auto-'));
 const ue4ss=path.join(root,'ue4ss'),rpc=path.join(ue4ss,'Mods','TKA_RPC','Bridge','rpc');fs.mkdirSync(rpc,{recursive:true});
 for(const file of fs.readdirSync(path.join(__dirname,'../rpc')).filter(f=>f.endsWith('.cjs')))fs.copyFileSync(path.join(__dirname,'../rpc',file),path.join(rpc,file));
 const applicationId='999'+Date.now();fs.writeFileSync(path.join(rpc,'config.json'),JSON.stringify({applicationId,logPath:'',staleSeconds:90,updateSeconds:15}));
 fs.writeFileSync(path.join(ue4ss,'UE4SS.log'),'');
 const game=spawn(process.execPath,['-e','setInterval(()=>{},1000)'],{stdio:'ignore'});
 const helper=spawn(process.execPath,[path.join(rpc,'bridge.cjs'),'--auto','--game-pid',String(game.pid)],{stdio:'ignore'});
 const helperExit=once(helper,'exit');
 try {
  for(let i=0;i<40&&!fs.existsSync(path.join(rpc,'rpc.log'));i++)await pause(100);
  assert.match(fs.readFileSync(path.join(rpc,'rpc.log'),'utf8'),/Started/);
  const duplicate=spawn(process.execPath,[path.join(rpc,'bridge.cjs'),'--auto','--game-pid',String(game.pid)],{stdio:'ignore'});
  assert.equal((await once(duplicate,'exit'))[0],1,'duplicate must not keep running');
  game.kill();
  const exit=await Promise.race([helperExit,pause(8000).then(()=>{throw Error('helper outlived game');})]);assert.equal(exit[0],0);
  assert.match(fs.readFileSync(path.join(rpc,'rpc.log'),'utf8'),/Stopped; presence cleared/);
 } finally {game.kill();helper.kill();fs.rmSync(root,{recursive:true,force:true});}
});
