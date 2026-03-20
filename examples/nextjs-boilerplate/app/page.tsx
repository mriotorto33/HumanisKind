"use client";
import React, { useState } from "react";

export default function Home() {
  const [status, setStatus] = useState<string>("Ready.");

  const handleAnchor = async () => {
    setStatus("Anchoring with Human Is Kind KMIR Policy...");
    try {
      const res = await fetch("/api/anchor", { method: "POST" });
      const data = await res.json();
      
      if (res.ok && data.success) {
        setStatus(`✅ Sacred Trace Generated!\n\nTx Hash: ${data.certificate.txHash}\nIPFS URI: ${data.certificate.ipfsUrl}\nKMIR Hash: ${data.certificate.manifestHash}\nSigner: ${data.certificate.publicKeyPem.split('\n')[1].substring(0, 30)}...`);
      } else {
        setStatus(`❌ Governance/KMIR Error: ${data.error}`);
      }
    } catch (e: any) {
      setStatus(`❌ Fatal Error: ${e.message}`);
    }
  };

  return (
    <main style={{ padding: "4rem", fontFamily: "sans-serif", maxWidth: "800px" }}>
      <h1>Human Is Kind™ - Next.js Governance Engine</h1>
      <p>This boilerplate demonstrates how to structurally enforce AI rules of engagement and generate <strong>The Sacred Trace™</strong> directly from your robust fullstack application.</p>
      
      <button 
        onClick={handleAnchor}
        style={{ padding: "1rem 2rem", fontSize: "1rem", cursor: "pointer", background: "#000", color: "#fff", border: "none", borderRadius: "8px", marginTop: "1rem" }}
      >
        Sign & Anchor Compliant Asset
      </button>
      
      <div style={{ marginTop: "2rem", padding: "1.5rem", background: "#f8f9fa", borderRadius: "8px", border: "1px solid #ddd" }}>
        <pre style={{ whiteSpace: "pre-wrap", wordWrap: "break-word", margin: 0 }}>
          {status}
        </pre>
      </div>
    </main>
  );
}
