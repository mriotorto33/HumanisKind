# 🛡️ Human Is Kind (HIK) SDK

> *"In a world of infinite copies, original human intent is the only true scarcity."*

**The Technical Infrastructure for the Sacred Trace™**

---

## The Problem

AI-generated content is flooding every platform. Deepfakes are indistinguishable from reality at scale. Existing "AI safety" frameworks are prompt-based — probabilistic, jailbreakable, and unenforceable at the infrastructure level.

There is no cryptographic way to prove, in real time, that what a human said is what a system delivered — until now.

**Human Is Kind (HIK)** is an *Integrity as a Service* (IaaS) foundational middleware. We shift AI safety from an unenforceable abstract honor system into a structural, mathematical requirement. The SDK provides immutable, blockchain-anchored cryptographic provenance for C2PA manifests, static digital assets, and hyper-scale live video streams.

---

## 🛡️ Origin & Independence Statement (Safe Harbor)

The HumanisKind (HIK) SDK is an independent, clean-room architecture designed for deterministic AI governance.

HIK does not contain, derive from, or rely upon any proprietary code, trade secrets, or confidential intellectual property from any third-party organizations or prior commercial engagements.

This project is built strictly on top of public, open-source specifications — primarily implementing and expanding upon the [C2PA](https://c2pa.org/) standard, COSE cryptographic primitives, and CMCD telemetry. HIK introduces a novel, independent middleware layer focused exclusively on real-time hardware-software interdiction and immutable blockchain anchoring.

---

## 🏛️ Core Architectures

### 1. The Ethical Kernel (v1.1)

The deterministic heart of the SDK — guaranteeing civilizational source integrity before signatures are fired.

**KMIR (Kernel of Manifested Integrity Rules)**
A strict, zero-trust cryptographic gatekeeper. If an AI payload fails to explicitly declare vital compliance flags (e.g., `no_deepfake_manipulation: true`), or attempts prohibited logic injections (e.g., `unconsented_faceswap`), KMIR forcefully throws an error and instantly aborts the transaction. There is no silent failure mode.

**Merkle-Anchored Governance**
Physically hashes the raw source buffer to eliminate textual drift, hallucinations, or silent content manipulation.

**OIDC CAWG Identity Bridging**
Seamlessly maps external federated identities (e.g., Google JWTs) directly into the CAWG (Coalition for Authenticated Web Governance) v1 identity schema within the manifest using an unforgeable cryptographic proof of possession.

**The Sacred Trace™**
An immutable cryptographic receipt permanently embedded directly into the C2PA `.hash.data` assertions on the blockchain — immediately and mathematically distinguishing legitimately verified data from any bypass attempt.

---

### 2. The Sequential Truth Engine (v2.0)

Evolving the protocol beyond localized static files into hyper-scale, low-latency live video streaming.

**Verifiable Segment Info (VSI)**
Real-time C2PA v2.3 compliant fMP4/HLS video fragment signing. The SDK mathematically maps `vsi_hash_map` assertions directly into ISO BMFF emsg (Event Message) binary boxes. Fragments are cryptographically signed using localized ephemeral C2PA keys (P-256), ensuring full structural compatibility with C2PA v2.3 validators (including Adobe's Validator) even in fully offline environments. Each fragment locks the cryptographic state of the previous into the current payload — outputting an unbreakable Merkle video-chain.

**CMCDv2 Ethical Pulse**
Dynamically broadcasts real-time integrity telemetry headers to the open web:

| Header | Name | Description |
|---|---|---|
| `CMCD-Custom-hik-es` | Ethical Score (0–100) | Live KMIR adherence. Score of 100 = mathematically pure stream. Drops below threshold trigger zero-trust stream termination. |
| `CMCD-Custom-hik-ps` | Provenance Score (0–∞) | Live Merkle Chain Depth tally. A score of 5,200 mathematically guarantees an unbroken chain of 5,200 verified frames back to the root camera anchor. |
| `CMCD-Custom-hik-tw` | Tolerance Window | Informs the Edge CDN of the broadcaster's explicit packet drop tolerance. Buffers real-world packet loss; instantly fails-close on ethical violations. |
| `CMCD-Custom-hik-ab` | Ad Break | Authorizes an unverified third-party intermission (SSAI) for mid-roll ad insertion without triggering zero-trust termination. |
| `CMCD-Custom-hik-sig` | Cryptographic Signature | Ed25519 signature of the telemetry payload — prevents deepfakers from spoofing `hik-ab` or `hik-es` values at the CDN edge. |

**Hyperscale Edge CDN Interception**
Serverless edge infrastructure (Cloudflare Workers / Fastly Compute) physically inspects the cryptographically signed `hik-sig` pulse — empowering networks to disconnect streaming packets in milliseconds if an unauthorized deepfake attempts to intercept the broadcast or spoof an ad break.

**Automated Proxy CA (Enterprise X.509)**
The backend SDK automatically generates and wraps localized ephemeral keys into standard X.509 certificate chains using `node-forge`. Certificates are dynamically injected into the C2PA `COSE_Sign1` unprotected header (via standard `x5c`), eliminating "Raw Public Key" errors from upstream C2PA validators (e.g., Adobe Content Credentials) without requiring front-end infrastructure changes.

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

# v1.1 Static Asset / Mock Deployment Tests
npx hardhat test tests/test-blockchain-flow.ts

# v2.0 Low-Latency Streaming & CDN Edge Tests
npm run test:v2
```

---

## 💻 Developer Implementations

### Static Asset Signature & KMIR Validation (Node.js)

```javascript
import { signAndAnchor, hashAssetFile } from "human-is-kind-sdk";

const assetPath = "/path/to/asset.jpg";
const actualHash = hashAssetFile(assetPath);

// The SDK automatically signs, hashes, uploads to IPFS, and anchors the manifest.
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
    // Zero-Trust: If these flags are not explicitly passed, the SDK hard-crashes.
    guardrails: {
      no_deepfake_manipulation: true,
      transparent_training_data: true,
    }
  }
});
```

### HIK Certificate Output

After signing and anchoring, you receive:

| Field | Description |
|---|---|
| `localPath` | Path to the signed asset |
| `manifestHash` | SHA-256 hash of the manifest |
| `ipfsUrl` | IPFS URI (e.g. `ipfs://Qm...`) |
| `txHash` | Blockchain transaction hash |

