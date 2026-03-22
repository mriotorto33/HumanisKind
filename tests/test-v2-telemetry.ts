import { StreamSigner } from "../src/vsi";
import { CMCDTelemetryHandler } from "../src/telemetry";
import { createHash } from "crypto";

async function runV2Tests() {
  console.log("🚀 Starting v2.0 Sequential Truth Engine Tests (VSI & Telemetry)\n");

  /// --- 1. Test StreamSigner (Merkle Chaining) ---
  console.log("--- 1. Testing VSI Merkle Chaining ---");
  const initialAnchor = "0x" + createHash("sha256").update("RootBroadcastSourceVideo.mp4").digest("hex");
  const streamSigner = new StreamSigner(initialAnchor);
  console.log(`[+] Initialized StreamSigner with root Anchor: ${initialAnchor.substring(0, 15)}...`);

  const fragment1 = { sequenceNumber: 1, payloadBuffer: Buffer.from("video_chunk_001.m4s") };
  const emsg1 = streamSigner.generateEmsgBox(fragment1);
  console.log(`[+] Fragment 1 Packed in emsg. Buffer Size: ${emsg1.length} bytes`);

  const fragment2 = { sequenceNumber: 2, payloadBuffer: Buffer.from("video_chunk_002.m4s") };
  const emsg2 = streamSigner.generateEmsgBox(fragment2);
  console.log(`[+] Fragment 2 Packed in emsg. Buffer Size: ${emsg2.length} bytes`);

  const currentTip = streamSigner.getChainTip();
  if (!currentTip || currentTip === initialAnchor) {
      throw new Error("VSI Test Failed: Merkle Chain failed to roll the hash forward securely.");
  }

  console.log("✅ VSI Merkle Chaining Test Passed!\n");


  /// --- 2. Test CMCD Telemetry (Ethical Pulse) ---
  console.log("--- 2. Testing CMCDv2 Ethical Pulse ---");
  const telemetry = new CMCDTelemetryHandler();
  
  // Valid State
  const compliantState = { kmirCompliancePercentage: 100, chainDepth: 2 };
  const validHeaders = telemetry.generateHeaders(compliantState);
  console.log(`[+] Broadcast Headers (100% compliance):`, validHeaders);
  
  if (!telemetry.evaluateEdgeRequest(validHeaders)) {
    throw new Error("Telemetry Test Failed: 100% compliant stream was blocked.");
  }
  console.log(`✅ 100% Compliant Request correctly allowed through Edge.`);

  // Malicious State (Deepfake detected upstream, compliance drops)
  const compromisedState = { kmirCompliancePercentage: 0, chainDepth: 5 };
  const maliciousHeaders = telemetry.generateHeaders(compromisedState);
  console.log(`[+] Broadcast Headers (0% compliance):`, maliciousHeaders);

  if (telemetry.evaluateEdgeRequest(maliciousHeaders)) {
    throw new Error("Telemetry Test Failed: Compromised stream bypassed the edge.");
  }
  console.log(`✅ Compromised Stream correctly dropped at the Edge.`);

  // Unauthorized State (Attempting to bypass HIK entirely)
  const bypassHeaders = { "X-Standard-Req": "true" };
  if (telemetry.evaluateEdgeRequest(bypassHeaders)) {
    throw new Error("Telemetry Test Failed: Bypass attempt succeeded.");
  }
  console.log(`✅ Bypass Request (No Ethical Pulse) correctly dropped at the Edge.`);

  // Authorized Ad Break (Explicitly pausing zero-trust checks for Server-Side Ad Insertion)
  console.log("--- 3. Testing SSAI Authorized Ad Breaks & Cryptographic Signatures ---");
  
  // Create a securely signed telemetry handler
  const { loadOrCreateSigningKey } = require("../src/signer");
  const secureKey = loadOrCreateSigningKey();
  
  const secureTelemetry = new CMCDTelemetryHandler({ 
    signingKey: secureKey,
    verificationKeyPem: secureKey.publicKeyPem
  });

  const adBreakState = { kmirCompliancePercentage: 100, chainDepth: 5, isAdBreakActive: true };
  const secureHeaders = secureTelemetry.generateHeaders(adBreakState);
  
  console.log(`[+] Broadcast Headers (Ad Break + Signature):`, secureHeaders);
  
  if (!secureTelemetry.evaluateEdgeRequest(secureHeaders)) {
    throw new Error("Telemetry Test Failed: Authorized Ad Break flag was not respected when properly signed.");
  }
  
  // Simulate a deepfaker spoofing an Ad Break without a valid signature
  const spoofedAdFragmentHeaders = { "CMCD-Custom-hik-ab": "1", "CMCD-Custom-hik-es": "100" };
  if (secureTelemetry.evaluateEdgeRequest(spoofedAdFragmentHeaders)) {
    throw new Error("Telemetry Test Failed: Edge CDN allowed a spoofed ad fragment without a signature!");
  }
  
  const badlySignedSpoof = { 
    ...spoofedAdFragmentHeaders, 
    "CMCD-Custom-hik-sig": "fake_signature_base64_string" 
  };
  if (secureTelemetry.evaluateEdgeRequest(badlySignedSpoof)) {
    throw new Error("Telemetry Test Failed: Edge CDN allowed a spoofed ad fragment with an invalid signature!");
  }
  console.log(`✅ Unverified/Spoofed Ad Fragments mathematically blocked by Edge Signature Validation.`);

  // Test Node.js / HTTP/2 lowercase header behavior
  const lowercasedSecureHeaders: Record<string, string> = {};
  for (const [k, v] of Object.entries(secureHeaders)) {
    lowercasedSecureHeaders[k.toLowerCase()] = v;
  }
  
  if (!secureTelemetry.evaluateEdgeRequest(lowercasedSecureHeaders)) {
    throw new Error("Telemetry Test Failed [FALSE POSITIVE]: Edge CDN blocked valid signed telemetry because the HTTP proxy lowercased the headers!");
  }
  console.log(`✅ Case-insensitive Edge Signature Validation correctly allowed lowercased HTTP headers.`);

  // Tolerance Window State (Tolerating missing pulse)
  const tolerantTelemetry = new CMCDTelemetryHandler({ maxToleranceWindow: 2 });
  if (!tolerantTelemetry.evaluateEdgeRequest(bypassHeaders)) {
    throw new Error("Telemetry Test Failed: Missing pulse not tolerated by window.");
  }
  console.log(`✅ Missing pulse correctly tolerated (1/2 missing).`);
  
  if (!tolerantTelemetry.evaluateEdgeRequest(bypassHeaders)) {
    throw new Error("Telemetry Test Failed: Missing pulse not tolerated by window second time.");
  }
  console.log(`✅ Missing pulse correctly tolerated (2/2 missing).`);

  if (tolerantTelemetry.evaluateEdgeRequest(bypassHeaders)) {
    throw new Error("Telemetry Test Failed: Missing pulse tolerated beyond window.");
  }
  console.log(`✅ Missing pulse correctly blocked after tolerance window exceeded (3/2 missing).`);

  // Recovering from missing pulse
  tolerantTelemetry.evaluateEdgeRequest(bypassHeaders); // 1 miss
  if (!tolerantTelemetry.evaluateEdgeRequest(validHeaders)) { // reset
    throw new Error("Telemetry Test Failed: Valid pulse blocked after missing pulse.");
  }
  console.log(`✅ Counter reset after receiving valid pulse.`);

  console.log("\n🎉 All v2.0 Sequential Truth Engine Tests Passed successfully!");
}

runV2Tests().catch(err => {
    console.error(err);
    process.exit(1);
});
