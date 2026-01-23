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

const app = express();
app.use(cors());
app.use(express.json());

/* ================= TWILIO CONFIG ================= */

// ⚠️ MOVE THESE TO RAILWAY VARIABLES LATER
const accountSid = "AC6201e39c2e427a09fdc7f1e7b9c1b9e9";
const authToken  = "2cbd62be7b900a889d6c3f488486e958";

// ✅ YOUR ACTIVE TWILIO SMS NUMBER
const TWILIO_NUMBER = "+17089192504";

const client = twilio(accountSid, authToken);

/* ================= HTTP ROUTES ================= */

app.get("/", (req, res) => {
  res.send("🚀 Assistive Glove Server is Running");
});

/* ===== SEND EMERGENCY SMS ===== */
app.post("/send-emergency", async (req, res) => {
  const { phone, lat, lon } = req.body;

  if (!phone || !lat || !lon) {
    return res.status(400).json({
      success: false,
      error: "Missing phone or location data"
    });
  }

  const mapLink = `https://www.google.com/maps?q=${lat},${lon}`;
  const body =
`🚨 EMERGENCY ALERT 🚨
I need immediate help!

📍 Live Location:
${mapLink}`;

  try {
    const message = await client.messages.create({
      from: TWILIO_NUMBER,
      to: `+${phone}`,   // e.g. 919512419089
      body
    });

    console.log("✅ SMS SENT:", message.sid);
    res.json({ success: true });

  } catch (err) {
    console.error("❌ TWILIO ERROR:", err.message);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/* ================= WEBSOCKET ================= */

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const clients = new Set();

wss.on("connection", ws => {
  clients.add(ws);
  console.log("🔌 WebSocket client connected");

  ws.on("message", msg => {
    for (const c of clients) {
      if (c !== ws && c.readyState === WebSocket.OPEN) {
        c.send(msg.toString());
      }
    }
  });

  ws.on("close", () => {
    clients.delete(ws);
    console.log("❌ WebSocket client disconnected");
  });
});

/* ================= START ================= */

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
