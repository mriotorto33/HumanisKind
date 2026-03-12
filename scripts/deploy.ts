import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
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
