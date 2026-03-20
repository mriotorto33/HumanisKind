"use client";
import React, { useState, useEffect, useRef } from "react";

export default function Home() {
  const [streamLog, setStreamLog] = useState<string[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sequence, setSequence] = useState(0);
  const logEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logs
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [streamLog]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(async () => {
        const currentSeq = sequence + 1;
        setSequence(currentSeq);
        
        // Simulate a malicious deepfake/hallucination injection exactly on chunk 4
        const isDeepfake = currentSeq === 4; 
        
        try {
          const res = await fetch(`/api/stream?seq=${currentSeq}&deepfake=${isDeepfake}`);
          if (res.status === 403) {
             setStreamLog(prev => [...prev, `[CDN EDGE] ❌ BLOCKED Seq ${currentSeq} - Stream disconnected. KMIR Policy Failed.`]);
             setIsPlaying(false); // Instantly violently halt the player
          } else {
             const data = await res.json();
             setStreamLog(prev => [...prev, `[CDN EDGE] ✅ SERVED Seq ${currentSeq} - Merkle Chain Valid. Ethical Pulse (hik-es) is ${data.hikEs}%`]);
          }
        } catch (e: any) {
           setIsPlaying(false);
        }
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [isPlaying, sequence]);

  return (
    <main style={{ padding: "4rem", fontFamily: "sans-serif", maxWidth: "800px" }}>
      <h1>Human Is Kind™ - Sequential Truth Engine</h1>
      <p>This UX simulates an fMP4 Edge CDN evaluating CMCDv2 telemetry (`hik-es` and `hik-ps`) in real-time. Notice how the stream aggressively halts the moment an unauthorized AI synthetic payload is introduced!</p>
      
      {/* Simulated Video Player */}
      <div style={{ 
          marginTop: "2rem", 
          height: "350px", 
          background: isPlaying ? "#000" : "#111", 
          borderRadius: "8px", 
          display: "flex", 
          flexDirection: "column",
          alignItems: "center", 
          justifyContent: "center",
          border: isPlaying ? "4px solid #4CAF50" : "4px solid #F44336",
          transition: "all 0.3s ease"
        }}>
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

      {/* Controls */}
      <div style={{ marginTop: "1.5rem", display: "flex", gap: "1rem" }}>
        <button 
          onClick={() => { setStreamLog([]); setSequence(0); setIsPlaying(true); }}
          style={{ padding: "1rem 2rem", background: "#000", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}
        >
          Initialize Live Stream
        </button>
      </div>

      {/* Telemetry Output Logs */}
      <div style={{ marginTop: "2rem", padding: "1.5rem", background: "#f8f9fa", borderRadius: "8px", border: "1px solid #ddd", height: "250px", overflowY: "auto" }}>
        <h3 style={{ marginTop: 0, borderBottom: "1px solid #ccc", paddingBottom: "0.5rem" }}>HIK Telemetry Log (CMCDv2)</h3>
        {streamLog.map((log, i) => (
          <div key={i} style={{ 
              color: log.includes("BLOCKED") ? "#D32F2F" : "#388E3C", 
              fontFamily: "monospace", 
              marginBottom: "0.5rem",
              fontWeight: log.includes("BLOCKED") ? "bold" : "normal"
            }}>
            {log}
          </div>
        ))}
        <div ref={logEndRef} />
      </div>
    </main>
  );
}
