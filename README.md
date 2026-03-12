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

## License

MIT
