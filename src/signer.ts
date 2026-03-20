import { createHash, createSign, generateKeyPairSync } from "crypto";
import { readFileSync, existsSync } from "fs";
import { keccak256, toUtf8Bytes, Wallet } from "ethers";
import stringify from "json-stable-stringify";
import type { BlockchainConfig } from "./blockchain";
import { registerAsset as anchorToBlockchain } from "./blockchain";
import type { StorageConfig } from "./storage";
import { uploadToIPFS, uploadToLocalIPFS, uploadToMockIPFS } from "./storage";

// ─────────────────────────────────────────────
// 🔐 Safe deterministic JSON stringify
// ─────────────────────────────────────────────
function safeStringify(obj: object): string {
  const result = stringify(obj);
  if (!result) throw new Error("Failed to stringify manifest");
  return result;
}

// ─────────────────────────────────────────────
// 📁 Hash actual file contents
// ─────────────────────────────────────────────
export function hashAssetFile(assetPath: string): string {
  if (!existsSync(assetPath)) {
    throw new Error(`Asset file not found: ${assetPath}`);
  }
  const fileBuffer = readFileSync(assetPath);
  return createHash("sha256").update(fileBuffer).digest("hex");
}

// ─────────────────────────────────────────────
// 🔒 Deterministic manifest hash (keccak256 for on-chain)
// ─────────────────────────────────────────────
export function hashManifest(manifest: object): string {
  const stable = safeStringify(manifest);
  return keccak256(toUtf8Bytes(stable));
}

// ─────────────────────────────────────────────
// 🔑 C2PA signing key interface
// ─────────────────────────────────────────────
export interface C2PASigningKey {
  privateKeyPem: string;
  publicKeyPem: string;
}

// ─────────────────────────────────────────────
// ✍️ Sign manifest (ES256 / COSE_Sign1 compliant)
// ─────────────────────────────────────────────
export async function signManifest(
  signingKey: C2PASigningKey,
  manifest: object
): Promise<string> {
  const stable = safeStringify(manifest);
  const payloadBytes = Buffer.from(stable, "utf8");

  const protectedHeader = safeStringify({
    alg: "ES256",
    cty: "application/c2pa",
    claim_generator: "HumanIsKind/1.0",
  });

  const sigStructure = Buffer.concat([
    Buffer.from(protectedHeader, "utf8"),
    Buffer.from("."),
    payloadBytes,
  ]);

 const sign = createSign("SHA256");
sign.update(sigStructure); // feed data

const derSignature = sign.sign(signingKey.privateKeyPem);

  // base64url encoding for C2PA
  return derSignature.toString("base64url");
}

// ─────────────────────────────────────────────
// 🔑 Generate ephemeral P-256 key pair
// ─────────────────────────────────────────────
export function generateC2PAKeyPair(): C2PASigningKey {
  const { privateKey, publicKey } = generateKeyPairSync("ec", {
    namedCurve: "P-256",
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  });

  return {
    privateKeyPem: privateKey,
    publicKeyPem: publicKey,
  };
}

// ─────────────────────────────────────────────
// 🏷️ HIK certificate interface
// ─────────────────────────────────────────────
export interface HIKCertificate {
  localPath: string;
  assetHash: string;
  manifestHash: string;
  ipfsUrl: string;
  txHash: string;
  signature: string;
  publicKeyPem: string;
}

export interface SignerConfig {
  blockchain: BlockchainConfig;
  storage: StorageConfig;
  signingKey?: C2PASigningKey;
  useLocalIPFS?: boolean;
  useMockIPFS?: boolean;
}

// ─────────────────────────────────────────────
// 🎯 Create manifest
// ─────────────────────────────────────────────
function createManifest(assetPath: string, assetHash: string): object {
  const now = new Date().toISOString();
  return {
    claim_generator: "HumanIsKind/1.0",
    created_at: now,
    assertions: [
      {
        label: "c2pa.actions.v1",
        data: {
          actions: [{ action: "c2pa.created", when: now, software_agent: "HumanIsKind-SDK" }],
        },
      },
      { label: "c2pa.hash.data", data: { alg: "sha256", value: assetHash } },
    ],
    asset_ref: assetPath,
  };
}

// ─────────────────────────────────────────────
// 🚀 Full pipeline: hash → manifest → sign → IPFS → blockchain
// ─────────────────────────────────────────────
export async function signAndAnchor(
  assetPath: string,
  config: SignerConfig
): Promise<HIKCertificate> {
  if (!config.blockchain.privateKey) throw new Error("Missing privateKey in blockchain config");

  const signingKey = config.signingKey ?? generateC2PAKeyPair();

  const assetHash = hashAssetFile(assetPath);
  const manifest = createManifest(assetPath, assetHash);
  const manifestHash = hashManifest(manifest);
  const signature = await signManifest(signingKey, manifest);

  const payload = { ...manifest, signature, publicKey: signingKey.publicKeyPem };
  let ipfsUrl: string;

  try {
    if (config.useMockIPFS) ipfsUrl = await uploadToMockIPFS(payload, manifestHash);
    else if (config.useLocalIPFS) ipfsUrl = await uploadToLocalIPFS(payload);
    else ipfsUrl = await uploadToIPFS(payload, config.storage);

    if (!ipfsUrl) throw new Error("IPFS upload returned empty URL");
  } catch (err) {
    throw new Error(`IPFS upload failed: ${(err as Error).message}`);
  }

  const txHash = await anchorToBlockchain(config.blockchain, manifestHash, ipfsUrl);

  return {
    localPath: assetPath,
    assetHash,
    manifestHash,
    ipfsUrl,
    txHash,
    signature,
    publicKeyPem: signingKey.publicKeyPem,
  };
}