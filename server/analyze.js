import fetch from "node-fetch";

export async function analyzeText(text) {
  try {
    const response = await fetch(
      "https://router.huggingface.co/hf-inference/models/unitary/toxic-bert",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.HF_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ inputs: text })
      }
    );

    const result = await response.json();

    let threat_score = 0;

    if (Array.isArray(result)) {
      result[0].forEach((p) => {
        if (p.label === "toxic") {
          threat_score = p.score;
        }
      });
    }

    // 🔥 SMART KEYWORD BOOST
    const dangerousWords = [
      "bomb", "bomber", "kill", "attack",
      "gun", "shoot", "explode", "terror",
      "fire", "weapon", "hostage", "massacre"
    ];

    const suspiciousWords = [
      "burn", "threat", "danger", "riot", "violence"
    ];

    const lowerText = text.toLowerCase();

    let keywordBoost = 0;

    dangerousWords.forEach(word => {
      if (lowerText.includes(word)) {
        keywordBoost = Math.max(keywordBoost, 0.75);
      }
    });

    suspiciousWords.forEach(word => {
      if (lowerText.includes(word)) {
        keywordBoost = Math.max(keywordBoost, 0.55);
      }
    });

    // 🔥 CONTEXT BOOST (THIS IS INSANE PART)
    if (
      lowerText.includes("set fire") ||
      lowerText.includes("burned") ||
      lowerText.includes("explosion")
    ) {
      keywordBoost = Math.max(keywordBoost, 0.65);
    }

    const intentWords = ["i will", "i am going to", "let me", "tonight", "plan to"];

let intentBoost = 0;

intentWords.forEach(word => {
  if (lowerText.includes(word)) {
    intentBoost = 0.2;
  }
});

threat_score = Math.min(1, threat_score + intentBoost);

    // FINAL SCORE = MAX OF BOTH
    threat_score = Math.max(threat_score, keywordBoost);

    return {
      sentiment: threat_score > 0.5 ? "negative" : "neutral",
      threat_score
    };

  } catch (err) {
    console.error("ERROR:", err.message);

    return {
      sentiment: "error",
      threat_score: 0
    };
  }
}