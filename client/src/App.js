import { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [booting, setBooting] = useState(true);
  const [bootText, setBootText] = useState("");

  const bootLines = [
    "Initializing Surveillance System...",
    "Loading Threat Models...",
    "Connecting to Intelligence Network...",
    "Scanning External Signals...",
    "System Ready."
  ];

  // 🧠 BOOT SEQUENCE
  useEffect(() => {
    let i = 0;

    const interval = setInterval(() => {
      if (i < bootLines.length) {
        setBootText((prev) => prev + bootLines[i] + "\n");
        i++;
      } else {
        clearInterval(interval);

        setTimeout(() => {
          setBooting(false);
        }, 800);
      }
    }, 700);

    return () => clearInterval(interval);
  }, []);

  if (booting) {
    return (
      <div className="boot-screen">
        <pre>{bootText}</pre>
      </div>
    );
  }

  return <MainApp />;
}

/* ================= MAIN APP ================= */

function MainApp() {
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [logs, setLogs] = useState([]);
  const [suspect, setSuspect] = useState(null);
  const [isAlert, setIsAlert] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lastAlertCount, setLastAlertCount] = useState(0);
  const [lastUpdated, setLastUpdated] = useState(null);

  const analyze = async () => {
    setLoading(true);

    const res = await fetch("http://localhost:5001/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ text })
    });

    const data = await res.json();
    setResult(data);
    await fetchAll();
    setLoading(false);
  };

  const scanReddit = async () => {
    setLoading(true);

    await fetch("http://localhost:5001/scan-reddit");

    setTimeout(async () => {
      await fetchAll();
      alert("Reddit scan complete!");
    }, 800);

    setLoading(false);
  };

  const fetchAll = async () => {
    const logsRes = await fetch("http://localhost:5001/logs");
    let logsData = await logsRes.json();

    logsData.sort((a, b) => b.threat_score - a.threat_score);
    setLogs(logsData);

    const suspectRes = await fetch("http://localhost:5001/suspect");
    setSuspect(await suspectRes.json());

    setLastUpdated(new Date().toLocaleTimeString());

    const highThreats = logsData.filter(
      (l) => l.threat_score > 0.75
    ).length;

    if (highThreats > lastAlertCount) {
      setLastAlertCount(highThreats);
      setIsAlert(true);
    }
  };

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 5000);
    return () => clearInterval(interval);
  }, []);

  const getClass = (score) => {
    if (score > 0.75) return "card high";
    if (score > 0.5) return "card medium";
    return "card low";
  };

  const getThreatLabel = (score) => {
    if (score > 0.75) return "🚨 ACTIVE THREAT";
    if (score > 0.5) return "⚠️ SUSPICIOUS";
    return "🟢 SAFE";
  };

  const getGlobalThreat = () => {
    if (logs.length === 0) return 0;
    return logs.reduce((s, l) => s + l.threat_score, 0) / logs.length;
  };

  const topThreat = logs[0];

  return (
    <>
      {/* 💻 TOP RIGHT */}
      <div className="terminal-signature">
        &gt; Made by Tavish SK<span className="cursor">_</span>
      </div>

      {isAlert && <div className="alert-overlay"></div>}

      <div className="radar"></div>

      <div className="container">
        <h1 className="typing-title">🧠 Surveillance Command Center</h1>

        {/* LEFT */}
        <div className="panel">
          <h2>🌐 Global Threat Level</h2>

          <div className="global-meter">
            <div
              className="global-fill"
              style={{ width: `${getGlobalThreat() * 100}%` }}
            ></div>
          </div>

          <p>{(getGlobalThreat() * 100).toFixed(1)}% risk</p>
          <p>Total Events: {logs.length}</p>
          <p>Last Updated: {lastUpdated}</p>

          <h2>🎯 Input</h2>

          <textarea
            rows="4"
            placeholder="Enter suspicious text..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />

          <button onClick={analyze}>
            {loading ? "Processing..." : "Analyze"}
          </button>

          <button onClick={scanReddit}>
            {loading ? "Scanning..." : "Scan Reddit"}
          </button>

          {result && (
            <div className={`card ${getClass(result.threat_score)}`}>
              <p>Threat: {result.threat_score.toFixed(3)}</p>
              <p>{getThreatLabel(result.threat_score)}</p>

              <div
                className="bar"
                style={{ width: `${result.threat_score * 100}%` }}
              ></div>
            </div>
          )}

          <h2>👤 Suspect</h2>

          {suspect && (
            <div className="card">
              <p>Risk: {suspect.risk_level}</p>
              <p>Avg: {suspect.avg_threat_score.toFixed(3)}</p>
              <p>Events: {suspect.high_threat_events}</p>
            </div>
          )}
        </div>

        {/* RIGHT */}
        <div className="panel">
          <h2>📡 Live Threat Feed</h2>

          {topThreat && (
            <div className="card high">
              <h3>🔥 Highest Threat</h3>
              <p>{topThreat.text}</p>
              <p>{topThreat.threat_score.toFixed(3)}</p>
            </div>
          )}

          {logs.map((log, i) => (
            <div key={i} className={`card ${getClass(log.threat_score)}`}>
              <p><b>{log.text}</b></p>

              <p>Threat: {log.threat_score.toFixed(3)}</p>

              <div
                className={`bar ${
                  log.threat_score > 0.75
                    ? "high"
                    : log.threat_score > 0.5
                    ? "medium"
                    : ""
                }`}
                style={{ width: `${log.threat_score * 100}%` }}
              ></div>

              <p>{getThreatLabel(log.threat_score)}</p>

              <p className="meta">📡 {log.source}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default App;