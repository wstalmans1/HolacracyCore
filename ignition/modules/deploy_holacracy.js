const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("HolacracyDeployment", (m) => {
    const holacracyCore = m.contract("HolacracyCore");

    return { holacracyCore };
}); 