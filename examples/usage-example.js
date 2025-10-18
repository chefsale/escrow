// Example usage of the MarketplaceEscrow contract
// This file demonstrates how to interact with the deployed contract

const { ethers } = require("hardhat");

async function main() {
  console.log("=== MarketplaceEscrow Usage Example ===\n");

  // Contract configuration
  const CONTRACT_ADDRESS = "0x..."; // Replace with your deployed contract address
  const BUYER_PRIVATE_KEY = "0x..."; // Replace with buyer's private key
  const SELLER_ADDRESS = "0x..."; // Replace with seller's address

  try {
    // Get signers
    const [deployer, buyer, seller] = await ethers.getSigners();
    
    // Attach to deployed contract
    const MarketplaceEscrow = await ethers.getContractFactory("MarketplaceEscrow");
    const escrowContract = MarketplaceEscrow.attach(CONTRACT_ADDRESS);

    console.log("Contract Address:", CONTRACT_ADDRESS);
    console.log("Deployer:", deployer.address);
    console.log("Buyer:", buyer.address);
    console.log("Seller:", seller.address);
    console.log("");

    // Example 1: Create an escrow payment
    console.log("=== Example 1: Creating Escrow Payment ===");
    const itemDescription = "iPhone 15 Pro Max 256GB";
    const paymentAmount = ethers.utils.parseEther("0.5"); // 0.5 ETH

    console.log("Creating escrow payment...");
    const createTx = await escrowContract.connect(buyer).createEscrowPayment(
      seller.address,
      itemDescription,
      { value: paymentAmount }
    );

    console.log("Transaction sent:", createTx.hash);
    const createReceipt = await createTx.wait();
    console.log("Transaction confirmed in block:", createReceipt.blockNumber);

    // Get escrow ID from event
    const paymentEvent = createReceipt.events.find(e => e.event === 'PaymentDeposited');
    const escrowId = paymentEvent.args.escrowId;
    console.log("Escrow ID:", escrowId.toString());
    console.log("");

    // Example 2: Generate QR code
    console.log("=== Example 2: Generating QR Code ===");
    const qrCodeData = JSON.stringify({
      escrowId: escrowId.toString(),
      buyer: buyer.address,
      seller: seller.address,
      amount: ethers.utils.formatEther(paymentAmount),
      itemDescription: itemDescription,
      timestamp: Date.now(),
      confirmationCode: "ABC12345"
    });

    console.log("Generating QR code...");
    const qrTx = await escrowContract.connect(buyer).generateQRCode(escrowId, qrCodeData);
    await qrTx.wait();
    console.log("QR code generated successfully");
    console.log("");

    // Example 3: Check escrow status
    console.log("=== Example 3: Checking Escrow Status ===");
    const escrowPayment = await escrowContract.getEscrowPayment(escrowId);
    
    console.log("Escrow Payment Details:");
    console.log("  Buyer:", escrowPayment.buyer);
    console.log("  Seller:", escrowPayment.seller);
    console.log("  Amount:", ethers.utils.formatEther(escrowPayment.amount), "ETH");
    console.log("  Item Description:", escrowPayment.itemDescription);
    console.log("  Created At:", new Date(escrowPayment.createdAt * 1000).toLocaleString());
    console.log("  Release Time:", new Date(escrowPayment.releaseTime * 1000).toLocaleString());
    console.log("  Is Released:", escrowPayment.isReleased);
    console.log("  Is Refunded:", escrowPayment.isRefunded);
    console.log("  Is Blocked:", escrowPayment.isBlocked);
    console.log("  QR Code Generated:", escrowPayment.qrCodeGenerated);
    console.log("");

    // Example 4: Release payment (buyer can do this immediately)
    console.log("=== Example 4: Releasing Payment ===");
    console.log("Releasing payment to seller...");
    
    const releaseTx = await escrowContract.connect(buyer).releasePayment(escrowId);
    await releaseTx.wait();
    console.log("Payment released successfully");
    console.log("");

    // Example 5: Check final status
    console.log("=== Example 5: Final Status Check ===");
    const finalPayment = await escrowContract.getEscrowPayment(escrowId);
    console.log("Final Status:");
    console.log("  Is Released:", finalPayment.isReleased);
    console.log("  Is Refunded:", finalPayment.isRefunded);
    console.log("  Is Blocked:", finalPayment.isBlocked);
    console.log("");

    // Example 6: Admin functions (only deployer can call these)
    console.log("=== Example 6: Admin Functions ===");
    console.log("Contract Owner:", await escrowContract.owner());
    console.log("Platform Wallet:", await escrowContract.platformWallet());
    console.log("Platform Fee:", (await escrowContract.platformFeePercentage()).toString(), "basis points");
    console.log("Total Platform Fees:", ethers.utils.formatEther(await escrowContract.totalPlatformFees()), "ETH");
    console.log("Contract Balance:", ethers.utils.formatEther(await escrowContract.getContractBalance()), "ETH");
    console.log("");

    // Example 7: Event listening
    console.log("=== Example 7: Event Listening ===");
    console.log("Setting up event listeners...");
    
    escrowContract.on("PaymentDeposited", (escrowId, buyer, seller, amount, itemDescription) => {
      console.log("New payment deposited:");
      console.log("  Escrow ID:", escrowId.toString());
      console.log("  Buyer:", buyer);
      console.log("  Seller:", seller);
      console.log("  Amount:", ethers.utils.formatEther(amount), "ETH");
      console.log("  Item:", itemDescription);
    });

    escrowContract.on("PaymentReleased", (escrowId, seller, amount) => {
      console.log("Payment released:");
      console.log("  Escrow ID:", escrowId.toString());
      console.log("  Seller:", seller);
      console.log("  Amount:", ethers.utils.formatEther(amount), "ETH");
    });

    escrowContract.on("QRCodeGenerated", (escrowId, qrCodeData) => {
      console.log("QR code generated for escrow:", escrowId.toString());
    });

    console.log("Event listeners set up. Waiting for events...");
    console.log("(Press Ctrl+C to stop)");

    // Keep the script running to listen for events
    process.on('SIGINT', () => {
      console.log("\nRemoving event listeners...");
      escrowContract.removeAllListeners();
      process.exit(0);
    });

  } catch (error) {
    console.error("Error in usage example:", error.message);
    
    if (error.message.includes("call revert exception")) {
      console.log("\nThis might be because:");
      console.log("1. Contract address is incorrect");
      console.log("2. Contract is not deployed on this network");
      console.log("3. Insufficient funds for gas");
      console.log("4. Invalid parameters");
    }
  }
}

// Run the example
main()
  .then(() => {
    // Keep process alive for event listening
    return new Promise(() => {});
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
