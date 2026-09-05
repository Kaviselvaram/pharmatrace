const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SupplyChainRegistry", function () {
  let registry;
  let admin, manufacturer, carrier, hospital, auditor, unauthorized;

  beforeEach(async function () {
    [admin, manufacturer, carrier, hospital, auditor, unauthorized] = await ethers.getSigners();

    const RegistryFactory = await ethers.getContractFactory("SupplyChainRegistry");
    registry = await RegistryFactory.deploy(admin.address);
    await registry.waitForDeployment();
  });

  describe("Role Initialization & Administration", function () {
    it("should set deployer as DEFAULT_ADMIN_ROLE", async function () {
      const adminRole = await registry.DEFAULT_ADMIN_ROLE();
      expect(await registry.hasRole(adminRole, admin.address)).to.be.true;
      expect(await registry.hasRole(adminRole, unauthorized.address)).to.be.false;
    });

    it("should allow admin to register authorized nodes", async function () {
      const mfgRole = await registry.MANUFACTURER_ROLE();
      await expect(registry.connect(admin).registerNode(manufacturer.address, "BioVax Pharma", mfgRole))
        .to.emit(registry, "NodeRegistered")
        .withArgs(manufacturer.address, "BioVax Pharma", mfgRole);

      expect(await registry.isAuthorized(manufacturer.address, mfgRole)).to.be.true;

      const nodeInfo = await registry.getNode(manufacturer.address);
      expect(nodeInfo.organizationName).to.equal("BioVax Pharma");
      expect(nodeInfo.isActive).to.be.true;
    });

    it("should reject node registration by non-admin accounts", async function () {
      const carrierRole = await registry.CARRIER_ROLE();
      await expect(
        registry.connect(unauthorized).registerNode(carrier.address, "ColdLogix Freight", carrierRole)
      ).to.be.revertedWithCustomError(registry, "AccessControlUnauthorizedAccount");
    });

    it("should allow admin to deactivate a node and revoke its role", async function () {
      const carrierRole = await registry.CARRIER_ROLE();
      await registry.connect(admin).registerNode(carrier.address, "ColdLogix Freight", carrierRole);
      expect(await registry.isAuthorized(carrier.address, carrierRole)).to.be.true;

      await expect(registry.connect(admin).deactivateNode(carrier.address))
        .to.emit(registry, "NodeDeactivated")
        .withArgs(carrier.address);

      expect(await registry.isAuthorized(carrier.address, carrierRole)).to.be.false;
      const nodeInfo = await registry.getNode(carrier.address);
      expect(nodeInfo.isActive).to.be.false;
    });
  });
});
