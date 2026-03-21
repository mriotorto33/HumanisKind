/**
 * v2.0 Sequential Truth Engine
 * CMCD v2 Ethical Pulse & Telemetry
 * 
 * Orchestrates real-time scoring and injection of custom HTTP headers
 * (hik-es, hik-ps) onto edge media segments.
 */

export interface EthicalPulseConfig {
  kmirCompliancePercentage: number; // 0 to 100
  chainDepth: number; // How many sequential fMP4 fragments have been successfully chained
}

export interface EdgeTelemetryConfig {
  maxToleranceWindow?: number; // Number of consecutive missing pulses to tolerate
}

export class CMCDTelemetryHandler {
  private consecutiveMissingPulses = 0;
  private maxToleranceWindow: number;

  constructor(config?: EdgeTelemetryConfig) {
    this.maxToleranceWindow = config?.maxToleranceWindow || 0;
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
