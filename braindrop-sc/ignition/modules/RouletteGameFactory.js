const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

/**
 * Deployment module for RouletteGameFactory
 * Configurable platform wallet and default fee
 */
module.exports = buildModule("RouletteGameFactory", (m) => {
    // Get deployment parameters with defaults
    const platformWallet = m.getParameter("platformWallet");
    const defaultPlatformFeePercent = m.getParameter("defaultPlatformFeePercent", 300); // Default 3%

    // Deploy the factory contract
    const factory = m.contract("RouletteGameFactory", [platformWallet, defaultPlatformFeePercent]);

    return { factory };
});
