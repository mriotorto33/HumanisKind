# 🛡️ Human Is Kind (HIK) SDK

> *"In a world of infinite copies, original human intent is the only true scarcity."*  
> **The Technical Infrastructure for the Sacred Trace™**

**Human Is Kind (HIK)** is an 'Integrity as a Service' (IaaS) foundational middleware. We shift AI safety from an unenforceable abstract "honor system" into a structural, mathematical requirement. The SDK provides immutable, blockchain-anchored cryptographic provenance for C2PA manifests, static digital assets, and hyper-scale live video streams.

---
## 🛡️ Origin & Independence Statement (Safe Harbor)

**Architecture & Code Provenance**

The HumanisKind (HIK) SDK is an independent, clean-room architecture designed for deterministic AI governance. This entire codebase was architected and generated from the ground up utilizing advanced agentic AI (Antigravity). 

HIK does not contain, derive from, or rely upon any proprietary code, trade secrets, or confidential intellectual property from any third-party organizations or prior commercial engagements. 

This project is built strictly on top of public, open-source specifications, primarily implementing and expanding upon the **C2PA (Coalition for Content Provenance and Authenticity)** standard, **COSE** cryptographic primitives, and **CMCD** telemetry. HIK introduces a novel, independent middleware layer focused exclusively on real-time hardware-software interdiction and immutable blockchain anchoring.


## 🏛️ Core Architectures

### 1. The Ethical Kernel (v1.1)
The deterministic heart of the SDK, guaranteeing civilizational source integrity before signatures are fired.
* **KMIR (Kernel of Manifested Integrity Rules)**: A strict, zero-trust cryptographic gatekeeper. If an AI payload fails to explicitly declare vital compliance flags (e.g., `no_deepfake_manipulation: true`), or attempts prohibited logic injections (e.g., `"unconsented_faceswap"`), KMIR forcefully throws an error and instantly aborts the transaction. 
* **Merkle-Anchored Governance**: Physically hashes the raw source buffer to eliminate textual drift, hallucinations, or silent content manipulation.
* **OIDC CAWG Identity Bridging**: Seamlessly maps external federated identities (e.g., Google JWTs) directly into the CAWG (Coalition for Authenticated Web Governance) v1 identity schema within the manifest using an unforgeable cryptographic proof of possession.
* **The Sacred Trace™**: An immutable cryptographic receipt permanently embedded directly into the C2PA `.hash.data` assertions on the blockchain, immediately distinguishing legitimately verified data from bypass attempts.

