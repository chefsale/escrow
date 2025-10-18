// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title MarketplaceEscrow
 * @dev Escrow contract for marketplace payments with QR code confirmation and admin controls
 */
contract MarketplaceEscrow is ReentrancyGuard, Ownable, Pausable {
    
    // Events
    event PaymentDeposited(
        uint256 indexed escrowId,
        address indexed buyer,
        address indexed seller,
        uint256 amount,
        string itemDescription
    );
    
    event PaymentReleased(
        uint256 indexed escrowId,
        address indexed seller,
        uint256 amount
    );
    
    event PaymentRefunded(
        uint256 indexed escrowId,
        address indexed buyer,
        uint256 amount
    );
    
    event PaymentBlocked(
        uint256 indexed escrowId,
        address indexed admin,
        string reason
    );
    
    event QRCodeGenerated(
        uint256 indexed escrowId,
        string qrCodeData
    );
    
    // Structs
    struct EscrowPayment {
        address buyer;
        address seller;
        uint256 amount;
        string itemDescription;
        uint256 createdAt;
        uint256 releaseTime; // 3 days from creation
        bool isReleased;
        bool isRefunded;
        bool isBlocked;
        string blockReason;
        string qrCodeData;
        bool qrCodeGenerated;
    }
    
    // State variables
    mapping(uint256 => EscrowPayment) public escrowPayments;
    uint256 public nextEscrowId = 1;
    uint256 public constant RELEASE_DELAY = 3 days;
    uint256 public platformFeePercentage = 250; // 2.5% (250 basis points)
    uint256 public constant MAX_FEE_PERCENTAGE = 1000; // 10% max fee
    
    address public platformWallet;
    uint256 public totalPlatformFees;
    
    // Modifiers
    modifier onlyValidEscrow(uint256 _escrowId) {
        require(_escrowId > 0 && _escrowId < nextEscrowId, "Invalid escrow ID");
        require(!escrowPayments[_escrowId].isReleased, "Payment already released");
        require(!escrowPayments[_escrowId].isRefunded, "Payment already refunded");
        require(!escrowPayments[_escrowId].isBlocked, "Payment is blocked");
        _;
    }
    
    modifier onlyBuyerOrSeller(uint256 _escrowId) {
        EscrowPayment memory payment = escrowPayments[_escrowId];
        require(
            msg.sender == payment.buyer || msg.sender == payment.seller,
            "Only buyer or seller"
        );
        _;
    }
    
    constructor(address _platformWallet) Ownable(msg.sender) {
        require(_platformWallet != address(0), "Invalid platform wallet");
        platformWallet = _platformWallet;
    }
    
    /**
     * @dev Create a new escrow payment
     * @param _seller Address of the seller
     * @param _itemDescription Description of the item being sold
     */
    function createEscrowPayment(
        address _seller,
        string memory _itemDescription
    ) external payable whenNotPaused nonReentrant {
        require(_seller != address(0), "Invalid seller address");
        require(_seller != msg.sender, "Cannot sell to yourself");
        require(msg.value > 0, "Payment amount must be greater than 0");
        require(bytes(_itemDescription).length > 0, "Item description required");
        
        uint256 escrowId = nextEscrowId++;
        uint256 releaseTime = block.timestamp + RELEASE_DELAY;
        
        escrowPayments[escrowId] = EscrowPayment({
            buyer: msg.sender,
            seller: _seller,
            amount: msg.value,
            itemDescription: _itemDescription,
            createdAt: block.timestamp,
            releaseTime: releaseTime,
            isReleased: false,
            isRefunded: false,
            isBlocked: false,
            blockReason: "",
            qrCodeData: "",
            qrCodeGenerated: false
        });
        
        emit PaymentDeposited(escrowId, msg.sender, _seller, msg.value, _itemDescription);
    }
    
    /**
     * @dev Generate QR code for item receipt confirmation
     * @param _escrowId ID of the escrow payment
     * @param _qrCodeData QR code data for confirmation
     */
    function generateQRCode(
        uint256 _escrowId,
        string memory _qrCodeData
    ) external onlyValidEscrow(_escrowId) onlyBuyerOrSeller(_escrowId) {
        require(bytes(_qrCodeData).length > 0, "QR code data required");
        
        escrowPayments[_escrowId].qrCodeData = _qrCodeData;
        escrowPayments[_escrowId].qrCodeGenerated = true;
        
        emit QRCodeGenerated(_escrowId, _qrCodeData);
    }
    
    /**
     * @dev Release payment to seller (can be called by buyer or after 3 days by anyone)
     * @param _escrowId ID of the escrow payment
     */
    function releasePayment(uint256 _escrowId) external onlyValidEscrow(_escrowId) nonReentrant {
        EscrowPayment storage payment = escrowPayments[_escrowId];
        
        // Check if caller is buyer or if 3 days have passed
        require(
            msg.sender == payment.buyer || block.timestamp >= payment.releaseTime,
            "Cannot release payment yet"
        );
        
        // Mark as released
        payment.isReleased = true;
        
        // Calculate platform fee
        uint256 platformFee = (payment.amount * platformFeePercentage) / 10000;
        uint256 sellerAmount = payment.amount - platformFee;
        
        // Update platform fees
        totalPlatformFees += platformFee;
        
        // Transfer payment to seller
        (bool success, ) = payment.seller.call{value: sellerAmount}("");
        require(success, "Transfer to seller failed");
        
        // Transfer platform fee to platform wallet
        if (platformFee > 0) {
            (bool feeSuccess, ) = platformWallet.call{value: platformFee}("");
            require(feeSuccess, "Platform fee transfer failed");
        }
        
        emit PaymentReleased(_escrowId, payment.seller, sellerAmount);
    }
    
    /**
     * @dev Refund payment to buyer (only buyer can call this before release)
     * @param _escrowId ID of the escrow payment
     */
    function refundPayment(uint256 _escrowId) external onlyValidEscrow(_escrowId) nonReentrant {
        EscrowPayment storage payment = escrowPayments[_escrowId];
        
        // Only buyer can refund before release time
        require(msg.sender == payment.buyer, "Only buyer can refund");
        require(block.timestamp < payment.releaseTime, "Cannot refund after release time");
        
        // Mark as refunded
        payment.isRefunded = true;
        
        // Refund full amount to buyer
        (bool success, ) = payment.buyer.call{value: payment.amount}("");
        require(success, "Refund transfer failed");
        
        emit PaymentRefunded(_escrowId, payment.buyer, payment.amount);
    }
    
    /**
     * @dev Admin function to block a payment
     * @param _escrowId ID of the escrow payment
     * @param _reason Reason for blocking the payment
     */
    function blockPayment(
        uint256 _escrowId,
        string memory _reason
    ) external onlyOwner onlyValidEscrow(_escrowId) {
        require(bytes(_reason).length > 0, "Block reason required");
        
        escrowPayments[_escrowId].isBlocked = true;
        escrowPayments[_escrowId].blockReason = _reason;
        
        emit PaymentBlocked(_escrowId, msg.sender, _reason);
    }
    
    /**
     * @dev Admin function to unblock a payment
     * @param _escrowId ID of the escrow payment
     */
    function unblockPayment(uint256 _escrowId) external onlyOwner {
        require(_escrowId > 0 && _escrowId < nextEscrowId, "Invalid escrow ID");
        require(escrowPayments[_escrowId].isBlocked, "Payment not blocked");
        
        escrowPayments[_escrowId].isBlocked = false;
        escrowPayments[_escrowId].blockReason = "";
    }
    
    /**
     * @dev Admin function to force release a blocked payment
     * @param _escrowId ID of the escrow payment
     */
    function forceReleasePayment(uint256 _escrowId) external onlyOwner nonReentrant {
        require(_escrowId > 0 && _escrowId < nextEscrowId, "Invalid escrow ID");
        EscrowPayment storage payment = escrowPayments[_escrowId];
        
        require(!payment.isReleased && !payment.isRefunded, "Payment already processed");
        require(payment.isBlocked, "Payment not blocked");
        
        // Unblock and release
        payment.isBlocked = false;
        payment.isReleased = true;
        payment.blockReason = "";
        
        // Calculate platform fee
        uint256 platformFee = (payment.amount * platformFeePercentage) / 10000;
        uint256 sellerAmount = payment.amount - platformFee;
        
        // Update platform fees
        totalPlatformFees += platformFee;
        
        // Transfer payment to seller
        (bool success, ) = payment.seller.call{value: sellerAmount}("");
        require(success, "Transfer to seller failed");
        
        // Transfer platform fee to platform wallet
        if (platformFee > 0) {
            (bool feeSuccess, ) = platformWallet.call{value: platformFee}("");
            require(feeSuccess, "Platform fee transfer failed");
        }
        
        emit PaymentReleased(_escrowId, payment.seller, sellerAmount);
    }
    
    /**
     * @dev Update platform fee percentage (only owner)
     * @param _newFeePercentage New fee percentage in basis points (max 10%)
     */
    function updatePlatformFee(uint256 _newFeePercentage) external onlyOwner {
        require(_newFeePercentage <= MAX_FEE_PERCENTAGE, "Fee too high");
        platformFeePercentage = _newFeePercentage;
    }
    
    /**
     * @dev Update platform wallet address (only owner)
     * @param _newPlatformWallet New platform wallet address
     */
    function updatePlatformWallet(address _newPlatformWallet) external onlyOwner {
        require(_newPlatformWallet != address(0), "Invalid platform wallet");
        platformWallet = _newPlatformWallet;
    }
    
    /**
     * @dev Pause the contract (only owner)
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause the contract (only owner)
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Get escrow payment details
     * @param _escrowId ID of the escrow payment
     * @return EscrowPayment struct
     */
    function getEscrowPayment(uint256 _escrowId) external view returns (EscrowPayment memory) {
        require(_escrowId > 0 && _escrowId < nextEscrowId, "Invalid escrow ID");
        return escrowPayments[_escrowId];
    }
    
    /**
     * @dev Get contract balance
     * @return Contract's ETH balance
     */
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    /**
     * @dev Emergency withdraw function (only owner)
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        (bool success, ) = owner().call{value: balance}("");
        require(success, "Emergency withdraw failed");
    }
}
