const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("MarketplaceEscrow", function () {
  let marketplaceEscrow;
  let owner;
  let buyer;
  let seller;
  let platformWallet;
  let addr1, addr2, addr3;

  const PLATFORM_FEE_PERCENTAGE = 250; // 2.5%
  const RELEASE_DELAY = 3 * 24 * 60 * 60; // 3 days in seconds

  beforeEach(async function () {
    [owner, buyer, seller, platformWallet, addr1, addr2, addr3] = await ethers.getSigners();

    const MarketplaceEscrow = await ethers.getContractFactory("MarketplaceEscrow");
    marketplaceEscrow = await MarketplaceEscrow.deploy(platformWallet.address);
    await marketplaceEscrow.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await marketplaceEscrow.owner()).to.equal(owner.address);
    });

    it("Should set the right platform wallet", async function () {
      expect(await marketplaceEscrow.platformWallet()).to.equal(platformWallet.address);
    });

    it("Should set the right platform fee percentage", async function () {
      expect(await marketplaceEscrow.platformFeePercentage()).to.equal(PLATFORM_FEE_PERCENTAGE);
    });

    it("Should set the right release delay", async function () {
      expect(await marketplaceEscrow.RELEASE_DELAY()).to.equal(RELEASE_DELAY);
    });
  });

  describe("Creating Escrow Payments", function () {
    it("Should create an escrow payment successfully", async function () {
      const amount = ethers.parseEther("1.0");
      const itemDescription = "Test Item";

      await expect(
        marketplaceEscrow.connect(buyer).createEscrowPayment(seller.address, itemDescription, {
          value: amount
        })
      )
        .to.emit(marketplaceEscrow, "PaymentDeposited")
        .withArgs(1, buyer.address, seller.address, amount, itemDescription);

      const escrowPayment = await marketplaceEscrow.getEscrowPayment(1);
      expect(escrowPayment.buyer).to.equal(buyer.address);
      expect(escrowPayment.seller).to.equal(seller.address);
      expect(escrowPayment.amount).to.equal(amount);
      expect(escrowPayment.itemDescription).to.equal(itemDescription);
      expect(escrowPayment.isReleased).to.be.false;
      expect(escrowPayment.isRefunded).to.be.false;
      expect(escrowPayment.isBlocked).to.be.false;
    });

    it("Should reject zero amount payment", async function () {
      await expect(
        marketplaceEscrow.connect(buyer).createEscrowPayment(seller.address, "Test Item", {
          value: 0
        })
      ).to.be.revertedWith("Payment amount must be greater than 0");
    });

    it("Should reject payment to zero address", async function () {
      const amount = ethers.parseEther("1.0");
      await expect(
        marketplaceEscrow.connect(buyer).createEscrowPayment(ethers.ZeroAddress, "Test Item", {
          value: amount
        })
      ).to.be.revertedWith("Invalid seller address");
    });

    it("Should reject payment to self", async function () {
      const amount = ethers.parseEther("1.0");
      await expect(
        marketplaceEscrow.connect(buyer).createEscrowPayment(buyer.address, "Test Item", {
          value: amount
        })
      ).to.be.revertedWith("Cannot sell to yourself");
    });

    it("Should reject empty item description", async function () {
      const amount = ethers.parseEther("1.0");
      await expect(
        marketplaceEscrow.connect(buyer).createEscrowPayment(seller.address, "", {
          value: amount
        })
      ).to.be.revertedWith("Item description required");
    });
  });

  describe("QR Code Generation", function () {
    let escrowId;

    beforeEach(async function () {
      const amount = ethers.parseEther("1.0");
      const itemDescription = "Test Item";

      await marketplaceEscrow.connect(buyer).createEscrowPayment(seller.address, itemDescription, {
        value: amount
      });
      escrowId = 1;
    });

    it("Should generate QR code successfully", async function () {
      const qrCodeData = '{"escrowId":1,"buyer":"0x123","seller":"0x456","amount":"1000000000000000000","itemDescription":"Test Item","timestamp":1234567890,"confirmationCode":"abc12345"}';

      await expect(
        marketplaceEscrow.connect(buyer).generateQRCode(escrowId, qrCodeData)
      )
        .to.emit(marketplaceEscrow, "QRCodeGenerated")
        .withArgs(escrowId, qrCodeData);

      const escrowPayment = await marketplaceEscrow.getEscrowPayment(escrowId);
      expect(escrowPayment.qrCodeData).to.equal(qrCodeData);
      expect(escrowPayment.qrCodeGenerated).to.be.true;
    });

    it("Should allow seller to generate QR code", async function () {
      const qrCodeData = '{"escrowId":1,"buyer":"0x123","seller":"0x456","amount":"1000000000000000000","itemDescription":"Test Item","timestamp":1234567890,"confirmationCode":"abc12345"}';

      await expect(
        marketplaceEscrow.connect(seller).generateQRCode(escrowId, qrCodeData)
      )
        .to.emit(marketplaceEscrow, "QRCodeGenerated")
        .withArgs(escrowId, qrCodeData);
    });

    it("Should reject QR code generation by unauthorized user", async function () {
      const qrCodeData = '{"escrowId":1,"buyer":"0x123","seller":"0x456","amount":"1000000000000000000","itemDescription":"Test Item","timestamp":1234567890,"confirmationCode":"abc12345"}';

      await expect(
        marketplaceEscrow.connect(addr1).generateQRCode(escrowId, qrCodeData)
      ).to.be.revertedWith("Only buyer or seller");
    });

    it("Should reject empty QR code data", async function () {
      await expect(
        marketplaceEscrow.connect(buyer).generateQRCode(escrowId, "")
      ).to.be.revertedWith("QR code data required");
    });
  });

  describe("Payment Release", function () {
    let escrowId;
    const amount = ethers.parseEther("1.0");

    beforeEach(async function () {
      await marketplaceEscrow.connect(buyer).createEscrowPayment(seller.address, "Test Item", {
        value: amount
      });
      escrowId = 1;
    });

    it("Should release payment immediately by buyer", async function () {
      const platformFee = (amount * BigInt(PLATFORM_FEE_PERCENTAGE)) / BigInt(10000);
      const sellerAmount = amount - platformFee;

      await expect(
        marketplaceEscrow.connect(buyer).releasePayment(escrowId)
      )
        .to.emit(marketplaceEscrow, "PaymentReleased")
        .withArgs(escrowId, seller.address, sellerAmount);

      const escrowPayment = await marketplaceEscrow.getEscrowPayment(escrowId);
      expect(escrowPayment.isReleased).to.be.true;
    });

    it("Should release payment after 3 days by anyone", async function () {
      // Fast forward 3 days
      await time.increase(RELEASE_DELAY);

      const platformFee = (amount * BigInt(PLATFORM_FEE_PERCENTAGE)) / BigInt(10000);
      const sellerAmount = amount - platformFee;

      await expect(
        marketplaceEscrow.connect(addr1).releasePayment(escrowId)
      )
        .to.emit(marketplaceEscrow, "PaymentReleased")
        .withArgs(escrowId, seller.address, sellerAmount);

      const escrowPayment = await marketplaceEscrow.getEscrowPayment(escrowId);
      expect(escrowPayment.isReleased).to.be.true;
    });

    it("Should reject release before 3 days by non-buyer", async function () {
      await expect(
        marketplaceEscrow.connect(addr1).releasePayment(escrowId)
      ).to.be.revertedWith("Cannot release payment yet");
    });
  });

  describe("Payment Refund", function () {
    let escrowId;
    const amount = ethers.parseEther("1.0");

    beforeEach(async function () {
      await marketplaceEscrow.connect(buyer).createEscrowPayment(seller.address, "Test Item", {
        value: amount
      });
      escrowId = 1;
    });

    it("Should refund payment by buyer before release time", async function () {
      const initialBuyerBalance = await buyer.provider.getBalance(buyer.address);

      await expect(
        marketplaceEscrow.connect(buyer).refundPayment(escrowId)
      )
        .to.emit(marketplaceEscrow, "PaymentRefunded")
        .withArgs(escrowId, buyer.address, amount);

      const escrowPayment = await marketplaceEscrow.getEscrowPayment(escrowId);
      expect(escrowPayment.isRefunded).to.be.true;

      const finalBuyerBalance = await buyer.provider.getBalance(buyer.address);
      expect(finalBuyerBalance - initialBuyerBalance).to.be.closeTo(amount, ethers.parseEther("0.01"));
    });

    it("Should reject refund by non-buyer", async function () {
      await expect(
        marketplaceEscrow.connect(seller).refundPayment(escrowId)
      ).to.be.revertedWith("Only buyer can refund");
    });

    it("Should reject refund after release time", async function () {
      await time.increase(RELEASE_DELAY);

      await expect(
        marketplaceEscrow.connect(buyer).refundPayment(escrowId)
      ).to.be.revertedWith("Cannot refund after release time");
    });
  });

  describe("Admin Functions", function () {
    let escrowId;
    const amount = ethers.parseEther("1.0");

    beforeEach(async function () {
      await marketplaceEscrow.connect(buyer).createEscrowPayment(seller.address, "Test Item", {
        value: amount
      });
      escrowId = 1;
    });

    it("Should block payment by admin", async function () {
      const reason = "Suspicious activity detected";

      await expect(
        marketplaceEscrow.connect(owner).blockPayment(escrowId, reason)
      )
        .to.emit(marketplaceEscrow, "PaymentBlocked")
        .withArgs(escrowId, owner.address, reason);

      const escrowPayment = await marketplaceEscrow.getEscrowPayment(escrowId);
      expect(escrowPayment.isBlocked).to.be.true;
      expect(escrowPayment.blockReason).to.equal(reason);
    });

    it("Should unblock payment by admin", async function () {
      const reason = "Suspicious activity detected";
      await marketplaceEscrow.connect(owner).blockPayment(escrowId, reason);

      await marketplaceEscrow.connect(owner).unblockPayment(escrowId);

      const escrowPayment = await marketplaceEscrow.getEscrowPayment(escrowId);
      expect(escrowPayment.isBlocked).to.be.false;
      expect(escrowPayment.blockReason).to.equal("");
    });

    it("Should reject non-admin from blocking payment", async function () {
      await expect(
        marketplaceEscrow.connect(addr1).blockPayment(escrowId, "Reason")
      ).to.be.revertedWithCustomError(marketplaceEscrow, "OwnableUnauthorizedAccount");
    });

    it("Should update platform fee", async function () {
      const newFee = 500; // 5%
      await marketplaceEscrow.connect(owner).updatePlatformFee(newFee);
      expect(await marketplaceEscrow.platformFeePercentage()).to.equal(newFee);
    });

    it("Should reject fee update above maximum", async function () {
      const newFee = 1500; // 15% - above 10% max
      await expect(
        marketplaceEscrow.connect(owner).updatePlatformFee(newFee)
      ).to.be.revertedWith("Fee too high");
    });

    it("Should update platform wallet", async function () {
      await marketplaceEscrow.connect(owner).updatePlatformWallet(addr1.address);
      expect(await marketplaceEscrow.platformWallet()).to.equal(addr1.address);
    });

    it("Should pause and unpause contract", async function () {
      await marketplaceEscrow.connect(owner).pause();
      expect(await marketplaceEscrow.paused()).to.be.true;

      await expect(
        marketplaceEscrow.connect(buyer).createEscrowPayment(seller.address, "Test Item", {
          value: amount
        })
      ).to.be.revertedWithCustomError(marketplaceEscrow, "EnforcedPause");

      await marketplaceEscrow.connect(owner).unpause();
      expect(await marketplaceEscrow.paused()).to.be.false;
    });
  });

  describe("Edge Cases and Security", function () {
    it("Should handle multiple escrow payments", async function () {
      const amount1 = ethers.parseEther("1.0");
      const amount2 = ethers.parseEther("2.0");

      await marketplaceEscrow.connect(buyer).createEscrowPayment(seller.address, "Item 1", {
        value: amount1
      });

      await marketplaceEscrow.connect(addr1).createEscrowPayment(addr2.address, "Item 2", {
        value: amount2
      });

      const escrow1 = await marketplaceEscrow.getEscrowPayment(1);
      const escrow2 = await marketplaceEscrow.getEscrowPayment(2);

      expect(escrow1.buyer).to.equal(buyer.address);
      expect(escrow1.amount).to.equal(amount1);
      expect(escrow2.buyer).to.equal(addr1.address);
      expect(escrow2.amount).to.equal(amount2);
    });

    it("Should prevent double release", async function () {
      const amount = ethers.parseEther("1.0");
      
      await marketplaceEscrow.connect(buyer).createEscrowPayment(seller.address, "Test Item", {
        value: amount
      });

      await marketplaceEscrow.connect(buyer).releasePayment(1);

      await expect(
        marketplaceEscrow.connect(buyer).releasePayment(1)
      ).to.be.revertedWith("Payment already released");
    });

    it("Should prevent double refund", async function () {
      const amount = ethers.parseEther("1.0");
      
      await marketplaceEscrow.connect(buyer).createEscrowPayment(seller.address, "Test Item", {
        value: amount
      });

      await marketplaceEscrow.connect(buyer).refundPayment(1);

      await expect(
        marketplaceEscrow.connect(buyer).refundPayment(1)
      ).to.be.revertedWith("Payment already refunded");
    });
  });
});