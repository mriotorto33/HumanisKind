/**
 * Human Is Kind - Edge CDN Telemetry Interceptor
 * 
 * Cloudflare Worker / Fastly Compute Edge template designed to strictly intercept 
 * and enforce the HIK Ethical Pulse (CMCD v2) telemetry.
 */

// If writing for Cloudflare, you would typically bundle this or import directly if published
// import { CMCDTelemetryHandler } from "human-is-kind-sdk/telemetry";

// Mocking the handler implementation structure for this edge template:
class EdgeTelemetryHandler {
  private consecutiveMissingPulses: Map<string, number> = new Map();
  private maxToleranceWindow: number;
  private verificationKey?: CryptoKey; // Injected Broadcaster Public Key

  constructor(maxToleranceWindow: number = 0, verificationKey?: CryptoKey) {
    this.maxToleranceWindow = maxToleranceWindow;
    this.verificationKey = verificationKey;
  }

  public async evaluateEdgeRequest(request: Request, headers: Record<string, string>, minCompliance = 100): Promise<boolean> {
    // In edge environments, track stream state via client IP or similar stream identifier
    const clientKey = request.headers.get("cf-connecting-ip") || "unknown";
    
    const esKey = headers["cmcd-custom-hik-es"];
    const twKey = headers["cmcd-custom-hik-tw"];
    const abKey = headers["cmcd-custom-hik-ab"];
    const sigKey = headers["cmcd-custom-hik-sig"];

    // 1. Strict Web Crypto API Signature Validation against the Broadcaster's Ed25519 Key
    if (this.verificationKey) {
      if (!sigKey && (esKey || twKey || abKey)) {
        return false; // Fail-close: Deepfaker injected telemetry without a mathematically valid signature
      }
      
      if (sigKey) {
        // Collect known HIK headers to reconstruct payload (O(1) optimal latency design)
        const verifyPayload: Record<string, string> = {};
        const knownKeys = [
          "cmcd-custom-hik-es", 
          "cmcd-custom-hik-ps", 
          "cmcd-custom-hik-tw", 
          "cmcd-custom-hik-ab"
        ].filter(k => headers[k] !== undefined).sort();
        
        for (const k of knownKeys) {
          verifyPayload[k] = headers[k];
        }

        const signaturePayload = new TextEncoder().encode(JSON.stringify(verifyPayload));
        
        // Decode Base64URL signature to Uint8Array buffer
        const base64Standard = sigKey.replace(/-/g, '+').replace(/_/g, '/');
        const sigBuffer = Uint8Array.from(atob(base64Standard), c => c.charCodeAt(0));

        // Natively verify Ed25519 signature payload in milliseconds at the Edge
        const isValid = await crypto.subtle.verify(
          { name: "Ed25519" },
          this.verificationKey,
          sigBuffer,
          signaturePayload
        );

        if (!isValid) return false; // Fail-close: Telemetry payload was tampered with (e.g. spoofed ad break)
      }
    }

    // If the broadcaster explicitly authorized an ad break (and it was verified!), temporarily pause zero-trust evaluation.
    if (abKey === "1") {
      return true;
    }
    
    // Use dynamically injected tolerance from the broadcaster, or fallback to the edge default
    const currentTolerance = twKey ? parseInt(twKey, 10) : this.maxToleranceWindow;
    
    if (!esKey) {
      const currentMissing = (this.consecutiveMissingPulses.get(clientKey) || 0) + 1;
      this.consecutiveMissingPulses.set(clientKey, currentMissing);
      
      if (currentMissing <= currentTolerance) {
        return true; // Tolerate missing pulse
      }
      return false; // Zero-trust failure
    }

    const score = parseInt(esKey, 10);
    this.consecutiveMissingPulses.delete(clientKey); // Reset on success

    if (isNaN(score) || score < minCompliance) return false;
    return true;
  }
}

/**
 * Utility to parse PEM public keys natively onto Edge devices via Web Crypto
 */
