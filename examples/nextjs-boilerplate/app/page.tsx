"use client";
import React, { useState, useEffect, useRef } from "react";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"v1" | "v2">("v1");

  // --- V1.1 State ---
  const [anchorLog, setAnchorLog] = useState<any>(null);
  const [isAnchoring, setIsAnchoring] = useState(false);
  const [simulateKmirFailure, setSimulateKmirFailure] = useState(false);

  // --- V2.0 State ---
  const [streamLog, setStreamLog] = useState<string[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sequence, setSequence] = useState(0);
  const [streamAction, setStreamAction] = useState<"normal" | "drop" | "ad_break" | "spoof" | "deepfake">("normal");
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { logEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [streamLog]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && activeTab === "v2") {
      interval = setInterval(async () => {
        const currentSeq = sequence + 1;
        
        // Capture the one-time action and immediately reset it so the sequence auto-recovers
        setSequence(currentSeq);
        const actionToApply = streamAction;
        if (streamAction !== "normal") {
           setStreamAction("normal");
        }

        try {
          const res = await fetch(`/api/advanced-stream?seq=${currentSeq}&action=${actionToApply}`);
          const data = await res.json();
          
          if (res.status === 403) {
             setStreamLog(prev => [...prev, `[CDN EDGE] ❌ BLOCKED Seq ${currentSeq} - ${data.error}`]);
             setIsPlaying(false);
          } else {
             setStreamLog(prev => [...prev, `[CDN EDGE] ✅ SERVED Seq ${currentSeq} - ${data.message}`]);
          }
        } catch (e: any) { setIsPlaying(false); }
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [isPlaying, sequence, activeTab, streamAction]);

  const runAnchorTest = async () => {
    setIsAnchoring(true);
    setAnchorLog(null);
    try {
      const res = await fetch("/api/anchor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ simulateKmirFailure })
      });
      const data = await res.json();
      setAnchorLog(data);
    } catch(e) {
      setAnchorLog({ success: false, error: String(e) });
    }
    setIsAnchoring(false);
  };

  return (
    <main style={{ padding: "3rem", fontFamily: "sans-serif", maxWidth: "1000px", margin: "0 auto" }}>
      <h1 style={{ letterSpacing: "-1px", fontSize: "2.5rem" }}>🛡️ Human Is Kind™ <span style={{color: "#666"}}>Console</span></h1>
      <p style={{ fontSize: "1.1rem", marginBottom: "2rem" }}>Master Dashboard visualizing the deterministic workflows of the HIK Protocol.</p>

      <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem", borderBottom: "2px solid #eee", paddingBottom: "1rem" }}>
        <button onClick={() => setActiveTab("v1")} style={tabStyle(activeTab === "v1")}>
          v1.1 (Static Asset Anchoring)
        </button>
        <button onClick={() => setActiveTab("v2")} style={tabStyle(activeTab === "v2")}>
          v2.0 (Live Stream SDK Edge)
        </button>
      </div>

      {activeTab === "v1" && (
        <section>
          <h2>The Ethical Kernel (v1.1)</h2>
          <p>Visually confirms the C2PA signing, KMIR policy enforcement, IPFS pinning, and Ethereum/Polygon Blockchain transaction anchoring.</p>
          
          <div style={{ background: "#f8f9fa", padding: "1.5rem", borderRadius: "8px", border: "1px solid #ddd", marginBottom: "2rem" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontWeight: "bold", fontSize: "1.1rem" }}>
              <input type="checkbox" checked={simulateKmirFailure} onChange={e => setSimulateKmirFailure(e.target.checked)} style={{ width: "20px", height: "20px" }} />
              Simulate KMIR Falsification (Omit deepfake parameter)
            </label>
            <p style={{ fontSize: "0.95rem", color: "#666", marginTop: "0.5rem" }}>Check this to omit `no_deepfake_manipulation: true` from the payload, forcefully triggering the SDK's Zero-Trust validation blockade.</p>
            
            <button onClick={runAnchorTest} disabled={isAnchoring} style={{ marginTop: "1rem", padding: "0.75rem 1.5rem", background: "#000", color: "#fff", cursor: "pointer", borderRadius: "6px", fontWeight: "bold", fontSize: "1rem" }}>
              {isAnchoring ? "Anchoring payload to Blockchain..." : "Execute signAndAnchor()"}
            </button>
          </div>

          {anchorLog && anchorLog.success && (
            <div style={{ padding: "1.5rem", border: "3px solid #4CAF50", borderRadius: "8px", background: "#f1f8e9" }}>
              <h3 style={{ color: "#2E7D32", marginTop: 0, fontSize: "1.5rem" }}>✅ The Sacred Trace Authorized & Anchored!</h3>
              <p>The C2PA manifest was successfully signed, wrapped into IPFS, and permanently anchored on-chain.</p>
              <ul style={{ wordBreak: "break-all", lineHeight: "1.6", fontSize: "1.1rem", background: "#e8f5e9", padding: "1rem 2rem", borderRadius: "8px" }}>
                <li><strong>Merkle Hash:</strong> <code>{anchorLog.certificate.manifestHash}</code></li>
                <li><strong>Local Asset:</strong> <code>{anchorLog.certificate.localPath}</code></li>
                <li><strong>IPFS Pin:</strong> <a href={anchorLog.certificate.ipfsUrl} target="_blank" rel="noreferrer">{anchorLog.certificate.ipfsUrl}</a></li>
                <li style={{ marginTop: "0.5rem" }}><strong>Smart Contract TX Hash:</strong> <br/><code style={{ background: "#4CAF50", color: "#fff", padding: "0.2rem 0.5rem", borderRadius: "4px" }}>{anchorLog.certificate.txHash}</code></li>
              </ul>
            </div>
          )}

          {anchorLog && !anchorLog.success && (
            <div style={{ padding: "1.5rem", border: "3px solid #F44336", borderRadius: "8px", background: "#ffebee" }}>
              <h3 style={{ color: "#C62828", marginTop: 0, fontSize: "1.5rem" }}>❌ KMIR Policy Engine Crash</h3>
              <p style={{ color: "#C62828", fontWeight: "bold" }}>The SDK instantly aborted the transaction. Bad data was prevented from reaching the blockchain.</p>
              <div style={{ background: "#ffcdd2", padding: "1rem", borderRadius: "8px", overflowX: "auto" }}>
                <pre style={{ margin: 0, color: "#C62828" }}>{anchorLog.error}</pre>
              </div>
            </div>
          )}
        </section>
      )}

      {activeTab === "v2" && (
        <section>
          <h2>The Sequential Truth Engine (v2.0)</h2>
          <p>This UX simulates an fMP4 Edge CDN evaluating CMCDv2 telemetry (`hik-es` and `hik-ps`) in real-time. Notice how the stream aggressively halts the moment an unauthorized AI synthetic payload is introduced!</p>
          
          <div style={{ marginTop: "1.5rem", height: "350px", background: isPlaying ? "#000" : "#111", borderRadius: "8px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", border: isPlaying ? "4px solid #4CAF50" : "4px solid #F44336", transition: "all 0.3s ease" }}>
            {isPlaying ? (
               <h2 style={{ color: "#4CAF50", letterSpacing: "2px" }}>▶ LIVE BROADCAST IS SECURE...</h2>
            ) : (
               <>
                 <h2 style={{ color: "#F44336", textAlign: "center", marginBottom: "0.5rem" }}>
                   {sequence > 0 ? "⏹ STREAM HALTED BY GOVERNANCE" : "⏹ PLAYER OFFLINE"}
                 </h2>
                 {sequence > 0 && <p style={{ color: "#ff8a80" }}>Unauthorized Deepfake attempt blocked at the Edge.</p>}
               </>
            )}
          </div>

          <div style={{ marginTop: "1.5rem", display: "flex", gap: "1rem" }}>
            {isPlaying ? (
              <>
                <button onClick={() => setStreamAction("drop")} style={actionBtn("#FF9800")}>Drop Packet (Tolerance Window)</button>
                <button onClick={() => setStreamAction("ad_break")} style={actionBtn("#2196F3")}>Submit Authorized Ad-Break</button>
                <button onClick={() => setStreamAction("spoof")} style={actionBtn("#d500f9")}>Spoof Deepfake Ad (Blocked)</button>
                <button onClick={() => setStreamAction("deepfake")} style={actionBtn("#F44336")}>Inject Synthetic Deepfake (Blocked)</button>
              </>
            ) : (
              <button 
                onClick={() => { setStreamLog([]); setSequence(0); setIsPlaying(true); setStreamAction("normal"); }} 
                style={{ padding: "1rem 2rem", background: "#000", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}
              >
                Initialize Live Stream
              </button>
            )}
          </div>

          <div style={{ marginTop: "2rem", padding: "1.5rem", background: "#f8f9fa", borderRadius: "8px", border: "1px solid #ddd", height: "250px", overflowY: "auto" }}>
            <h3 style={{ marginTop: 0, borderBottom: "1px solid #ccc", paddingBottom: "0.5rem" }}>HIK Telemetry Log (CMCDv2)</h3>
            {streamLog.map((log, i) => (
              <div key={i} style={{ color: log.includes("BLOCKED") ? "#D32F2F" : "#388E3C", fontFamily: "monospace", marginBottom: "0.5rem", fontWeight: log.includes("BLOCKED") ? "bold" : "normal" }}>
                {log}
              </div>
            ))}
            <div ref={logEndRef} />
          </div>
        </section>
      )}
    </main>
  );
}

function tabStyle(active: boolean): React.CSSProperties {
  return {
    padding: "0.75rem 1.5rem",
    background: active ? "#000" : "transparent",
    color: active ? "#fff" : "#666",
    border: active ? "none" : "2px solid #ddd",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "1rem"
  };
}

function actionBtn(color: string): React.CSSProperties {
  return {
    padding: "0.75rem 1rem",
    background: "transparent",
    color: color,
    border: `2px solid ${color}`,
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "0.9rem"
  };
}
