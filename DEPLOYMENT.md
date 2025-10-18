# Deployment Guide for Marketplace Escrow Contract

This guide will walk you through deploying the MarketplaceEscrow contract to Base network.

## Prerequisites

1. **Node.js** (v16 or higher)
2. **npm** or **yarn**
3. **MetaMask** or compatible wallet
4. **Base network** added to your wallet
5. **ETH** for gas fees (at least 0.01 ETH recommended)

## Step 1: Environment Setup

1. Copy the environment file:
```bash
cp env.example .env
```

2. Edit `.env` with your configuration:
```bash
# Private key for deployment (without 0x prefix)
PRIVATE_KEY=your_private_key_here

# BaseScan API key for contract verification (optional)
BASESCAN_API_KEY=your_basescan_api_key_here
```

**⚠️ Security Note**: Never commit your private key to version control. Keep it secure and never share it.

## Step 2: Install Dependencies

```bash
npm install
```

## Step 3: Compile Contracts

```bash
npm run compile
```

## Step 4: Run Tests

```bash
npm test
```

Make sure all tests pass before deploying.

## Step 5: Deploy to Base Sepolia (Testnet)

First, deploy to the testnet to verify everything works:

```bash
npm run deploy:base-sepolia
```

This will:
- Deploy the contract to Base Sepolia
- Display the contract address
- Show deployment information
- Provide verification instructions

### Getting Base Sepolia ETH

1. Go to [Base Sepolia Faucet](https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet)
2. Connect your wallet
3. Request testnet ETH

## Step 6: Test on Testnet

After deployment, test the contract functions:

1. **Create an escrow payment**:
```javascript
// Using MetaMask or your preferred wallet
const contract = new ethers.Contract(contractAddress, abi, signer);
await contract.createEscrowPayment(sellerAddress, "Test Item", { value: ethers.utils.parseEther("0.1") });
```

2. **Generate QR code**:
```javascript
await contract.generateQRCode(1, '{"test": "data"}');
```

3. **Release payment**:
```javascript
await contract.releasePayment(1);
```

## Step 7: Deploy to Base Mainnet

Once testing is complete, deploy to mainnet:

```bash
npm run deploy:base
```

### Getting Base Mainnet ETH

1. Bridge ETH from Ethereum mainnet to Base
2. Use [Base Bridge](https://bridge.base.org/)
3. Or buy ETH directly on Base

## Step 8: Verify Contract

Verify your contract on BaseScan for transparency:

```bash
# Set environment variables
export CONTRACT_ADDRESS=0x...
export PLATFORM_WALLET=0x...

# Run verification
npx hardhat run scripts/verify.js --network base
```

Or manually verify on [BaseScan](https://basescan.org/):
1. Go to your contract address
2. Click "Contract" tab
3. Click "Verify and Publish"
4. Enter constructor arguments: `["0xYourPlatformWalletAddress"]`

## Step 9: Update Frontend

Update your frontend application with the deployed contract address:

```javascript
// In your frontend configuration
const CONTRACT_ADDRESS = "0x..."; // Your deployed contract address
const NETWORK_ID = 8453; // Base mainnet
```

## Step 10: Monitor Deployment

### Check Contract Status

```bash
# Check contract balance
npx hardhat run scripts/check-balance.js --network base

# Check platform fees
npx hardhat run scripts/check-fees.js --network base
```

### Monitor Events

Set up event monitoring for:
- `PaymentDeposited`
- `PaymentReleased`
- `PaymentRefunded`
- `PaymentBlocked`
- `QRCodeGenerated`

## Deployment Checklist

- [ ] Environment variables configured
- [ ] Dependencies installed
- [ ] Contracts compiled successfully
- [ ] All tests passing
- [ ] Testnet deployment successful
- [ ] Testnet testing completed
- [ ] Mainnet deployment successful
- [ ] Contract verified on BaseScan
- [ ] Frontend updated with contract address
- [ ] Monitoring set up

## Troubleshooting

### Common Issues

1. **Insufficient Gas**:
   - Increase gas limit in hardhat.config.js
   - Ensure wallet has enough ETH

2. **Network Connection Issues**:
   - Check RPC URL in hardhat.config.js
   - Verify network configuration

3. **Verification Fails**:
   - Check constructor arguments
   - Ensure contract is deployed correctly
   - Try manual verification on BaseScan

4. **Transaction Fails**:
   - Check gas price
   - Verify wallet has sufficient balance
   - Check network congestion

### Getting Help

1. Check [Base Documentation](https://docs.base.org/)
2. Review [Hardhat Documentation](https://hardhat.org/docs)
3. Check contract events for error details
4. Verify all parameters are correct

## Security Considerations

1. **Private Key Security**:
   - Never share your private key
   - Use hardware wallets for mainnet
   - Consider using a dedicated deployment wallet

2. **Contract Verification**:
   - Always verify contracts on BaseScan
   - Share contract address publicly
   - Document all admin functions

3. **Access Control**:
   - Secure admin wallet
   - Consider multi-sig for admin functions
   - Document admin procedures

## Post-Deployment

1. **Monitor Contract**:
   - Set up alerts for important events
   - Monitor contract balance
   - Track platform fees

2. **Update Documentation**:
   - Update README with contract address
   - Document any custom configurations
   - Share deployment information

3. **User Onboarding**:
   - Provide clear instructions for users
   - Create user guides
   - Set up support channels

## Emergency Procedures

### Pause Contract
```javascript
await contract.pause();
```

### Emergency Withdraw
```javascript
await contract.emergencyWithdraw();
```

### Update Platform Wallet
```javascript
await contract.updatePlatformWallet(newWalletAddress);
```

---

**Remember**: Always test thoroughly on testnet before deploying to mainnet. This contract handles real money and should be deployed with extreme care.