### 2. The Sequential Truth Engine (v2.0)
Evolving the protocol beyond localized static files directly into hyper-scale, low-latency live video streaming.
* **Verifiable Segment Info (VSI)**: Real-time **C2PA v2.3 compliant** fMP4/HLS video fragment signing. The SDK mathematically maps the `vsi_hash_map` assertions directly into ISO BMFF `emsg` (Event Message) binary boxes. Fragments are actively cryptographically signed using localized ephemeral C2PA keys (P-256) ensuring full structural compatibility with C2PA v2.3 validators (e.g., Adobe's Validator), even in fully offline environments. This rigidly locks the cryptographic state of the *previous* media fragment into the *current* payload, outputting an unbreakable Merkle video-chain.
* **CMCDv2 Ethical Pulse**: Dynamically broadcasts real-time integrity telemetry headers directly to the open web:
  - `CMCD-Custom-hik-es` (Ethical Score: 0-100): Calculates live KMIR adherence. A score of 100 means the stream is mathematically pure. By default, if upstream logic drops the score below the `minimumCompliance` threshold (e.g., detecting an unauthorized deepfake), zero-trust components drop the stream. 
  - `CMCD-Custom-hik-ps` (Provenance Score: 0-∞): A live tally of the **Merkle Chain Depth**. A `hik-ps` of 5,200 mathematically guarantees there is an unbreakable, cryptographically verified chain of 5,200 consecutive video frames leading flawlessly back to the root physical camera anchor.
  - `CMCD-Custom-hik-tw` (Tolerance Window): Dynamically informs the Edge CDN of the broadcaster's explicit network packet drop tolerance. Buffers against real-world packet drops linearly, while instantly failing-close on explicit ethical violations.
  - `CMCD-Custom-hik-ab` (Ad Break): Specifically authorizes an unverified third-party intermission (SSAI) to allow seamless mid-roll ad insertions without triggering zero-trust stream termination.
  - **`CMCD-Custom-hik-sig`** (Cryptographic Telemetry Signature): An Ed25519 signature of the telemetry payload ensuring absolute mathematical protection against deepfakers spoofing the `hik-ab` or `hik-es` values at the CDN edge.
* **Hyperscale Edge CDN Interception**: Serverless edge infrastructure (e.g., Cloudflare Workers / Fastly Compute) physically inspects the cryptographically signed `hik-sig` pulse, empowering networks to physically disconnect streaming packets in milliseconds if an unauthorized deepfake attempts to intercept the broadcast or spoof an ad break. Network packet loss is safely tolerated through stateful buffering windows configured by the broadcaster.
* **Automated Proxy CA (Enterprise X.509)**: The backend SDK automatically generates and securely wraps localized ephemeral keys into standard `X.509` certificate chains using `node-forge`. These certificates are dynamically injected directly into the `C2PA COSE_Sign1` unprotected header (via standard `x5c`), seamlessly eliminating "Raw Public Key" errors from upstream C2PA validators (e.g. Adobe Content Credentials) without requiring front-end infrastructure changes.

### Hardware Broadcaster Requirements (e.g., Mobile / Camera App)
To interface properly with the v2.0 SDK backend in production (like a live stream from a hardware camera):
1. **CMCD Headers**: Broadcaster apps must natively inject `CMCD-Custom-hik-es` (Ethical Score), `CMCD-Custom-hik-ps` (Provenance Tally), and optionally `CMCD-Custom-hik-ab` (Ad Breaks) headers to all outgoing video chunks (`.m4s`, `.ts`).
2. **Hardware Ed25519 Enclaves**: The device (e.g., Android StrongBox / Apple Secure Enclave) must explicitly sign the CMCD telemetry payload utilizing purely hardware-backed `Ed25519` private keys. Attach the Base64URL signature string to the chunk header as `CMCD-Custom-hik-sig`.
3. **Public Key Handshake**: The app must successfully hand its public `Ed25519` key to the ingestion Edge server when opening the video session. The Edge CDN will rely on this registered key for 100% of its zero-trust drops against live CMCD packets. The Backend Proxy CA isolates this hardware key from the ultimate C2PA Manifest generation, ensuring maximum architectural separation.

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

### Fullstack Governance Command Dashboard (Next.js)
A complete, high-fidelity "Mission Control" interface is included in `examples/nextjs-boilerplate`. This module showcases:
*   **Deterministic Kill-Switch**: Real-time edge disconnection for deepfake payloads.
*   **Atomic Chain Visualizer**: Live IPFS and Blockchain anchoring transparency.
*   **Executive Metrics**: Real-time HIK-ES and HIK-PS telemetry HUD.

This implementation is designed as a **Technical Mandate** for leadership and investor presentations.

```bash
cd examples/nextjs-boilerplate
npm install     
npm run dev     
# Open http://localhost:3001 to begin the presentation.
```

## HIK Certificate

After signing and anchoring, you receive:

| Field        | Description                          |
|-------------|--------------------------------------|
| `localPath` | Path to the signed asset             |
| `manifestHash` | SHA-256 hash of the manifest      |
| `ipfsUrl`   | IPFS URI (e.g. `ipfs://Qm...`)       |
| `txHash`    | Blockchain transaction hash          |

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
## ⚖️ License & IP Agreement: Evaluation Only (Commercial FSL Available)

**Copyright (c) 2026 Martín Riotorto & Matías Mospan.**

This public repository is provided as **"Visible Source"** exclusively for transparency, academic research, and security auditing. We believe in the "Fair Source" paradigm: the enterprise market requires absolute code visibility to verify deterministic compliance, but the foundational creators require protection against unauthorized commercial exploitation.

### 1. Public Repo Rights (Non-Commercial & Evaluation)
By accessing this public repository, you are granted a limited right to view, download, and test this Software locally strictly for:
* Independent security and compliance auditing.
* Academic research.
* Local, non-production integration testing.

### 2. Commercial & Production Use (Requires FSL License)
**Using this Software for internal business operations, commercial services, or deploying it into any production environment (e.g., live HR workflows, public APIs) is STRICTLY PROHIBITED without a valid Commercial License.**

Organizations requiring production deployment to satisfy regulatory frameworks (such as the EU AI Act or NYC LL144) must acquire the **Functional Source License (FSL-1.1-ALv2)** through a formal agreement with the HumanisKind lead architects.

### 3. The Enterprise FSL Advantage
When an organization executes a commercial agreement and acquires the FSL-1.1-ALv2 license, they unlock:
* **Unlimited Internal Production Use:** Full legal rights to deploy the deterministic governance engine within their own infrastructure (e.g., GCP Kubernetes sidecars).
* **Delayed Open Source Publication (DOSP):** To mathematically eliminate vendor lock-in, the specific version of the code licensed to the enterprise will automatically and irrevocably convert to the permissive **Apache License Version 2.0** exactly 24 months after the agreement.

---

### 💼 Enterprise Integrations & Partnerships
For organizations requiring deep infrastructural integration (e.g., GCP Kubernetes sidecar orchestration, Go runtime migrations, and SLA-backed support), the HIK team offers dedicated Non-Recurring Engineering (NRE) engagements. 

Please reach out directly to the Lead Architects to discuss Enterprise deployment requirements, NRE engagements, and the activation of the FSL commercial license.

---

### 🙏 Acknowledgments & Special Thanks
Special thanks to **Federico Brubacher** for his invaluable contribution as an external Strategic Advisor. His independent validation of the HIK architecture against global scalability and Big Tech standards—particularly his rigorous testing of the hardware enclaves—has been instrumental in ensuring the enterprise-grade readiness of this protocol.

