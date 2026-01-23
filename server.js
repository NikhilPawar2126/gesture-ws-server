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
const axios = require("axios");
const cors = require("cors");
const http = require("http");

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 8080;

// 1. HEALTH CHECK (Visit your Railway URL in a browser to see this)
app.get("/", (req, res) => {
    res.send("<h1>Glove Server is Online</h1><p>WebSocket and SMS API are active.</p>");
});

// 2. EMERGENCY SMS ROUTE
app.post("/send-emergency", async (req, res) => {
    const { phone, lat, lon } = req.body;
    const API_KEY = "cd_np8_230126_lL_Xwz";

    // ⚠️ CRITICAL: CircuitDigest variables (var1, var2) MUST be under 30 characters.
    // We trim the GPS to 4 decimal places to ensure the SMS is accepted.
    const shortGPS = `${Number(lat).toFixed(4)},${Number(lon).toFixed(4)}`;

    console.log(`[SMS] Sending alert to: ${phone}`);

    try {
        const response = await axios({
            method: 'post',
            url: 'https://www.circuitdigest.cloud/send_sms',
            params: { ID: '101' }, // Template ID 101: "Device Status Alert"
            data: {
                "mobiles": phone, // Must be verified on the CircuitDigest website
                "var1": "Glove Alert", 
                "var2": shortGPS
            },
            headers: { 
                'Authorization': API_KEY,
                'Content-Type': 'application/json'
            }
        });
        
        console.log("[SMS SUCCESS]", response.data);
        res.json({ success: true, data: response.data });
    } catch (error) {
        const errorData = error.response ? error.response.data : error.message;
        console.error("[SMS FAILED]", errorData);
        res.status(500).json({ success: false, error: errorData });
    }
});

// 3. WEBSOCKET BROADCAST (For Finger Sensor Data)
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const clients = new Set();

wss.on("connection", (ws) => {
    clients.add(ws);
    console.log("[WS] Glove/Web App Connected");

    ws.on("message", (msg) => {
        const messageStr = msg.toString();
        // Broadcast to everyone EXCEPT the sender to save bandwidth
        clients.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(messageStr);
            }
        });
    });

    ws.on("close", () => {
        clients.delete(ws);
        console.log("[WS] Connection Closed");
    });
});

server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));