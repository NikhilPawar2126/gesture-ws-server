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
 * server.js
 * IoT Assistive Gesture Glove – Backend
 *
 * FEATURES:
 * - WebSocket relay (ESP32 ↔ Web Clients)
 * - Emergency WhatsApp sending via Twilio Sandbox
 * - Safe ENV-based credential handling
 * - Railway compatible (process.env.PORT)
 ************************************************************/
/************************************************************
 * server.js – SIMPLE WEBSOCKET RELAY
 * ESP32  <-->  Web Pages
 * NO APIs, NO SMS, NO WhatsApp backend
 ************************************************************/

const http = require("http");
const WebSocket = require("ws");

const PORT = process.env.PORT || 8080;

/* Create HTTP server */
const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end("Assistive Glove WebSocket Server Running");
});

/* WebSocket server */
const wss = new WebSocket.Server({ server });
const clients = new Set();

wss.on("connection", (ws) => {
  clients.add(ws);
  console.log("🔌 Client connected");

  ws.on("message", (message) => {
    // Broadcast to everyone except sender
    for (const client of clients) {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message.toString());
      }
    }
  });

  ws.on("close", () => {
    clients.delete(ws);
    console.log("❌ Client disconnected");
  });
});

server.listen(PORT, () => {
  console.log(`🚀 WebSocket server running on port ${PORT}`);
});
