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
// });const express = require("express");
const WebSocket = require("ws");
const axios = require("axios");
const cors = require("cors");
const http = require("http");

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 8080;

// 1. HEALTH CHECK
app.get("/", (req, res) => {
    res.send("<h1>Glove Server Online</h1><p>SMS target: 9512419089</p>");
});

// 2. EMERGENCY SMS ROUTE (Hardcoded)
app.post("/send-emergency", async (req, res) => {
    const { lat, lon } = req.body; // Browser only sends location now
    const API_KEY = "cd_np8_230126_lL_Xwz";
    const TARGET_NUMBER = "919512419089"; // Your friend's number with country code

    // Truncate to 3 decimals to ensure we stay under the 30-character limit
    const shortGPS = `${Number(lat).toFixed(3)},${Number(lon).toFixed(3)}`;

    console.log(`[SMS] Sending alert to Friend: ${TARGET_NUMBER}`);

    try {
        const response = await axios({
            method: 'post',
            url: 'https://www.circuitdigest.cloud/send_sms?ID=101',
            data: {
                "mobiles": TARGET_NUMBER,
                "var1": "Glove Alert", 
                "var2": shortGPS
            },
            headers: { 
                'Authorization': API_KEY,
                'Content-Type': 'application/json'
            }
        });
        
        console.log("[SMS SUCCESS]", response.data);
        res.json({ success: true });
    } catch (error) {
        const errorData = error.response ? error.response.data : error.message;
        console.error("[SMS FAILED]", errorData);
        res.status(500).json({ success: false, error: errorData });
    }
});

// 3. WEBSOCKET BROADCAST (Does NOT affect sensor data)
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const clients = new Set();

wss.on("connection", (ws) => {
    clients.add(ws);
    console.log("[WS] Client Connected");

    ws.on("message", (msg) => {
        const messageStr = msg.toString();
        // This part handles your flex sensors - it remains untouched and fast!
        clients.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(messageStr);
            }
        });
    });

    ws.on("close", () => clients.delete(ws));
});

server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
