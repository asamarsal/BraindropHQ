require("@nomicfoundation/hardhat-toolbox");
require('dotenv').config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    solidity: {
        version: "0.8.20",
        settings: {
            optimizer: {
                enabled: true,
                runs: 200
            }
        }
    },
    defaultNetwork: "mantleSepolia",
    networks: {
        // Mantle Mainnet
        mantle: {
            url: process.env.MANTLE_RPC || "https://rpc.mantle.xyz",
            accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
            chainId: 5000
        },
        // Mantle Sepolia Testnet (Default)
        mantleSepolia: {
            url: process.env.MANTLE_SEPOLIA_RPC || "https://rpc.sepolia.mantle.xyz",
            accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
            chainId: 5003
        },
        // Local development
        localhost: {
            url: "http://127.0.0.1:8545"
        }
    },
    paths: {
        sources: "./contracts",
        tests: "./test",
        cache: "./cache",
        artifacts: "./artifacts"
    },
    etherscan: {
        apiKey: {
            mantleSepolia: process.env.MANTLESCAN_API_KEY || "placeholder"
        },
        customChains: [
            {
                network: "mantleSepolia",
                chainId: 5003,
                urls: {
                    apiURL: "https://api-sepolia.mantlescan.xyz/api",
                    browserURL: "https://sepolia.mantlescan.xyz/"
                }
            }
        ]
    }
};
