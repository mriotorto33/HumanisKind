import { createHash } from "crypto";
import stringify from "json-stable-stringify";

/**
 * Kernel of Manifested Integrity Rules (KMIR)
 * Deterministic validation engine for AI Policy Manifests.
 */

export interface PolicyManifest {
  ai_agent_id: string;
  source_corpus_hash: string;
  allowed_transformations: string[];
  guardrails: {
    no_deepfake_manipulation: boolean;
    transparent_training_data: boolean;
    human_in_the_loop?: boolean;
  };
}

export interface SacredTraceReceipt {
  kmir_version: string;
  validation_status: "PASSED" | "FAILED";
  timestamp: string;
  merkle_anchored_source: string;
  trace_id: string;
  certified_guardrails: PolicyManifest["guardrails"];
}

export class KMIRValidator {
  /**
   * Strictly parses an AI's proposed Policy Manifest against deterministic constraints.
   * Ensures compliance to create "The Sacred Trace™" receipt.
   * 
   * @param manifest The JSON manifest proposed by the AI
   * @throws Error if the manifest violates the ethical kernel constraints
   * @returns A cryptographic receipt verifying the chain of custody
   */
  public generateSacredTrace(manifest: PolicyManifest): SacredTraceReceipt {
    this.validateAgent(manifest.ai_agent_id);
    this.validateSource(manifest.source_corpus_hash);
    this.validateGuardrails(manifest.guardrails);
    this.validateTransformations(manifest.allowed_transformations);

    return {
      kmir_version: "1.1.0",
      validation_status: "PASSED",
      timestamp: new Date().toISOString(),
      merkle_anchored_source: manifest.source_corpus_hash,
      trace_id: this.generateTraceId(manifest),
      certified_guardrails: manifest.guardrails
    };
  }

  private validateAgent(agentId: string) {
    if (!agentId || agentId.trim() === "") {
      throw new Error("KMIR Violation: AI Agent ID is required for attribution.");
    }
  }

  private validateSource(hash: string) {
    if (!hash || !hash.match(/^0x[a-fA-F0-9]{64}$/)) {
      throw new Error("KMIR Violation: Merkle-Anchored source hash is missing or invalid.");
    }
  }

  private validateGuardrails(guardrails: PolicyManifest["guardrails"]) {
    if (!guardrails) {
      throw new Error("KMIR Violation: Guardrails payload is entirely missing.");
    }
    if (guardrails.no_deepfake_manipulation !== true) {
      throw new Error("KMIR Violation: Action prohibited. Deepfake manipulation must be explicitly opted out.");
    }
    if (guardrails.transparent_training_data !== true) {
      throw new Error("KMIR Violation: Action prohibited. Training data transparency must be assured.");
    }
  }

  private validateTransformations(transforms: string[]) {
    if (!transforms || !Array.isArray(transforms)) return;
    const prohibitedTransformations = ["unconsented_faceswap", "synthetic_voice_clone"];
    
    for (const t of transforms) {
      if (prohibitedTransformations.includes(t)) {
        throw new Error(`KMIR Violation: Prohibited logic injection detected -> ${t}`);
      }
    }
  }

  /**
   * Deterministic logic injection: computes a stable trace ID for the receipt.
   */
  private generateTraceId(manifest: PolicyManifest): string {
    const stableJson = stringify({
      agent: manifest.ai_agent_id,
      source: manifest.source_corpus_hash,
      guardrails: manifest.guardrails
    });
    if (!stableJson) throw new Error("Failed to dynamically stringify the trace payload.");
    return "0x" + createHash("sha256").update(stableJson).digest("hex");
  }
}
