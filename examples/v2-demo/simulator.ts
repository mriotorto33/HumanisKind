import axios from "axios";
import { createHash } from "crypto";
import { StreamSigner } from "../../src/vsi";
import { CMCDTelemetryHandler } from "../../src/telemetry";
import { loadOrCreateSigningKey } from "../../src/signer";

async function runSimulator() {
  console.log("📱 [Pixel 10] Starting broadcaster simulation...");

  const initialAnchor = "0x" + createHash("sha256").update("Pixel10_Initial_State").digest("hex");
  const signingKey = loadOrCreateSigningKey();
  
  const streamSigner = new StreamSigner(initialAnchor, signingKey);
  const telemetryHandler = new CMCDTelemetryHandler({
    signingKey: signingKey
  });

  let sequence = 1;
  const isMalicious = process.env.SIM_MALICIOUS === "true";

  console.log(`[Simulator] Mode: ${isMalicious ? "🛑 MALICIOUS (Deepfake/Tamper)" : "✅ HONEST"}`);

  setInterval(async () => {
    try {
      const fragment = {
        sequenceNumber: sequence++,
        payloadBuffer: Buffer.from(`video_chunk_${sequence}.m4s`),
        timestamp: new Date().toISOString()
      };

      // 1. Generate Merkle Chain link (VSI)
      const emsg = streamSigner.generateEmsgBox(fragment);

      // 2. Generate Telemetry Headers (Ethical Pulse)
      const compliance = isMalicious ? 0 : 100;
      const headers = telemetryHandler.generateHeaders({
        kmirCompliancePercentage: compliance,
        chainDepth: sequence
      });

      // 3. Inject malicious behavior if requested
      if (isMalicious && Math.random() > 0.5) {
        console.log("⚠️ [Simulator] Spoofing signature or headers...");
        // Tamper with the signature to simulate a deepfaker without keys
        if (headers["CMCD-Custom-hik-sig"]) {
           headers["CMCD-Custom-hik-sig"] = "tampered_sig_" + Math.random().toString(36);
        }
      }

      console.log(`[Simulator] Sending Fragment #${fragment.sequenceNumber} (Compliance: ${compliance}%)`);

      const response = await axios.post("http://localhost:3000/ingest", {
        fragment_id: fragment.sequenceNumber,
        timestamp: fragment.timestamp,
        emsg_hex: emsg.toString("hex")
      }, {
        headers: headers,
        timeout: 5000
      });

      console.log(`[Middleware Response] Status: ${response.status} - ${response.data.status}`);

    } catch (error: any) {
      console.error(`[Simulator Error] ${error.message} ${error.response?.data?.error || ""}`);
    }
  }, 2000);
}

runSimulator().catch(console.error);
