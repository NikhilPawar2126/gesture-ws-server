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

const express = require("express");
const WebSocket = require("ws");
const http = require("http");
const cors = require("cors");
const twilio = require("twilio");

const app = express();
app.use(express.json());
app.use(cors());

/* ================= TWILIO (FROM ENV) ================= */
const accountSid = process.env.TWILIO_SID;
const authToken  = process.env.TWILIO_TOKEN;

if (!accountSid || !authToken) {
  console.error("❌ Twilio ENV vars missing");
}

const client = twilio(accountSid, authToken);

/* ================= BASIC ROUTE ================= */
app.get("/", (req, res) => {
  res.send("Glove Emergency Server Running");
});

/* ================= EMERGENCY ROUTE ================= */
app.post("/send-emergency", async (req, res) => {
  const { phone, lat, lon } = req.body;

  if (!phone || !lat || !lon) {
    return res.status(400).json({ success: false, error: "Missing data" });
  }

  const mapLink = `https://www.google.com/maps?q=${lat},${lon}`;

  try {
    const msg = await client.messages.create({
      from: "whatsapp:+14155238886",          // Twilio sandbox number
      to:   `whatsapp:+${phone}`,             // MUST have joined sandbox
      body: `🚨 *EMERGENCY ALERT*\nI need help!\n📍 ${mapLink}`
    });

    console.log("✅ WhatsApp sent:", msg.sid);
    res.json({ success: true });

  } catch (err) {
    console.error("❌ Twilio Error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ================= WEBSOCKET ================= */
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const clients = new Set();

wss.on("connection", (ws) => {
  clients.add(ws);

  ws.on("message", (msg) => {
    for (const c of clients) {
      if (c !== ws && c.readyState === WebSocket.OPEN) {
        c.send(msg.toString());
      }
    }
  });

  ws.on("close", () => clients.delete(ws));
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
