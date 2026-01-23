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
const express = require("express");
const WebSocket = require("ws");
const http = require("http");
const cors = require("cors");
const twilio = require("twilio");

const app = express();
app.use(express.json());
app.use(cors());

// --- UPDATED CREDENTIALS ---
const accountSid = 'AC6201e39c2e427a09fdc7f1e7b9c1b9e9'; 
const authToken = '416a890d41f75f91457d195f591f83fa'; // Triple check this matches your Twilio "Show Auth Token" button!

const client = new twilio(accountSid, authToken);
const PORT = process.env.PORT || 8080;

app.get("/", (req, res) => res.send("Glove Server Live & Twilio Authenticated"));

app.post("/send-emergency", async (req, res) => {
    const { phone, lat, lon } = req.body;
    const mapLink = `https://www.google.com/maps?q=${lat},${lon}`;

    try {
        const message = await client.messages.create({
            from: 'whatsapp:+14155238886',
            to: `whatsapp:+${phone}`,
            body: `🚨 GLOVE EMERGENCY alert!\nUser needs help.\nLocation: ${mapLink}`
        });
        
        console.log("✅ Message Sent! SID:", message.sid);
        res.json({ success: true });
    } catch (error) {
        console.error("❌ Twilio Error:", error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// --- WEBSOCKETS (FOR SENSORS) ---
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const clients = new Set();

wss.on("connection", (ws) => {
    clients.add(ws);
    ws.on("message", (msg) => {
        const messageStr = msg.toString();
        clients.forEach(c => {
            if (c !== ws && c.readyState === WebSocket.OPEN) c.send(messageStr);
        });
    });
    ws.on("close", () => clients.delete(ws));
});

server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
