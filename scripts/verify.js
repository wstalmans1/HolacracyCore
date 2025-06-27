async function main() {
    const contractAddress = "DEPLOYED_CONTRACT_ADDRESS"; // Replace with your contract's deployed address
    
    console.log("Verifying contract...");
    try {
        await hre.run("verify:verify", {
            address: contractAddress,
            constructorArguments: [], // HolacracyCore has no constructor arguments
        });
        console.log("Contract verified successfully");
    } catch (e) {
        if (e.message.toLowerCase().includes("already verified")) {
            console.log("Contract is already verified!");
        } else {
            console.error(e);
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 