import { ethers } from "hardhat";

async function main() {
  const FACTORY_ADDRESS = process.env.ROSCA_FACTORY_ADDRESS;
  
  if (!FACTORY_ADDRESS) {
    console.error("Please set ROSCA_FACTORY_ADDRESS in .env file");
    return;
  }

  console.log("Creating test ROSCA circle...");

  const ROSCAFactory = await ethers.getContractFactory("ROSCAFactory");
  const factory = ROSCAFactory.attach(FACTORY_ADDRESS);

  const tx = await factory.createCircle(
    ethers.utils.parseUnits("100", 6), // 100 PYUSD monthly
    5, // 5 members
    5, // 5 months duration
    "IN", // India
    18, // Min age 18
    65  // Max age 65
  );
  
  const receipt = await tx.wait();
  const event = receipt.events?.find((e: any) => e.event === "CircleCreated");
  const circleId = event?.args?.circleId;
  
  console.log("Test circle created!");
  console.log("Circle ID:", circleId?.toString());
  console.log("Transaction:", tx.hash);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});