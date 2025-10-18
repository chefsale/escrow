const { ethers } = require("hardhat");

async function main() {
  const contractAddress = process.env.CONTRACT_ADDRESS;
  
  if (!contractAddress) {
    console.error("Please set CONTRACT_ADDRESS environment variable");
    process.exit(1);
  }

  console.log("Checking MarketplaceEscrow contract status...");
  console.log("Contract Address:", contractAddress);
  console.log("Network:", hre.network.name);
  console.log("");

  try {
    // Get contract instance
    const MarketplaceEscrow = await ethers.getContractFactory("MarketplaceEscrow");
    const contract = MarketplaceEscrow.attach(contractAddress);

    // Get basic contract info
    console.log("=== Contract Information ===");
    console.log("Owner:", await contract.owner());
    console.log("Platform Wallet:", await contract.platformWallet());
    console.log("Platform Fee:", (await contract.platformFeePercentage()).toString(), "basis points");
    console.log("Release Delay:", (await contract.RELEASE_DELAY()).toString(), "seconds");
    console.log("Paused:", await contract.paused());
    console.log("");

    // Get contract balance
    console.log("=== Contract Balance ===");
    const balance = await contract.getContractBalance();
    console.log("ETH Balance:", ethers.utils.formatEther(balance), "ETH");
    console.log("");

    // Get platform fees
    console.log("=== Platform Fees ===");
    const totalFees = await contract.totalPlatformFees();
    console.log("Total Platform Fees:", ethers.utils.formatEther(totalFees), "ETH");
    console.log("");

    // Get next escrow ID
    console.log("=== Escrow Statistics ===");
    const nextEscrowId = await contract.nextEscrowId();
    console.log("Next Escrow ID:", nextEscrowId.toString());
    console.log("Total Escrow Payments:", (nextEscrowId - 1).toString());
    console.log("");

    // Check recent escrow payments
    if (nextEscrowId.gt(1)) {
      console.log("=== Recent Escrow Payments ===");
      const recentCount = Math.min(5, nextEscrowId.toNumber() - 1);
      
      for (let i = 1; i <= recentCount; i++) {
        try {
          const payment = await contract.getEscrowPayment(i);
          console.log(`Escrow #${i}:`);
          console.log(`  Buyer: ${payment.buyer}`);
          console.log(`  Seller: ${payment.seller}`);
          console.log(`  Amount: ${ethers.utils.formatEther(payment.amount)} ETH`);
          console.log(`  Item: ${payment.itemDescription}`);
          console.log(`  Created: ${new Date(payment.createdAt * 1000).toLocaleString()}`);
          console.log(`  Release Time: ${new Date(payment.releaseTime * 1000).toLocaleString()}`);
          console.log(`  Status: ${payment.isReleased ? 'Released' : payment.isRefunded ? 'Refunded' : payment.isBlocked ? 'Blocked' : 'Active'}`);
          if (payment.isBlocked) {
            console.log(`  Block Reason: ${payment.blockReason}`);
          }
          console.log(`  QR Generated: ${payment.qrCodeGenerated ? 'Yes' : 'No'}`);
          console.log("");
        } catch (error) {
          console.log(`Escrow #${i}: Error reading payment data`);
        }
      }
    }

    // Check if contract is ready for use
    console.log("=== Contract Status ===");
    const isPaused = await contract.paused();
    const hasBalance = balance.gt(0);
    const hasEscrows = nextEscrowId.gt(1);
    
    console.log("Contract Ready:", !isPaused && hasBalance ? "✅ Yes" : "❌ No");
    console.log("Has Balance:", hasBalance ? "✅ Yes" : "❌ No");
    console.log("Has Escrows:", hasEscrows ? "✅ Yes" : "❌ No");
    console.log("Is Paused:", isPaused ? "❌ Yes" : "✅ No");
    console.log("");

    // Gas estimation for common functions
    console.log("=== Gas Estimates ===");
    try {
      const createEscrowGas = await contract.estimateGas.createEscrowPayment(
        "0x0000000000000000000000000000000000000001", // Dummy address
        "Test Item",
        { value: ethers.utils.parseEther("0.001") }
      );
      console.log("Create Escrow Payment:", createEscrowGas.toString(), "gas");
    } catch (error) {
      console.log("Create Escrow Payment: Unable to estimate");
    }

    try {
      const releaseGas = await contract.estimateGas.releasePayment(1);
      console.log("Release Payment:", releaseGas.toString(), "gas");
    } catch (error) {
      console.log("Release Payment: Unable to estimate");
    }

    console.log("");
    console.log("=== Contract Check Complete ===");

  } catch (error) {
    console.error("Error checking contract status:", error.message);
    
    if (error.message.includes("call revert exception")) {
      console.log("This might be because:");
      console.log("1. Contract address is incorrect");
      console.log("2. Contract is not deployed on this network");
      console.log("3. Contract is not verified");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
