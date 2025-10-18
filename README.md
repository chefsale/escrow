# Marketplace Escrow Contract for Base Network

A secure escrow smart contract system for marketplace payments on Base network, featuring QR code confirmation, admin controls, and automatic payment release mechanisms.

## Features

- **Secure Escrow Payments**: Hold payments in escrow until item delivery is confirmed
- **QR Code Integration**: Generate QR codes for item receipt confirmation
- **3-Day Auto-Release**: Automatic payment release after 3 days if not blocked
- **Admin Controls**: Marketplace admin can block payments for disputes
- **Platform Fees**: Configurable platform fees (default 2.5%)
- **Refund System**: Buyers can refund payments before release time
- **Reentrancy Protection**: Secure against reentrancy attacks
- **Pausable**: Emergency pause functionality

## Contract Architecture

### Core Components

1. **MarketplaceEscrow.sol**: Main escrow contract
2. **QRCodeGenerator.sol**: Utility library for QR code generation
3. **Comprehensive Test Suite**: Full test coverage
4. **Deployment Scripts**: Ready for Base network deployment

### Key Functions

#### For Buyers
- `createEscrowPayment()`: Create a new escrow payment
- `generateQRCode()`: Generate QR code for item confirmation
- `releasePayment()`: Release payment to seller (immediate or after 3 days)
- `refundPayment()`: Refund payment before release time

#### For Sellers
- `generateQRCode()`: Generate QR code for item confirmation
- Receive payments automatically after release

#### For Admins
- `blockPayment()`: Block a payment for disputes
- `unblockPayment()`: Unblock a previously blocked payment
- `forceReleasePayment()`: Force release a blocked payment
- `updatePlatformFee()`: Update platform fee percentage
- `pause()`/`unpause()`: Emergency controls

## Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Hardhat
- MetaMask or compatible wallet

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp env.example .env

# Edit .env with your configuration
# PRIVATE_KEY=your_private_key_here
# BASESCAN_API_KEY=your_basescan_api_key_here
```

### Compilation

```bash
# Compile contracts
npm run compile
```

### Testing

```bash
# Run tests
npm test

# Run tests with coverage
npx hardhat coverage
```

## Deployment

### Base Mainnet

```bash
# Deploy to Base mainnet
npm run deploy:base
```

### Base Sepolia (Testnet)

```bash
# Deploy to Base Sepolia testnet
npm run deploy:base-sepolia
```

### Verification

```bash
# Verify contract on BaseScan
CONTRACT_ADDRESS=0x... PLATFORM_WALLET=0x... npx hardhat run scripts/verify.js --network base
```

## Usage Examples

### Creating an Escrow Payment

```javascript
// Frontend integration
const escrow = new MarketplaceEscrowIntegration(contractAddress, provider);
await escrow.initialize(signer);

// Create payment
const result = await escrow.createEscrowPayment(
  sellerAddress,    // 0x...
  "iPhone 15 Pro",  // Item description
  1.5               // Amount in ETH
);

console.log("Escrow ID:", result.escrowId);
```

### Generating QR Code

```javascript
// Generate QR code for item confirmation
const qrData = escrow.generateQRCodeData(
  escrowId,
  buyerAddress,
  sellerAddress,
  "1.5",
  "iPhone 15 Pro"
);

await escrow.generateQRCode(escrowId, qrData);
```

### Releasing Payment

```javascript
// Release payment (buyer can do this immediately)
await escrow.releasePayment(escrowId);

// Or wait 3 days for automatic release
// Anyone can call releasePayment after 3 days
```

### Admin Functions

```javascript
// Block a payment for disputes
await escrow.contract.connect(admin).blockPayment(escrowId, "Suspicious activity");

// Unblock a payment
await escrow.contract.connect(admin).unblockPayment(escrowId);

// Force release a blocked payment
await escrow.contract.connect(admin).forceReleasePayment(escrowId);
```

## Contract Details

### Platform Fees
- Default: 2.5% (250 basis points)
- Maximum: 10% (1000 basis points)
- Configurable by contract owner

### Release Mechanism
- **Immediate**: Buyer can release payment immediately
- **Automatic**: After 3 days, anyone can release the payment
- **Admin Override**: Admin can force release blocked payments

### Security Features
- **ReentrancyGuard**: Prevents reentrancy attacks
- **Ownable**: Admin controls with proper access management
- **Pausable**: Emergency pause functionality
- **Input Validation**: Comprehensive input validation
- **Event Logging**: Full event logging for transparency

## Events

```solidity
event PaymentDeposited(uint256 indexed escrowId, address indexed buyer, address indexed seller, uint256 amount, string itemDescription);
event PaymentReleased(uint256 indexed escrowId, address indexed seller, uint256 amount);
event PaymentRefunded(uint256 indexed escrowId, address indexed buyer, uint256 amount);
event PaymentBlocked(uint256 indexed escrowId, address indexed admin, string reason);
event QRCodeGenerated(uint256 indexed escrowId, string qrCodeData);
```

## Gas Optimization

The contract is optimized for gas efficiency:
- Uses `uint256` for consistent storage layout
- Minimal external calls
- Efficient event logging
- Optimized for 200 runs in Solidity compiler

## Testing

The test suite covers:
- ✅ Contract deployment and initialization
- ✅ Escrow payment creation
- ✅ QR code generation
- ✅ Payment release mechanisms
- ✅ Refund functionality
- ✅ Admin controls
- ✅ Security features
- ✅ Edge cases and error handling

Run tests with:
```bash
npm test
```

## Security Considerations

1. **Reentrancy Protection**: All external calls are protected
2. **Access Control**: Proper role-based access control
3. **Input Validation**: All inputs are validated
4. **Emergency Controls**: Pause functionality for emergencies
5. **Admin Controls**: Limited admin powers with transparency

## Base Network Integration

### Network Details
- **Mainnet**: https://mainnet.base.org
- **Testnet**: https://sepolia.base.org
- **Chain ID**: 8453 (mainnet), 84532 (testnet)
- **Currency**: ETH

### Gas Configuration
- Gas Price: 1 gwei (configurable)
- Gas Limit: Auto-estimated by Hardhat

## Frontend Integration

The `frontend/escrow-integration.js` file provides:
- Complete JavaScript integration class
- React hooks for easy integration
- Event listening capabilities
- Error handling
- TypeScript-ready structure

## Deployment Checklist

- [ ] Set up environment variables
- [ ] Fund deployment account
- [ ] Deploy to testnet first
- [ ] Test all functions
- [ ] Deploy to mainnet
- [ ] Verify contract on BaseScan
- [ ] Update frontend with contract address
- [ ] Set up monitoring

## Support

For issues or questions:
1. Check the test suite for usage examples
2. Review the contract comments
3. Check Base network documentation
4. Verify your wallet has sufficient ETH for gas

## License

MIT License - see LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

---

**⚠️ Important**: Always test on testnet before deploying to mainnet. This contract handles real money and should be thoroughly tested.
