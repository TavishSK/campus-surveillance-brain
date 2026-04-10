import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { analyzeText } from "./analyze.js";
import {
  saveLog,
  getLogs,
  getSuspectScore,
  getAlerts
} from "./db.js";
import { fetchRedditPosts } from "./reddit.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Server running");
});

// 🔍 Analyze manual input
app.post("/analyze", async (req, res) => {
  const { text } = req.body;

  const result = await analyzeText(text);

  saveLog({
    text,
    ...result,
    source: "manual"
  });

  res.json(result);
});

// 🌐 Scan Reddit (FIXED)
app.get("/scan-reddit", async (req, res) => {
  try {
    const posts = await fetchRedditPosts();

    console.log("🔥 REDDIT POSTS:", posts.length);

    for (const post of posts) {
      const analysis = await analyzeText(post.title);

      saveLog({
        text: post.title,
        threat_score: analysis.threat_score,
        sentiment: analysis.sentiment,
        source: "reddit"
      });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Reddit scan error:", err);
    res.status(500).json({ error: "failed" });
  }
});

// 📊 Logs
app.get("/logs", (req, res) => {
  const data = getLogs();
  console.log("📊 LOGS SENT:", data);
  res.json(data);
});

// 👤 Suspect
app.get("/suspect", (req, res) => {
  res.json(getSuspectScore());
});

// 🚨 Alerts
app.get("/alerts", (req, res) => {
  res.json(getAlerts());
});

const PORT = 5001;

app.listen(PORT, () => {
  console.log(`🔥 Server running on port ${PORT}`);
});