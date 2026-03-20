import { uploadToIPFS } from "./storage";
import { hashManifest, signManifest, generateC2PAKeyPair, C2PASigningKey } from "./signer";
import {
  registerAsset as registerOnChain,
  verifyAsset as verifyOnChain,
  BlockchainConfig,
} from "./blockchain";
import { Wallet } from "ethers";

export interface HIKConfig extends BlockchainConfig {
  pinataApiKey: string;
  pinataSecretKey: string;
  signingKey?: C2PASigningKey; // optional: use your own C2PA key
}

export async function register(config: HIKConfig, data: any) {
  if (!config.privateKey) throw new Error("Missing privateKey");

  const wallet = new Wallet(config.privateKey);

  // Use provided signing key or generate ephemeral one
  const signingKey = config.signingKey ?? generateC2PAKeyPair();

  // Build deterministic manifest
  const manifest = {
    ...data,
    timestamp: new Date().toISOString(),
    version: "1.0",
  };

  // 1️⃣ Hash the manifest (for blockchain / CID purposes)
  const hash = hashManifest(manifest);

  // 2️⃣ C2PA-compatible signature (base64url DER)
  const signature = await signManifest(signingKey, manifest);

  // 3️⃣ Upload to IPFS (with signature)
  const cid = await uploadToIPFS(
    { ...manifest, signature, publicKeyPem: signingKey.publicKeyPem },
    config
  );

  // 4️⃣ Register on blockchain
  const txHash = await registerOnChain(config, hash, cid);

  return {
    hash,
    cid,
    signature,
    txHash,
    publicKeyPem: signingKey.publicKeyPem, // return for offline verification
  };
}

export async function verify(config: HIKConfig, hash: string) {
  const result = await verifyOnChain(config, hash);

  if (!result) {
    return { valid: false };
  }

  return {
    valid: true,
    ...result,
  };
}