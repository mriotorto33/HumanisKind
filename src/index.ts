/**
 * Human Is Kind (HIK) SDK
 * Blockchain-anchored provenance for C2PA manifests.
 */

export {
  signAndAnchor,
  hashManifest,
  type HIKCertificate,
  type SignerConfig,
} from "./signer";

export {
  registerAsset,
  verifyAsset,
  createProvider,
  createWallet,
  getHIKRegistryContract,
  type BlockchainConfig,
} from "./blockchain";

export {
  uploadToIPFS,
  uploadToLocalIPFS,
  fetchFromIPFS,
  type StorageConfig,
} from "./storage";
