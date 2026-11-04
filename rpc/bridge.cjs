const fs = require('node:fs');
const path = require('node:path');
const net = require('node:net');
const {StringDecoder} = require('node:string_decoder');
const {Discord} = require('./discord.cjs');
const {activity} = require('./presence.cjs');
const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));
const automatic = process.argv.includes('--auto');
const gamePid = Number(process.argv[process.argv.indexOf('--game-pid') + 1]);
if (automatic) {
  if (!Number.isInteger(gamePid) || gamePid <= 0) throw new Error('Automatic mode requires --game-pid');
  if (!config.logPath) config.logPath = path.resolve(__dirname, '../../../..', 'UE4SS.log');
}
const runtimeLog = path.join(__dirname, 'rpc.log');
function log(text) { fs.appendFileSync(runtimeLog, `${new Date().toISOString()} ${text}\n`); }
const discord = new Discord(config.applicationId);
const controlPath = `\\\\.\\pipe\\tka-rpc-${config.applicationId}`;
if (process.argv.includes('--stop')) {
  const socket = net.createConnection(controlPath, () => socket.end('stop'));
  socket.on('error', () => { console.log('RPC já está parado.'); });
} else if (process.argv.includes('--check')) {
  (async () => {
    try { await discord.connect(); await discord.activity(null); console.log('PASS: Discord READY and SET_ACTIVITY accepted for ' + config.applicationId); }
    catch (e) { console.error(e.message); process.exitCode = 1; }
    finally { discord.disconnect(); }
  })();
} else {
  let offset = 0, identity = '', partial = '', decoder = new StringDecoder('utf8');
  let state = null, receivedAt = 0, lastSent = '', lastSendAt = 0, connecting = false, stopping = false;
  let lastConnectionAttempt = 0;
  const control = net.createServer(socket => {
    socket.on('error', () => {});
    socket.on('data', data => { if (data.toString() === 'stop') shutdown(); });
  });
  control.on('error', error => { console.error(error.code === 'EADDRINUSE' ? 'RPC já está em execução.' : error.message); process.exit(1); });
  async function shutdown() {
    if (stopping) return; stopping = true;
    clearInterval(timer);
    try { if (discord.ready) await discord.activity(null); } catch (_) {}
    discord.disconnect(); log('Stopped; presence cleared'); control.close(); process.exit(0);
  }
  function line(text) {
    if (text.includes('[TKA_RPC] Loaded') || text.includes('Event loop end')) { state = null; receivedAt = 0; }
    const marker = '[TKA_RPC] STATE ';
    const at = text.indexOf(marker);
    if (at < 0) return;
    try {
      const next = JSON.parse(text.slice(at + marker.length));
      if (!['menu', 'loading', 'playing'].includes(next.phase) || !Number.isFinite(next.session_start)) return;
      state = next; receivedAt = Date.now();
    } catch (_) { log('Ignored incomplete or invalid state'); }
  }
  function readLog() {
    try {
      const stat = fs.statSync(config.logPath);
      const nextIdentity = `${stat.dev}:${stat.ino}:${stat.birthtimeMs}`;
      if (identity !== nextIdentity || stat.size < offset) {
        identity = nextIdentity; offset = 0; partial = ''; decoder = new StringDecoder('utf8'); state = null;
        // Never replay a stale session when starting the bridge.
        if (Date.now() - stat.mtimeMs > 15000) offset = stat.size;
      }
      if (stat.size === offset) return;
      const fd = fs.openSync(config.logPath, 'r');
      try {
        while (offset < stat.size) {
          const buf = Buffer.alloc(Math.min(65536, stat.size - offset));
          const count = fs.readSync(fd, buf, 0, buf.length, offset);
          if (!count) break; offset += count;
          partial += decoder.write(buf.subarray(0, count));
          const lines = partial.split(/\r?\n/); partial = lines.pop(); lines.forEach(line);
          if (partial.length > 1024 * 1024) { partial = ''; log('Skipped oversized log line'); }
        }
      } finally { fs.closeSync(fd); }
    } catch (e) { if (e.code !== 'ENOENT' && e.code !== 'EBUSY') throw e; }
  }
  let busy = false;
  async function tick() {
    if (busy || stopping) return; busy = true;
    try {
      readLog();
      if (!discord.ready && !connecting && Date.now() - lastConnectionAttempt > 10000) {
        connecting = true; lastConnectionAttempt = Date.now();
        try { await discord.connect(); lastSent = ''; log('Discord connected'); }
        catch (_) { /* Retry while the Discord desktop client is closed. */ }
        finally { connecting = false; }
      }
      if (!discord.ready) return;
      const active = state && Date.now() - receivedAt < config.staleSeconds * 1000;
      const next = active ? activity(state, config) : null;
      const serialized = JSON.stringify(next);
      // Clear immediately on shutdown/staleness, throttle regular presence updates.
      if (serialized !== lastSent && (!next || Date.now() - lastSendAt >= config.updateSeconds * 1000)) {
        await discord.activity(next); lastSent = serialized; lastSendAt = Date.now();
        log(next ? `Activity: ${next.details} / ${next.state}` : 'Presence cleared; waiting for game');
      }
    } catch (e) { log('ERROR ' + e.message); discord.disconnect(); }
    finally { busy = false; }
  }
  const timer = setInterval(() => {
    if (automatic) {
      try { process.kill(gamePid, 0); }
      catch (e) { if (e.code === 'ESRCH') { shutdown(); return; } }
    }
    tick();
  }, 1000);
  control.listen(controlPath, () => { log('Started; application ' + config.applicationId); tick(); });
  process.on('SIGINT', shutdown); process.on('SIGTERM', shutdown);
}
