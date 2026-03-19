import { ethers, network } from "hardhat";
import * as dotenv from "dotenv";
import { uploadToIPFS } from "../src/storage";

dotenv.config();

async function main() {
  const signers = await ethers.getSigners();

  if (signers.length === 0) {
    throw new Error(
      "No signers available. Run `npx hardhat node` or set PRIVATE_KEY in .env"
    );
  }

  const deployer = signers[0];
  console.log("Deploying HIKRegistry with account:", deployer.address);
  console.log("Network:", network.name);

  // Toggle between mock IPFS and real Pinata upload
  const USE_REAL_IPFS = process.env.USE_PINATA === "true";

  let cid: string;

  // Manifest payload (this will be uploaded to IPFS)
  const manifest = {
    name: "HIK Proof",
    description: "Human Is Kind registry entry",
    timestamp: new Date().toISOString(),
    version: "1.0",
  };

  if (USE_REAL_IPFS) {
    console.log("Uploading manifest to Pinata (IPFS)...");

    if (!process.env.PINATA_API_KEY || !process.env.PINATA_SECRET_KEY) {
      throw new Error(
        "Missing PINATA_API_KEY or PINATA_SECRET_KEY in .env"
      );
    }

    // Upload to IPFS via Pinata
    cid = await uploadToIPFS(manifest, {
      pinataApiKey: process.env.PINATA_API_KEY,
      pinataSecretKey: process.env.PINATA_SECRET_KEY,
    });

    console.log("IPFS upload successful. CID:", cid);
  } else {
    // Local development fallback
    console.log("Using mock IPFS CID (local development mode)");
    cid = "ipfs://mockCID";
  }

  // Get contract factory
  const HIKRegistry = await ethers.getContractFactory("HIKRegistry");

  // IMPORTANT:
  // Contract must accept CID in constructor:
  // constructor(string memory _baseURI)
  console.log("Deploying contract with baseURI:", cid);

  const registry = await HIKRegistry.deploy(cid);
  await registry.waitForDeployment();

  const address = await registry.getAddress();

  console.log("\nDeployment successful");
  console.log("Contract address:", address);
  console.log("Base URI (CID):", cid);

  console.log("\nAdd to your .env:");
  console.log(`HIK_REGISTRY_ADDRESS=${address}`);
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exitCode = 1;
});
