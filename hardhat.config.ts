import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

function normalizePrivateKey(privateKey: string): string | undefined {
  const trimmed = privateKey.trim();
  if (!trimmed) return undefined;

  const withoutPrefix = trimmed.startsWith("0x") ? trimmed.slice(2) : trimmed;
  if (!/^[0-9a-fA-F]{64}$/.test(withoutPrefix)) {
    throw new Error(
      "Invalid PRIVATE_KEY in .env: expected a 32-byte hex string (64 chars) with or without 0x prefix."
    );
  }

  return `0x${withoutPrefix}`;
}

const PRIVATE_KEY = normalizePrivateKey(process.env.PRIVATE_KEY || "");
const POLYGON_RPC_URL = process.env.POLYGON_RPC_URL || "https://polygon-rpc.com";

const config: HardhatUserConfig = {
  solidity: "0.8.20",
  paths: {
    tests: "tests",
  },
  networks: {
    hardhat: {},
    localhost: {
      url: "http://127.0.0.1:8545",
      // When running against a local Hardhat node, prefer the node's unlocked accounts
      // (set via `npx hardhat node`). Only provide a private key if explicitly configured.
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : undefined,
    },
    amoy: {
      url: "https://rpc-amoy.polygon.technology",
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : undefined,
    },
    polygon: {
      url: POLYGON_RPC_URL,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : undefined,
    },
  },
  etherscan: {
    apiKey: {
      polygon: process.env.POLYGONSCAN_API_KEY || "",
      polygonAmoy: process.env.POLYGONSCAN_API_KEY || "",
    },
  },
};

export default config;
