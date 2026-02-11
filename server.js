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
 * server.js (FIXED + STABLE FOR RAILWAY)
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
// ⚠️ PUT THESE IN RAILWAY ENV VARIABLES
const accountSid = process.env.TWILIO_SID || "YOUR_SID";
const authToken  = process.env.TWILIO_TOKEN || "YOUR_TOKEN";
const TWILIO_NUMBER = process.env.TWILIO_NUMBER || "+17089192504";

const client = twilio(accountSid, authToken);

/* ================= ROUTES ================= */
app.get("/", (req, res) => {
  res.send("🚀 Assistive Glove Server is Running");
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
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
      to: `+${phone}`,
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

/* ================= SERVER + WEBSOCKET ================= */
const server = http.createServer(app);

// IMPORTANT: define path explicitly
const wss = new WebSocket.Server({ server, path: "/" });

const clients = new Set();

wss.on("connection", (ws) => {
  clients.add(ws);
  console.log("🔌 WebSocket client connected");

  ws.isAlive = true;

  ws.on("pong", () => {
    ws.isAlive = true;
  });

  ws.on("message", (msg) => {
    // broadcast to all
    for (const c of clients) {
      if (c.readyState === WebSocket.OPEN) {
        c.send(msg.toString());
      }
    }
  });

  ws.on("close", () => {
    clients.delete(ws);
    console.log("❌ WebSocket client disconnected");
  });
});

// KEEPALIVE PING EVERY 20s
setInterval(() => {
  for (const ws of clients) {
    if (ws.isAlive === false) {
      clients.delete(ws);
      ws.terminate();
      continue;
    }

    ws.isAlive = false;
    ws.ping();
  }
}, 20000);

/* ================= START ================= */
const PORT = process.env.PORT || 8080;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
