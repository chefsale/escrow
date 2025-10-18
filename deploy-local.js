const MarketplaceEscrow = artifacts.require("MarketplaceEscrow");

module.exports = async function (deployer, network, accounts) {
  console.log("Deploying to network:", network);
  console.log("Available accounts:", accounts);
  
  // Use the first account as the platform wallet for development
  const platformWallet = accounts[0];
  
  console.log("Deploying MarketplaceEscrow...");
  console.log("Platform wallet:", platformWallet);
  
  await deployer.deploy(MarketplaceEscrow, platformWallet);
  
  const marketplaceEscrow = await MarketplaceEscrow.deployed();
  
  console.log("✅ MarketplaceEscrow deployed successfully!");
  console.log("Contract address:", marketplaceEscrow.address);
  console.log("Owner:", await marketplaceEscrow.owner());
  console.log("Platform wallet:", await marketplaceEscrow.platformWallet());
  console.log("Platform fee:", (await marketplaceEscrow.platformFeePercentage()).toString(), "basis points");
  console.log("Release delay:", (await marketplaceEscrow.RELEASE_DELAY()).toString(), "seconds");
  
  // Save contract address for frontend
  const fs = require('fs');
  const contractInfo = {
    address: marketplaceEscrow.address,
    network: network,
    deployedAt: new Date().toISOString()
  };
  
  fs.writeFileSync(
    'marketplace-frontend/src/contract-address.json', 
    JSON.stringify(contractInfo, null, 2)
  );
  
  console.log("📝 Contract address saved to frontend/src/contract-address.json");
  console.log("🚀 You can now start the frontend with: cd marketplace-frontend && npm start");
};