### Fullstack Governance Command Dashboard (Next.js)

A complete "Mission Control" interface is included in `examples/nextjs-boilerplate`:

- **Deterministic Kill-Switch** — real-time edge disconnection for deepfake payloads
- **Atomic Chain Visualizer** — live IPFS and blockchain anchoring transparency
- **Executive Metrics** — real-time HIK-ES and HIK-PS telemetry HUD

Designed as a technical mandate for leadership and investor presentations.

```bash
cd examples/nextjs-boilerplate
npm install
npm run dev
# Open http://localhost:3001
```

---

## ⚡ Ecosystem CLI Commands

### Local E2E Sandbox

```bash
# Terminal 1: Spin up local blockchain
npx hardhat node

# Terminal 2: Deploy Registry, Sign Asset, Anchor Trace
npm run demo:local

# Print the fetched Blockchain certificate to console
npm run show-certificate:local
```

### Production Mainnet / Polygon Amoy

```bash
# Testnet dry run
npm run demo:amoy

# Mainnet master deploy
npx hardhat run scripts/demo.ts --network polygon
```

---

## 🔌 Hardware Integration

> For teams building camera apps, mobile broadcasters, or hardware enclaves that interface with the HIK v2.0 backend — see [`HARDWARE.md`](./HARDWARE.md) for full broadcaster requirements, Ed25519 enclave specs, and public key handshake protocol.

---

## ⚖️ License & IP

**Copyright (c) 2026 Martín Riotorto & Matías Mospan.**

This public repository is provided as **Visible Source** exclusively for transparency, academic research, and security auditing. We operate under the Fair Source paradigm: the enterprise market requires absolute code visibility to verify deterministic compliance, but the foundational creators require protection against unauthorized commercial exploitation.

### Public Repo Rights (Non-Commercial & Evaluation)

By accessing this repository, you are granted a limited right to view, download, and test this software locally strictly for:

- Independent security and compliance auditing
- Academic research
- Local, non-production integration testing

### Commercial & Production Use (Requires FSL License)

Deploying this software for internal business operations, commercial services, or any production environment is **strictly prohibited** without a valid Commercial License.

Organizations requiring production deployment to satisfy regulatory frameworks (EU AI Act, NYC LL144) must acquire the **FSL-1.1-ALv2** license through a formal agreement with the HumanisKind lead architects.

### The Enterprise FSL Advantage

Executing a commercial agreement unlocks:

- **Unlimited Internal Production Use** — full legal rights to deploy the deterministic governance engine within your own infrastructure (e.g., GCP Kubernetes sidecars)
- **Delayed Open Source Publication (DOSP)** — the licensed version automatically and irrevocably converts to Apache License 2.0 exactly **24 months** after agreement execution, mathematically eliminating vendor lock-in

---

## 💼 Enterprise Licensing & Contact

For enterprise deployment inquiries, FSL licensing, and formal integration discussions, contact the lead architects directly via [humaniskind.com](https://humaniskind.com).

---

## 🙏 Acknowledgments

Special thanks to **Federico Brubacher** for his contribution as an external Strategic Advisor. His independent validation of the HIK architecture against global scalability benchmarks and enterprise standards has been instrumental in ensuring the protocol's enterprise-grade readiness.

---

*© 2026 Martín Riotorto & Matías Mospan — HumanisKind (HIK) v2.0 | Architecting Integrity as a Service | [github.com/mriotorto33/HumanisKind](https://github.com/mriotorto33/HumanisKind)*
