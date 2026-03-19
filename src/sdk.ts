import { uploadToIPFS } from "./storage";
import { hashManifest, signManifest } from "./signer";
import {
  registerAsset as registerOnChain,
  verifyAsset as verifyOnChain,
  BlockchainConfig,
} from "./blockchain";
import { Wallet } from "ethers";

export interface HIKConfig extends BlockchainConfig {
  pinataApiKey: string;
  pinataSecretKey: string;
}

export async function register(config: HIKConfig, data: any) {
  if (!config.privateKey) throw new Error("Missing privateKey");

  const wallet = new Wallet(config.privateKey);

  const manifest = {
    ...data,
    timestamp: new Date().toISOString(),
    version: "1.0",
  };

  const hash = hashManifest(manifest);
  const signature = await signManifest(wallet, manifest);

  const cid = await uploadToIPFS(
    { ...manifest, signature },
    config
  );

  const txHash = await registerOnChain(config, hash, cid);

  return {
    hash,
    cid,
    signature,
    txHash,
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