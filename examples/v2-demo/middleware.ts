import express from "express";
import { CMCDTelemetryHandler } from "../../src/telemetry";
import { loadOrCreateSigningKey } from "../../src/signer";

const app = express();
const port = 3000;

app.use(express.json());

const signingKey = loadOrCreateSigningKey();
const telemetryHandler = new CMCDTelemetryHandler({
  verificationKeyPem: signingKey.publicKeyPem,
  maxToleranceWindow: 2
});

const logs: any[] = [];

// Synchronization primitive for CPU load simulation
function simulateCPULoad(ms: number) {
  const start = Date.now();
  while (Date.now() - start < ms) {
    // Busy loop to saturate single-thread
    Math.sqrt(Math.random() * 1000000);
  }
}

app.post("/ingest", async (req, res) => {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);

  console.log(`\n[Middleware] Processing Request ${requestId}...`);

  // 1. Inyectar Latencia Artificial (Emulando Cold Start o Network Lag)
  const latency = 100 + Math.random() * 200;
  await new Promise(resolve => setTimeout(resolve, latency));

  // 2. Inyectar Carga de CPU (Gobernanza Determinística HIK)
  // En un Cloudflare Worker / Lambda, procesos pesados de verificación 
  // bloquean el event loop.
  const cpuOverhead = 150; 
  simulateCPULoad(cpuOverhead);

  // 3. Validar Integridad usando el SDK
  const isValid = telemetryHandler.evaluateEdgeRequest(req.headers as Record<string, string>);
  
  const result = {
    id: requestId,
    timestamp: new Date().toISOString(),
    fragment_id: req.body.fragment_id,
    integrity: isValid ? "Validated" : "Compromised",
    latency: `${(Date.now() - startTime).toFixed(0)}ms`,
    overhead: `${cpuOverhead}ms`
  };

  logs.unshift(result);
  if (logs.length > 50) logs.pop();

  if (isValid) {
    console.log(`✅ [${requestId}] Integrity Validated. Allowed through edge.`);
    res.status(200).json({ status: "Integrity Validated", ...result });
  } else {
    console.warn(`🛑 [${requestId}] Integrity Comprometida! Dropping segment.`);
    res.status(403).json({ status: "Integrity Comprometida", error: "Security Violation", ...result });
  }
});

app.get("/logs", (req, res) => {
  res.json(logs);
});

app.get("/", (req, res) => {
  res.send(`
    <html>
      <head>
        <title>HIK v2.0 Telemetry Dashboard</title>
        <style>
          body { font-family: sans-serif; background: #1a1a1a; color: #eee; padding: 20px; }
          .log-entry { border-left: 4px solid #444; padding: 10px; margin-bottom: 10px; background: #2a2a2a; }
          .Validated { border-left-color: #4caf50; }
          .Compromised { border-left-color: #f44336; }
          h1 { color: #fff; }
          .meta { font-size: 0.8em; color: #888; }
        </style>
        <script>
          setInterval(() => location.reload(), 2000);
        </script>
      </head>
      <body>
        <h1>HIK v2.0 Real-time Integrity Dashboard</h1>
        <p>Emulating Cloudflare Edge Middleware (Single-threaded Saturation Demo)</p>
        <div id="logs">
          ${logs.map(l => `
            <div class="log-entry ${l.integrity}">
              <strong>Fragment #${l.fragment_id} - ${l.integrity}</strong>
              <div class="meta">
                ID: ${l.id} | Total Time: ${l.latency} | HIK CPU Overhead: ${l.overhead} <br/>
                Timestamp: ${l.timestamp}
              </div>
            </div>
          `).join('')}
        </div>
      </body>
    </html>
  `);
});

app.listen(port, () => {
  console.log(`🚀 [Middleware] Telemetry listener active at http://localhost:${port}`);
  console.log(`📊 View logs at http://localhost:${port}/logs or root URL`);
});
