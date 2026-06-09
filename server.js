// SkripsiMonitor - Signaling Server
// Jalankan: node server.js
// Butuh: npm install ws

const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

const PORT = process.env.PORT || 3000;

// HTTP server untuk serve file statis
const httpServer = http.createServer((req, res) => {
  let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);
  const ext = path.extname(filePath);
  const contentTypes = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.ico': 'image/x-icon',
    '.webmanifest': 'application/manifest+json'
  };

  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (req.url !== '/favicon.ico') {
        // Fallback ke index.html untuk PWA routing
        fs.readFile(path.join(__dirname, 'index.html'), (e2, d2) => {
          if (e2) { res.writeHead(404); res.end('Not Found'); return; }
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(d2);
        });
      } else {
        res.writeHead(204); res.end();
      }
      return;
    }
    res.writeHead(200, { 'Content-Type': contentTypes[ext] || 'text/plain' });
    res.end(data);
  });
});

// WebSocket signaling server
const wss = new WebSocket.Server({ server: httpServer });

// rooms: { roomId: { userA: ws, userB: ws } }
const rooms = {};

// Simpan info user per WS
const clients = new Map();

function broadcastToRoom(roomId, senderId, message) {
  const room = rooms[roomId];
  if (!room) return;
  Object.entries(room).forEach(([role, ws]) => {
    if (ws && ws !== senderId && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  });
}

function getPartnerRole(role) {
  return role === 'userA' ? 'userB' : 'userA';
}

wss.on('connection', (ws) => {
  console.log('[WS] Client terhubung');

  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch (e) { return; }

    switch (msg.type) {

      case 'join': {
        // msg: { type: 'join', roomId, role, username }
        const { roomId, role, username } = msg;
        if (!rooms[roomId]) rooms[roomId] = {};

        // Jika role sudah dipakai, tolak
        if (rooms[roomId][role] && rooms[roomId][role].readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'error', message: 'Role sudah digunakan di room ini.' }));
          return;
        }

        rooms[roomId][role] = ws;
        clients.set(ws, { roomId, role, username });

        ws.send(JSON.stringify({ type: 'joined', role, roomId }));
        console.log(`[JOIN] ${username} (${role}) masuk room ${roomId}`);

        // Beritahu partner jika sudah ada
        const partnerRole = getPartnerRole(role);
        const partnerWs = rooms[roomId][partnerRole];
        if (partnerWs && partnerWs.readyState === WebSocket.OPEN) {
          // Beritahu yang baru join bahwa partner sudah online
          ws.send(JSON.stringify({ type: 'partner_online', partnerRole }));
          // Beritahu partner bahwa user baru join
          partnerWs.send(JSON.stringify({ type: 'partner_online', partnerRole: role, username }));
        }
        break;
      }

      case 'offer':
      case 'answer':
      case 'ice_candidate': {
        // Forward ke partner
        const info = clients.get(ws);
        if (!info) return;
        broadcastToRoom(info.roomId, ws, msg);
        break;
      }

      case 'notify': {
        // Kirim notifikasi ke partner
        // msg: { type: 'notify', text }
        const info = clients.get(ws);
        if (!info) return;
        broadcastToRoom(info.roomId, ws, {
          type: 'notify',
          from: info.username,
          text: msg.text
        });
        break;
      }

      case 'ping': {
        ws.send(JSON.stringify({ type: 'pong' }));
        break;
      }
    }
  });

  ws.on('close', () => {
    const info = clients.get(ws);
    if (!info) return;
    const { roomId, role, username } = info;

    if (rooms[roomId]) {
      delete rooms[roomId][role];
      if (Object.keys(rooms[roomId]).length === 0) {
        delete rooms[roomId];
      } else {
        // Beritahu partner
        broadcastToRoom(roomId, ws, {
          type: 'partner_offline',
          username
        });
      }
    }

    clients.delete(ws);
    console.log(`[LEAVE] ${username} (${role}) keluar`);
  });

  ws.on('error', (err) => {
    console.error('[WS Error]', err.message);
  });
});

httpServer.listen(PORT, () => {
  console.log(`\n✅ SkripsiMonitor Server berjalan di http://localhost:${PORT}`);
  console.log(`   Bagikan URL ini ke kedua perangkat (pastikan satu jaringan atau pakai ngrok)\n`);
});
