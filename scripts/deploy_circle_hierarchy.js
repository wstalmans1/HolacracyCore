const hre = require("hardhat");

async function main() {
  const CircleHierarchy = await hre.ethers.getContractFactory("CircleHierarchy");
  const circleHierarchy = await CircleHierarchy.deploy();
  await circleHierarchy.waitForDeployment();
  console.log("CircleHierarchy deployed to:", await circleHierarchy.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 