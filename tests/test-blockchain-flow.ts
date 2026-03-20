/**
 * End-to-end test: Sign -> Upload -> Anchor -> Verify
 * Uses Hardhat in-process network for blockchain; mock IPFS for storage.
 */

import { expect } from "chai";
import { ethers, Wallet } from "ethers";
import * as fs from "fs";
import * as path from "path";
import hre from "hardhat";
import { signAndAnchor, verifyAsset, hashManifest } from "../src/index";
import * as HIKRegistryJson from "../artifacts/contracts/HIKRegistry.sol/HIKRegistry.json";

describe("HIK Blockchain Flow", function () {
  const assetPath = path.join(__dirname, "test-asset.jpg");
  let registryAddress: string;
  let deployer: { address: string; privateKey: string };
  let provider: ethers.BrowserProvider;

  before(async function () {
    // Create a dummy asset file for testing
    fs.writeFileSync(assetPath, "dummy image content");

    // Check if hardhat-ethers is installed, use its provider to avoid nonce caching
    if ((hre as any).ethers && (hre as any).ethers.provider) {
      provider = (hre as any).ethers.provider;
    } else {
      provider = new ethers.BrowserProvider(hre.network.provider as any);
      provider.pollingInterval = 50; // VERY aggressive polling to avoid nonce caching
    }

    // Use Hardhat mnemonic for first account
    const wallet = Wallet.fromPhrase(
      "test test test test test test test test test test test junk"
    ).connect(provider);

    // Deploy HIKRegistry to network manually since ethers isn't from hardhat
    const factory = new ethers.ContractFactory(
      HIKRegistryJson.abi,
      HIKRegistryJson.bytecode,
      wallet
    );
    const registry = await factory.deploy();
    await registry.waitForDeployment?.(); // optional in ethers v6

    // Get address in ethers v6
    registryAddress = await registry.getAddress();

    deployer = {
      address: wallet.address,
      privateKey: wallet.privateKey, // 0x-prefixed
    };
  });

  after(function () {
    // Clean up dummy asset file
    if (fs.existsSync(assetPath)) {
      fs.unlinkSync(assetPath);
    }
  });

  it("should complete full lifecycle: Sign -> Upload -> Anchor -> Verify", async function () {
    const config = {
      blockchain: {
        provider: provider,
        privateKey: deployer.privateKey,
        contractAddress: registryAddress,
      },
      storage: {},
      useMockIPFS: true,
    };

    // Sign -> Hash -> Upload (mock) -> Anchor
    const certificate = await signAndAnchor(assetPath, config);

    expect(certificate).to.have.property("localPath", assetPath);
    expect(certificate).to.have.property("manifestHash");
    expect(certificate.manifestHash).to.match(/^0x[a-f0-9]{64}$/);
    expect(certificate).to.have.property("ipfsUrl");
    expect(certificate.ipfsUrl).to.match(/^ipfs:\/\/mock-/);
    expect(certificate).to.have.property("txHash");
    expect(certificate.txHash).to.match(/^0x[a-f0-9]{64}$/);

    // Verify on-chain
    const verification = await verifyAsset(
      {
        provider: config.blockchain.provider,
        contractAddress: config.blockchain.contractAddress,
      },
      certificate.manifestHash
    );

    expect(verification).to.not.be.null;
    expect(verification!.creator.toLowerCase()).to.equal(deployer.address.toLowerCase());
    expect(verification!.ipfsUrl).to.equal(certificate.ipfsUrl);
    expect(typeof verification!.timestamp).to.equal("bigint");
  });

  it("should reject duplicate registration of same manifest hash", async function () {
    const { registerAsset } = await import("../src/blockchain");

    const config = {
      provider: provider,
      privateKey: deployer.privateKey,
      contractAddress: registryAddress,
    };

    const manifestHash = "0x" + "a".repeat(64);
    const ipfsUri = "ipfs://QmDuplicateTest";

    // First registration should succeed
    await registerAsset(config, manifestHash, ipfsUri);

    // Duplicate registration should fail
    await expect(registerAsset(config, manifestHash, ipfsUri)).to.be.rejectedWith(
      /AssetAlreadyRegistered|revert/
    );
  });

  it("should produce deterministic manifest hash", function () {
    const manifest = {
      claim_generator: "HumanIsKind/1.0",
      asset_ref: "/test.jpg",
    };
    const hash1 = hashManifest(manifest);
    const hash2 = hashManifest(manifest);

    expect(hash1).to.equal(hash2);
    expect(hash1).to.match(/^0x[a-f0-9]{64}$/);
  });
});