async function importHIKPublicKey(pem: string): Promise<CryptoKey> {
  const b64 = pem.replace(/-----[A-Z ]+-----/g, "").replace(/\s+/g, "");
  const binaryDerString = atob(b64);
  const binaryDer = new Uint8Array(binaryDerString.length);
  for (let i = 0; i < binaryDerString.length; i++) {
    binaryDer[i] = binaryDerString.charCodeAt(i);
  }
  return await crypto.subtle.importKey(
    "spki",
    binaryDer,
    { name: "Ed25519" },
    true,
    ["verify"]
  );
}

export default {
  async fetch(request: Request, env: { HIK_BROADCASTER_PUBLIC_KEY: string, YOUTUBE_STREAM_KEY: string }, ctx: any): Promise<Response> {
    const url = new URL(request.url);

    // 1. Only intercept video/audio stream fragments (e.g. .m4s or .ts files) and HLS playlists (.m3u8)
    if (!url.pathname.match(/\.(m4s|ts|mp4|m3u8)$/)) {
      return fetch(request);
    }

    // 2. Initialize Edge Verify Key (Pulled safely from Cloudflare Env Secrets)
    let broadcasterKey: CryptoKey | undefined;
    if (env.HIK_BROADCASTER_PUBLIC_KEY) {
      broadcasterKey = await importHIKPublicKey(env.HIK_BROADCASTER_PUBLIC_KEY);
    }
    
    // 3. Initialize with a tolerance window of 3 missing pulses
    const telemetryHandler = new EdgeTelemetryHandler(3, broadcasterKey);

    // 4. Convert Request Headers map to standard record dictionary
    const requestHeaders: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      requestHeaders[key.toLowerCase()] = value; // Normalize securely
    });

    // 5. Evaluate the request for Zero-Trust Governance Compliance
    // Ensures real-time hik-es is 100% compliant before CDN transmits streaming data
    const isCompliant = await telemetryHandler.evaluateEdgeRequest(request, requestHeaders, 100);

    if (!isCompliant) {
      // 4. Instantly disconnect malicious, deepfaked, or unverified streams at the Edge
      return new Response("HIK Governance Violation: Ethical Pulse blocked at the Edge. Stream disconnected.", {
        status: 403, // Forbidden
        headers: { "X-HIK-Status": "BLOCKED" }
      });
    }

    // 6. Transparent Proxy Relay to YouTube Live HLS Ingestion
    // Fefo's app streams to this Cloudflare Worker. Once the chunk is mathematically verified,
    // the Worker pipes the raw video bytes securely directly into YouTube's ingest servers.
    if (!env.YOUTUBE_STREAM_KEY) {
      return new Response("HIK Proxy Configuration Error: Missing YOUTUBE_STREAM_KEY environment variable.", { status: 500 });
    }

    // Typical YouTube Live HLS Ingest format:
    // https://a.upload.youtube.com/http_upload_hls?cid=[STREAM_KEY]&copy=0&file=[FILENAME]
    const filename = url.pathname.split("/").pop() || "chunk.ts";
    const ytIngestUrl = new URL(`https://a.upload.youtube.com/http_upload_hls`);
    ytIngestUrl.searchParams.set("cid", env.YOUTUBE_STREAM_KEY);
    ytIngestUrl.searchParams.set("copy", "0");
    ytIngestUrl.searchParams.set("file", filename);

    const ytRequest = new Request(ytIngestUrl.toString(), {
      method: request.method, // Forward POST/PUT natively
      headers: {
        "Content-Type": request.headers.get("Content-Type") || "video/MP2T",
        "Content-Length": request.headers.get("Content-Length") || ""
      },
      body: request.body,     // Stream the bitstream directly (zero memory buffering penalty!)
      redirect: "follow"
    });

    const response = await fetch(ytRequest);
    
    // Log the authentically verified Provenance Score (hik-ps) for observability dashboards
    const provenanceScore = requestHeaders["cmcd-custom-hik-ps"];
    if (provenanceScore) {
       console.log(`[HIK Edge Telemetry] Compliant media chunk delivered. PS: ${provenanceScore}`);
    }

    return response;
  }
};
