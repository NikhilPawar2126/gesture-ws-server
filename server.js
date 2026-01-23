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
const http = require("http");
const WebSocket = require("ws");
const cors = require("cors");
const twilio = require("twilio");

/* ================== APP SETUP ================== */
const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 8080;

/* ================== TWILIO SETUP ================== */
/*
  IMPORTANT:
  These MUST be set in Railway → Variables

  TWILIO_SID   = ACxxxxxxxxxxxxxxxxxxxx
  TWILIO_TOKEN = your_auth_token
*/

const accountSid = process.env.TWILIO_SID;
const authToken  = process.env.TWILIO_TOKEN;

if (!accountSid || !authToken) {
  console.error("❌ Twilio ENV variables missing");
}

const twilioClient = twilio(accountSid, authToken);

// Twilio WhatsApp Sandbox number (fixed)
const TWILIO_WHATSAPP_FROM = "whatsapp:+14155238886";

/* ================== BASIC HEALTH CHECK ================== */
app.get("/", (req, res) => {
  res.send("✅ Assistive Glove Server is LIVE");
});

/* ================== EMERGENCY ROUTE ================== */
app.post("/send-emergency", async (req, res) => {
  const { phone, lat, lon } = req.body;

  if (!phone || !lat || !lon) {
    return res.status(400).json({
      success: false,
      error: "Missing phone or location data"
    });
  }

  // Clean phone number (digits only)
  const cleanPhone = phone.replace(/\D/g, "");
  const toNumber = `whatsapp:+${cleanPhone}`;

  const mapLink = `https://www.google.com/maps?q=${lat},${lon}`;

  try {
    const message = await twilioClient.messages.create({
      from: TWILIO_WHATSAPP_FROM,
      to: toNumber,
      body:
        "🚨 *EMERGENCY ALERT* 🚨\n" +
        "The glove user needs immediate help.\n" +
        `📍 Location: ${mapLink}`
    });

    console.log("✅ WhatsApp sent:", message.sid);

    res.json({ success: true });

  } catch (error) {
    console.error("❌ Twilio Error:", error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/* ================== HTTP + WEBSOCKET ================== */
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const clients = new Set();

wss.on("connection", (ws) => {
  clients.add(ws);
  console.log("🔌 WebSocket client connected");

  ws.on("message", (message) => {
    const msg = message.toString();

    // Broadcast to ALL other clients (NOT echo back)
    clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(msg);
      }
    });
  });

  ws.on("close", () => {
    clients.delete(ws);
    console.log("❌ WebSocket client disconnected");
  });

  ws.on("error", (err) => {
    console.error("WS Error:", err.message);
  });
});

/* ================== START SERVER ================== */
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
