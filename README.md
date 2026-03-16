# Human Is Kind (HIK) SDK

Blockchain-anchored provenance for C2PA manifests. Sign assets locally, store manifests on IPFS, and anchor hashes to a smart contract for permanent verification.

## Architecture

```
Asset → C2PA Sign → Manifest JSON → SHA-256 Hash → IPFS Pin → Blockchain Anchor
```

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
    contractAddress: 'YOUR_DEPLOYED_ADDRESS'
  }
});
---

## CLI Commands

### Deploy Locally (with running node)

```bash
# Terminal 1: Start local Hardhat node
npx hardhat node

# Terminal 2: Deploy contract
npx hardhat run scripts/deploy.ts --network localhost
```

### Deploy to Polygon Amoy (Testnet)

```bash
# Ensure .env has PRIVATE_KEY and optionally POLYGON_RPC_URL
npx hardhat run scripts/deploy.ts --network amoy
```

### Deploy to Polygon Mainnet

```bash
npx hardhat run scripts/deploy.ts --network polygon
```

## Project Structure

```
HumanisKind/
├── contracts/
│   └── HIKRegistry.sol      # Smart contract for manifest anchoring
├── src/
│   ├── blockchain.ts        # ethers.js interaction with HIKRegistry
│   ├── storage.ts           # IPFS upload (Pinata / local node)
│   ├── signer.ts            # Full flow: Sign → Hash → Upload → Anchor
│   └── index.ts             # SDK exports
├── scripts/
│   └── deploy.ts            # Deployment script
├── tests/
│   └── test-blockchain-flow.ts  # E2E: Sign → Upload → Anchor → Verify
├── hardhat.config.ts
├── package.json
└── .env.example
```

## Usage

```typescript
import { signAndAnchor, verifyAsset } from "human-is-kind-sdk";

const certificate = await signAndAnchor("/path/to/asset.jpg", {
  blockchain: {
    rpcUrl: process.env.RPC_URL!,
    privateKey: process.env.PRIVATE_KEY!,
    contractAddress: process.env.HIK_REGISTRY_ADDRESS!,
  },
  storage: {
    pinataApiKey: process.env.PINATA_API_KEY,
    pinataSecretKey: process.env.PINATA_SECRET_KEY,
  },
});

console.log(certificate);
// { localPath, manifestHash, ipfsUrl, txHash }

const verification = await verifyAsset(
  { rpcUrl, contractAddress },
  certificate.manifestHash
);
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
