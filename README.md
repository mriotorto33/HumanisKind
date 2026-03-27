# Human Is Kind (HIK)

Blockchain-anchored provenance for C2PA manifests. Sign assets locally, store manifests on IPFS, and anchor hashes to a smart contract for permanent verification.
# SDK 🛡️

> **The Technical Infrastructure for Sacred Trace™**
> 
> Architecting 'Integrity as a Service' (IaaS) by moving AI safety from abstract theory to hard-coded, deterministic design constraints.

## 🛡️ Origin & Independence Statement (Safe Harbor)

**Architecture & Code Provenance**

The HumanisKind (HIK) SDK is an independent, clean-room architecture designed for deterministic AI governance. This entire codebase was architected and generated from the ground up utilizing advanced agentic AI (Antigravity). 

HIK does not contain, derive from, or rely upon any proprietary code, trade secrets, or confidential intellectual property from any third-party organizations or prior commercial engagements. 

This project is built strictly on top of public, open-source specifications, primarily implementing and expanding upon the **C2PA (Coalition for Content Provenance and Authenticity)** standard, **COSE** cryptographic primitives, and **CMCD** telemetry. HIK introduces a novel, independent middleware layer focused exclusively on real-time hardware-software interdiction and immutable blockchain anchoring.

## Architecture

```
Asset → KMIR Policy Validation → C2PA Sign → Manifest JSON → SHA-256 Hash → IPFS Pin → Blockchain Anchor
```

## 🛡️ The Ethical Kernel (v1.1)

The HIK SDK fundamentally shifts AI compliance from an "honor system" into a structural, mathematical requirement. We achieve this zero-trust determinism through three primary architectural pillars:

### 1. KMIR (Kernel of Manifested Integrity Rules)
The deterministic heart of the SDK (`src/kmir.ts`). KMIR operates as a strict, zero-trust cryptographic gatekeeper that evaluates an AI's proposed operational parameters structurally. 
- **Zero-Trust Guardrails**: If an AI payload fails to explicitly declare vital compliance flags (`transparent_training_data: true`, `no_deepfake_manipulation: true`), or attempts prohibited logic injections (e.g., `"unconsented_faceswap"`), KMIR forcefully throws an error and instantly aborts the signature pipeline. 
- **Deterministic Rejection**: It categorically prevents biased or manipulated "bad data" from ever reaching the blockchain. Non-compliant data payloads are aggressively rejected before any authenticating cryptographic operations occur.

### 2. Merkle-Anchored Integrity
Housed within the Governance Engine (`src/governance.ts`), this is how we ensure outputs remain deterministically linked to their approved source.
- When an AI generates an output based on source material, the SDK computes a raw `SHA-256` hash directly against the physical file buffer.
- If the AI's declared `source_corpus_hash` inside its KMIR policy does not mathematically match the Governance Engine's computed physical Merkle Anchor, the SDK detects falsification ("textual drift") and outright rejects the transaction.

### 3. The Sacred Trace™
A cryptographic receipt verifying the unbroken chain of custody from the source corpus to the final AI output.
- Once an AI payload successfully passes the KMIR validation and the Merkle-Anchored source integrity checks, the SDK compiles a deterministic `SacredTraceReceipt`.
- This receipt is injected irrevocably into the final C2PA JSON `.hash.data` assertions, cryptographically signed with your private key, and permanently anchored to the smart contract—making authentically verified data immediately distinguishable from bypass attempts.

### 🌐 Real-World Example: Preventing Deepfakes in Live Broadcasts
Consider a news network transmitting live satellite video feeds. Without Human Is Kind, a malicious actor (or compromised vendor software) could intercept the feed, apply a real-time AI synthetic face-swap, and broadcast the manipulated propaganda to millions before anyone notices.

With the HIK SDK integrated directly into the broadcasting pipeline:
1. **The Root Hash**: The physical camera generates a **Merkle Anchor** for every 5-second video chunk and cryptographically signs it.
2. **Explicit Consent**: Any AI middleware touching the feed (e.g., color correction, real-time closed captioning) MUST submit a payload to the SDK's **KMIRValidator** explicitly declaring `no_deepfake_manipulation: true`.
3. **The Trap**: If a malicious deepfake model attempts to alter the feed, it faces a structural paradox. It either refuses to sign the explicit KMIR declaration (which auto-crashes the stream before it airs), or it *chooses to lie* by declaring `no_deepfake_manipulation: true`.
4. **Instant Revocation**: Because the AI was forced to lie, **The Sacred Trace** permanently binds the deepfake frames to the malicious Agent's ID and physical signature on the blockchain. Verifiers instantly detect the anomaly, drop the broadcast in milliseconds, and the network permanently burns the compromised vendor's cryptographic keys—eradicating their ability to operate civilizational infrastructure ever again.

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your PRIVATE_KEY, RPC_URL, PINATA_API_KEY, PINATA_SECRET_KEY
```

### 3. Compile Contracts

```bash
npx hardhat compile
```

### 4. Run Tests

```bash
npx hardhat test tests/test-blockchain-flow.ts
```
## 🧪 Test Without External Services (Mock Mode)

```typescript
const certificate = await signAndAnchor('./my-asset.jpg', {
  useMockIPFS: true,
  blockchain: {
    rpcUrl: 'http://localhost:8545',
    privateKey: 'your-test-key',
    contractAddress: 'YOUR_DEPLOYED_ADDRESS',
  },
  storage: {}, // required by TypeScript but unused in mock mode
});
```

## CLI Commands

### Deploy & Demo Locally (with running node)

```bash
# Terminal 1: Start local Hardhat node
npx hardhat node

