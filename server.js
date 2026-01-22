const WebSocket = require("ws");

const PORT = process.env.PORT || 8080;
const wss = new WebSocket.Server({ port: PORT });

const clients = new Set();

console.log("WebSocket server running on port", PORT);

wss.on("connection", ws => {
  clients.add(ws);
  console.log("Client connected");

  ws.on("message", msg => {
    // broadcast to all clients
    for (const client of clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(msg.toString());
      }
    }
  });

  ws.on("close", () => {
    clients.delete(ws);
    console.log("Client disconnected");
  });
});
