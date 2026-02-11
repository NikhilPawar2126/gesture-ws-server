// const WebSocket = require("ws");

// const PORT = process.env.PORT || 8080;
// const wss = new WebSocket.Server({ port: PORT });

// const clients = new Set();

// console.log("WebSocket server running on port", PORT);

// wss.on("connection", ws => {
//   clients.add(ws);
//   console.log("Client connected");

//   ws.on("message", msg => {
//     // broadcast to all clients
//     for (const client of clients) {
//       if (client.readyState === WebSocket.OPEN) {
//         client.send(msg.toString());
//       }
//     }
//   });

//   ws.on("close", () => {
//     clients.delete(ws);
//     console.log("Client disconnected");
//   });
// });

/************************************************************
 * SIMPLE WEBSOCKET RELAY SERVER (RAILWAY STABLE)
 * ESP32 <-> Web Clients
 *
 * - Receives sensor data from ESP32
 * - Sends it to gesture.js
 * - Receives display text from gesture.js
 * - Sends it to ESP32 LCD
 * - Receives button pressed from ESP32
 * - Sends it to emergency.js
 ************************************************************/

const http = require("http");
const WebSocket = require("ws");

const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end("🚀 Gesture WebSocket Relay Server Running");
});

// WebSocket Server
const wss = new WebSocket.Server({ server });

console.log("✅ WebSocket Relay Ready");

// Connected clients
const clients = new Set();

// When client connects
wss.on("connection", (ws) => {
  clients.add(ws);
  console.log("🔌 Client Connected | Total:", clients.size);

  ws.on("message", (msg) => {
    // Broadcast message to all clients
    for (const client of clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(msg.toString());
      }
    }
  });

  ws.on("close", () => {
    clients.delete(ws);
    console.log("❌ Client Disconnected | Total:", clients.size);
  });

  ws.on("error", (err) => {
    console.log("⚠️ WS Error:", err.message);
  });
});

// Keep alive ping (important for Railway)
setInterval(() => {
  for (const ws of clients) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.ping();
    }
  }
}, 20000);

// Start server
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
