const MarketplaceEscrow = artifacts.require("MarketplaceEscrow");

module.exports = async function (deployer, network, accounts) {
  // Use the first account as the platform wallet for development
  // In production, you should use a dedicated platform wallet
  const platformWallet = accounts[0];
  
  console.log("Deploying MarketplaceEscrow...");
  console.log("Platform wallet:", platformWallet);
  console.log("Network:", network);
  
  await deployer.deploy(MarketplaceEscrow, platformWallet);
  
  const marketplaceEscrow = await MarketplaceEscrow.deployed();
  
  console.log("MarketplaceEscrow deployed at:", marketplaceEscrow.address);
  console.log("Owner:", await marketplaceEscrow.owner());
  console.log("Platform wallet:", await marketplaceEscrow.platformWallet());
  console.log("Platform fee:", (await marketplaceEscrow.platformFeePercentage()).toString(), "basis points");
  console.log("Release delay:", (await marketplaceEscrow.RELEASE_DELAY()).toString(), "seconds");
};
