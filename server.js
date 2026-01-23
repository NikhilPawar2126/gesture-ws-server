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

// --- TWILIO CONFIGURATION ---
const accountSid = 'AC6201e39c2e427a09fdc7f1e7b9c1b9e9'; 
const authToken = '416a890d41f75f91457d195f591f83fa';   
const client = new twilio(accountSid, authToken);

const PORT = process.env.PORT || 8080;

// Health Check for Railway
app.get("/", (req, res) => {
    res.send("<h1>Glove Server is Online</h1><p>Twilio WhatsApp & WebSockets Active.</p>");
});

// --- AUTOMATIC WHATSAPP ROUTE ---
app.post("/send-emergency", async (req, res) => {
    const { phone, lat, lon } = req.body;
    
    // Twilio Sandbox Number (Check your Twilio console to confirm this number)
    const twilioNumber = 'whatsapp:+14155238886'; 
    const targetNumber = `whatsapp:+${phone}`; // Converts 919512419089 to whatsapp:+919512419089

    const mapLink = `https://www.google.com/maps?q=${lat},${lon}`;

    console.log(`[WhatsApp] Sending automatic alert to: ${targetNumber}`);

    try {
        const message = await client.messages.create({
            from: twilioNumber,
            body: `🚨 *EMERGENCY ALERT* 🚨\nThe glove user needs help!\n📍 Location: ${mapLink}`,
            to: targetNumber
        });
        
        console.log("[Twilio Success] Message SID:", message.sid);
        res.json({ success: true, sid: message.sid });
    } catch (error) {
        console.error("[Twilio Failed]", error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// --- WEBSOCKET BROADCAST (For Finger Sensors) ---
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const clients = new Set();

wss.on("connection", (ws) => {
    clients.add(ws);
    console.log("[WS] New client connected (Glove/App)");

    ws.on("message", (msg) => {
        const messageStr = msg.toString();
        // Broadcast to all connected web dashboards
        clients.forEach(client => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(messageStr);
            }
        });
    });

    ws.on("close", () => {
        clients.delete(ws);
        console.log("[WS] Client disconnected");
    });
});

server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));