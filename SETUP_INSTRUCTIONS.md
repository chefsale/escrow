# 🚀 Marketplace Escrow System - Setup Instructions

## ✅ System Status
- **Smart Contract**: Deployed and tested ✅
- **Frontend**: Running on http://localhost:3000 ✅
- **Hardhat Network**: Running on http://127.0.0.1:8545 ✅

## 🔧 MetaMask Setup

### Step 1: Add Hardhat Network to MetaMask

1. **Open MetaMask** and click on the network dropdown (top of the extension)
2. **Click "Add Network"** or "Custom RPC"
3. **Enter these details**:
   - **Network Name**: Hardhat Local
   - **RPC URL**: http://127.0.0.1:8545
   - **Chain ID**: 31337
   - **Currency Symbol**: ETH
   - **Block Explorer URL**: (leave empty)

4. **Click "Save"**

### Step 2: Import Test Accounts

The Hardhat network provides test accounts with 100 ETH each. Here are the first few:

**Account 1 (Owner/Platform)**: `0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1`
- Private Key: `0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d`

**Account 2 (Buyer)**: `0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0`
- Private Key: `0x6cbed15c793ce57650b9877cf6fa156fbef513c4e6134f022a85b1ffdd59b2a1`

**Account 3 (Seller)**: `0x22d491Bde2303f2f43325b2108D26f1eAbA1e32b`
- Private Key: `0x6370fd033278c143179d81c5526140625662b8daa446c22ee2d73db3707e620c`

### Step 3: Import Accounts to MetaMask

1. **Click MetaMask account icon** (top right)
2. **Click "Import Account"**
3. **Select "Private Key"**
4. **Paste one of the private keys above**
5. **Click "Import"**

Repeat for multiple accounts to test different scenarios.

## 🌐 Using the Frontend

### Step 1: Open the Frontend
- Go to http://localhost:3000
- You should see the Marketplace Escrow System interface

### Step 2: Connect Wallet
1. **Click "Add Hardhat Network"** (if not already added)
2. **Click "Connect MetaMask"**
3. **Select the Hardhat Local network** (Chain ID: 31337)
4. **Choose an account** to connect

### Step 3: Create Escrow Payment
1. **Fill out the form**:
   - **Seller Address**: Use Account 3 address (`0x22d491Bde2303f2f43325b2108D26f1eAbA1e32b`)
   - **Item Description**: "Test iPhone 15 Pro"
   - **Amount**: 0.1 ETH
2. **Click "Create Escrow Payment"**
3. **Confirm the transaction** in MetaMask

### Step 4: Test Different Scenarios
- **Switch accounts** to test buyer/seller perspectives
- **Release payments** as the buyer
- **Refund payments** before release time
- **View payment status** and details

## 🔍 Contract Details

- **Contract Address**: `0xCfEB869F69431e42cdB54A4F4f105C19C080A601`
- **Network**: Hardhat Local (Chain ID: 31337)
- **Platform Fee**: 2.5%
- **Release Delay**: 3 days (259,200 seconds)

## 🛠 Troubleshooting

### If you get "Parameter decoding error":
1. **Make sure you're on the correct network** (Hardhat Local, Chain ID: 31337)
2. **Refresh the page** after switching networks
3. **Check that Hardhat node is running** on port 8545

### If MetaMask shows "Insufficient funds":
1. **Switch to a test account** with 100 ETH
2. **Make sure you're on Hardhat Local network**

### If the frontend doesn't load:
1. **Check that React is running** on port 3000
2. **Check browser console** for errors
3. **Make sure all services are running**

## 🎯 Testing Scenarios

1. **Create Escrow**: Buyer creates payment for seller
2. **Generate QR Code**: Generate confirmation QR code
3. **Release Payment**: Buyer releases payment immediately
4. **Refund Payment**: Buyer refunds before 3 days
5. **Admin Functions**: Use owner account for admin controls

## 📱 Features Available

- ✅ **Wallet Connection**: MetaMask integration
- ✅ **Create Escrow**: Form to create payments
- ✅ **View Payments**: List all escrow payments
- ✅ **Release/Refund**: Payment management
- ✅ **Real-time Updates**: Live status updates
- ✅ **Error Handling**: User-friendly messages
- ✅ **Network Validation**: Automatic network checking

## 🚀 Next Steps

1. **Test all features** with different accounts
2. **Deploy to Base Sepolia** for testnet testing
3. **Deploy to Base Mainnet** for production
4. **Customize the UI** for your marketplace needs

---

**Happy Testing! 🎉**