# Terminal 2: Run the full SDK E2E demo (Deploys registry & registers a mock asset)
npm run demo:local

# Terminal 2 (Optional): View the certificate on the registry
npm run show-certificate:local
```

### Deploy to Polygon Amoy (Testnet)

```bash
# Ensure .env has PRIVATE_KEY and optionally POLYGON_RPC_URL
npm run demo:amoy
```

### Deploy to Polygon Mainnet

```bash
npx hardhat run scripts/demo.ts --network polygon
```

## 🚀 Next.js Fullstack Boilerplate

A complete, zero-config Next.js App Router template is included. It securely demonstrates integrating the **Governance Engine** and **KMIR Validator** rules directly into a scalable frontend and backend API.

```bash
cd examples/nextjs-boilerplate
npm install     # Install frontend dependencies
npm run dev     # Start the local development server
```
Once running, simply browse to **http://localhost:3000** to test the secure KMIR integrations.

## Project Structure

```
HumanisKind/
├── contracts/
│   └── HIKRegistry.sol      # Smart contract for manifest anchoring
├── src/
│   ├── kmir.ts              # Kernel of Manifested Integrity Rules
│   ├── governance.ts        # Merkle-Anchored Integrity & Rules of Engagement
│   ├── blockchain.ts        # ethers.js interaction with HIKRegistry
│   ├── storage.ts           # IPFS upload (Pinata / local node)
│   ├── signer.ts            # Full flow: Sign → Hash → Upload → Anchor
│   └── index.ts             # SDK exports
├── examples/
│   └── nextjs-boilerplate/  # Fullstack Next.js Integration Template
├── scripts/
│   ├── demo.ts              # Deployment & E2E SDK Demo script
│   └── show-certificate.ts  # Reads a certificate from the blockchain
├── tests/
│   └── test-blockchain-flow.ts  # E2E: Sign → Upload → Anchor → Verify
├── hardhat.config.ts
├── package.json
└── .env.example
```

## Usage

```typescript
import { signAndAnchor, verifyAsset, hashAssetFile } from "human-is-kind-sdk";

const assetPath = "/path/to/asset.jpg";
const actualHash = hashAssetFile(assetPath);

const certificate = await signAndAnchor(assetPath, {
  blockchain: {
    rpcUrl: process.env.RPC_URL!,
    privateKey: process.env.PRIVATE_KEY!,
    contractAddress: process.env.HIK_REGISTRY_ADDRESS!,
  },
  storage: {
    pinataApiKey: process.env.PINATA_API_KEY,
    pinataSecretKey: process.env.PINATA_SECRET_KEY,
    // Optional: increase timeout (ms) when pinning can be slow.
    timeoutMs: 120_000,
  },
  kmirPolicy: {
    ai_agent_id: "humaniskind-compliance-agent",
    source_corpus_hash: actualHash,
    allowed_transformations: [],
    guardrails: {
      no_deepfake_manipulation: true,
      transparent_training_data: true,
      human_in_the_loop: true
    }
  },
  agentRules: {
    agent_id: "humaniskind-compliance-agent",
    vendor: "HumanIsKind",
    compliance_flags: {
      allows_synthetic_derivatives: false,
      requires_human_verification: true,
      respects_opt_out_crawling: true
    }
  }
});

console.log(certificate);
// { localPath, manifestHash, ipfsUrl, txHash }

const verification = await verifyAsset(
  { rpcUrl, contractAddress },
  certificate.manifestHash
);
```

## 🔎 See the Certificate Object (Example Script)

A small helper script is included to read your most recently anchored certificate directly from the blockchain and print it to your console.

```bash
# Look up the certificate saved in your .env
npm run show-certificate:local
```

## HIK Certificate

After signing and anchoring, you receive:

| Field        | Description                          |
|-------------|--------------------------------------|
| `localPath` | Path to the signed asset             |
| `manifestHash` | SHA-256 hash of the manifest      |
| `ipfsUrl`   | IPFS URI (e.g. `ipfs://Qm...`)       |
| `txHash`    | Blockchain transaction hash          |

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

