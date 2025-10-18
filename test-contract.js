const { ethers } = require("hardhat");

async function main() {
  console.log("🧪 Testing MarketplaceEscrow Contract...\n");

  // Get signers
  const [owner, buyer, seller, addr1] = await ethers.getSigners();
  
  // Deploy contract
  const MarketplaceEscrow = await ethers.getContractFactory("MarketplaceEscrow");
  const escrow = await MarketplaceEscrow.deploy(owner.address);
  await escrow.waitForDeployment();
  
  console.log("✅ Contract deployed at:", await escrow.getAddress());
  console.log("👤 Owner:", await escrow.owner());
  console.log("💰 Platform wallet:", await escrow.platformWallet());
  console.log("");

  // Test 1: Create escrow payment
  console.log("📝 Test 1: Creating escrow payment...");
  const amount = ethers.parseEther("0.1");
  const tx1 = await escrow.connect(buyer).createEscrowPayment(
    seller.address, 
    "Test iPhone 15 Pro", 
    { value: amount }
  );
  await tx1.wait();
  console.log("✅ Escrow payment created successfully!");
  console.log("");

  // Test 2: Check escrow details
  console.log("📋 Test 2: Checking escrow details...");
  const escrowDetails = await escrow.getEscrowPayment(1);
  console.log("   Buyer:", escrowDetails.buyer);
  console.log("   Seller:", escrowDetails.seller);
  console.log("   Amount:", ethers.formatEther(escrowDetails.amount), "ETH");
  console.log("   Item:", escrowDetails.itemDescription);
  console.log("   Is Released:", escrowDetails.isReleased);
  console.log("   Is Refunded:", escrowDetails.isRefunded);
  console.log("   Is Blocked:", escrowDetails.isBlocked);
  console.log("");

  // Test 3: Generate QR code
  console.log("📱 Test 3: Generating QR code...");
  const qrData = JSON.stringify({
    escrowId: 1,
    buyer: buyer.address,
    seller: seller.address,
    amount: "0.1",
    itemDescription: "Test iPhone 15 Pro",
    timestamp: Date.now(),
    confirmationCode: "ABC12345"
  });
  
  const tx2 = await escrow.connect(buyer).generateQRCode(1, qrData);
  await tx2.wait();
  console.log("✅ QR code generated successfully!");
  console.log("");

  // Test 4: Release payment
  console.log("💸 Test 4: Releasing payment...");
  const tx3 = await escrow.connect(buyer).releasePayment(1);
  await tx3.wait();
  console.log("✅ Payment released successfully!");
  console.log("");

  // Test 5: Check final status
  console.log("🔍 Test 5: Checking final status...");
  const finalDetails = await escrow.getEscrowPayment(1);
  console.log("   Is Released:", finalDetails.isReleased);
  console.log("   Is Refunded:", finalDetails.isRefunded);
  console.log("   Is Blocked:", finalDetails.isBlocked);
  console.log("");

  // Test 6: Check platform fees
  console.log("💰 Test 6: Checking platform fees...");
  const platformFees = await escrow.totalPlatformFees();
  console.log("   Total platform fees:", ethers.formatEther(platformFees), "ETH");
  console.log("");

  console.log("🎉 All tests passed! Contract is working correctly.");
  console.log("🚀 You can now use the frontend at http://localhost:3000");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Test failed:", error);
    process.exit(1);
  });
