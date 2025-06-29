const hre = require("hardhat");

async function main() {
  const address = "0x47ebB41dEE17E06488C5b6aeCB31d613833b21e4";
  const abi = [
    {
      "inputs": [
        { "internalType": "uint256", "name": "", "type": "uint256" }
      ],
      "name": "circles",
      "outputs": [
        { "internalType": "uint256", "name": "id", "type": "uint256" },
        { "internalType": "string", "name": "purpose", "type": "string" },
        { "internalType": "uint8", "name": "circleType", "type": "uint8" },
        { "internalType": "uint256", "name": "parentId", "type": "uint256" },
        { "internalType": "bool", "name": "exists", "type": "bool" }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ];

  const provider = hre.ethers.provider;
  const contract = new hre.ethers.Contract(address, abi, provider);

  const root = await contract.circles(0);
  console.log("Root circle:", root);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 