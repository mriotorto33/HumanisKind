# 🛡️ Human Is Kind (HIK) SDK

> *"In a world of infinite copies, original human intent is the only true scarcity."*  
> **The Technical Infrastructure for the Sacred Trace™**

**Human Is Kind (HIK)** is an 'Integrity as a Service' (IaaS) foundational middleware. We shift AI safety from an unenforceable abstract "honor system" into a structural, mathematical requirement. The SDK provides immutable, blockchain-anchored cryptographic provenance for C2PA manifests, static digital assets, and hyper-scale live video streams.

---

## 🏛️ Core Architectures

### 1. The Ethical Kernel (v1.1)
The deterministic heart of the SDK, guaranteeing civilizational source integrity before signatures are fired.
* **KMIR (Kernel of Manifested Integrity Rules)**: A strict, zero-trust cryptographic gatekeeper. If an AI payload fails to explicitly declare vital compliance flags (e.g., `no_deepfake_manipulation: true`), or attempts prohibited logic injections (e.g., `"unconsented_faceswap"`), KMIR forcefully throws an error and instantly aborts the transaction. 
* **Merkle-Anchored Governance**: Physically hashes the raw source buffer to eliminate textual drift, hallucinations, or silent content manipulation.
* **The Sacred Trace™**: An immutable cryptographic receipt permanently embedded directly into the C2PA `.hash.data` assertions on the blockchain, immediately distinguishing legitimately verified data from bypass attempts.

### 2. The Sequential Truth Engine (v2.0)
Evolving the protocol beyond localized static files directly into hyper-scale, low-latency live video streaming.
* **Verifiable Segment Info (VSI)**: Real-time **C2PA v2.3 compliant** fMP4/HLS video fragment signing. The SDK mathematically maps the `vsi_hash_map` assertions directly into ISO BMFF `emsg` (Event Message) binary boxes. Fragments are actively cryptographically signed using localized ephemeral C2PA keys (P-256) ensuring full structural compatibility with C2PA v2.3 validators (e.g., Adobe's Validator), even in fully offline environments. This rigidly locks the cryptographic state of the *previous* media fragment into the *current* payload, outputting an unbreakable Merkle video-chain.
* **CMCDv2 Ethical Pulse**: Dynamically broadcasts real-time integrity telemetry headers directly to the open web:
  - `CMCD-Custom-hik-es` (Ethical Score: 0-100): Calculates live KMIR adherence. A score of 100 means the stream is mathematically pure. If upstream logic drops the score by even 1 point (e.g., detecting an unauthorized deepfake), zero-trust components drop the stream.
  - `CMCD-Custom-hik-ps` (Provenance Score: 0-∞): A live tally of the **Merkle Chain Depth**. A `hik-ps` of 5,200 mathematically guarantees there is an unbreakable, cryptographically verified chain of 5,200 consecutive video frames leading flawlessly back to the root physical camera anchor.
* **Hyperscale Edge CDN Interception**: Serverless edge infrastructure (e.g., Cloudflare Workers / Fastly Compute) physically inspects the `hik-es` pulse, empowering networks to physically disconnect streaming packets in milliseconds if an unauthorized deepfake attempts to intercept the broadcast.

---

## 🚀 Quick Start

### 1. Install & Configure
```bash
npm install
cp .env.example .env
# Edit .env with your PRIVATE_KEY, RPC_URL, PINATA_API_KEY, PINATA_SECRET_KEY
```

### 2. Compile & Test
```bash
npx hardhat compile

# Run v1.1 Static Asset / Mock Deployment Tests
npx hardhat test tests/test-blockchain-flow.ts

# Run v2.0 Low-Latency Streaming & CDN Edge Tests
npm run test:v2
```

---

## 💻 Developer Implementations

### Static Asset Signature & KMIR Validation (Node.js)
```typescript
import { signAndAnchor, hashAssetFile } from "human-is-kind-sdk";

const assetPath = "/path/to/asset.jpg";
const actualHash = hashAssetFile(assetPath);

// The SDK automatically signs, hashes, uploads to IPFS, and anchors the manifest!
const certificate = await signAndAnchor(assetPath, {
  blockchain: {
    rpcUrl: process.env.RPC_URL!,
    privateKey: process.env.PRIVATE_KEY!,
    contractAddress: process.env.HIK_REGISTRY_ADDRESS!,
  },
  kmirPolicy: {
    ai_agent_id: "humaniskind-compliance-agent",
    source_corpus_hash: actualHash,
    allowed_transformations: [],
    // Zero-Trust: If these aren't explicitly passed, the SDK hard-crashes.
    guardrails: {
      no_deepfake_manipulation: true,
      transparent_training_data: true,
    }
  }
});
```

### Fullstack Server & UX Simulator (Next.js)
A complete, plug-and-play Next.js App Router template is included showcasing seamless backend KMIR validation and a dynamic streaming Player UX that intercepts deepfakes visually.
```bash
cd examples/nextjs-boilerplate
npm install     
npm run dev     
# Open http://localhost:3000 to test the Edge verification UX visually!
```

---

## ⚡ Ecosystem CLI Commands

### Local E2E Sandbox
Demonstrate the full pipeline locally by temporarily spinning up a local EVM node.
```bash
# Terminal 1: Spin up local blockchain
npx hardhat node

# Terminal 2: Deploy Registry, Sign Asset, Anchor Trace
npm run demo:local

# Terminal 2: Print the fetched Blockchain object to console
npm run show-certificate:local
```

### Production Mainnet / Polygon Amoy Deploy
```bash
# Testnet Dry Run
npm run demo:amoy

# Mainnet Master Deploy
npx hardhat run scripts/demo.ts --network polygon
```

---

## ⚖️ License Agreement (Version 1.0)
**Copyright (c) 2026 Martín Riotorto & Luiza Sadowska.**

This Software is provided as **"Visible Source"** exclusively for transparency in human provenance and AI auditing.

* **Permitted:** Personal, academic, non-commercial research, and 30-day integration evaluation.
* **Prohibited:** Commercial use, middleware wrappers, or enterprise tracking without a valid subscribed license.
* **No Redistribution:** You may not redistribute the source code under an alternate license (e.g., MIT, GPL), nor may unauthorized personnel merge PRs against the central Standard.

**To obtain a Commercial License, please contact: https://www.humaniskind.com**

> *"Ensuring AI remains human-centric through transparent, ethical middleware."*
