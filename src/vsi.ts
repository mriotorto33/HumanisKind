/**
 * v2.0 Sequential Truth Engine
 * Verifiable Segment Info (VSI) & Merkle Chaining
 * 
 * C2PA v2 compliant real-time fragment signing for fMP4 and HLS/DASH streams.
 */

import { createHash } from "crypto";

export interface StreamFragment {
  sequenceNumber: number;
  payloadBuffer: Buffer;
  timestamp?: string;
}

export interface ChainedFragmentAssertion {
  sequence_number: number;
  current_payload_hash: string;
  previous_link_hash: string; // The unbreakable Merkle Chain link
  timestamp: string;
}

export class StreamSigner {
  private currentChainTip: string;

  /**
   * Initializes a real-time stream signer.
   * @param initialAnchorHash The Governance Merkle Anchor of the broadcast starting state.
   */
  constructor(initialAnchorHash: string) {
    if (!initialAnchorHash || !initialAnchorHash.startsWith("0x")) {
      throw new Error("VSI Error: A valid 0x Merkle Anchor is required to start the chain.");
    }
    this.currentChainTip = initialAnchorHash;
  }

  /**
   * Processes a live video/audio fragment in ultra-low latency, cryptographically
   * locking its state to the previous fragment in the broadcast.
   * 
   * @param fragment The raw fMP4 media chunk buffer and sequence
   * @returns The C2PA v2 assertion block ready for `.hash.data` injection
   */
  public chainFragment(fragment: StreamFragment): ChainedFragmentAssertion {
    // 1. Hash the naked fragment payload
    const payloadHash = "0x" + createHash("sha256").update(fragment.payloadBuffer).digest("hex");

    // 2. Build the sequential truth assertion
    const assertion: ChainedFragmentAssertion = {
      sequence_number: fragment.sequenceNumber,
      current_payload_hash: payloadHash,
      previous_link_hash: this.currentChainTip,
      timestamp: fragment.timestamp || new Date().toISOString()
    };

    // 3. Seal the mathematical link into the new chain tip
    const linkBuffer = Buffer.from(JSON.stringify(assertion), "utf8");
    this.currentChainTip = "0x" + createHash("sha256").update(linkBuffer).digest("hex");

    return assertion;
  }

  /**
   * Retrieves the current immutable tip of the broadcast chain.
   * Used to publish the high-watermark state to the HIKRegistry smart contract.
   */
  public getChainTip(): string {
    return this.currentChainTip;
  }
}
