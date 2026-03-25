"use client";
import React, { useState, useEffect, useRef } from "react";
import KillSwitch from "../components/KillSwitch";
import TelemetryChart from "../components/TelemetryChart";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"v1" | "v2">("v1");

  // --- V1.1 State ---
  const [anchorLog, setAnchorLog] = useState<any>(null);
  const [isAnchoring, setIsAnchoring] = useState(false);
  const [simulateKmirFailure, setSimulateKmirFailure] = useState(false);

  // --- V2.0 State ---
  const [streamLog, setStreamLog] = useState<any[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sequence, setSequence] = useState(0);
  const [streamAction, setStreamAction] = useState<"normal" | "drop" | "ad_break" | "spoof" | "deepfake" | "stress">("normal");
  const [esHistory, setEsHistory] = useState<number[]>([]);
  const [psHistory, setPsHistory] = useState<number[]>([]);
  const [overheadHistory, setOverheadHistory] = useState<number[]>([]);
  const [isTriggered, setIsTriggered] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { logEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [streamLog]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && activeTab === "v2" && !isTriggered) {
      interval = setInterval(async () => {
        const currentSeq = sequence + 1;
        setSequence(currentSeq);
        const actionToApply = streamAction;
        if (streamAction !== "normal") setStreamAction("normal");

        try {
          const res = await fetch(`/api/advanced-stream?seq=${currentSeq}&action=${actionToApply}`);
          const data = await res.json();
          
          const es = data.receivedHeaders?.["CMCD-Custom-hik-es"] ? parseInt(data.receivedHeaders["CMCD-Custom-hik-es"]) : (actionToApply === "drop" ? 0 : 100);
          const ps = data.receivedHeaders?.["CMCD-Custom-hik-ps"] ? parseInt(data.receivedHeaders["CMCD-Custom-hik-ps"]) : currentSeq;
          const overhead = data.metrics?.overhead || 0;

          setEsHistory(prev => [...prev.slice(-19), es]);
          setPsHistory(prev => [...prev.slice(-19), ps]);
          setOverheadHistory(prev => [...prev.slice(-19), overhead]);

          const metricStr = ` | Edge: ${overhead}ms | Total: ${data.metrics?.totalTime}ms`;

          const timeStr = new Date().toLocaleTimeString();
          if (res.status === 403) {
             setStreamLog(prev => [...prev, {
               timestamp: timeStr,
               message: `🛑 CRITICAL: ${data.error}${metricStr}`,
               type: "error"
             }]);
             setIsTriggered(true);
             setIsPlaying(false);
          } else {
             setStreamLog(prev => [...prev, 
               {
                 timestamp: timeStr,
                 message: `✅ AUTHENTICATED: Seq ${currentSeq} ${metricStr}`,
                 type: "info"
               },
               {
                 timestamp: timeStr,
                 message: `[SEQ TRUTH] ANCHORED: Checkpoint Verified.`,
                 type: "success",
                 details: data.checkpoint
               }
             ]);
          }
        } catch (e: any) { setIsPlaying(false); }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, sequence, activeTab, streamAction, isTriggered]);

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
    <main style={{ padding: "3rem", maxWidth: "1200px", margin: "0 auto", position: "relative" }}>
      {/* Header Section */}
      <div style={{ marginBottom: "3rem", textAlign: "center" }}>
        <h1 style={{ fontSize: "3rem", margin: "0 0 0.5rem 0", background: "linear-gradient(to right, #10b981, #3b82f6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          Human Is Kind™ <span style={{ color: "var(--text-secondary)", fontWeight: "300" }}>Command</span>
        </h1>
        <p style={{ fontSize: "1.2rem", color: "var(--text-secondary)" }}>
          Deterministic AI Governance & Sequential Truth Engine
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", justifyContent: "center", gap: "1rem", marginBottom: "3rem" }}>
        <button onClick={() => setActiveTab("v1")} style={tabStyle(activeTab === "v1")}>
          v1.1 Static Asset Anchoring
        </button>
        <button onClick={() => setActiveTab("v2")} style={tabStyle(activeTab === "v2")}>
          v2.0 Live Stream SDK Edge
        </button>
      </div>

      {/* V1 Workspace */}
      {activeTab === "v1" && (
        <section className="animate-in">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
            <div className="glass-card" style={{ padding: "2rem" }}>
              <h2 style={{ color: "var(--accent-emerald)" }}>The Ethical Kernel</h2>
              <p style={{ color: "var(--text-secondary)" }}>Validating an immutable 'Atomic Chain' of provenance for static hardware capture.</p>
              
              <div style={{ marginTop: "2rem", borderTop: "1px solid var(--glass-border)", paddingTop: "1.5rem" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer", fontSize: "1rem" }}>
                  <input type="checkbox" checked={simulateKmirFailure} onChange={e => setSimulateKmirFailure(e.target.checked)} style={{ width: "18px", height: "18px", accentColor: "var(--accent-crimson)" }} />
                  Simulate KMIR Governance Violation (Deepfake Bypass)
                </label>
                
                <button onClick={runAnchorTest} disabled={isAnchoring} style={primaryBtn(isAnchoring)}>
                  {isAnchoring ? "CHISELING ATOMIC TRACE..." : "EXECUTE KMIR VALIDATION"}
                </button>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {anchorLog && anchorLog.success ? (
                    <div className="glass-card" style={{ padding: "1.5rem", borderLeft: "4px solid var(--accent-emerald)" }}>
                        <h3 className="glow-emerald" style={{ color: "var(--accent-emerald)", margin: 0 }}>✅ ANCHORED</h3>
                        <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
                          Protocol 1.1: Immutable Trace successfully anchored.
                        </p>
                        
                        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                          <div style={{ background: "rgba(0,0,0,0.3)", padding: "1rem", borderRadius: "8px" }}>
                            <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: "bold" }}>Merkle Manifest Hash</div>
                            <code style={{ fontSize: "0.85rem", color: "var(--accent-emerald)", wordBreak: "break-all" }}>{anchorLog.certificate.manifestHash}</code>
                          </div>

                          <div style={{ background: "rgba(0,0,0,0.3)", padding: "1rem", borderRadius: "8px" }}>
                            <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: "bold" }}>Live IPFS Gateway</div>
                            <a href={anchorLog.certificate.ipfsUrl} target="_blank" rel="noreferrer" style={{ fontSize: "0.85rem", color: "#3b82f6", textDecoration: "underline", wordBreak: "break-all" }}>
                              {anchorLog.certificate.ipfsUrl}
                            </a>
                          </div>

                          <div style={{ background: "rgba(0,0,0,0.3)", padding: "1rem", borderRadius: "8px" }}>
                            <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: "bold" }}>Broadcaster Wallet</div>
                            <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", wordBreak: "break-all" }}>
                              0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
                            </div>
                          </div>

                          <div style={{ background: "rgba(0,0,0,0.3)", padding: "1rem", borderRadius: "8px" }}>
                            <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: "bold" }}>Blockchain Transaction</div>
                            <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", wordBreak: "break-all" }}>
                              {anchorLog.certificate.txHash}
                            </div>
                            <div style={{ fontSize: "0.7rem", color: "#64748b", marginTop: "0.25rem" }}>
                               Network: Hardhat Local (31337)
                            </div>
                          </div>
                        </div>
                    </div>
                ) : anchorLog && (
                    <div className="glass-card" style={{ padding: "1.5rem", borderLeft: "4px solid var(--accent-crimson)" }}>
                        <h3 className="glow-crimson" style={{ color: "var(--accent-crimson)", margin: 0 }}>❌ ENFORCED</h3>
                        <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>The Ethical Kernel physically blocked the non-compliant payload.</p>
                        <div style={{ color: "var(--accent-crimson)", fontFamily: "monospace", padding: "1rem", background: "rgba(0,0,0,0.3)", borderRadius: "8px" }}>
                            {anchorLog.error}
                        </div>
                    </div>
                )}
            </div>
          </div>
        </section>
      )}

      {/* V2 Workspace */}
      {activeTab === "v2" && (
        <section className="animate-in">
          <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: "2rem" }}>
            {/* Control Sidebar */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <KillSwitch isTriggered={isTriggered} isArmed={isPlaying} />
              
              <div className="glass-card" style={{ padding: "1.5rem" }}>
                <h3 style={{ fontSize: "1rem", marginBottom: "1rem" }}>Attack Simulation</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  <button onClick={() => setStreamAction("drop")} disabled={!isPlaying} style={actionBtn("#f59e0b")}>Drop Packet (Jitter)</button>
                  <button onClick={() => setStreamAction("spoof")} disabled={!isPlaying} style={actionBtn("#a855f7")}>Spoof Ad-Break (Auth Failure)</button>
                  <button onClick={() => setStreamAction("deepfake")} disabled={!isPlaying} style={actionBtn("#ef4444")}>Inject Synthetic Payload</button>
                  <button onClick={() => setStreamAction("stress")} disabled={!isPlaying} style={actionBtn("#fbbf24")}>Heavy Governance Stress</button>
                  
                  {!isPlaying && (
                    <button 
                      onClick={() => { setStreamLog([]); setSequence(0); setIsPlaying(true); setStreamAction("normal"); setIsTriggered(false); setEsHistory([]); setPsHistory([]); setOverheadHistory([]); }} 
                      style={startBtn}
                    >
                      INITIALIZE TRUTH ENGINE
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Main Monitoring Hub */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
               {/* Telemetry Charts */}
               <div style={{ display: "flex", gap: "1rem" }}>
                  <TelemetryChart label="HIK-ES (Ethical Score)" data={esHistory} color="rgba(16, 185, 129, 1)" max={100} />
                  <TelemetryChart label="HIK-PS (Provenance Depth)" data={psHistory} color="rgba(59, 130, 246, 1)" max={Math.max(...psHistory, 10)} />
                  <TelemetryChart label="Edge Overhead (ms)" data={overheadHistory} color="rgba(245, 158, 11, 1)" max={Math.max(...overheadHistory, 10)} />
               </div>

               {/* Live Log */}
               <div className="glass-card" style={{ padding: "1.5rem", flex: 1, display: "flex", flexDirection: "column" }}>
                 <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--glass-border)", paddingBottom: "0.75rem", marginBottom: "1rem" }}>
                    <h3 style={{ margin: 0, fontSize: "1rem" }}>Edge Telemetry Stream (CMCD v2)</h3>
                    <div style={{ fontSize: "0.8rem", color: isPlaying ? "var(--accent-emerald)" : "var(--accent-crimson)" }}>
                        {isPlaying ? "• CORE_ENGINE_ACTIVE" : "• CORE_ENGINE_HALTED"}
                    </div>
                 </div>
                 <div style={{ height: "300px", overflowY: "auto", fontFamily: "monospace", fontSize: "0.85rem" }}>
                    {streamLog.map((log, i) => (
                  <div key={i} style={{ marginBottom: "0.6rem", color: log.type === "error" ? "var(--accent-crimson)" : log.type === "warn" ? "#fbbf24" : log.type === "success" ? "var(--accent-emerald)" : "#94a3b8" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
                        <span style={{ color: "var(--accent-emerald)", opacity: 0.7, flexShrink: 0 }}>[{log.timestamp}]</span>
                        <div style={{ flex: 1 }}>
                            {log.message}
                            {log.details && (
                                <details style={{ marginTop: "0.25rem", color: "var(--text-secondary)", fontSize: "0.75rem", cursor: "pointer" }}>
                                    <summary style={{ outline: "none", opacity: 0.8 }}>Technical Trace (IPFS/TX)</summary>
                                    <div style={{ padding: "0.5rem", background: "rgba(0,0,0,0.4)", borderRadius: "4px", marginTop: "0.25rem", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                                        <div><strong>Merkle Root:</strong> <code style={{ color: "var(--accent-emerald)", wordBreak: "break-all" }}>{log.details.manifestHash}</code></div>
                                        <div><strong>IPFS Pin:</strong> <a href={`https://gateway.pinata.cloud/ipfs/${log.details.ipfsUrl.replace("ipfs://", "")}`} target="_blank" rel="noreferrer" style={{ color: "#3b82f6", textDecoration: "underline", wordBreak: "break-all" }}>{log.details.ipfsUrl}</a></div>
                                        <div><strong>TX Hash:</strong> <code style={{ opacity: 0.7, wordBreak: "break-all" }}>{log.details.txHash}</code></div>
                                    </div>
                                </details>
                            )}
                        </div>
                    </div>
                  </div>
                ))}
                    <div ref={logEndRef} />
                 </div>
               </div>
            </div>
          </div>
        </section>
      )}

      <style jsx global>{`
        .animate-in {
          animation: fadeIn 0.5s ease-out forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </main>
  );
}

function tabStyle(active: boolean): React.CSSProperties {
  return {
    padding: "0.75rem 2rem",
    background: active ? "rgba(16, 185, 129, 0.1)" : "transparent",
    color: active ? "var(--accent-emerald)" : "var(--text-secondary)",
    border: active ? "1px solid var(--accent-emerald)" : "1px solid var(--glass-border)",
    borderRadius: "100px",
    cursor: "pointer",
    fontWeight: "bold",
    transition: "all 0.3s ease",
    fontSize: "0.95rem"
  };
}

function primaryBtn(disabled: boolean): React.CSSProperties {
  return {
    marginTop: "2rem",
    width: "100%",
    padding: "1rem",
    background: "var(--accent-emerald)",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: disabled ? "not-allowed" : "pointer",
    fontWeight: "bold",
    fontSize: "1rem",
    opacity: disabled ? 0.6 : 1
  };
}

function actionBtn(color: string): React.CSSProperties {
  return {
    padding: "0.75rem",
    background: "rgba(0,0,0,0.2)",
    color: color,
    border: `1px solid ${color}44`,
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "0.85rem",
    textAlign: "left"
  };
}

const startBtn: React.CSSProperties = {
  marginTop: "1rem",
  padding: "1rem",
  background: "#fff",
  color: "#000",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "bold",
  fontSize: "1rem",
  boxShadow: "0 4px 14px rgba(255,255,255,0.2)"
};
