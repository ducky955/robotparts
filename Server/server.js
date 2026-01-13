const express = require("express");
const cors = require("cors");
const fs = require("fs");
const app = express();

const DEVICE_TIMEOUT_MS = 30000; // 30 seconds

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ------------------ LOAD PERSISTENT DATA ------------------ */

let messages = [];
let devices = {};

if (fs.existsSync("messages.json")) {
  try {
    messages = JSON.parse(fs.readFileSync("messages.json", "utf8"));
    console.log("Loaded saved messages:", messages.length);
  } catch (err) {
    console.error("Error loading messages.json:", err);
  }
}

if (fs.existsSync("devices.json")) {
  try {
    devices = JSON.parse(fs.readFileSync("devices.json", "utf8"));
    console.log("Loaded saved devices:", Object.keys(devices).length);
  } catch (err) {
    console.error("Error loading devices.json:", err);
  }
}

/* ------------------ DASHBOARD UI ------------------ */

app.get("/", (req, res) => {
  const deviceList = Object.values(devices)
    .map(d => `
      <li style="margin-bottom: 6px;">
        <span style="
          display:inline-block;
          width:10px;
          height:10px;
          background:#00cc44;
          border-radius:50%;
          margin-right:8px;
        "></span>
        <strong>${d.name}</strong>
        <span style="color:#666; font-size:12px;">
          (Last seen: ${new Date(d.lastSeen).toLocaleString()})
        </span>
      </li>
    `)
    .join("");

  const messageList = messages
    .map(m => `
      <div style="margin-bottom:10px;">
        <span style="color:#1a73e8; font-weight:bold;">[${m.time}]</span>
        <span style="color:#1a73e8;">${m.text}</span>
      </div>
    `)
    .join("");

  res.send(`
    <html>
      <body style="font-family: sans-serif; max-width: 700px; margin: auto; padding: 20px;">

        <div style="padding: 15px; border: 2px solid #ccc; border-radius: 8px; margin-bottom: 20px; background: #f7f7f7;">
          <h2 style="margin-top:0;">Devices Online</h2>
          <ul style="list-style:none; padding-left:0;">${deviceList}</ul>
        </div>

        <div style="padding: 15px; border: 2px solid #ccc; border-radius: 8px; margin-bottom: 20px; height: 300px; overflow-y: auto; background: #fafafa;">
          <h2 style="margin-top:0;">Message History</h2>
          ${messageList}
        </div>

        <div style="padding: 15px; border: 2px solid #ccc; border-radius: 8px; background: #f0f8ff;">
          <h2 style="margin-top:0;">Send Message</h2>
          <form method="POST" action="/send-message">
            <textarea name="msg" rows="3" style="width:100%; padding:10px; border-radius:6px; border:1px solid #aaa; resize: vertical;"></textarea>
            <br><br>
            <button type="submit" style="padding:10px 20px; background:#1a73e8; color:white; border:none; border-radius:6px; cursor:pointer; font-size:16px;">Send</button>
          </form>

          <form method="POST" action="/clear-messages" onsubmit="return confirm('Are you sure you want to delete ALL messages?');">
            <button type="submit" style="
              margin-top:10px;
              padding:10px 20px;
              background:#d9534f;
              color:white;
              border:none;
              border-radius:6px;
              cursor:pointer;
              font-size:16px;
            ">Clear All Messages</button>
          </form>
        </div>

      </body>
    </html>
  `);
});

/* ------------------ API ROUTES ------------------ */

// Add a new message
app.post("/send-message", (req, res) => {
  const text = req.body.msg || req.body.text || "";
  const time = new Date().toLocaleString();

  messages.push({ text, time });

  fs.writeFileSync("messages.json", JSON.stringify(messages, null, 2));

  console.log("New message:", text);
  res.redirect("/");
});

// Clear all messages
app.post("/clear-messages", (req, res) => {
  messages = [];
  fs.writeFileSync("messages.json", JSON.stringify(messages, null, 2));
  console.log("All messages cleared");
  res.redirect("/");
});

// Return ALL messages
app.get("/messages", (req, res) => {
  res.json(messages);
});

// Return ONLY the latest message
app.get("/messages/latest", (req, res) => {
  if (messages.length === 0) {
    return res.json({ text: "", time: "" });
  }
  res.json(messages[messages.length - 1]);
});

// Device registers itself
app.post("/register", (req, res) => {
  const id = req.body.id || req.query.id;
  const name = req.body.name || req.query.name;

  if (!id || !name) {
    console.log("Bad register request:", req.body);
    return res.json({ status: "error", message: "Missing id or name" });
  }

  devices[id] = {
    name,
    lastSeen: Date.now()
  };

  fs.writeFileSync("devices.json", JSON.stringify(devices, null, 2));

  console.log(`Device registered: ${name} (${id})`);
  res.json({ status: "ok" });
});

// Device heartbeat
app.post("/heartbeat", (req, res) => {
  const id = req.body.id || req.query.id;

  if (devices[id]) {
    devices[id].lastSeen = Date.now();
    fs.writeFileSync("devices.json", JSON.stringify(devices, null, 2));
  } else {
    console.log("Unknown device heartbeat:", req.body);
  }

  res.json({ status: "ok" });
});

/* ------------------ DEVICE TIMEOUT CLEANUP ------------------ */

setInterval(() => {
  const now = Date.now();

  for (const id in devices) {
    if (now - devices[id].lastSeen > DEVICE_TIMEOUT_MS) {
      console.log(`Device timed out: ${devices[id].name} (${id})`);
      delete devices[id];
      fs.writeFileSync("devices.json", JSON.stringify(devices, null, 2));
    }
  }
}, 5000);

/* ------------------ START SERVER ------------------ */

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
