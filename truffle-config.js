const HDWalletProvider = require('@truffle/hdwallet-provider');
require('dotenv').config();

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*"
    },
    base: {
      provider: () => new HDWalletProvider(
        process.env.PRIVATE_KEY,
        "https://mainnet.base.org"
      ),
      network_id: 8453,
      gas: 10000000,
      gasPrice: 1000000000, // 1 gwei
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true
    },
    baseSepolia: {
      provider: () => new HDWalletProvider(
        process.env.PRIVATE_KEY,
        "https://sepolia.base.org"
      ),
      network_id: 84532,
      gas: 10000000,
      gasPrice: 1000000000, // 1 gwei
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true
    }
  },
  compilers: {
    solc: {
      version: "0.8.20",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
    }
  },
  plugins: [
    'truffle-plugin-verify'
  ],
  api_keys: {
    basescan: process.env.BASESCAN_API_KEY
  }
};
