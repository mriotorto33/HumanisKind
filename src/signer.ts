import {
  createHash,
  createSign,
  createVerify,
  generateKeyPairSync,
} from "crypto";
import { readFileSync, existsSync, writeFileSync } from "fs";
import { keccak256, toUtf8Bytes } from "ethers";
import stringify from "json-stable-stringify";
import type { BlockchainConfig } from "./blockchain";
import { registerAsset as anchorToBlockchain } from "./blockchain";
import type { StorageConfig } from "./storage";
import { uploadToIPFS, uploadToLocalIPFS, uploadToMockIPFS } from "./storage";
import { KMIRValidator, PolicyManifest, SacredTraceReceipt } from "./kmir";
import { GovernanceEngine, AgentRulesOfEngagement } from "./governance";

// ─────────────────────────────────────────────
// 🔐 Safe deterministic JSON stringify
// ─────────────────────────────────────────────
function safeStringify(obj: object): string {
  const result = stringify(obj);
  if (!result) throw new Error("Failed to stringify manifest");
  return result;
}

// ─────────────────────────────────────────────
// 📁 Hash actual file contents (not path string)
// ─────────────────────────────────────────────
export function hashAssetFile(assetPath: string): string {
  if (!existsSync(assetPath)) {
    throw new Error(`Asset file not found: ${assetPath}`);
  }
  const fileBuffer = readFileSync(assetPath);
  return createHash("sha256").update(fileBuffer).digest("hex");
}

// ─────────────────────────────────────────────
// 🔒 Deterministic manifest hash
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
// 💾 Persistent key loader / generator
// ─────────────────────────────────────────────
export function loadOrCreateSigningKey(
  privateKeyPath = "./hik-signing.key.pem",
  publicKeyPath = "./hik-signing.pub.pem"
): C2PASigningKey {
  const privPath = process.env.HIK_PRIVATE_KEY_PATH ?? privateKeyPath;
  const pubPath = process.env.HIK_PUBLIC_KEY_PATH ?? publicKeyPath;

  if (existsSync(privPath) && existsSync(pubPath)) {
    return {
      privateKeyPem: readFileSync(privPath, "utf8"),
      publicKeyPem: readFileSync(pubPath, "utf8"),
    };
  }

  console.log("🔑 No signing key found — generating new P-256 key pair...");
  const pair = generateC2PAKeyPair();
  writeFileSync(privPath, pair.privateKeyPem, { mode: 0o600 });
  writeFileSync(pubPath, pair.publicKeyPem);
  console.log(`✅ Keys saved:\n   private → ${privPath}\n   public  → ${pubPath}`);
  console.log("   Add HIK_PRIVATE_KEY_PATH and HIK_PUBLIC_KEY_PATH to your .env");

  return pair;
}

// ─────────────────────────────────────────────
// ✍️ Sign manifest (ES256 / C2PA COSE_Sign1)
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
  sign.update(sigStructure);
  sign.end();
  const derSignature = sign.sign(signingKey.privateKeyPem);

  return derSignature.toString("base64url");
}

// ─────────────────────────────────────────────
// 🔍 Offline certificate verification
// ─────────────────────────────────────────────
export interface VerifyResult {
  signatureValid: boolean;
  assetIntact: boolean | null;
  manifestHash: string;
  signer: string;
  error?: string;
}

export function verifySignature(
  certificate: HIKCertificate,
  assetPath?: string
): VerifyResult {
  try {
    const stable = safeStringify(certificate.manifest);
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

    const verify = createVerify("SHA256");
    verify.update(sigStructure);
    verify.end();
    const signatureValid = verify.verify(
      certificate.publicKeyPem,
      Buffer.from(certificate.signature, "base64url")
    );

    let assetIntact: boolean | null = null;
    if (assetPath) {
      assetIntact = hashAssetFile(assetPath) === certificate.assetHash;
    }

    const fingerprint = createHash("sha256")
      .update(certificate.publicKeyPem)
      .digest("hex")
      .slice(0, 20);

    return {
      signatureValid,
      assetIntact,
      manifestHash: certificate.manifestHash,
      signer: `hik:${fingerprint}`,
    };
  } catch (err) {
    return {
      signatureValid: false,
      assetIntact: null,
      manifestHash: certificate.manifestHash ?? "unknown",
      signer: "unknown",
      error: (err as Error).message,
    };
  }
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
  return { privateKeyPem: privateKey, publicKeyPem: publicKey };
}

// ─────────────────────────────────────────────
// 🏷️ HIK Certificate
// ─────────────────────────────────────────────
export interface HIKCertificate {
  localPath: string;
  assetHash: string;
  manifest: object;
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
  kmirPolicy?: PolicyManifest;
  agentRules?: AgentRulesOfEngagement;
}

// ─────────────────────────────────────────────
// 🎯 Create manifest
// ─────────────────────────────────────────────
function createManifest(assetPath: string, assetHash: string, sacredTrace?: SacredTraceReceipt): object {
  const now = new Date().toISOString();
  const assertions: any[] = [
    {
      label: "c2pa.actions.v1",
      data: {
        actions: [
          { action: "c2pa.created", when: now, software_agent: "HumanIsKind-SDK" },
        ],
      },
    },
    { label: "c2pa.hash.data", data: { alg: "sha256", value: assetHash } },
  ];

  if (sacredTrace) {
    assertions.push({
      label: "human-is-kind.kmir.v1",
      data: sacredTrace
    });
  }

  return {
    claim_generator: "HumanIsKind/1.0",
    created_at: now,
    assertions,
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
  if (!config.blockchain.privateKey) {
    throw new Error("Missing privateKey in blockchain config");
  }

  const governance = new GovernanceEngine();
  if (config.agentRules) {
    governance.certifyAgentEngagement(config.agentRules);
  }

  const signingKey = config.signingKey ?? loadOrCreateSigningKey();
  const assetHash = hashAssetFile(assetPath);

  let sacredTrace: SacredTraceReceipt | undefined;
  if (config.kmirPolicy) {
    const merkleAnchor = governance.generateMerkleAnchor(assetPath);
    if (config.kmirPolicy.source_corpus_hash !== merkleAnchor && config.kmirPolicy.source_corpus_hash !== assetHash) {
       throw new Error("Governance Violation: Policy manifest source hash does not match computed Merkle Anchor.");
    }
    const kmir = new KMIRValidator();
    sacredTrace = kmir.generateSacredTrace(config.kmirPolicy);
  }

  const manifest = createManifest(assetPath, assetHash, sacredTrace);
  const manifestHash = hashManifest(manifest);
  const signature = await signManifest(signingKey, manifest);

  const payload = { ...manifest, signature, publicKey: signingKey.publicKeyPem };

  let ipfsUrl: string;
  if (config.useMockIPFS) ipfsUrl = await uploadToMockIPFS(payload, manifestHash);
  else if (config.useLocalIPFS) ipfsUrl = await uploadToLocalIPFS(payload);
  else ipfsUrl = await uploadToIPFS(payload, config.storage);

  const txHash = await anchorToBlockchain(config.blockchain, manifestHash, ipfsUrl);

  return {
    localPath: assetPath,
    assetHash,
    manifest,
    manifestHash,
    ipfsUrl,
    txHash,
    signature,
    publicKeyPem: signingKey.publicKeyPem,
  };
}