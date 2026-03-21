"use client";
import React, { useEffect, useRef, useState } from "react";

// Types mapping to our CMCD Telemetry
interface StreamTelemetry {
  seq: number;
  es: string; // Ethical Score
  txHash: string; // Mock Smart Contract Hash per segment
  status: "secure" | "dropped";
}

export default function PlayerPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [telemetry, setTelemetry] = useState<StreamTelemetry | null>(null);
  const [isCrashed, setIsCrashed] = useState(false);

  useEffect(() => {
    // Load hls.js from CDN dynamically
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/hls.js@latest";
    script.onload = () => {
      const video = videoRef.current;
      if (video && (window as any).Hls.isSupported()) {
        const hls = new (window as any).Hls({
           // Allow custom request hooking for Edge simulation telemetry
           xhrSetup: function(xhr: XMLHttpRequest, url: string) {
             xhr.onreadystatechange = function() {
               if (xhr.readyState === 4 && url.includes(".ts")) {
                  // Simulate parsing CMCD-Custom-hik-es headers from Edge CDN response
                  // Since public bitmovin doesn't have it, we mock the UI telemetry per package
                  const seqMatch = url.match(/segment_(\d+)/) || Math.floor(Math.random() * 100);
                  const isBlocked = xhr.status >= 400 || xhr.status === 0; // Playwright kills it
                  
                  if (isBlocked) {
                    setIsCrashed(true);
                    setTelemetry({
                      seq: Number(seqMatch?.[1] || seqMatch),
                      es: "0 (Deepfake Blocked)",
                      txHash: "0x0000000000000000000000000000000000000000",
                      status: "dropped"
                    });
                  } else {
                    setTelemetry({
                      seq: Number(seqMatch?.[1] || seqMatch),
                      es: "100",
                      txHash: "0x" + Array.from({length: 40}, () => Math.floor(Math.random()*16).toString(16)).join(''),
                      status: "secure"
                    });
                  }
               }
             }
           }
        });
        
        // Error handling for Edge Network disconnects (Deepfake physical drop)
        hls.on((window as any).Hls.Events.ERROR, (event: any, data: any) => {
          if (data.fatal && data.type === (window as any).Hls.ErrorTypes.NETWORK_ERROR) {
             setIsCrashed(true);
          }
        });

        // Load Bitmovin HLS test stream
        hls.loadSource("https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8");
        hls.attachMedia(video);
      }
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#050505", color: "#fff", fontFamily: "sans-serif" }}>
      <div style={{ position: "relative", width: "100%", maxWidth: "900px", borderRadius: "12px", overflow: "hidden", boxShadow: "0 20px 40px rgba(0,0,0,0.5)" }}>
        
        {/* Minimalist Overlay for Telemetry & Smart Contract */}
        <div style={{ position: "absolute", top: "20px", left: "20px", zIndex: 10, display: "flex", flexDirection: "column", gap: "8px", pointerEvents: "none" }}>
          
          {/* Main Status Tag */}
          <div style={{ 
            background: isCrashed ? "rgba(244, 67, 54, 0.9)" : "rgba(76, 175, 80, 0.9)", 
            padding: "6px 14px", borderRadius: "20px", fontWeight: "bold", fontSize: "0.85rem", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", gap: "6px", width: "fit-content"
          }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#fff", animation: isCrashed ? "none" : "pulse 1.5s infinite" }} />
            {isCrashed ? "GOVERNANCE DROP: DEEPFAKE DETECTED" : "HIK ZERO-TRUST ACTIVE"}
          </div>

          {/* Telemetry per package (Minimalist) */}
          {telemetry && !isCrashed && (
            <div style={{ 
              background: "rgba(0,0,0,0.6)", padding: "10px 14px", borderRadius: "8px", backdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.1)", minWidth: "220px", fontSize: "0.8rem", color: "#ddd"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span>📦 Chunk {telemetry.seq}</span>
                <span style={{ color: "#4CAF50", fontWeight: "bold" }}>ES: {telemetry.es}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", fontSize: "0.75rem", color: "#aaa" }}>
                <span>⛓️ On-Chain Anchor:</span>
                <span style={{ fontFamily: "monospace", color: "#2196F3" }}>{telemetry.txHash.slice(0, 16)}...</span>
              </div>
            </div>
          )}
        </div>

        {/* Video Player */}
        <video
          ref={videoRef}
          controls
          autoPlay
          muted
          style={{ width: "100%", display: "block", aspectRatio: "16/9", filter: isCrashed ? "grayscale(100%) blur(5px)" : "none", transition: "all 0.4s ease" }}
        />

        {/* CSS for pulsating dot */}
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.3; } 100% { opacity: 1; } }
        `}} />
      </div>
    </div>
  );
}
