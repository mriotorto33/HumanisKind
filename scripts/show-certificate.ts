import hre from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  const { ethers } = hre;

  const contractAddress = process.env.HIK_REGISTRY_ADDRESS;
  const manifestHash = process.env.HIK_LAST_HASH;

  if (!contractAddress) {
    throw new Error("Missing HIK_REGISTRY_ADDRESS in .env");
  }

  if (!manifestHash) {
    throw new Error("Missing HIK_LAST_HASH in .env");
  }

  console.log("🔗 Contract:", contractAddress);
  console.log("🔍 Hash:", manifestHash);

  const registry = await ethers.getContractAt(
    "HIKRegistry",
    contractAddress
  );

  // 👇 SIEMPRE chequear antes
  const exists = await registry.isRegistered(manifestHash);

  if (!exists) {
    console.log("❌ Asset NOT registered");
    return;
  }

  const asset = await registry.getAsset(manifestHash);

  console.log("\n📄 CERTIFICATE");
  console.log("----------------------------");
  console.log("Creator:   ", asset.creator);
  console.log("Timestamp: ", asset.timestamp.toString());
  console.log("IPFS URI:  ", asset.ipfsUri);
}

main().catch((error) => {
  console.error("❌ Error:", error);
  process.exitCode = 1;
});