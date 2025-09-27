import { ethers } from "hardhat";

async function main() {
  console.log("Deploying ROSCA Platform to Ethereum...");

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
    console.log("Deploying Mock PYUSD for testnet...");
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
  }

  console.log(`Deploying to ${isMainnet ? 'Ethereum Mainnet' : 'Ethereum Testnet'}`);
  console.log(`Using PYUSD: ${pyusdAddress}`);
  console.log(`Using KYC Verifier: ${KYC_VERIFIER}`);

  const ROSCAFactory = await ethers.getContractFactory("ROSCAFactory");
  const roscaFactory = await ROSCAFactory.deploy(pyusdAddress, KYC_VERIFIER);

  await roscaFactory.deployed();
  console.log("ROSCA Factory deployed to:", roscaFactory.address);
  
  console.log("Adding supported countries...");
  const countries = ["IN", "PH", "KE", "NG", "MX", "BR"];
  for (const country of countries) {
    const tx = await roscaFactory.addSupportedCountry(country);
    await tx.wait();
    console.log(`Added country: ${country}`);
  }
  
  console.log("\nDeployment Complete!");
  console.log("ROSCA Factory:", roscaFactory.address);
  console.log("PYUSD:", pyusdAddress);
  console.log("KYC Verifier:", KYC_VERIFIER);
  
  console.log("\nAdd to .env file:");
  console.log(`ROSCA_FACTORY_ADDRESS=${roscaFactory.address}`);
  console.log(`MOCK_PYUSD_ADDRESS=${pyusdAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});