import { ethers } from "hardhat";

async function main() {
  const KYC_ADDRESS = process.env.KYC_VERIFIER_ADDRESS;
  const FACTORY_ADDRESS = process.env.ROSCA_FACTORY_ADDRESS;
  
  if (!KYC_ADDRESS || !FACTORY_ADDRESS) {
    console.error("Please set KYC_VERIFIER_ADDRESS and ROSCA_FACTORY_ADDRESS in .env");
    return;
  }

  console.log("Verifying cross-chain integration...");

  const KYCVerifier = await ethers.getContractFactory("KYCVerifier");
  const ROSCAFactory = await ethers.getContractFactory("ROSCAFactory");
  
  const kycVerifier = KYCVerifier.attach(KYC_ADDRESS);
  const factory = ROSCAFactory.attach(FACTORY_ADDRESS);

  const isKYCConfigured = await kycVerifier.isContractConfigured();
  const kycStats = await kycVerifier.getTotalStats();
  
  console.log("KYC Verifier Status:");
  console.log("- Configured:", isKYCConfigured);
  console.log("- Total Users:", kycStats.totalUsers.toString());
  console.log("- Scope:", kycStats.configScope.toString());

  const platformStats = await factory.getPlatformStats();
  const factoryKYC = await factory.kycVerifier();
  
  console.log("\nROSCA Platform Status:");
  console.log("- KYC Verifier Address:", factoryKYC);
  console.log("- KYC Match:", factoryKYC.toLowerCase() === KYC_ADDRESS.toLowerCase());
  console.log("- Total Circles:", platformStats.totalCircles.toString());

  console.log("\nIntegration verification complete!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});