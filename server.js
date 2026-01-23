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
app.use(cors()); // Fixes CORS errors for your Web App

const PORT = process.env.PORT || 8080;

// --- EMERGENCY SMS ROUTE ---
app.post("/send-emergency", async (req, res) => {
    const { phone, lat, lon } = req.body;
    const API_KEY = "cd_np8_230126_lL_Xwz";

    // ⚠️ IMPORTANT: CircuitDigest limits var1 and var2 to 30 characters each.
    // We send coordinates directly so the link stays short.
    const coordinates = `${lat.toFixed(4)},${lon.toFixed(4)}`;

    console.log(`[SMS Request] Target: ${phone}`);

    try {
        const response = await axios.post('https://www.circuitdigest.cloud/send_sms?ID=101', {
            "mobiles": phone,
            "var1": "Glove Help",     // Max 30 chars
            "var2": coordinates       // Max 30 chars (Shortened GPS)
        }, {
            headers: { 'Authorization': API_KEY }
        });
        
        console.log("[SMS Success]", response.data);
        res.json({ success: true, data: response.data });
    } catch (error) {
        // Detailed error logging to see the real issue in Railway logs
        const errorMsg = error.response ? error.response.data : error.message;
        console.error("[SMS Failed]", errorMsg);
        res.status(500).json({ success: false, error: errorMsg });
    }
});

// --- WEBSOCKET BROADCAST ---
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const clients = new Set();

wss.on("connection", ws => {
    clients.add(ws);
    console.log("New connection established");

    ws.on("message", msg => {
        // Broadcast Flex Sensor & Button data to all clients
        for (const client of clients) {
            if (client.readyState === WebSocket.OPEN) {
                client.send(msg.toString());
            }
        }
    });

    ws.on("close", () => clients.delete(ws));
});

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));