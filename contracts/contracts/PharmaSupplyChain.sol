// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./SupplyChainRegistry.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title PharmaSupplyChain
 * @notice Core smart contract orchestrating pharmaceutical batch lifecycles,
 *         two-party multi-sig handovers, on-chain ECDSA signature verification,
 *         strict cold-chain threshold compliance, and autonomous replenishment requests.
 * @dev CBS3002 Information Security Project - Kaviselvaram & Aniesh S
 */
contract PharmaSupplyChain is ReentrancyGuard {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    SupplyChainRegistry public immutable registry;

    enum BatchStatus {
        CREATED,        // 0: Genesis at Manufacturer
        IN_TRANSIT,     // 1: Custody transferred to logistics carrier
        DELIVERED,      // 2: Successfully accepted by hospital pharmacy
        QUARANTINED,    // 3: Temperature excursion or security breach detected
        REPLENISHED     // 4: Replacement batch dispatched and linked
    }

    struct Batch {
        bytes32 batchId;
        string productName;
        address manufacturer;
        address currentCustodian;
        int16 minTempScaled; // Scaled by 100 (e.g., 200 = 2.00°C)
        int16 maxTempScaled; // Scaled by 100 (e.g., 800 = 8.00°C)
        uint32 createdAt;
        BatchStatus status;
        bytes32 replacementBatchId;
        uint256 telemetryCommitCount;
    }

    struct HandoverRequest {
        address from;
        address to;
        bool pending;
        uint256 initiatedAt;
    }

    // Storage
    mapping(bytes32 => Batch) private _batches;
    bytes32[] private _batchIds;

    // batchId => HandoverRequest
    mapping(bytes32 => HandoverRequest) public activeHandovers;

    // batchId => custodianAddress => lastNonce (strictly monotonic replay protection)
    mapping(bytes32 => mapping(address => uint256)) public lastNonce;

    // Events
    event BatchCreated(
        bytes32 indexed batchId,
        string productName,
        address indexed manufacturer,
        int16 minTempScaled,
        int16 maxTempScaled,
        uint32 createdAt
    );

    event HandoverInitiated(
        bytes32 indexed batchId,
        address indexed from,
        address indexed to,
        uint256 timestamp
    );

    event CustodyTransferred(
        bytes32 indexed batchId,
        address indexed from,
        address indexed to,
        BatchStatus newStatus,
        uint256 timestamp
    );

    event TelemetryCommitted(
        bytes32 indexed batchId,
        int16 temperatureScaled,
        int32 latitudeScaled,
        int32 longitudeScaled,
        uint32 timestamp,
        uint256 nonce,
        address indexed signer
    );

    event ColdChainBreach(
        bytes32 indexed batchId,
        int16 temperatureScaled,
        int16 minAllowed,
        int16 maxAllowed,
        uint32 timestamp,
        address indexed custodian
    );

    event ReplenishmentOrderDispatched(
        bytes32 indexed originalBatchId,
        bytes32 indexed suggestedReplacementId,
        address indexed custodian,
        uint256 timestamp
    );

    event BatchReplenished(
        bytes32 indexed originalBatchId,
        bytes32 indexed replacementBatchId,
        uint256 timestamp
    );

    event TamperAttemptDetected(
        bytes32 indexed batchId,
        address indexed expectedCustodian,
        address indexed recoveredSigner,
        uint256 timestamp
    );

    modifier onlyManufacturer() {
        require(
            registry.isAuthorized(msg.sender, registry.MANUFACTURER_ROLE()),
            "PharmaSupplyChain: sender must be authorized manufacturer"
        );
        _;
    }

    modifier onlyCustodian(bytes32 batchId) {
        require(_batches[batchId].createdAt > 0, "PharmaSupplyChain: batch does not exist");
        require(
            _batches[batchId].currentCustodian == msg.sender,
            "PharmaSupplyChain: sender is not authorized custodian"
        );
        _;
    }

    constructor(address registryAddress) {
        require(registryAddress != address(0), "PharmaSupplyChain: invalid registry address");
        registry = SupplyChainRegistry(registryAddress);
    }

    /**
     * @notice Mints a new pharmaceutical lot digital twin on-chain
     */
    function createBatch(
        bytes32 batchId,
        string calldata productName,
        int16 minTempScaled,
        int16 maxTempScaled
    ) external onlyManufacturer nonReentrant {
        require(batchId != bytes32(0), "PharmaSupplyChain: invalid batchId");
        require(_batches[batchId].createdAt == 0, "PharmaSupplyChain: batch already exists");
        require(bytes(productName).length > 0, "PharmaSupplyChain: product name required");
        require(minTempScaled < maxTempScaled, "PharmaSupplyChain: min temp must be < max temp");

        _batches[batchId] = Batch({
            batchId: batchId,
            productName: productName,
            manufacturer: msg.sender,
            currentCustodian: msg.sender,
            minTempScaled: minTempScaled,
            maxTempScaled: maxTempScaled,
            createdAt: uint32(block.timestamp),
            status: BatchStatus.CREATED,
            replacementBatchId: bytes32(0),
            telemetryCommitCount: 0
        });

        _batchIds.push(batchId);

        emit BatchCreated(
            batchId,
            productName,
            msg.sender,
            minTempScaled,
            maxTempScaled,
            uint32(block.timestamp)
        );
    }

    /**
     * @notice Custody Handover Step 1: Relinquishing party initiates transfer
     */
    function initiateHandover(
        bytes32 batchId,
        address recipient
    ) external onlyCustodian(batchId) {
        Batch storage b = _batches[batchId];
        require(
            b.status == BatchStatus.CREATED || b.status == BatchStatus.IN_TRANSIT,
            "PharmaSupplyChain: batch not eligible for handover"
        );
        require(recipient != address(0) && recipient != msg.sender, "PharmaSupplyChain: invalid recipient");
        require(
            registry.isAuthorized(recipient, registry.CARRIER_ROLE()) ||
            registry.isAuthorized(recipient, registry.HOSPITAL_ROLE()),
            "PharmaSupplyChain: recipient must be authorized carrier or hospital"
        );

        activeHandovers[batchId] = HandoverRequest({
            from: msg.sender,
            to: recipient,
            pending: true,
            initiatedAt: block.timestamp
        });

        emit HandoverInitiated(batchId, msg.sender, recipient, block.timestamp);
    }

    /**
     * @notice Custody Handover Step 2: Receiving party counter-signs and completes transfer (2-of-2 multi-sig)
     */
    function confirmHandover(bytes32 batchId, address sender) external nonReentrant {
        HandoverRequest memory req = activeHandovers[batchId];
        require(req.pending, "PharmaSupplyChain: no pending handover for batch");
        require(req.to == msg.sender, "PharmaSupplyChain: caller is not designated recipient");
        require(req.from == sender, "PharmaSupplyChain: sender address mismatch");

        Batch storage b = _batches[batchId];
        require(
            b.status == BatchStatus.CREATED || b.status == BatchStatus.IN_TRANSIT,
            "PharmaSupplyChain: invalid batch status for transfer"
        );
        require(
            registry.isAuthorized(msg.sender, registry.CARRIER_ROLE()) ||
            registry.isAuthorized(msg.sender, registry.HOSPITAL_ROLE()),
            "PharmaSupplyChain: recipient is no longer an active authorized entity"
        );

        // Transition state machine
        BatchStatus newStatus;
        if (registry.isAuthorized(msg.sender, registry.HOSPITAL_ROLE())) {
            newStatus = BatchStatus.DELIVERED;
        } else {
            newStatus = BatchStatus.IN_TRANSIT;
        }

        b.currentCustodian = msg.sender;
        b.status = newStatus;
        delete activeHandovers[batchId];

        emit CustodyTransferred(batchId, sender, msg.sender, newStatus, block.timestamp);
    }

    /**
     * @notice Pure helper to reconstruct canonical Keccak-256 and recover signer via EIP-191
     */
    function verifySignature(
        bytes32 batchId,
        int16 temperatureScaled,
        int32 latitudeScaled,
        int32 longitudeScaled,
        uint32 timestamp,
        uint256 nonce,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public pure returns (address recoveredSigner, bytes32 rawPayloadHash) {
        // Strict 78-byte canonical payload:
        // bytes32(32) + int16(2) + int32(4) + int32(4) + uint32(4) + uint256(32) = 78 bytes
        bytes memory payload = abi.encodePacked(
            batchId,
            temperatureScaled,
            latitudeScaled,
            longitudeScaled,
            timestamp,
            nonce
        );

        rawPayloadHash = keccak256(payload);
        bytes32 ethSignedMessageHash = rawPayloadHash.toEthSignedMessageHash();

        recoveredSigner = ECDSA.recover(ethSignedMessageHash, v, r, s);
        require(recoveredSigner != address(0), "PharmaSupplyChain: invalid signature format");
    }

    /**
     * @notice Ingests cryptographically signed telemetry, verifies origin via ecrecover,
     *         and validates threshold compliance.
     */
    function submitSignedTelemetry(
        bytes32 batchId,
        int16 temperatureScaled,
        int32 latitudeScaled,
        int32 longitudeScaled,
        uint32 timestamp,
        uint256 nonce,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external nonReentrant returns (bool isCompliant) {
        Batch storage b = _batches[batchId];
        require(b.createdAt > 0, "PharmaSupplyChain: batch does not exist");
        require(
            b.status == BatchStatus.IN_TRANSIT,
            "PharmaSupplyChain: telemetry only accepted for active in-transit batches"
        );

        // 1. Validate Coordinate and Nonce Boundaries
        require(latitudeScaled >= -90_000_000 && latitudeScaled <= 90_000_000, "PharmaSupplyChain: latitude out of bounds [-90, 90]");
        require(longitudeScaled >= -180_000_000 && longitudeScaled <= 180_000_000, "PharmaSupplyChain: longitude out of bounds [-180, 180]");
        require(nonce > 0, "PharmaSupplyChain: nonce must be strictly positive");

        // 2. Recover Signer & Validate Signature Authenticity
        (address recoveredSigner, ) = verifySignature(
            batchId,
            temperatureScaled,
            latitudeScaled,
            longitudeScaled,
            timestamp,
            nonce,
            v,
            r,
            s
        );

        if (recoveredSigner != b.currentCustodian) {
            emit TamperAttemptDetected(batchId, b.currentCustodian, recoveredSigner, block.timestamp);
            revert("PharmaSupplyChain: INVALID_SIGNATURE (recovered signer != custodian)");
        }

        require(
            registry.isAuthorized(recoveredSigner, registry.CARRIER_ROLE()),
            "PharmaSupplyChain: recovered signer is not an active authorized carrier"
        );

        // 3. Replay Protection: Nonce must be strictly monotonic
        require(
            nonce > lastNonce[batchId][recoveredSigner],
            "PharmaSupplyChain: REPLAY_ATTACK_DETECTED (nonce must strictly increment)"
        );
        lastNonce[batchId][recoveredSigner] = nonce;

        // 4. Timestamp Clock-Drift Validation (within 1 hour in past, 60s in future)
        require(timestamp <= block.timestamp + 60, "PharmaSupplyChain: future timestamp not allowed");
        require(timestamp >= block.timestamp - 3600, "PharmaSupplyChain: timestamp too stale");

        // 4. Threshold Compliance Evaluation
        if (temperatureScaled < b.minTempScaled || temperatureScaled > b.maxTempScaled) {
            // Cold-Chain Threshold Breached!
            b.status = BatchStatus.QUARANTINED;

            emit ColdChainBreach(
                batchId,
                temperatureScaled,
                b.minTempScaled,
                b.maxTempScaled,
                timestamp,
                recoveredSigner
            );

            // Autonomous Digital Recovery: Trigger replenishment request event
            bytes32 suggestedRepId = keccak256(abi.encodePacked(batchId, block.timestamp, nonce));
            emit ReplenishmentOrderDispatched(batchId, suggestedRepId, recoveredSigner, block.timestamp);

            return false;
        }

        // Nominal Telemetry Accepted
        b.telemetryCommitCount++;
        emit TelemetryCommitted(
            batchId,
            temperatureScaled,
            latitudeScaled,
            longitudeScaled,
            timestamp,
            nonce,
            recoveredSigner
        );

        return true;
    }

    /**
     * @notice Registers an expedited replacement lot linked to a quarantined lot
     */
    function linkReplacementBatch(
        bytes32 originalBatchId,
        bytes32 replacementBatchId
    ) external onlyManufacturer nonReentrant {
        Batch storage orig = _batches[originalBatchId];
        require(orig.createdAt > 0, "PharmaSupplyChain: original batch does not exist");
        require(orig.status == BatchStatus.QUARANTINED, "PharmaSupplyChain: batch is not quarantined");
        require(orig.manufacturer == msg.sender, "PharmaSupplyChain: only original manufacturer can link replacement");
        require(_batches[replacementBatchId].createdAt > 0, "PharmaSupplyChain: replacement batch does not exist");
        require(_batches[replacementBatchId].manufacturer == msg.sender, "PharmaSupplyChain: replacement must belong to same manufacturer");

        orig.status = BatchStatus.REPLENISHED;
        orig.replacementBatchId = replacementBatchId;

        emit BatchReplenished(originalBatchId, replacementBatchId, block.timestamp);
    }

    /**
     * @notice Retrieve full batch data
     */
    function getBatch(bytes32 batchId) external view returns (Batch memory) {
        require(_batches[batchId].createdAt > 0, "PharmaSupplyChain: batch does not exist");
        return _batches[batchId];
    }

    /**
     * @notice Total registered batches count
     */
    function totalBatches() external view returns (uint256) {
        return _batchIds.length;
    }

    /**
     * @notice Get all batch IDs
     */
    function getAllBatchIds() external view returns (bytes32[] memory) {
        return _batchIds;
    }
}
