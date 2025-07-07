const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("HolacracyDeploymentUpdated", (m) => {
  const holacracyFactory = m.contract("HolacracyOrganizationFactory");
  
  return { holacracyFactory };
}); 