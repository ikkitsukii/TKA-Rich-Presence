const net = require('node:net');
const {randomUUID} = require('node:crypto');
function frame(op, data) {
  const body = Buffer.isBuffer(data) ? data : Buffer.from(JSON.stringify(data));
  const header = Buffer.alloc(8); header.writeUInt32LE(op); header.writeUInt32LE(body.length, 4);
  return Buffer.concat([header, body]);
}
class Decoder {
  constructor(onFrame) { this.buffer = Buffer.alloc(0); this.onFrame = onFrame; }
  push(chunk) {
    this.buffer = Buffer.concat([this.buffer, chunk]);
    while (this.buffer.length >= 8) {
      const op = this.buffer.readUInt32LE(), size = this.buffer.readUInt32LE(4);
      if (size > 1024 * 1024) throw new Error('IPC frame too large');
      if (this.buffer.length < 8 + size) break;
      const body = this.buffer.subarray(8, 8 + size);
      this.buffer = this.buffer.subarray(8 + size);
      this.onFrame(op, body);
    }
  }
}
class Discord {
  constructor(id, log = () => {}) { this.id = id; this.log = log; this.requests = new Map(); this.ready = false; }
  async connect() {
    for (let i = 0; i < 10; i++) {
      try { await this.open(`\\\\.\\pipe\\discord-ipc-${i}`); return; }
      catch (error) { this.disconnect(); if (i === 9) throw error; }
    }
  }
  open(pipe) {
    return new Promise((resolve, reject) => {
      const socket = net.createConnection(pipe); this.socket = socket;
      const timeout = setTimeout(() => { reject(new Error('Discord handshake timeout')); socket.destroy(); }, 5000);
      const decoder = new Decoder((op, body) => {
        if (op === 3) { socket.write(frame(4, body)); return; }
        if (op === 2) { socket.destroy(); return; }
        if (op !== 1) return;
        const message = JSON.parse(body.toString('utf8'));
        if (message.evt === 'READY') { clearTimeout(timeout); this.ready = true; resolve(); }
        const request = this.requests.get(message.nonce);
        if (request) {
          this.requests.delete(message.nonce); clearTimeout(request.timer);
          if (message.evt === 'ERROR') request.reject(new Error(`${message.data?.code}: ${message.data?.message}`));
          else request.resolve(message.data);
        }
      });
      socket.on('connect', () => socket.write(frame(0, {v: 1, client_id: this.id})));
      socket.on('data', chunk => { try { decoder.push(chunk); } catch (e) { reject(e); socket.destroy(); } });
      socket.on('error', reject);
      socket.on('close', () => {
        clearTimeout(timeout); if (this.socket === socket) this.ready = false; reject(new Error('Discord disconnected'));
        for (const r of this.requests.values()) { clearTimeout(r.timer); r.reject(new Error('Discord disconnected')); }
        this.requests.clear();
      });
    });
  }
  activity(activity) {
    if (!this.ready) return Promise.reject(new Error('Discord not connected'));
    const nonce = randomUUID();
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { this.requests.delete(nonce); reject(new Error('SET_ACTIVITY timeout')); }, 8000);
      this.requests.set(nonce, {resolve, reject, timer});
      this.socket.write(frame(1, {cmd: 'SET_ACTIVITY', args: {pid: process.pid, activity}, nonce}));
    });
  }
  disconnect() { this.ready = false; this.socket?.destroy(); }
}
module.exports = {Discord, Decoder, frame};
