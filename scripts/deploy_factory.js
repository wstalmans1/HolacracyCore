const hre = require("hardhat");

async function main() {
  const Factory = await hre.ethers.getContractFactory("HolacracyOrganizationFactory");
  const factory = await Factory.deploy();
  await factory.waitForDeployment(); // For Hardhat v2.17+ (Ethers v6)
  // If using Ethers v5 (older Hardhat), use: await factory.deployed();
  console.log("HolacracyOrganizationFactory deployed to:", await factory.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});