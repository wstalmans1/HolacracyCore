const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying updated HolacracyOrganizationFactory contract...");

  const HolacracyOrganizationFactory = await ethers.getContractFactory("HolacracyOrganizationFactory");
  const factory = await HolacracyOrganizationFactory.deploy();

  await factory.waitForDeployment();
  const address = await factory.getAddress();

  console.log("Updated HolacracyOrganizationFactory deployed to:", address);
  
  // Get network info
  const network = await ethers.provider.getNetwork();
  console.log("Network:", network.name);
  
  // Verify the contract on Etherscan
  if (network.name !== "hardhat" && network.name !== "localhost") {
    console.log("Waiting for block confirmations...");
    await factory.deploymentTransaction().wait(6);
    
    try {
      const hre = require("hardhat");
      await hre.run("verify:verify", {
        address: address,
        constructorArguments: [],
      });
      console.log("Contract verified on Etherscan");
    } catch (error) {
      console.log("Verification failed:", error.message);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 