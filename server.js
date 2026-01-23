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

// ALLOWS your web app to talk to this server
app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

const PORT = process.env.PORT || 8080;

// --- 🟢 PART 1: EMERGENCY SMS ROUTE ---
// This handles the SMS and DOES NOT interfere with the sensors.
app.post("/send-emergency", async (req, res) => {
    const { phone, lat, lon } = req.body;
    const API_KEY = "cd_np8_230126_lL_Xwz";
    
    // 1. Shorten the URL (CircuitDigest has a character limit for variables)
    // Using a more compact Google Maps format
    const locUrl = `maps.google.com/?q=${lat},${lon}`;

    console.log(`[SMS Request] Sending to: ${phone}`);

    try {
        const response = await axios.post('https://www.circuitdigest.cloud/send_sms?ID=101', {
            "mobiles": phone,
            "var1": "Glove User",
            "var2": locUrl
        }, {
            headers: { 'Authorization': API_KEY }
        });
        
        console.log("[SMS Success]", response.data);
        res.json({ success: true, data: response.data });
    } catch (error) {
        // This will print the ACTUAL error from CircuitDigest in your Railway Logs
        if (error.response) {
            console.error("[CircuitDigest Error Body]:", error.response.data);
            res.status(500).json({ success: false, error: error.response.data.message || "API Rejected Request" });
        } else {
            console.error("[Network Error]:", error.message);
            res.status(500).json({ success: false, error: "Server Connection Failed" });
        }
    }
});

// --- 🔵 PART 2: WEBSOCKET BROADCAST ---
// This is your original code that handles Flex Sensor data.
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const clients = new Set();

wss.on("connection", ws => {
    clients.add(ws);
    console.log("Client (Glove or WebApp) connected");

    ws.on("message", msg => {
        // BROADCAST to all clients (Flex sensors continue working here)
        for (const client of clients) {
            if (client.readyState === WebSocket.OPEN) {
                client.send(msg.toString());
            }
        }
    });

    ws.on("close", () => clients.delete(ws));
});

server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));