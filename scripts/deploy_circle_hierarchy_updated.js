const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying updated CircleHierarchy contract...");

  const CircleHierarchy = await ethers.getContractFactory("CircleHierarchy");
  const circleHierarchy = await CircleHierarchy.deploy();

  await circleHierarchy.waitForDeployment();

  const address = await circleHierarchy.getAddress();
  console.log("Updated CircleHierarchy deployed to:", address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 