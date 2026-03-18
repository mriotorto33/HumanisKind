import { ethers } from "hardhat";

async function main() {
  const signers = await ethers.getSigners();
  if (signers.length === 0) {
    throw new Error(
      "No signers available. Ensure you are connected to a network with unlocked accounts (e.g. run `npx hardhat node`) or set PRIVATE_KEY in .env."
    );
  }

  const deployer = signers[0];
  console.log("Deploying HIKRegistry with account:", deployer.address);

  const HIKRegistry = await ethers.getContractFactory("HIKRegistry");
  const registry = await HIKRegistry.deploy();
  await registry.waitForDeployment();

  const address = await registry.getAddress();
  console.log("HIKRegistry deployed to:", address);
  console.log("\nAdd to .env:");
  console.log(`HIK_REGISTRY_ADDRESS=${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
