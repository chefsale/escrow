const { ethers } = require("hardhat");

async function main() {
  console.log("Starting deployment of MarketplaceEscrow contract...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Check deployer balance
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  if (balance < ethers.parseEther("0.01")) {
    console.error("Insufficient balance for deployment. Please add funds to your account.");
    process.exit(1);
  }

  // Set platform wallet (you can change this to your desired platform wallet)
  const platformWallet = deployer.address; // Using deployer as platform wallet for now

  console.log("Platform wallet will be set to:", platformWallet);

  // Deploy the contract
  const MarketplaceEscrow = await ethers.getContractFactory("MarketplaceEscrow");
  console.log("Deploying MarketplaceEscrow...");

  const marketplaceEscrow = await MarketplaceEscrow.deploy(platformWallet);
  await marketplaceEscrow.waitForDeployment();

  console.log("MarketplaceEscrow deployed to:", await marketplaceEscrow.getAddress());

  // Verify deployment
  console.log("\n=== Deployment Verification ===");
  console.log("Contract address:", await marketplaceEscrow.getAddress());
  console.log("Owner:", await marketplaceEscrow.owner());
  console.log("Platform wallet:", await marketplaceEscrow.platformWallet());
  console.log("Platform fee percentage:", (await marketplaceEscrow.platformFeePercentage()).toString(), "basis points");
  console.log("Release delay:", (await marketplaceEscrow.RELEASE_DELAY()).toString(), "seconds");
  console.log("Contract balance:", ethers.formatEther(await marketplaceEscrow.getContractBalance()), "ETH");

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    contractAddress: await marketplaceEscrow.getAddress(),
    deployer: deployer.address,
    platformWallet: platformWallet,
    deploymentTime: new Date().toISOString()
  };

  console.log("\n=== Deployment Information ===");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  // Instructions for verification
  console.log("\n=== Next Steps ===");
  console.log("1. Save the contract address:", await marketplaceEscrow.getAddress());
  console.log("2. Verify the contract on BaseScan:");
  console.log(`   npx hardhat verify --network ${hre.network.name} ${await marketplaceEscrow.getAddress()} "${platformWallet}"`);
  console.log("3. Update your frontend with the contract address");
  console.log("4. Test the contract functions");

  return marketplaceEscrow;
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
