const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying HolacracyOrganizationFactory contract...");

  const Factory = await ethers.getContractFactory("HolacracyOrganizationFactory");
  const factory = await Factory.deploy();

  await factory.waitForDeployment();

  const address = await factory.getAddress();
  console.log("HolacracyOrganizationFactory deployed to:", address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 