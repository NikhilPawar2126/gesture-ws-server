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
app.use(cors()); // Critical for browser communication

const PORT = process.env.PORT || 8080;

// 1. Health Check Route (Open this in your browser to test if server is live)
app.get("/", (req, res) => {
    res.send("Glove Server is Running! WebSocket and SMS routes are active.");
});

// 2. EMERGENCY SMS ROUTE
app.post("/send-emergency", async (req, res) => {
    const { phone, lat, lon } = req.body;
    const API_KEY = "cd_np8_230126_lL_Xwz";

    // Shortening variables to stay under the 30-character limit
    const coordinates = `${Number(lat).toFixed(4)},${Number(lon).toFixed(4)}`;

    console.log(`[SMS Request] Attempting to send to: ${phone}`);

    try {
        // Explicitly defining the request to prevent 405/Method errors
        const response = await axios({
            method: 'post',
            url: 'https://www.circuitdigest.cloud/send_sms',
            params: { ID: '101' }, // Passes ?ID=101 correctly
            data: {
                "mobiles": phone,
                "var1": "Glove Alert",
                "var2": coordinates
            },
            headers: { 
                'Authorization': API_KEY,
                'Content-Type': 'application/json'
            }
        });
        
        console.log("[SMS Success]", response.data);
        res.json({ success: true, data: response.data });
    } catch (error) {
        // Capturing the actual error body from the response
        const errorData = error.response ? error.response.data : error.message;
        console.error("[SMS Failed]", errorData);
        res.status(500).json({ success: false, error: errorData });
    }
});

// 3. WEBSOCKET BROADCAST
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const clients = new Set();

wss.on("connection", ws => {
    clients.add(ws);
    console.log("[WS] New connection established");

    ws.on("message", msg => {
        // Broadcast Flex Sensor & Button data to all clients
        const messageStr = msg.toString();
        clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(messageStr);
            }
        });
    });

    ws.on("close", () => {
        clients.delete(ws);
        console.log("[WS] Client disconnected");
    });
});

server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
    ws.on("close", () => clients.delete(ws));
});


server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
