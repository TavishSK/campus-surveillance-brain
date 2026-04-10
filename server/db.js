let logs = [];

export function saveLog(entry) {
  logs.push({
    ...entry,
    timestamp: new Date().toISOString()
  });
}

export function getLogs() {
  return logs.sort((a, b) => b.threat_score - a.threat_score);
}

export function getSuspectScore() {
  if (logs.length === 0) {
    return {
      risk_level: "LOW",
      avg_threat_score: 0,
      high_threat_events: 0
    };
  }

  const avg =
    logs.reduce((sum, l) => sum + l.threat_score, 0) / logs.length;

  const high = logs.filter((l) => l.threat_score > 0.7).length;

  let risk = "LOW";
  if (avg > 0.6) risk = "HIGH";
  else if (avg > 0.3) risk = "MEDIUM";

  return {
    risk_level: risk,
    avg_threat_score: avg,
    high_threat_events: high
  };
}

export function getAlerts() {
  const highThreats = logs.filter((l) => l.threat_score > 0.7);

  return {
    alert: highThreats.length >= 3
  };
}