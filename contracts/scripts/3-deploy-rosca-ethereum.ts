import { ethers } from "hardhat";

async function main() {
  console.log("Deploying Optimized ROSCA Platform to Ethereum...");

  const PYUSD_MAINNET = "0x6c3ea9036406852006290770BEdFcAbA0e23A0e8";
  const KYC_VERIFIER = process.env.KYC_VERIFIER_ADDRESS;
  
  if (!KYC_VERIFIER) {
    console.error("Please set KYC_VERIFIER_ADDRESS in .env file");
    return;
  }

  const network = await ethers.provider.getNetwork();
  const isMainnet = network.chainId === 1;
  let pyusdAddress = isMainnet ? PYUSD_MAINNET : "";
  
  if (!isMainnet) {
    console.log("Using existing Mock PYUSD from environment...");
    pyusdAddress = process.env.MOCK_PYUSD_ADDRESS || "";
    
    if (!pyusdAddress) {
      console.log("Deploying new Mock PYUSD for testnet...");
      const MockERC20 = await ethers.getContractFactory("MockERC20");
      const mockPYUSD = await MockERC20.deploy(
        "PayPal USD",
        "PYUSD",
        6,
        ethers.utils.parseUnits("1000000", 6)
      );
      await mockPYUSD.deployed();
      pyusdAddress = mockPYUSD.address;
      console.log("Mock PYUSD deployed to:", pyusdAddress);
    } else {
      console.log("Using existing Mock PYUSD:", pyusdAddress);
    }
  }

  console.log(`Deploying to ${isMainnet ? 'Ethereum Mainnet' : 'Ethereum Testnet'}`);
  console.log(`Using PYUSD: ${pyusdAddress}`);
  console.log(`Using KYC Verifier: ${KYC_VERIFIER}`);

  console.log("Deploying optimized ROSCA Factory...");
  const ROSCAFactory = await ethers.getContractFactory("ROSCAFactory");
  const roscaFactory = await ROSCAFactory.deploy(pyusdAddress, KYC_VERIFIER);
  await roscaFactory.deployed();
  console.log("Optimized ROSCA Factory deployed to:", roscaFactory.address);

  console.log("Deploying ROSCA Analytics...");
  const ROSCAAnalytics = await ethers.getContractFactory("ROSCAAnalytics");
  const roscaAnalytics = await ROSCAAnalytics.deploy(roscaFactory.address);
  await roscaAnalytics.deployed();
  console.log("ROSCA Analytics deployed to:", roscaAnalytics.address);
  
  console.log("Adding supported countries...");
  const countries = ["IN", "PH", "KE", "NG", "MX", "BR"];
  for (const country of countries) {
    const tx = await roscaFactory.addSupportedCountry(country);
    await tx.wait();
    console.log(`Added country: ${country}`);
  }
  
  console.log("\nDeployment Complete!");
  console.log("Optimized ROSCA Factory:", roscaFactory.address);
  console.log("ROSCA Analytics:", roscaAnalytics.address);
  console.log("PYUSD:", pyusdAddress);
  console.log("KYC Verifier:", KYC_VERIFIER);
  
  console.log("\nUpdate .env file with:");
  console.log(`ROSCA_FACTORY_ADDRESS=${roscaFactory.address}`);
  console.log(`ROSCA_ANALYTICS_ADDRESS=${roscaAnalytics.address}`);
  if (!process.env.MOCK_PYUSD_ADDRESS) {
    console.log(`MOCK_PYUSD_ADDRESS=${pyusdAddress}`);
  }

  console.log("\nContract sizes:");
  const factoryCode = await ethers.provider.getCode(roscaFactory.address);
  const analyticsCode = await ethers.provider.getCode(roscaAnalytics.address);
  console.log(`Factory size: ${Math.round(factoryCode.length / 2)} bytes`);
  console.log(`Analytics size: ${Math.round(analyticsCode.length / 2)} bytes`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});