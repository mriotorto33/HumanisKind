import { ethers, Contract, Wallet, Provider } from "ethers";
import { normalizeHash } from "./utils";

export interface BlockchainConfig {
  rpcUrl?: string;
  provider?: Provider;
  privateKey?: string;
  contractAddress: string;
}

const ABI = [
  "function registerAsset(bytes32 manifestHash, string ipfsUri)",
  "function getAsset(bytes32 manifestHash) view returns (address creator, uint256 timestamp, string ipfsUri)",
  "function isRegistered(bytes32 manifestHash) view returns (bool)",
];

function getProvider(config: BlockchainConfig): Provider {
  if (config.provider) return config.provider;
  if (!config.rpcUrl) throw new Error("Missing rpcUrl or provider");
  return new ethers.JsonRpcProvider(config.rpcUrl);
}

function getContract(config: BlockchainConfig, signerOrProvider: any): Contract {
  return new ethers.Contract(config.contractAddress, ABI, signerOrProvider);
}

export async function registerAsset(
  config: BlockchainConfig,
  manifestHash: string,
  ipfsUri: string
): Promise<string> {
  if (!config.privateKey) throw new Error("Missing privateKey");

  const provider = getProvider(config);
  const wallet = new Wallet(config.privateKey, provider);
  const contract = getContract(config, wallet);

  const tx = await contract.registerAsset(
    normalizeHash(manifestHash),
    ipfsUri
  );

  const receipt = await tx.wait();
  return receipt?.hash ?? tx.hash;
}

export async function verifyAsset(
  config: BlockchainConfig,
  manifestHash: string
) {
  const provider = getProvider(config);
  const contract = getContract(config, provider);

  const hash = normalizeHash(manifestHash);

  const exists = await contract.isRegistered(hash);
  if (!exists) return null;

  const { creator, timestamp, ipfsUri } = await contract.getAsset(hash);

  return {
    creator,
    timestamp,
    ipfsUrl: ipfsUri,
  };
}