"use client";
import React, { useEffect, useRef } from "react";

interface TelemetryChartProps {
  data: number[];
  label: string;
  color: string;
  max: number;
}

export default function TelemetryChart({ data, label, color, max }: TelemetryChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Draw background grid
    ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
        const y = (height / 4) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }

    if (data.length < 2) return;

    // Draw line
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";

    const step = width / (data.length - 1);
    data.forEach((val, i) => {
        const x = i * step;
        const y = height - (val / max) * height;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Draw gradient area
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, color.replace("1)", "0.3)"));
    grad.addColorStop(1, color.replace("1)", "0)"));
    ctx.fillStyle = grad;
    ctx.fill();

  }, [data, color, max]);

  return (
    <div className="glass-card" style={{ padding: "1rem", flex: 1 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
        <span style={{ fontSize: "0.8rem", color: "#94a3b8", fontWeight: "bold" }}>{label}</span>
        <span style={{ fontSize: "0.8rem", color: color, fontWeight: "bold" }}>{data[data.length - 1] || 0}</span>
      </div>
      <canvas ref={canvasRef} width={200} height={80} style={{ width: "100%", height: "80px" }} />
    </div>
  );
}
