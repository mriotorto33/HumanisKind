import { createHash } from "crypto";
import type { BlockchainConfig } from "./blockchain";
import { registerAsset as anchorToBlockchain } from "./blockchain";
import type { StorageConfig } from "./storage";
import { keccak256, toUtf8Bytes, Wallet } from "ethers";
import stringify from "json-stable-stringify";
import {
  uploadToIPFS,
  uploadToLocalIPFS,
  uploadToMockIPFS,
} from "./storage";

/**
 * 🔐 Safe stringify (fix TS + determinismo)
 */
function safeStringify(obj: object): string {
  const result = stringify(obj);
  if (!result) throw new Error("Failed to stringify manifest");
  return result;
}

/**
 * 🔐 Deterministic hash
 */
export function hashManifest(manifest: object): string {
  const stable = safeStringify(manifest);
  return keccak256(toUtf8Bytes(stable));
}

/**
 * ✍️ Signature
 */
export async function signManifest(
  wallet: Wallet,
  manifest: object
): Promise<string> {
  const stable = safeStringify(manifest);
  return wallet.signMessage(stable);
}

export interface HIKCertificate {
  localPath: string;
  manifestHash: string;
  ipfsUrl: string;
  txHash: string;
  signature: string; // ✅ agregado
}

export interface SignerConfig {
  blockchain: BlockchainConfig;
  storage: StorageConfig;
  useLocalIPFS?: boolean;
  useMockIPFS?: boolean;
}

/**
 * 🧬 Deterministic manifest (single timestamp source)
 */
function createManifest(assetPath: string): object {
  const now = new Date().toISOString(); // ✅ UNA sola fuente

  return {
    claim_generator: "HumanIsKind/1.0",
    created_at: now,

    assertions: [
      {
        label: "c2pa.actions.v1",
        data: {
          actions: [
            {
              action: "c2pa.created",
              when: now,
              software_agent: "HumanIsKind-SDK",
            },
          ],
        },
      },
      {
        label: "c2pa.hash.data",
        data: {
          alg: "sha256",
          value: createHash("sha256").update(assetPath).digest("hex"),
        },
      },
    ],

    asset_ref: assetPath,
  };
}

/**
 * 🚀 FULL PIPELINE
 */
export async function signAndAnchor(
  assetPath: string,
  config: SignerConfig
): Promise<HIKCertificate> {
  if (!config.blockchain.privateKey) {
    throw new Error("Missing privateKey");
  }

  const wallet = new Wallet(config.blockchain.privateKey);

  // 1. Manifest
  const manifest = createManifest(assetPath);

  // 2. Hash
  const manifestHash = hashManifest(manifest);

  // 3. Signature (C2PA-style)
  const signature = await signManifest(wallet, manifest);

  const finalPayload = {
    ...manifest,
    signature,
  };

  // 4. IPFS (siempre async consistente)
  let ipfsUrl: string;

  if (config.useMockIPFS) {
    ipfsUrl = await Promise.resolve(
      uploadToMockIPFS(finalPayload, manifestHash)
    );
  } else if (config.useLocalIPFS) {
    ipfsUrl = await uploadToLocalIPFS(finalPayload, config.storage);
  } else {
    ipfsUrl = await uploadToIPFS(finalPayload, config.storage);
  }

  // 5. Blockchain
  const txHash = await anchorToBlockchain(
    config.blockchain,
    manifestHash,
    ipfsUrl
  );

  return {
    localPath: assetPath,
    manifestHash,
    ipfsUrl,
    txHash,
    signature,
  };
}