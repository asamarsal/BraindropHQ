const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();

    console.log("Deploying contracts with account:", deployer.address);
    console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());

    // Deployment configuration
    const platformWallet = deployer.address; // Use deployer as platform wallet initially
    const defaultPlatformFeePercent = 300; // 3% default fee

    console.log("\n--- Deploying RouletteGameFactory ---");
    console.log("Platform Wallet:", platformWallet);
    console.log("Default Platform Fee:", defaultPlatformFeePercent / 100, "%");

    // Deploy Factory
    const RouletteGameFactory = await hre.ethers.getContractFactory("RouletteGameFactory");
    const factory = await RouletteGameFactory.deploy(platformWallet, defaultPlatformFeePercent);

    await factory.waitForDeployment();
    const factoryAddress = await factory.getAddress();

    console.log("\n✅ RouletteGameFactory deployed to:", factoryAddress);
    console.log("\n--- Deployment Summary ---");
    console.log("Network:", hre.network.name);
    console.log("Factory Address:", factoryAddress);
    console.log("Platform Wallet:", platformWallet);
    console.log("Default Fee:", defaultPlatformFeePercent / 100, "%");

    // Save deployment info
    const deploymentInfo = {
        network: hre.network.name,
        factoryAddress: factoryAddress,
        platformWallet: platformWallet,
        defaultFeePercent: defaultPlatformFeePercent,
        deployedAt: new Date().toISOString(),
        deployer: deployer.address
    };

    console.log("\n--- Save this info ---");
    console.log(JSON.stringify(deploymentInfo, null, 2));

    // Verify on explorer (optional, for testnet/mainnet)
    if (hre.network.name !== "localhost" && hre.network.name !== "hardhat") {
        console.log("\n--- Waiting for block confirmations ---");
        await factory.deploymentTransaction().wait(5);

        console.log("\n--- Verifying contract on MantleScan ---");
        try {
            await hre.run("verify:verify", {
                address: factoryAddress,
                constructorArguments: [platformWallet, defaultPlatformFeePercent],
            });
            console.log("✅ Contract verified!");
        } catch (error) {
            console.log("⚠️ Verification failed:", error.message);
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
