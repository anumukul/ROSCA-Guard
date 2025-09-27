import { ethers } from "hardhat";

async function main() {
  console.log("Deploying KYC Verifier to Celo...");
  
  // Celo Hub V2 addresses
  const CELO_MAINNET_HUB = "0xe57F4773bd9c9d8b6Cd70431117d353298B9f5BF";
  const CELO_TESTNET_HUB = "0x68c931C9a534D37aa78094877F46fE46a49F1A51";
  
  const network = await ethers.provider.getNetwork();
  const isMainnet = network.chainId === 42220;
  const hubAddress = isMainnet ? CELO_MAINNET_HUB : CELO_TESTNET_HUB;
  
  console.log(`Deploying to ${isMainnet ? 'Celo Mainnet' : 'Celo Testnet'}`);
  console.log(`Using Hub: ${hubAddress}`);

  const KYCVerifier = await ethers.getContractFactory("KYCVerifier");
  const kycVerifier = await KYCVerifier.deploy(
    hubAddress,
    1 // scope as uint256
  );

  await kycVerifier.deployed();
  console.log("KYC Verifier deployed to:", kycVerifier.address);
  
  // Get the computed scope
  const scope = await kycVerifier.getCurrentScope();
  console.log("Computed Scope:", scope.toString());
  console.log("Scope Seed:", await kycVerifier.getScopeSeed());
  
  console.log("\nNext Steps:");
  console.log("1. Go to https://tools.self.xyz/");
  console.log("2. Create verification config with:");
  console.log(`   - Contract Address: ${kycVerifier.address}`);
  console.log(`   - Scope: ${scope.toString()}`);
  console.log("3. Copy the generated config ID");
  console.log("4. Add to .env: SELF_CONFIG_ID=your_config_id");
  console.log("5. Add to .env: KYC_VERIFIER_ADDRESS=" + kycVerifier.address);
  console.log("6. Run: npm run configure:kyc");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});