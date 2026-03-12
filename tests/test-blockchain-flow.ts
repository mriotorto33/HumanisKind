/**
 * End-to-end test: Sign -> Upload -> Anchor -> Verify
 * Uses Hardhat in-process network for blockchain; mock IPFS for storage.
 */

import { expect } from "chai";
import { ethers } from "hardhat";
import { signAndAnchor, verifyAsset, hashManifest } from "../src/index";

describe("HIK Blockchain Flow", function () {
  let registryAddress: string;
  let deployer: { address: string; privateKey?: string };

  before(async function () {
    // Deploy HIKRegistry to Hardhat in-process network
    const HIKRegistry = await ethers.getContractFactory("HIKRegistry");
    const registry = await HIKRegistry.deploy();
    await registry.waitForDeployment();
    registryAddress = await registry.getAddress();

    const signer = (await ethers.getSigners())[0];
    // Use default Hardhat mnemonic to derive private key for first account
    const wallet = ethers.Wallet.fromPhrase(
      "test test test test test test test test test test test junk"
    );
    deployer = {
      address: wallet.address,
      privateKey: wallet.privateKey.replace("0x", ""),
    };
  });

  it("should complete full lifecycle: Sign -> Upload -> Anchor -> Verify", async function () {
    const assetPath = "/path/to/test-asset.jpg";

    const config = {
      blockchain: {
        provider: ethers.provider,
        privateKey: deployer.privateKey!.replace("0x", ""),
        contractAddress: registryAddress,
      },
      storage: {},
      useMockIPFS: true,
    };

    // 1. Sign -> Hash -> Upload (mock) -> Anchor
    const certificate = await signAndAnchor(assetPath, config);

    expect(certificate).to.have.property("localPath", assetPath);
    expect(certificate).to.have.property("manifestHash");
    expect(certificate.manifestHash).to.match(/^[a-f0-9]{64}$/);
    expect(certificate).to.have.property("ipfsUrl");
    expect(certificate.ipfsUrl).to.match(/^ipfs:\/\/mock-/);
    expect(certificate).to.have.property("txHash");
    expect(certificate.txHash).to.match(/^0x[a-f0-9]{64}$/);

    // 2. Verify on-chain
    const verification = await verifyAsset(
      {
        provider: config.blockchain.provider,
        contractAddress: config.blockchain.contractAddress,
      },
      certificate.manifestHash
    );

    expect(verification).to.not.be.null;
    expect(verification!.creator.toLowerCase()).to.equal(
      deployer.address.toLowerCase()
    );
    expect(verification!.ipfsUrl).to.equal(certificate.ipfsUrl);
    expect(verification!.timestamp).to.be.a("bigint");
  });

  it("should reject duplicate registration of same manifest hash", async function () {
    const { registerAsset } = await import("../src/blockchain");
    const config = {
      provider: ethers.provider,
      privateKey: deployer.privateKey!.replace("0x", ""),
      contractAddress: registryAddress,
    };

    const manifestHash = "a".repeat(64);
    const ipfsUri = "ipfs://QmDuplicateTest";

    await registerAsset(config, manifestHash, ipfsUri);

    await expect(
      registerAsset(config, manifestHash, ipfsUri)
    ).to.be.rejectedWith(/AssetAlreadyRegistered|revert/);
  });

  it("should produce deterministic manifest hash", function () {
    const manifest = {
      claim_generator: "HumanIsKind/1.0",
      asset_ref: "/test.jpg",
    };
    const hash1 = hashManifest(manifest);
    const hash2 = hashManifest(manifest);
    expect(hash1).to.equal(hash2);
    expect(hash1).to.have.lengthOf(64);
    expect(hash1).to.match(/^[a-f0-9]{64}$/);
  });
});
