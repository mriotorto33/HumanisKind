# Human Is Kind (HIK)

Blockchain-anchored provenance for C2PA manifests. Sign assets locally, store manifests on IPFS, and anchor hashes to a smart contract for permanent verification.
# SDK 🛡️

> **The Technical Infrastructure for Sacred Trace™**
> 
> Architecting 'Integrity as a Service' (IaaS) by moving AI safety from abstract theory to hard-coded, deterministic design constraints.


## Architecture

```
Asset → KMIR Policy Validation → C2PA Sign → Manifest JSON → SHA-256 Hash → IPFS Pin → Blockchain Anchor
```

## 🛡️ The Ethical Kernel (v1.1)

The HIK SDK introduces strict deterministic validation to ensure civilizational source integrity through three main components:

1. **KMIR (Kernel of Manifested Integrity Rules)**: A strict policy validator (`src/kmir.ts`) that guarantees AI behaviors meet ethical guardrails (e.g., forbidding deepfakes, ensuring transparent training data) *before* any signature can be generated.
2. **Merkle-Anchored Integrity**: The Governance Engine (`src/governance.ts`) cryptographically hashes raw source corpora to verify asset provenance and eliminate textual drift.
3. **The Sacred Trace™**: If the policy passes both engines, a cryptographic receipt is generated and permanently embedded directly into the C2PA `.hash.data` assertions on the blockchain.

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


# HumanisKind (HIK) SDK License Agreement (Version 1.0)

**Copyright (c) 2026 Martín Riotorto & Luiza Sadowska.**

## 1. Overview
This license governs the use of the HumanisKind (HIK) SDK ("The Software"). The Software is provided as "Visible Source" for the purpose of transparency in human provenance and AI ethics auditing.

## 2. Permitted Use (Non-Commercial)
You are permitted to view, download, and use The Software for:
* Personal, non-commercial projects.
* Academic research and educational purposes.
* Evaluation and integration testing (up to 30 days).

## 3. Commercial Use (Requires License)
Commercial use of The Software is strictly prohibited without a valid, paid subscription. This includes, but is not limited to:
* Integrating the SDK into a for-profit application or middleware.
* Using the SDK for internal business e-governance or provenance tracking.
* Providing paid services based on the HIK Registry.

**To obtain a Commercial License, please subscribe to a plan at: https://www.humaniskind.com**

## 4. Restrictions
* **No Redistribution:** You may not redistribute the source code or derivatives under a different license (e.g., MIT, GPL).
* **No Unofficial Contributors:** Contributions to the official repository are restricted to authorized personnel (Martín Riotorto & Luiza) to maintain the integrity of the Human Provenance standard.

## 5. Termination
Failure to comply with the terms of this license or failure to maintain a paid subscription for commercial use will result in the immediate termination of your right to use The Software.

---

*“Ensuring AI remains human-centric through transparent, ethical middleware.”*
