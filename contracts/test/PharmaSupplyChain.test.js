const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PharmaSupplyChain", function () {
  let registry, supplyChain;
  let admin, manufacturer, carrier, hospital, auditor, unauthorized, manufacturer2;

  // Standard Hardhat Account #0 deterministic private key for cryptographic test vector
  // Address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
  const TEST_PRIVKEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
  const testWallet = new ethers.Wallet(TEST_PRIVKEY);

  const BATCH_ID = "0x4a9b6c8d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b";
  const PRODUCT_NAME = "COVID-19 mRNA Vaccine Lot B";
  const MIN_TEMP = 200; // 2.00°C
  const MAX_TEMP = 800; // 8.00°C

  /**
   * Helper function to construct canonical 78-byte payload and sign via EIP-191 personal_sign
   */
  async function signCanonicalTelemetry(signerWallet, batchId, tempScaled, latScaled, lonScaled, timestamp, nonce) {
    const encodedPayload = ethers.solidityPacked(
      ["bytes32", "int16", "int32", "int32", "uint32", "uint256"],
      [batchId, tempScaled, latScaled, lonScaled, timestamp, nonce]
    );

    const rawPayloadHash = ethers.keccak256(encodedPayload);

    // Sign the 32-byte raw hash using EIP-191 personal_sign (matches encode_defunct in Python)
    const signature = await signerWallet.signMessage(ethers.getBytes(rawPayloadHash));
    const sigComponents = ethers.Signature.from(signature);

    return {
      encodedPayload,
      rawPayloadHash,
      v: sigComponents.v,
      r: sigComponents.r,
      s: sigComponents.s,
    };
  }

  beforeEach(async function () {
    [admin, manufacturer, carrier, hospital, auditor, unauthorized, manufacturer2] = await ethers.getSigners();

    // 1. Deploy Registry
    const RegistryFactory = await ethers.getContractFactory("SupplyChainRegistry");
    registry = await RegistryFactory.deploy(admin.address);
    await registry.waitForDeployment();

    // 2. Register authorized nodes
    await registry.connect(admin).registerNode(manufacturer.address, "BioVax Pharma", await registry.MANUFACTURER_ROLE());
    await registry.connect(admin).registerNode(manufacturer2.address, "Apex Pharma", await registry.MANUFACTURER_ROLE());
    await registry.connect(admin).registerNode(carrier.address, "ColdLogix Freight", await registry.CARRIER_ROLE());
    await registry.connect(admin).registerNode(hospital.address, "Apollo Specialty Hospital", await registry.HOSPITAL_ROLE());
    await registry.connect(admin).registerNode(testWallet.address, "Test Signer Carrier", await registry.CARRIER_ROLE());

    // 3. Deploy PharmaSupplyChain
    const SupplyChainFactory = await ethers.getContractFactory("PharmaSupplyChain");
    supplyChain = await SupplyChainFactory.deploy(await registry.getAddress());
    await supplyChain.waitForDeployment();
  });

  describe("Section 1: Cryptographic Correctness & Canonical Proof", function () {
    it("should match the pre-computed 78-byte canonical payload and recover expected signer address", async function () {
      const tempScaled = 425; // 4.25°C
      const latScaled = 12971600; // 12.9716°N
      const lonScaled = 77594600; // 77.5946°E
      const timestamp = 1772798400;
      const nonce = 1042;

      const { encodedPayload, rawPayloadHash, v, r, s } = await signCanonicalTelemetry(
        testWallet,
        BATCH_ID,
        tempScaled,
        latScaled,
        lonScaled,
        timestamp,
        nonce
      );

      // Verify payload length is exactly 78 bytes (156 hex characters + '0x' = 158 length)
      expect(encodedPayload.length).to.equal(2 + 78 * 2);
      expect(rawPayloadHash).to.equal("0xf1ab697f1f9b154772c485059ab5e2ea802460192a1f6489703029d714c09dca");

      // Verify contract pure verification function recovers exact expected address
      const [recoveredSigner, contractPayloadHash] = await supplyChain.verifySignature(
        BATCH_ID,
        tempScaled,
        latScaled,
        lonScaled,
        timestamp,
        nonce,
        v,
        r,
        s
      );

      expect(contractPayloadHash).to.equal(rawPayloadHash);
      expect(recoveredSigner).to.equal(testWallet.address);
      expect(recoveredSigner).to.equal("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");
    });

    it("should reject malleable high-s signatures", async function () {
      const tempScaled = 425;
      const latScaled = 12971600;
      const lonScaled = 77594600;
      const timestamp = 1772798400;
      const nonce = 1042;

      const { v, r, s } = await signCanonicalTelemetry(
        testWallet,
        BATCH_ID,
        tempScaled,
        latScaled,
        lonScaled,
        timestamp,
        nonce
      );

      // secp256k1 group order n
      const secp256k1n = BigInt("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141");
      const highS = BigInt(secp256k1n) - BigInt(s);
      const flippedV = v === 27 ? 28 : 27;

      // High-s signature should be rejected by OpenZeppelin ECDSA library
      await expect(
        supplyChain.verifySignature(
          BATCH_ID,
          tempScaled,
          latScaled,
          lonScaled,
          timestamp,
          nonce,
          flippedV,
          r,
          ethers.toBeHex(highS, 32)
        )
      ).to.be.revertedWithCustomError(supplyChain, "ECDSAInvalidSignatureS");
    });

    it("should reject invalid v values (v != 27 and v != 28)", async function () {
      const tempScaled = 425;
      const latScaled = 12971600;
      const lonScaled = 77594600;
      const timestamp = 1772798400;
      const nonce = 1042;

      const { r, s } = await signCanonicalTelemetry(
        testWallet,
        BATCH_ID,
        tempScaled,
        latScaled,
        lonScaled,
        timestamp,
        nonce
      );

      // Invalid v = 29
      await expect(
        supplyChain.verifySignature(
          BATCH_ID,
          tempScaled,
          latScaled,
          lonScaled,
          timestamp,
          nonce,
          29,
          r,
          s
        )
      ).to.be.revertedWithCustomError(supplyChain, "ECDSAInvalidSignature");

      // Invalid v = 0
      await expect(
        supplyChain.verifySignature(
          BATCH_ID,
          tempScaled,
          latScaled,
          lonScaled,
          timestamp,
          nonce,
          0,
          r,
          s
        )
      ).to.be.revertedWithCustomError(supplyChain, "ECDSAInvalidSignature");
    });
  });

  describe("Section 2: Batch Lifecycle & Access Control", function () {
    it("should allow an authorized manufacturer to create a new batch", async function () {
      await expect(
        supplyChain.connect(manufacturer).createBatch(BATCH_ID, PRODUCT_NAME, MIN_TEMP, MAX_TEMP)
      )
        .to.emit(supplyChain, "BatchCreated")
        .withArgs(BATCH_ID, PRODUCT_NAME, manufacturer.address, MIN_TEMP, MAX_TEMP, (val) => val > 0);

      const batch = await supplyChain.getBatch(BATCH_ID);
      expect(batch.productName).to.equal(PRODUCT_NAME);
      expect(batch.currentCustodian).to.equal(manufacturer.address);
      expect(batch.status).to.equal(0); // CREATED
      expect(batch.minTempScaled).to.equal(MIN_TEMP);
      expect(batch.maxTempScaled).to.equal(MAX_TEMP);
    });

    it("should reject batch creation by unauthorized actors", async function () {
      await expect(
        supplyChain.connect(unauthorized).createBatch(BATCH_ID, PRODUCT_NAME, MIN_TEMP, MAX_TEMP)
      ).to.be.revertedWith("PharmaSupplyChain: sender must be authorized manufacturer");
    });

    it("should prevent creating duplicate batches with identical ID", async function () {
      await supplyChain.connect(manufacturer).createBatch(BATCH_ID, PRODUCT_NAME, MIN_TEMP, MAX_TEMP);
      await expect(
        supplyChain.connect(manufacturer).createBatch(BATCH_ID, "Duplicate Lot", MIN_TEMP, MAX_TEMP)
      ).to.be.revertedWith("PharmaSupplyChain: batch already exists");
    });

    it("should reject batch creation when minTemp >= maxTemp", async function () {
      await expect(
        supplyChain.connect(manufacturer).createBatch(BATCH_ID, PRODUCT_NAME, 800, 200)
      ).to.be.revertedWith("PharmaSupplyChain: min temp must be < max temp");
    });
  });

  describe("Section 3: Custody Handover (2-of-2 Multi-Sig)", function () {
    beforeEach(async function () {
      await supplyChain.connect(manufacturer).createBatch(BATCH_ID, PRODUCT_NAME, MIN_TEMP, MAX_TEMP);
    });

    it("should successfully transfer custody from Manufacturer to Carrier via dual confirmation", async function () {
      // Step 1: Manufacturer initiates handover to carrier
      await expect(supplyChain.connect(manufacturer).initiateHandover(BATCH_ID, carrier.address))
        .to.emit(supplyChain, "HandoverInitiated")
        .withArgs(BATCH_ID, manufacturer.address, carrier.address, (val) => val > 0);

      let batch = await supplyChain.getBatch(BATCH_ID);
      expect(batch.currentCustodian).to.equal(manufacturer.address);

      // Step 2: Carrier confirms receipt
      await expect(supplyChain.connect(carrier).confirmHandover(BATCH_ID, manufacturer.address))
        .to.emit(supplyChain, "CustodyTransferred")
        .withArgs(BATCH_ID, manufacturer.address, carrier.address, 1, (val) => val > 0);

      batch = await supplyChain.getBatch(BATCH_ID);
      expect(batch.currentCustodian).to.equal(carrier.address);
      expect(batch.status).to.equal(1); // IN_TRANSIT
    });

    it("should reject handover initiation to oneself", async function () {
      await expect(
        supplyChain.connect(manufacturer).initiateHandover(BATCH_ID, manufacturer.address)
      ).to.be.revertedWith("PharmaSupplyChain: invalid recipient");
    });

    it("should reject confirmation by an unintended third party", async function () {
      await supplyChain.connect(manufacturer).initiateHandover(BATCH_ID, carrier.address);

      await expect(
        supplyChain.connect(unauthorized).confirmHandover(BATCH_ID, manufacturer.address)
      ).to.be.revertedWith("PharmaSupplyChain: caller is not designated recipient");
    });

    it("should reject double confirmation of same handover", async function () {
      await supplyChain.connect(manufacturer).initiateHandover(BATCH_ID, carrier.address);
      await supplyChain.connect(carrier).confirmHandover(BATCH_ID, manufacturer.address);

      await expect(
        supplyChain.connect(carrier).confirmHandover(BATCH_ID, manufacturer.address)
      ).to.be.revertedWith("PharmaSupplyChain: no pending handover for batch");
    });

    it("should reject confirmation if recipient was revoked in registry", async function () {
      await supplyChain.connect(manufacturer).initiateHandover(BATCH_ID, carrier.address);
      // Admin deactivates carrier
      await registry.connect(admin).deactivateNode(carrier.address);

      await expect(
        supplyChain.connect(carrier).confirmHandover(BATCH_ID, manufacturer.address)
      ).to.be.revertedWith("PharmaSupplyChain: recipient is no longer an active authorized entity");
    });

    it("should complete handover to Hospital and transition batch status to DELIVERED", async function () {
      // Manufacturer -> Carrier
      await supplyChain.connect(manufacturer).initiateHandover(BATCH_ID, carrier.address);
      await supplyChain.connect(carrier).confirmHandover(BATCH_ID, manufacturer.address);

      // Carrier -> Hospital
      await supplyChain.connect(carrier).initiateHandover(BATCH_ID, hospital.address);
      await supplyChain.connect(hospital).confirmHandover(BATCH_ID, carrier.address);

      const batch = await supplyChain.getBatch(BATCH_ID);
      expect(batch.currentCustodian).to.equal(hospital.address);
      expect(batch.status).to.equal(2); // DELIVERED
    });
  });

  describe("Section 4: Telemetry Ingestion, Replay Protection & Adversarial Attacks", function () {
    let now, carrierWallet;

    beforeEach(async function () {
      await supplyChain.connect(manufacturer).createBatch(BATCH_ID, PRODUCT_NAME, MIN_TEMP, MAX_TEMP);
      await supplyChain.connect(manufacturer).initiateHandover(BATCH_ID, carrier.address);
      await supplyChain.connect(carrier).confirmHandover(BATCH_ID, manufacturer.address);

      const block = await ethers.provider.getBlock("latest");
      now = block.timestamp;

      carrierWallet = ethers.HDNodeWallet.fromMnemonic(
        ethers.Mnemonic.fromPhrase("test test test test test test test test test test test junk"),
        "m/44'/60'/0'/0/2" // Hardhat account #2 is carrier
      );
    });

    it("should accept valid signed telemetry within cold-chain limits", async function () {
      const tempScaled = 450; // 4.50°C
      const latScaled = 12971600;
      const lonScaled = 77594600;
      const nonce = 1;

      const { v, r, s } = await signCanonicalTelemetry(
        carrierWallet,
        BATCH_ID,
        tempScaled,
        latScaled,
        lonScaled,
        now,
        nonce
      );

      await expect(
        supplyChain.connect(carrier).submitSignedTelemetry(
          BATCH_ID,
          tempScaled,
          latScaled,
          lonScaled,
          now,
          nonce,
          v,
          r,
          s
        )
      )
        .to.emit(supplyChain, "TelemetryCommitted")
        .withArgs(BATCH_ID, tempScaled, latScaled, lonScaled, now, nonce, carrier.address);

      const batch = await supplyChain.getBatch(BATCH_ID);
      expect(batch.telemetryCommitCount).to.equal(1);
    });

    it("should detect MITM attack modifying temperature", async function () {
      const genuineTemp = 1250;
      const tamperedTemp = 425;
      const sig = await signCanonicalTelemetry(carrierWallet, BATCH_ID, genuineTemp, 12971600, 77594600, now, 1);

      await expect(
        supplyChain.connect(carrier).submitSignedTelemetry(
          BATCH_ID,
          tamperedTemp,
          12971600,
          77594600,
          now,
          1,
          sig.v,
          sig.r,
          sig.s
        )
      ).to.be.revertedWith("PharmaSupplyChain: INVALID_SIGNATURE (recovered signer != custodian)");
    });

    it("should detect MITM attack modifying latitude", async function () {
      const sig = await signCanonicalTelemetry(carrierWallet, BATCH_ID, 450, 12971600, 77594600, now, 1);

      await expect(
        supplyChain.connect(carrier).submitSignedTelemetry(
          BATCH_ID,
          450,
          15000000, // tampered latitude
          77594600,
          now,
          1,
          sig.v,
          sig.r,
          sig.s
        )
      ).to.be.revertedWith("PharmaSupplyChain: INVALID_SIGNATURE (recovered signer != custodian)");
    });

    it("should detect MITM attack modifying longitude", async function () {
      const sig = await signCanonicalTelemetry(carrierWallet, BATCH_ID, 450, 12971600, 77594600, now, 1);

      await expect(
        supplyChain.connect(carrier).submitSignedTelemetry(
          BATCH_ID,
          450,
          12971600,
          80000000, // tampered longitude
          now,
          1,
          sig.v,
          sig.r,
          sig.s
        )
      ).to.be.revertedWith("PharmaSupplyChain: INVALID_SIGNATURE (recovered signer != custodian)");
    });

    it("should detect MITM attack modifying timestamp", async function () {
      const sig = await signCanonicalTelemetry(carrierWallet, BATCH_ID, 450, 12971600, 77594600, now, 1);

      await expect(
        supplyChain.connect(carrier).submitSignedTelemetry(
          BATCH_ID,
          450,
          12971600,
          77594600,
          now - 10, // tampered timestamp
          1,
          sig.v,
          sig.r,
          sig.s
        )
      ).to.be.revertedWith("PharmaSupplyChain: INVALID_SIGNATURE (recovered signer != custodian)");
    });

    it("should detect MITM attack modifying nonce", async function () {
      const sig = await signCanonicalTelemetry(carrierWallet, BATCH_ID, 450, 12971600, 77594600, now, 1);

      await expect(
        supplyChain.connect(carrier).submitSignedTelemetry(
          BATCH_ID,
          450,
          12971600,
          77594600,
          now,
          2, // tampered nonce
          sig.v,
          sig.r,
          sig.s
        )
      ).to.be.revertedWith("PharmaSupplyChain: INVALID_SIGNATURE (recovered signer != custodian)");
    });

    it("should detect MITM attack modifying batchId", async function () {
      const OTHER_BATCH = "0x5b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c";
      await supplyChain.connect(manufacturer).createBatch(OTHER_BATCH, "Other Lot", MIN_TEMP, MAX_TEMP);
      await supplyChain.connect(manufacturer).initiateHandover(OTHER_BATCH, carrier.address);
      await supplyChain.connect(carrier).confirmHandover(OTHER_BATCH, manufacturer.address);

      const sig = await signCanonicalTelemetry(carrierWallet, BATCH_ID, 450, 12971600, 77594600, now, 1);

      await expect(
        supplyChain.connect(carrier).submitSignedTelemetry(
          OTHER_BATCH, // tampered batchId
          450,
          12971600,
          77594600,
          now,
          1,
          sig.v,
          sig.r,
          sig.s
        )
      ).to.be.revertedWith("PharmaSupplyChain: INVALID_SIGNATURE (recovered signer != custodian)");
    });

    it("should enforce replay protection: reject same nonce, lower nonce, and accept higher nonce", async function () {
      // 1. First submission with nonce = 10 -> succeeds
      const sig1 = await signCanonicalTelemetry(carrierWallet, BATCH_ID, 450, 12971600, 77594600, now, 10);
      await supplyChain.connect(carrier).submitSignedTelemetry(BATCH_ID, 450, 12971600, 77594600, now, 10, sig1.v, sig1.r, sig1.s);

      // 2. Replay attempt with same nonce (10) -> rejected
      await expect(
        supplyChain.connect(carrier).submitSignedTelemetry(BATCH_ID, 450, 12971600, 77594600, now, 10, sig1.v, sig1.r, sig1.s)
      ).to.be.revertedWith("PharmaSupplyChain: REPLAY_ATTACK_DETECTED (nonce must strictly increment)");

      // 3. Lower nonce attempt (9) -> rejected
      const sigLower = await signCanonicalTelemetry(carrierWallet, BATCH_ID, 450, 12971600, 77594600, now, 9);
      await expect(
        supplyChain.connect(carrier).submitSignedTelemetry(BATCH_ID, 450, 12971600, 77594600, now, 9, sigLower.v, sigLower.r, sigLower.s)
      ).to.be.revertedWith("PharmaSupplyChain: REPLAY_ATTACK_DETECTED (nonce must strictly increment)");

      // 4. Higher nonce (11) -> succeeds
      const sigHigher = await signCanonicalTelemetry(carrierWallet, BATCH_ID, 450, 12971600, 77594600, now, 11);
      await expect(
        supplyChain.connect(carrier).submitSignedTelemetry(BATCH_ID, 450, 12971600, 77594600, now, 11, sigHigher.v, sigHigher.r, sigHigher.s)
      ).to.emit(supplyChain, "TelemetryCommitted");
    });

    it("should reject telemetry with zero nonce", async function () {
      const sig = await signCanonicalTelemetry(carrierWallet, BATCH_ID, 450, 12971600, 77594600, now, 0);
      await expect(
        supplyChain.connect(carrier).submitSignedTelemetry(BATCH_ID, 450, 12971600, 77594600, now, 0, sig.v, sig.r, sig.s)
      ).to.be.revertedWith("PharmaSupplyChain: nonce must be strictly positive");
    });

    it("should reject telemetry with out-of-bounds coordinates", async function () {
      // Latitude > 90° (90_000_001)
      const sigLat = await signCanonicalTelemetry(carrierWallet, BATCH_ID, 450, 90_000_001, 77594600, now, 1);
      await expect(
        supplyChain.connect(carrier).submitSignedTelemetry(BATCH_ID, 450, 90_000_001, 77594600, now, 1, sigLat.v, sigLat.r, sigLat.s)
      ).to.be.revertedWith("PharmaSupplyChain: latitude out of bounds [-90, 90]");

      // Longitude > 180° (180_000_001)
      const sigLon = await signCanonicalTelemetry(carrierWallet, BATCH_ID, 450, 12971600, 180_000_001, now, 1);
      await expect(
        supplyChain.connect(carrier).submitSignedTelemetry(BATCH_ID, 450, 12971600, 180_000_001, now, 1, sigLon.v, sigLon.r, sigLon.s)
      ).to.be.revertedWith("PharmaSupplyChain: longitude out of bounds [-180, 180]");
    });

    it("should reject telemetry if the carrier was deactivated in registry", async function () {
      await registry.connect(admin).deactivateNode(carrier.address);

      const sig = await signCanonicalTelemetry(carrierWallet, BATCH_ID, 450, 12971600, 77594600, now, 1);
      await expect(
        supplyChain.connect(carrier).submitSignedTelemetry(BATCH_ID, 450, 12971600, 77594600, now, 1, sig.v, sig.r, sig.s)
      ).to.be.revertedWith("PharmaSupplyChain: recovered signer is not an active authorized carrier");
    });
  });

  describe("Section 5: Strict Temperature Boundaries & Autonomous Recovery", function () {
    let now, carrierWallet;

    beforeEach(async function () {
      await supplyChain.connect(manufacturer).createBatch(BATCH_ID, PRODUCT_NAME, MIN_TEMP, MAX_TEMP); // 200 to 800
      await supplyChain.connect(manufacturer).initiateHandover(BATCH_ID, carrier.address);
      await supplyChain.connect(carrier).confirmHandover(BATCH_ID, manufacturer.address);

      const block = await ethers.provider.getBlock("latest");
      now = block.timestamp;

      carrierWallet = ethers.HDNodeWallet.fromMnemonic(
        ethers.Mnemonic.fromPhrase("test test test test test test test test test test test junk"),
        "m/44'/60'/0'/0/2"
      );
    });

    it("boundary test: 199 (1.99°C) breaches minimum threshold and triggers quarantine", async function () {
      const tempScaled = 199; // Below min 200
      const sig = await signCanonicalTelemetry(carrierWallet, BATCH_ID, tempScaled, 12971600, 77594600, now, 1);

      await expect(
        supplyChain.connect(carrier).submitSignedTelemetry(BATCH_ID, tempScaled, 12971600, 77594600, now, 1, sig.v, sig.r, sig.s)
      )
        .to.emit(supplyChain, "ColdChainBreach")
        .withArgs(BATCH_ID, tempScaled, MIN_TEMP, MAX_TEMP, now, carrier.address)
        .and.to.emit(supplyChain, "ReplenishmentOrderDispatched");

      const batch = await supplyChain.getBatch(BATCH_ID);
      expect(batch.status).to.equal(3); // QUARANTINED
    });

    it("boundary test: 200 (2.00°C) is exact safe lower bound and passes", async function () {
      const tempScaled = 200; // Exact min
      const sig = await signCanonicalTelemetry(carrierWallet, BATCH_ID, tempScaled, 12971600, 77594600, now, 1);

      await expect(
        supplyChain.connect(carrier).submitSignedTelemetry(BATCH_ID, tempScaled, 12971600, 77594600, now, 1, sig.v, sig.r, sig.s)
      ).to.emit(supplyChain, "TelemetryCommitted");

      const batch = await supplyChain.getBatch(BATCH_ID);
      expect(batch.status).to.equal(1); // Still IN_TRANSIT
    });

    it("boundary test: 800 (8.00°C) is exact safe upper bound and passes", async function () {
      const tempScaled = 800; // Exact max
      const sig = await signCanonicalTelemetry(carrierWallet, BATCH_ID, tempScaled, 12971600, 77594600, now, 1);

      await expect(
        supplyChain.connect(carrier).submitSignedTelemetry(BATCH_ID, tempScaled, 12971600, 77594600, now, 1, sig.v, sig.r, sig.s)
      ).to.emit(supplyChain, "TelemetryCommitted");

      const batch = await supplyChain.getBatch(BATCH_ID);
      expect(batch.status).to.equal(1); // Still IN_TRANSIT
    });

    it("boundary test: 801 (8.01°C) breaches maximum threshold and triggers quarantine", async function () {
      const tempScaled = 801; // Above max 800
      const sig = await signCanonicalTelemetry(carrierWallet, BATCH_ID, tempScaled, 12971600, 77594600, now, 1);

      await expect(
        supplyChain.connect(carrier).submitSignedTelemetry(BATCH_ID, tempScaled, 12971600, 77594600, now, 1, sig.v, sig.r, sig.s)
      )
        .to.emit(supplyChain, "ColdChainBreach")
        .withArgs(BATCH_ID, tempScaled, MIN_TEMP, MAX_TEMP, now, carrier.address)
        .and.to.emit(supplyChain, "ReplenishmentOrderDispatched");

      const batch = await supplyChain.getBatch(BATCH_ID);
      expect(batch.status).to.equal(3); // QUARANTINED
    });

    it("should allow manufacturer to link an expedited replacement batch to a quarantined lot", async function () {
      // 1. Force quarantine via breach
      const sig = await signCanonicalTelemetry(carrierWallet, BATCH_ID, 1150, 12971600, 77594600, now, 1);
      await supplyChain.connect(carrier).submitSignedTelemetry(BATCH_ID, 1150, 12971600, 77594600, now, 1, sig.v, sig.r, sig.s);

      // 2. Manufacturer creates replacement lot
      const REP_BATCH_ID = "0x5b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c";
      await supplyChain.connect(manufacturer).createBatch(REP_BATCH_ID, "COVID-19 mRNA Replacement Lot", MIN_TEMP, MAX_TEMP);

      // 3. Link replacement
      await expect(supplyChain.connect(manufacturer).linkReplacementBatch(BATCH_ID, REP_BATCH_ID))
        .to.emit(supplyChain, "BatchReplenished")
        .withArgs(BATCH_ID, REP_BATCH_ID, (val) => val > 0);

      const batch = await supplyChain.getBatch(BATCH_ID);
      expect(batch.status).to.equal(4); // REPLENISHED
      expect(batch.replacementBatchId).to.equal(REP_BATCH_ID);
    });

    it("should reject linking replacement if caller is not the original manufacturer", async function () {
      // 1. Quarantine batch
      const sig = await signCanonicalTelemetry(carrierWallet, BATCH_ID, 1150, 12971600, 77594600, now, 1);
      await supplyChain.connect(carrier).submitSignedTelemetry(BATCH_ID, 1150, 12971600, 77594600, now, 1, sig.v, sig.r, sig.s);

      // 2. Different manufacturer creates replacement batch
      const REP_BATCH_ID = "0x5b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c";
      await supplyChain.connect(manufacturer2).createBatch(REP_BATCH_ID, "Apex Replacement Lot", MIN_TEMP, MAX_TEMP);

      // 3. Manufacturer2 tries to link to Manufacturer1's batch -> reverts
      await expect(
        supplyChain.connect(manufacturer2).linkReplacementBatch(BATCH_ID, REP_BATCH_ID)
      ).to.be.revertedWith("PharmaSupplyChain: only original manufacturer can link replacement");
    });
  });

  describe("Section 6: Invalid State Machine Transitions", function () {
    let now, carrierWallet;

    beforeEach(async function () {
      await supplyChain.connect(manufacturer).createBatch(BATCH_ID, PRODUCT_NAME, MIN_TEMP, MAX_TEMP);
      await supplyChain.connect(manufacturer).initiateHandover(BATCH_ID, carrier.address);
      await supplyChain.connect(carrier).confirmHandover(BATCH_ID, manufacturer.address);

      const block = await ethers.provider.getBlock("latest");
      now = block.timestamp;

      carrierWallet = ethers.HDNodeWallet.fromMnemonic(
        ethers.Mnemonic.fromPhrase("test test test test test test test test test test test junk"),
        "m/44'/60'/0'/0/2"
      );
    });

    it("should reject telemetry submission when batch is already QUARANTINED", async function () {
      // Breach to quarantine
      const sig1 = await signCanonicalTelemetry(carrierWallet, BATCH_ID, 1200, 12971600, 77594600, now, 1);
      await supplyChain.connect(carrier).submitSignedTelemetry(BATCH_ID, 1200, 12971600, 77594600, now, 1, sig1.v, sig1.r, sig1.s);

      // Subsequent telemetry submission -> rejected
      const sig2 = await signCanonicalTelemetry(carrierWallet, BATCH_ID, 450, 12971600, 77594600, now, 2);
      await expect(
        supplyChain.connect(carrier).submitSignedTelemetry(BATCH_ID, 450, 12971600, 77594600, now, 2, sig2.v, sig2.r, sig2.s)
      ).to.be.revertedWith("PharmaSupplyChain: telemetry only accepted for active in-transit batches");
    });

    it("should reject handover initiation on QUARANTINED batch", async function () {
      const sig1 = await signCanonicalTelemetry(carrierWallet, BATCH_ID, 1200, 12971600, 77594600, now, 1);
      await supplyChain.connect(carrier).submitSignedTelemetry(BATCH_ID, 1200, 12971600, 77594600, now, 1, sig1.v, sig1.r, sig1.s);

      await expect(
        supplyChain.connect(carrier).initiateHandover(BATCH_ID, hospital.address)
      ).to.be.revertedWith("PharmaSupplyChain: batch not eligible for handover");
    });

    it("should reject handover initiation on DELIVERED batch", async function () {
      // Deliver to hospital
      await supplyChain.connect(carrier).initiateHandover(BATCH_ID, hospital.address);
      await supplyChain.connect(hospital).confirmHandover(BATCH_ID, carrier.address);

      // Hospital attempts further handover -> rejected
      await expect(
        supplyChain.connect(hospital).initiateHandover(BATCH_ID, carrier.address)
      ).to.be.revertedWith("PharmaSupplyChain: batch not eligible for handover");
    });

    it("should reject telemetry submission on DELIVERED batch", async function () {
      await supplyChain.connect(carrier).initiateHandover(BATCH_ID, hospital.address);
      await supplyChain.connect(hospital).confirmHandover(BATCH_ID, carrier.address);

      const sig = await signCanonicalTelemetry(carrierWallet, BATCH_ID, 450, 12971600, 77594600, now, 1);
      await expect(
        supplyChain.connect(carrier).submitSignedTelemetry(BATCH_ID, 450, 12971600, 77594600, now, 1, sig.v, sig.r, sig.s)
      ).to.be.revertedWith("PharmaSupplyChain: telemetry only accepted for active in-transit batches");
    });

    it("should reject linking replacement batch to a batch that is NOT quarantined", async function () {
      const REP_BATCH_ID = "0x5b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c";
      await supplyChain.connect(manufacturer).createBatch(REP_BATCH_ID, "Replacement Lot", MIN_TEMP, MAX_TEMP);

      // Attempt linking to active IN_TRANSIT batch
      await expect(
        supplyChain.connect(manufacturer).linkReplacementBatch(BATCH_ID, REP_BATCH_ID)
      ).to.be.revertedWith("PharmaSupplyChain: batch is not quarantined");
    });
  });
});
