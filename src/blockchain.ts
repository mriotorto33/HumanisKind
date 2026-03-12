/**
 * HIK Blockchain Module
 * Interacts with HIKRegistry smart contract for immutable manifest anchoring.
 */

import { ethers, Contract, Wallet, Provider } from "ethers";

export interface BlockchainConfig {
  rpcUrl?: string;
  /** Optional: use this provider instead of creating from rpcUrl (e.g. Hardhat ethers.provider) */
  provider?: ethers.Provider;
  privateKey: string;
  contractAddress: string;
}

const HIK_REGISTRY_ABI = [
  "function registerAsset(bytes32 manifestHash, string memory ipfsUri) external",
  "function getAsset(bytes32 manifestHash) external view returns (address creator, uint256 timestamp, string memory ipfsUri)",
  "function isRegistered(bytes32 manifestHash) external view returns (bool)",
  "event AssetRegistered(bytes32 indexed manifestHash, address indexed creator, string ipfsUri, uint256 timestamp)",
];

/**
 * Creates an ethers provider from RPC URL.
 * Supports Infura, Alchemy, or any JSON-RPC endpoint.
 */
export function createProvider(rpcUrl: string): Provider {
  return new ethers.JsonRpcProvider(rpcUrl);
}

/**
 * Creates a wallet from private key for transaction signing.
 */
export function createWallet(privateKey: string, provider?: Provider): Wallet {
  return provider
    ? new ethers.Wallet(privateKey, provider)
    : new ethers.Wallet(privateKey);
}

/**
 * Gets the HIKRegistry contract instance.
 */
export function getHIKRegistryContract(
  address: string,
  signerOrProvider: Wallet | Provider
): Contract {
  return new ethers.Contract(address, HIK_REGISTRY_ABI, signerOrProvider);
}

/**
 * Anchors a manifest hash and IPFS URI to the blockchain.
 * @returns Transaction hash
 */
export async function registerAsset(
  config: BlockchainConfig,
  manifestHash: string,
  ipfsUri: string
): Promise<string> {
  const provider = config.provider ?? createProvider(config.rpcUrl!);
  const wallet = createWallet(config.privateKey, provider);
  const contract = getHIKRegistryContract(config.contractAddress, wallet);

  const hashBytes32 = manifestHash.startsWith("0x") ? manifestHash : `0x${manifestHash}`;
  const tx = await contract.registerAsset(hashBytes32, ipfsUri);
  const receipt = await tx.wait();

  return receipt?.hash ?? tx.hash;
}

/**
 * Verifies that a manifest hash is registered on-chain.
 */
export async function verifyAsset(
  config: Pick<BlockchainConfig, "rpcUrl" | "provider" | "contractAddress">,
  manifestHash: string
): Promise<{ creator: string; timestamp: bigint; ipfsUrl: string } | null> {
  const provider = config.provider ?? createProvider(config.rpcUrl!);
  const contract = getHIKRegistryContract(config.contractAddress, provider);

  const hashBytes32 = manifestHash.startsWith("0x") ? manifestHash : `0x${manifestHash}`;
  const isReg = await contract.isRegistered(hashBytes32);

  if (!isReg) return null;

  const result = await contract.getAsset(hashBytes32);
  const ipfsUri = result[2] ?? result.ipfsUri ?? "";
  return {
    creator: result[0] ?? result.creator,
    timestamp: result[1] ?? result.timestamp,
    ipfsUrl: ipfsUri,
  };
}
