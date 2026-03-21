/**
 * v2.0 Sequential Truth Engine
 * CMCD v2 Ethical Pulse & Telemetry
 * 
 * Orchestrates real-time scoring and injection of custom HTTP headers
 * (hik-es, hik-ps) onto edge media segments.
 */

import { createSign, createVerify } from "crypto";
import { type C2PASigningKey, loadOrCreateSigningKey } from "./signer";

export interface EthicalPulseConfig {
  kmirCompliancePercentage: number; // 0 to 100
  chainDepth: number; // How many sequential fMP4 fragments have been successfully chained
  isAdBreakActive?: boolean; // Signal authorized chain sleep during ads
}

export interface EdgeTelemetryConfig {
  maxToleranceWindow?: number; // Number of consecutive missing pulses to tolerate
  signingKey?: C2PASigningKey; // Broadcaster private key to sign telemetry
  verificationKeyPem?: string; // Edge CDN public key to physically verify telemetry
}

export class CMCDTelemetryHandler {
  private consecutiveMissingPulses = 0;
  private maxToleranceWindow: number;
  private signingKey?: C2PASigningKey;
  private verificationKeyPem?: string;

  constructor(config?: EdgeTelemetryConfig) {
    this.maxToleranceWindow = config?.maxToleranceWindow || 0;
    this.signingKey = config?.signingKey;
    this.verificationKeyPem = config?.verificationKeyPem;
  }

  /**
   * Generates the Custom Media Common Data (CMCD v2) telemetry headers 
   * to broadcast the integrity state of a live stream segment.
   * 
   * @param config The real-time compliance state of the live broadcast
   * @returns An object containing the HIK custom HTTP headers
   */
  public generateHeaders(config: EthicalPulseConfig): Record<string, string> {
    // hik-es: Ethical Score (0-100)
    // Measures the real-time adherence to KMIR guardrails.
    // If compliance drops below 100, the edge node can instantly kill the stream.
    const hikEs = Math.max(0, Math.min(100, config.kmirCompliancePercentage));

    // hik-ps: Provenance Score (0-100+)
    // Represents the strength and depth of the unbreakable video-chain.
    // Deep chains inherently possess higher cryptographic weight.
    const hikPs = config.chainDepth;

    const headers: Record<string, string> = {
      "CMCD-Custom-hik-es": hikEs.toString(),
      "CMCD-Custom-hik-ps": hikPs.toString()
    };

    // hik-tw: Tolerance Window
    // Dynamically informs the Edge CDN of the broadcaster's explicit network packet drop tolerance.
    if (this.maxToleranceWindow > 0) {
      headers["CMCD-Custom-hik-tw"] = this.maxToleranceWindow.toString();
    }

    // hik-ab: Ad Break active
    // Instructs the zero-trust edge to temporarily sleep to allow unverified third-party ad insertions
    if (config.isAdBreakActive) {
      headers["CMCD-Custom-hik-ab"] = "1";
    }

    // Secure the headers cryptographically if a signing key is configured
    if (this.signingKey) {
      // Deterministic JSON stringification of headers for repeatable payload signatures
      const keys = Object.keys(headers).sort();
      const payloadObj: Record<string, string> = {};
      for (const k of keys) {
        payloadObj[k] = headers[k];
      }
      
      const payloadString = JSON.stringify(payloadObj);
      const sign = createSign("SHA256");
      sign.update(Buffer.from(payloadString, "utf8"));
      sign.end();
      
      headers["CMCD-Custom-hik-sig"] = sign.sign(this.signingKey.privateKeyPem).toString("base64url");
    }

    return headers;
  }

  /**
   * Evaluates an incoming stream segment request at the CDN Edge based on HIK telemetry.
   * Enables hyperscale dropping of malicious or deepfaked content before it hits end-users.
   * 
   * @param headers The HTTP request headers (case-insensitive keys)
   * @param minimumCompliance Expected KMIR ethical threshold (default 100 for strict zero-trust)
   * @returns boolean True if the stream is compliant and should be served
   */
  public evaluateEdgeRequest(headers: Record<string, string>, minimumCompliance = 100): boolean {
    // Normalize headers to lowercase for robust lookup
    const normalizedHeaders: Record<string, string> = {};
    for (const [k, v] of Object.entries(headers)) {
      normalizedHeaders[k.toLowerCase()] = v;
    }

    const esKey = normalizedHeaders["cmcd-custom-hik-es"];
    const abKey = normalizedHeaders["cmcd-custom-hik-ab"];
    const sigKey = normalizedHeaders["cmcd-custom-hik-sig"];

    // 1. If the Edge expects a cryptographic signature, rigidly verify it before ANY trust decisions
    if (this.verificationKeyPem) {
      if (!sigKey && (esKey || abKey)) {
        // Missing signature on claimed telemetry is an automatic deepfake failure
        return false;
      }
      if (sigKey) {
        // Reconstruct the exact header object to verify the payload signature
        const payloadObj: Record<string, string> = {};
        for (const [k, v] of Object.entries(normalizedHeaders)) {
          if (k.startsWith("cmcd-custom-hik-") && k !== "cmcd-custom-hik-sig") {
            // Note: the sender used original casing (e.g. "CMCD-Custom-hik-es"),
            // so if normalization breaks the signature hash, it would fail.
            // We must find the original keys from the *unnormalized* headers to correctly verify.
          }
        }
        
        // Accurate reconstruction using original headers
        const originalHIKHeaders: Record<string, string> = {};
        for (const [k, v] of Object.entries(headers)) {
          if (k.toLowerCase().startsWith("cmcd-custom-hik-") && k.toLowerCase() !== "cmcd-custom-hik-sig") {
             originalHIKHeaders[k] = v;
          }
        }
        
        const keys = Object.keys(originalHIKHeaders).sort();
        const verifyPayload: Record<string, string> = {};
        for (const k of keys) {
          verifyPayload[k] = originalHIKHeaders[k];
        }

        const verify = createVerify("SHA256");
        verify.update(Buffer.from(JSON.stringify(verifyPayload), "utf8"));
        verify.end();

        const isValid = verify.verify(this.verificationKeyPem, Buffer.from(sigKey, "base64url"));
        if (!isValid) {
          // The headers were tampered with (e.g., someone spoofed an ad-break or inflated their ethical score)
          return false;
        }
      }
    }

    if (abKey === "1") {
      // Authorized Chain Sleep: The broadcaster explicitly signed an ad break.
      // Allow unverified fragments to pass the Edge without counting against tolerance.
      return true;
    }
    
    if (!esKey) {
      // Network drop or missing pulse: Use the tolerance window
      this.consecutiveMissingPulses++;
      if (this.consecutiveMissingPulses <= this.maxToleranceWindow) {
        // Tolerate this missing pulse as a transient network issue
        return true;
      }
      
      // Zero-trust: once we exceed the buffering window, kill the stream.
      return false;
    }

    const ethicalScore = parseInt(esKey, 10);
    
    // Once we receive a valid telemetry pulse, we can reset our missing pulse counter
    this.consecutiveMissingPulses = 0;

    if (isNaN(ethicalScore) || ethicalScore < minimumCompliance) {
      // The stream has actively failed KMIR validation (e.g., untagged deepfake detected upstream)
      return false;
    }

    return true;
  }
}
