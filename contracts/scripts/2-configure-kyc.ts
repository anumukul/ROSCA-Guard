import { ethers } from "hardhat";

async function main() {
  const KYC_ADDRESS = process.env.KYC_VERIFIER_ADDRESS;
  const CONFIG_ID = process.env.SELF_CONFIG_ID;
  
  if (!KYC_ADDRESS || !CONFIG_ID) {
    console.error("Please set KYC_VERIFIER_ADDRESS and SELF_CONFIG_ID in .env file");
    return;
  }
  
  console.log("Configuring KYC Verifier...");
  console.log("KYC Address:", KYC_ADDRESS);
  console.log("Config ID:", CONFIG_ID);

  const KYCVerifier = await ethers.getContractFactory("KYCVerifier");
  const kycVerifier = KYCVerifier.attach(KYC_ADDRESS);

  const tx = await kycVerifier.configureContract(CONFIG_ID);
  await tx.wait();
  
  console.log("KYC Verifier configured successfully!");
  console.log("Configuration transaction:", tx.hash);
  
  const isConfigured = await kycVerifier.isContractConfigured();
  const storedConfigId = await kycVerifier.configId();
  
  console.log("Is Configured:", isConfigured);
  console.log("Stored Config ID:", storedConfigId);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});