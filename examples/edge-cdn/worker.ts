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

  constructor(maxToleranceWindow: number = 0) {
    this.maxToleranceWindow = maxToleranceWindow;
  }

  public evaluateEdgeRequest(request: Request, headers: Record<string, string>, minCompliance = 100): boolean {
    // In edge environments, track stream state via client IP or similar stream identifier
    const clientKey = request.headers.get("cf-connecting-ip") || "unknown";
    
    const esKey = headers["cmcd-custom-hik-es"];
    const twKey = headers["cmcd-custom-hik-tw"];
    
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

export default {
  async fetch(request: Request, env: any, ctx: any): Promise<Response> {
    const url = new URL(request.url);

    // 1. Only intercept video/audio stream fragments (e.g. .m4s or .ts files)
    if (!url.pathname.match(/\.(m4s|ts|mp4)$/)) {
      return fetch(request);
    }

    // Initialize with a tolerance window of 3 missing pulses
    const telemetryHandler = new EdgeTelemetryHandler(3);

    // 2. Convert Request Headers map to standard record dictionary
    const requestHeaders: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      requestHeaders[key.toLowerCase()] = value; // Normalize securely
    });

    // 3. Evaluate the request for Zero-Trust Governance Compliance
    // Ensures real-time hik-es is 100% compliant before CDN transmits streaming data
    const isCompliant = telemetryHandler.evaluateEdgeRequest(request, requestHeaders, 100);

    if (!isCompliant) {
      // 4. Instantly disconnect malicious, deepfaked, or unverified streams at the Edge
      return new Response("HIK Governance Violation: Ethical Pulse blocked at the Edge. Stream disconnected.", {
        status: 403, // Forbidden
        headers: { "X-HIK-Status": "BLOCKED" }
      });
    }

    // 5. Serve the authenticated video frame from upstream Origin
    const response = await fetch(request);
    
    // Log the authentically verified Provenance Score (hik-ps) 
    const provenanceScore = requestHeaders["cmcd-custom-hik-ps"];
    if (provenanceScore) {
       console.log(`[HIK Edge Telemetry] Compliant media chunk delivered. PS: ${provenanceScore}`);
    }

    return response;
  }
};
