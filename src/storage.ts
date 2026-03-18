/**
 * HIK Storage Module
 * Uploads C2PA manifests to IPFS via Pinata or local node.
 */

import axios from "axios";

export interface StorageConfig {
  pinataApiKey?: string;
  pinataSecretKey?: string;
  ipfsGateway?: string;
  /**
   * Timeout for IPFS requests in milliseconds.
   * Defaults to 120s (120000) to allow for slower networks.
   */
  timeoutMs?: number;
}

const DEFAULT_GATEWAY = "https://gateway.pinata.cloud/ipfs/";

/**
 * Uploads manifest JSON to IPFS using Pinata API.
 * @param manifest - Manifest object (will be JSON-stringified)
 * @param config - Pinata API credentials
 * @returns IPFS URI (e.g., ipfs://Qm...)
 */
export async function uploadToIPFS(
  manifest: object,
  config: StorageConfig
): Promise<string> {
  const { pinataApiKey, pinataSecretKey, timeoutMs } = config;

  if (!pinataApiKey || !pinataSecretKey) {
    throw new Error(
      "Pinata API credentials required. Set PINATA_API_KEY and PINATA_SECRET_KEY in .env"
    );
  }

  const timeout = timeoutMs ?? 120_000;
  const json = JSON.stringify(manifest);
  const blob = new Blob([json], { type: "application/json" });
  const formData = new FormData();
  formData.append("file", blob, "manifest.json");

  const response = await axios.post(
    "https://api.pinata.cloud/pinning/pinFileToIPFS",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
        pinata_api_key: pinataApiKey,
        pinata_secret_api_key: pinataSecretKey,
      },
      maxBodyLength: Infinity,
      timeout,
    }
  );

  const cid = response.data.IpfsHash;
  return `ipfs://${cid}`;
}

/**
 * Uploads manifest to a local IPFS node (for testing).
 * Requires IPFS daemon running with API enabled.
 */
export async function uploadToLocalIPFS(
  manifest: object,
  _config?: StorageConfig
): Promise<string> {
  const json = JSON.stringify(manifest);

  const timeout = _config?.timeoutMs ?? 120_000;
  const response = await axios.post(
    "http://127.0.0.1:5001/api/v0/add",
    json,
    {
      headers: { "Content-Type": "application/json" },
      params: { "cid-version": 1 },
      transformRequest: [(data) => data],
      timeout,
    }
  );

  const cid = response.data.Hash;
  return `ipfs://${cid}`;
}

/**
 * Mock IPFS upload for testing (no external service required).
 * Returns a deterministic fake URI based on hash.
 */
export function uploadToMockIPFS(manifest: object, manifestHash: string): string {
  return `ipfs://mock-${manifestHash.slice(0, 16)}`;
}

/**
 * Resolves IPFS URI to fetch manifest content.
 */
export async function fetchFromIPFS(
  ipfsUri: string,
  config?: StorageConfig
): Promise<object> {
  const gateway = config?.ipfsGateway ?? DEFAULT_GATEWAY;
  const cid = ipfsUri.replace("ipfs://", "");
  const url = `${gateway.replace(/\/$/, "")}/${cid}`;

  const response = await axios.get(url);
  return typeof response.data === "string"
    ? JSON.parse(response.data)
    : response.data;
}
