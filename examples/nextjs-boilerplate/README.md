# 🛡️ Human Is Kind™ Governance Command Dashboard
### *A Premium Implementation of the HumanIsKind SDK*

This dashboard provides a high-fidelity "Mission Control" interface for visualizing the technical enforcement of AI safety and provenance across both static and streaming assets.

## 🚀 Key Governance Proofs

### 1. The Ethical Kernel (v1.1)
**Immutable Static Asset Anchoring**
*   **KMIR Validation:** Zero-trust cryptographic gatekeeping for hardware capture.
*   **Atomic Chain:** Full pipeline verification from local hash to **Live Pinata IPFS** and **Blockchain Anchoring**.
*   **Transparency:** Real-time visibility into Broadcaster Wallets, Merkle Hashes, and Verified Transaction IDs.

### 2. The Sequential Truth Engine (v2.0)
**Deterministic Edge Enforcement for Live Streams**
*   **CMCDv2 Telemetry HUD:** Real-time visualization of `hik-es` (Ethical Score), `hik-ps` (Provenance Depth), and Edge overhead metrics.
*   **Hardware Kill-Switch:** A deterministic response to governance violations. If the "Sequential Truth" is broken (e.g., synthetic payload injection), the system triggers a physical disconnect at the network edge in **< 1ms**.
*   **Rolling Merkle Checkpoints:** Continuous technical traces (IPFS/TX) embedded directly into the stream console for maximum transparency.

---

## 🛠️ Getting Started

### 1. Configure Environment
Ensure the following variables are set in your `.env`:
*   `PRIVATE_KEY`: A funded wallet (Hardware Enclave or Local Dev).
*   `PINATA_API_KEY` & `PINATA_SECRET_KEY`: For live IPFS anchoring.
*   `HIK_REGISTRY_ADDRESS`: The deployed Human Registry contract.

### 2. Launch Mission Control
```bash
npm install
npm run dev
```

Visit `http://localhost:3001` (or your configured port) to begin the leadership presentation.

---
*HumanIsKind shifts AI safety from an unenforceable "honor system" into a structural, mathematical requirement.*
