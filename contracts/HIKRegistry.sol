// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title HIKRegistry
 * @dev Decentralized provenance registry for Human Is Kind (HIK) C2PA manifests.
 * Maps manifest hashes to creator addresses and IPFS URIs for permanent verification.
 */
contract HIKRegistry {
    struct AssetRecord {
        address creator;
        uint256 timestamp;
        string ipfsUri;
    }

    mapping(bytes32 => AssetRecord) private _assets;
    mapping(bytes32 => bool) private _registered;

    event AssetRegistered(
        bytes32 indexed manifestHash,
        address indexed creator,
        string ipfsUri,
        uint256 timestamp
    );

    error AssetAlreadyRegistered(bytes32 manifestHash);

    /**
     * @dev Registers a C2PA manifest hash with its IPFS URI.
     * @param manifestHash SHA-256 hash of the manifest JSON
     * @param ipfsUri IPFS URI (e.g., ipfs://Qm...)
     */
    function registerAsset(bytes32 manifestHash, string memory ipfsUri) external {
        if (_registered[manifestHash]) {
            revert AssetAlreadyRegistered(manifestHash);
        }

        _assets[manifestHash] = AssetRecord({
            creator: msg.sender,
            timestamp: block.timestamp,
            ipfsUri: ipfsUri
        });
        _registered[manifestHash] = true;

        emit AssetRegistered(manifestHash, msg.sender, ipfsUri, block.timestamp);
    }

    /**
     * @dev Retrieves the record for a registered manifest hash.
     */
    function getAsset(bytes32 manifestHash) external view returns (
        address creator,
        uint256 timestamp,
        string memory ipfsUri
    ) {
        require(_registered[manifestHash], "HIKRegistry: asset not registered");
        AssetRecord memory record = _assets[manifestHash];
        return (record.creator, record.timestamp, record.ipfsUri);
    }

    /**
     * @dev Checks if a manifest hash has been registered.
     */
    function isRegistered(bytes32 manifestHash) external view returns (bool) {
        return _registered[manifestHash];
    }
}
