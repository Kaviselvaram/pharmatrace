const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("=== Deploying Pharmaceutical Supply Chain Smart Contracts ===");

  const [deployer, manufacturer, carrier, hospital, auditor] = await ethers.getSigners();
  console.log(`Deployer Account: ${deployer.address}`);

  // 1. Deploy SupplyChainRegistry
  const RegistryFactory = await ethers.getContractFactory("SupplyChainRegistry");
  const registry = await RegistryFactory.deploy(deployer.address);
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log(`SupplyChainRegistry deployed to: ${registryAddress}`);

  // 2. Deploy PharmaSupplyChain
  const SupplyChainFactory = await ethers.getContractFactory("PharmaSupplyChain");
  const supplyChain = await SupplyChainFactory.deploy(registryAddress);
  await supplyChain.waitForDeployment();
  const supplyChainAddress = await supplyChain.getAddress();
  console.log(`PharmaSupplyChain deployed to: ${supplyChainAddress}`);

  // 3. Register Standard Demonstration Actors
  console.log("Registering initial authorized supply chain nodes...");
  const mfgRole = await registry.MANUFACTURER_ROLE();
  const carrierRole = await registry.CARRIER_ROLE();
  const hospitalRole = await registry.HOSPITAL_ROLE();
  const auditorRole = await registry.AUDITOR_ROLE();

  await registry.registerNode(manufacturer.address, "BioVax LifeSciences Ltd (Manufacturer)", mfgRole);
  console.log(`Registered Manufacturer: ${manufacturer.address}`);

  await registry.registerNode(carrier.address, "ColdLogix Freight Fleet (Carrier)", carrierRole);
  console.log(`Registered Carrier: ${carrier.address}`);

  await registry.registerNode(hospital.address, "Apollo Specialty Hospital (Pharmacy)", hospitalRole);
  console.log(`Registered Hospital: ${hospital.address}`);

  await registry.registerNode(auditor.address, "CDSCO Regulatory Audit Division (Auditor)", auditorRole);
  console.log(`Registered Auditor: ${auditor.address}`);

  // 3b. Seed Demonstration Batches for Live Viva
  console.log("Seeding initial demonstration pharmaceutical batches...");
  const batch1Id = "0x1111111111111111111111111111111111111111111111111111111111111111";
  const tx1 = await supplyChain.connect(manufacturer).createBatch(
    batch1Id,
    "Comirnaty mRNA COVID-19 Vaccine (2-8°C)",
    200,
    800
  );
  await tx1.wait();
  const txHandoverInit = await supplyChain.connect(manufacturer).initiateHandover(batch1Id, carrier.address);
  await txHandoverInit.wait();
  const txHandoverConf = await supplyChain.connect(carrier).confirmHandover(batch1Id, manufacturer.address);
  await txHandoverConf.wait();
  console.log(`Seeded Active In-Transit Batch #1: ${batch1Id}`);

  const batch2Id = "0x2222222222222222222222222222222222222222222222222222222222222222";
  const tx2 = await supplyChain.connect(manufacturer).createBatch(
    batch2Id,
    "Covaxin Purified Inactivated Lot B-4091",
    200,
    800
  );
  await tx2.wait();
  console.log(`Seeded Pre-Transit Created Batch #2: ${batch2Id}`);

  // 4. Save Deployment Addresses & ABIs for Backend Consumption
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const registryArtifact = await hre.artifacts.readArtifact("SupplyChainRegistry");
  const supplyChainArtifact = await hre.artifacts.readArtifact("PharmaSupplyChain");

  const deploymentData = {
    network: hre.network.name,
    chainId: hre.network.config.chainId || 31337,
    deployedAt: new Date().toISOString(),
    contracts: {
      SupplyChainRegistry: {
        address: registryAddress,
        abi: registryArtifact.abi,
      },
      PharmaSupplyChain: {
        address: supplyChainAddress,
        abi: supplyChainArtifact.abi,
      },
    },
    demoActors: {
      deployer: deployer.address,
      manufacturer: manufacturer.address,
      carrier: carrier.address,
      hospital: hospital.address,
      auditor: auditor.address,
    },
  };

  const outputPath = path.join(deploymentsDir, "local.json");
  fs.writeFileSync(outputPath, JSON.stringify(deploymentData, null, 2));
  console.log(`Deployment metadata written to: ${outputPath}`);
  console.log("=== Phase 1 Smart Contract Deployment Complete ===");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
