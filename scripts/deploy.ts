import hre from "hardhat";
import * as dotenv from "dotenv";
import { uploadToIPFS } from "../src/storage";

dotenv.config();

async function main() {
  const { ethers, network } = hre;

  const [deployer] = await ethers.getSigners();

  console.log("Deploying with:", deployer.address);
  console.log("Network:", network.name);

  // ----------------------------------------
  // 1. CREATE MANIFEST
  // ----------------------------------------
  const manifest = {
    name: "HIK Proof",
    description: "Human Is Kind registry entry",
    timestamp: new Date().toISOString(),
    version: "1.0",
  };

  // ----------------------------------------
  // 2. UPLOAD TO REAL IPFS (NO MOCK)
  // ----------------------------------------
  if (!process.env.PINATA_API_KEY || !process.env.PINATA_SECRET_KEY) {
    throw new Error("Missing Pinata credentials in .env");
  }

  console.log("\n📤 Uploading to IPFS...");

  const cid = await uploadToIPFS(manifest, {
    pinataApiKey: process.env.PINATA_API_KEY,
    pinataSecretKey: process.env.PINATA_SECRET_KEY,
  });

  console.log("✅ IPFS CID:", cid);

  const gatewayUrl = cid.replace(
    "ipfs://",
    "https://gateway.pinata.cloud/ipfs/"
  );

  console.log("🌍 View:", gatewayUrl);

  // ----------------------------------------
  // 3. DEPLOY CONTRACT
  // ----------------------------------------
  const HIKRegistry = await ethers.getContractFactory("HIKRegistry");

  console.log("\n🚀 Deploying contract...");
  const registry = await HIKRegistry.deploy();

  await registry.waitForDeployment();
  const address = await registry.getAddress();

  console.log("✅ Contract:", address);

  // ----------------------------------------
  // 4. REGISTER ASSET
  // ----------------------------------------
  const manifestHash = ethers.keccak256(
    ethers.toUtf8Bytes(JSON.stringify(manifest))
  );

  console.log("\n📝 Registering asset...");

  const tx = await registry.registerAsset(manifestHash, cid);
  await tx.wait();

  console.log("✅ Registered");

  // ----------------------------------------
  // 5. OUTPUT EVERYTHING CLEAN
  // ----------------------------------------
  console.log("\n==============================");
  console.log("📄 CERTIFICATE READY");
  console.log("==============================");

  console.log("Contract:", address);
  console.log("Hash:", manifestHash);
  console.log("CID:", cid);
  console.log("URL:", gatewayUrl);

  console.log("\n👉 Save in .env:");
  console.log(`HIK_REGISTRY_ADDRESS=${address}`);
  console.log(`HIK_LAST_HASH=${manifestHash}`);
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});