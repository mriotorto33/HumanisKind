import hre from "hardhat";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
import { signAndAnchor } from "../src/index";

dotenv.config();

async function main() {
  const { network } = hre;
  // Typecast to avoid TS lint error about ethers missing from HRE
  const ethers = (hre as any).ethers;

  console.log("🌍 Network:", network.name);

  // Try to use environment private key, fallback to Hardhat account #0 for localhost
  let privateKey = process.env.PRIVATE_KEY;
  if ((!privateKey || privateKey.trim() === "0x" || privateKey.trim() === "") && network.name === "localhost") {
    privateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
  }

  if (!privateKey) {
    throw new Error("Missing PRIVATE_KEY in .env");
  }

  // 1. DEPLOY CONTRACT
  const HIKRegistry = await ethers.getContractFactory("HIKRegistry");
  console.log("\n🚀 Deploying HIKRegistry contract...");
  const registry = await HIKRegistry.deploy();
  await registry.waitForDeployment();
  const address = await registry.getAddress();
  console.log("✅ Contract deployed to:", address);

  // 2. CREATE DUMMY ASSET
  const assetPath = path.join(__dirname, "demo-asset.jpg");
  fs.writeFileSync(assetPath, "this is a dummy image for demo purposes...");
  console.log(`\n🖼️ Created dummy asset for hashing: ${assetPath}`);

  // 3. PREPARE C2PA SIGNER CONFIG
  console.log("\n📝 Running full SDK signAndAnchor flow...");
  const hasPinata = !!process.env.PINATA_API_KEY && !!process.env.PINATA_SECRET_KEY;

  if (!hasPinata) {
    console.log("⚠️ No Pinata keys found in .env, falling back to mock IPFS storage.");
  } else {
    console.log("🔗 Pinata keys found. Will upload manifest to IPFS!");
  }

  const config = {
    blockchain: {
      provider: ethers.provider,
      privateKey,
      contractAddress: address,
    },
    storage: {
      pinataApiKey: process.env.PINATA_API_KEY,
      pinataSecretKey: process.env.PINATA_SECRET_KEY,
    },
    useMockIPFS: !hasPinata,
  };

  // 4. SIGN AND ANCHOR
  console.log("⏳ Hashing, Signing (ECDSA), and Anchoring transaction...");
  const certificate = await signAndAnchor(assetPath, config as any);

  console.log("\n==================================");
  console.log("🎓 SDK CERTIFICATE SUCCESSFULLY GENERATED");
  console.log("==================================");
  console.log("Contract Address: ", address);
  console.log("Manifest Hash:    ", certificate.manifestHash);
  console.log("IPFS URI:         ", certificate.ipfsUrl);
  console.log("Transaction Hash: ", certificate.txHash);
  console.log("\nSigner Public Key:\n", certificate.publicKeyPem.trim());

  console.log("\n👉 Save these in your .env to verify later with show-certificate:local");
  console.log(`HIK_REGISTRY_ADDRESS=${address}`);
  console.log(`HIK_LAST_HASH=${certificate.manifestHash}`);

  // Cleanup
  if (fs.existsSync(assetPath)) fs.unlinkSync(assetPath);
}

main().catch((error) => {
  console.error("\n❌ Demo failed:", error);
  process.exitCode = 1;
});