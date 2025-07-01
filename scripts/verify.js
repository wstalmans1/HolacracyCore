async function main() {
    const contractAddress = "0x272b742BA562752868a7fA4E30c48F965DCf91CC"; // Replace with your contract's deployed address
    
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