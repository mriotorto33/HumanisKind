const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

async function main() {
    const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
    const wallet = new ethers.Wallet("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", provider);

    console.log("Deploying HIKRegistry with account:", wallet.address);

    const artifactPath = path.join(__dirname, "../artifacts/contracts/HIKRegistry.sol/HIKRegistry.json");
    if (!fs.existsSync(artifactPath)) {
        throw new Error("Artifact not found. Run 'npx hardhat compile' first.");
    }
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

    const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
    const contract = await factory.deploy();
    await contract.waitForDeployment();

    const address = await contract.getAddress();
    console.log("HIKRegistry deployed to:", address);
    
    // Update .env
    const envPath = path.join(__dirname, "../.env");
    let envContent = fs.readFileSync(envPath, "utf8");
    envContent = envContent.replace(/HIK_REGISTRY_ADDRESS=.*/, `HIK_REGISTRY_ADDRESS=${address}`);
    fs.writeFileSync(envPath, envContent);
    console.log("Updated .env with new address:", address);
}

main().catch(console.error);
