import hre from "hardhat";
import { signAndAnchor } from "../src/index";

async function main() {
  // Deploy a fresh registry for this run (so we don't need env vars).
  const HIKRegistry = await hre.ethers.getContractFactory("HIKRegistry");
  const registry = await HIKRegistry.deploy();
  await registry.waitForDeployment();
  const contractAddress = await registry.getAddress();

  // Use the same default Hardhat test mnemonic as the suite does.
  const wallet = hre.ethers.Wallet.fromPhrase(
    "test test test test test test test test test test test junk"
  );

  const certificate = await signAndAnchor("./assets/test.jpg", {
    useMockIPFS: true,
    blockchain: {
      rpcUrl: "http://localhost:8545",
      privateKey: wallet.privateKey.replace("0x", ""),
      contractAddress,
    },
    storage: {},
  });

  console.log("HIK Certificate:", certificate);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
