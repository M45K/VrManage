const WebSocket = require('ws');

const wss = new WebSocket.Server({ host: '192.168.1.20', port: 3000 });

console.log('✅ Signaling server compatibile con Unity (pipe format) in ascolto');

const peers = new Map();

wss.on('connection', (ws) => {
  let peerId = null;

  ws.on('message', (msg) => {
    const text = msg.toString();
    const parts = text.split('|');
    if (parts.length < 4) {
      console.warn('❌ Messaggio non valido:', text);
      return;
    }

    const [type, sender, receiver, message, connCount, isSenderStr] = parts;
    const isSender = isSenderStr === 'true';

    if (type === 'NEWPEER') {
      peerId = sender;
      peers.set(peerId, ws);
      console.log(`👤 Peer registrato: ${peerId}`);
    }

    if (receiver === 'ALL') {
      // Broadcast a tutti tranne il mittente
      for (const [id, client] of peers.entries()) {
        if (id !== sender && client.readyState === WebSocket.OPEN) {
          client.send(text);
        }
      }
      console.log(`📢 Broadcast ${type} da ${sender}`);
    } else {
      if (!peers.has(receiver)) {
        console.warn(`⚠️ Destinatario non trovato: ${receiver}`);
        return;
      }

      peers.get(receiver).send(text);
      console.log(`➡️ ${type} da ${sender} a ${receiver}`);
    }
  });

  ws.on('close', () => {
    if (peerId && peers.has(peerId)) {
      peers.delete(peerId);
      console.log(`❌ Peer disconnesso: ${peerId}`);
    }
  });
});
