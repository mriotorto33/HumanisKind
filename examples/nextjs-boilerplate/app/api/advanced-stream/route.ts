import { NextResponse } from "next/server";
import { CMCDTelemetryHandler } from "../../../../../src/telemetry";
import { loadOrCreateSigningKey } from "../../../../../src/signer";

export async function GET(request: Request) {
  const startTime = Date.now();
  const url = new URL(request.url);
  const sequence = parseInt(url.searchParams.get("seq") || "0", 10);
  const action = url.searchParams.get("action") || "normal";

  // Boot up the Broadcaster's cryptographic signing keys
  const secureKey = loadOrCreateSigningKey();

  // Initialize the Broadcaster (and the mock CDN Edge) with strict cryptographic validation
  const telemetry = new CMCDTelemetryHandler({
    maxToleranceWindow: 2, // Survive 2 dropped packets
    signingKey: secureKey,
    verificationKeyPem: secureKey.publicKeyPem
  });

  // --- Middleware Simulation ---
  const overhead = 100 + Math.floor(Math.random() * 50); // Simulating 100-150ms of governance overhead
  const latency = 50 + Math.floor(Math.random() * 50);   // Simulating 50-100ms of network latency
  
  // 1. Latency Simulation
  await new Promise(resolve => setTimeout(resolve, latency));

  // 2. CPU Overload Simulation (Busy loop)
  const cpuStart = Date.now();
  while (Date.now() - cpuStart < overhead) {
    Math.sqrt(Math.random() * 1000000);
  }

  // Base Compliance State
  const state = {
    kmirCompliancePercentage: 100,
    chainDepth: sequence,
    isAdBreakActive: false
  };

  // 1. Broadcaster Action Generation 
  let headersToTransmit: Record<string, string> = {};

  if (action === "normal") {
    headersToTransmit = telemetry.generateHeaders(state);
  } else if (action === "drop") {
    // A network infrastructure failure! No headers arrive at the Edge.
    headersToTransmit = {};
  } else if (action === "ad_break") {
    // The Broadcaster explicitly authorizes an Ad Break and signs it mathematically
    state.isAdBreakActive = true;
    headersToTransmit = telemetry.generateHeaders(state);
  } else if (action === "spoof") {
    // A Deepfaker attempts to inject an Ad Break but lacks the private key to sign it
    headersToTransmit = {
      "CMCD-Custom-hik-es": "100",
      "CMCD-Custom-hik-tw": "2",
      "CMCD-Custom-hik-ab": "1", // Spoofed "Sleep" command
      // Missing proper hik-sig Ed25519 payload!
    };
  } else if (action === "deepfake") {
    state.kmirCompliancePercentage = 0; // Trigger the KMIR zero-trust heuristic drop
    headersToTransmit = telemetry.generateHeaders(state);
  }

  // 2. The CDN Edge physically inspects the incoming request headers
  const isCompliant = telemetry.evaluateEdgeRequest(headersToTransmit, 100);

  // 3. The Edge determines the stream's fate
  if (!isCompliant) {
    let reason = "KMIR Deepfake Manipulation Detected.";
    if (action === "spoof") reason = "Missing or Invalid Cryptographic Signature (Spoofing Attempt).";

    return new NextResponse(
      JSON.stringify({
        error: `HIK Governance Violation: Ethical Pulse blocked at the Edge. ${reason}`,
        state,
        receivedHeaders: headersToTransmit,
        metrics: { overhead, totalTime: Date.now() - startTime }
      }),
      { status: 403, headers: { "X-HIK-Status": "BLOCKED" } }
    );
  }

  // 4. The Edge serves the authenticated video frame from the upstream Origin
  return NextResponse.json({
    success: true,
    message: action === "drop" ? `Fragment ${sequence} missing telemetry but safely tolerated by 'hik-tw'.`
      : action === "ad_break" ? `Fragment ${sequence} unverified but gracefully slept by authorized 'hik-ab'.`
        : `Fragment ${sequence} securely delivered with active CMCD verification.`,
    receivedHeaders: headersToTransmit,
    metrics: { overhead, totalTime: Date.now() - startTime },
    timestamp: new Date().toISOString()
  });
}
