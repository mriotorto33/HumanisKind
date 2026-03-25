"use client";
import React from "react";

interface KillSwitchProps {
  isTriggered: boolean;
  isArmed: boolean;
}

export default function KillSwitch({ isTriggered, isArmed }: KillSwitchProps) {
  return (
    <div className="glass-card" style={{ 
      padding: "1.5rem", 
      display: "flex", 
      flexDirection: "column", 
      alignItems: "center", 
      gap: "1rem",
      border: isTriggered ? "2px solid #ef4444" : "1px solid rgba(255,255,255,0.1)",
      transition: "all 0.3s ease",
      boxShadow: isTriggered ? "0 0 30px rgba(239, 68, 68, 0.4)" : "none"
    }}>
      <div style={{ fontSize: "0.8rem", color: "#94a3b8", fontWeight: "bold", textTransform: "uppercase" }}>
        Deterministic Kill-Switch (RHEFOR Integration)
      </div>
      
      <div style={{ 
        width: "60px", 
        height: "60px", 
        borderRadius: "50%", 
        background: isTriggered ? "#ef4444" : (isArmed ? "#059669" : "#1e293b"),
        boxShadow: isTriggered ? "0 0 20px #ef4444" : (isArmed ? "0 0 15px #10b981" : "none"),
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "1.5rem",
        transition: "all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
      }}>
        {isTriggered ? "💀" : (isArmed ? "🔒" : "🔓")}
      </div>

      <div style={{ textAlign: "center" }}>
        <div style={{ 
          fontSize: "1.1rem", 
          fontWeight: "bold", 
          color: isTriggered ? "#ef4444" : (isArmed ? "#10b981" : "#94a3b8") 
        }}>
          {isTriggered ? "STREAM HALTED" : (isArmed ? "SYSTEM ARMED" : "STANDBY")}
        </div>
        <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.25rem" }}>
          {isTriggered ? "Governance Violation Detected" : "Monitoring KMIR Compliance"}
        </div>
      </div>
    </div>
  );
}
