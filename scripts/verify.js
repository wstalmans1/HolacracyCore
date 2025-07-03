async function main() {
    const contractAddress = "0xDd5c56E73B69F344AC25B7B4Ac8155778Fe13846"; // HolacracyOrganizationFactory deployed address
    
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