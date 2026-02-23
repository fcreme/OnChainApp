# Testnet Guide - OnChain

## What is Testnet?

Testnet is a test network that simulates the Ethereum blockchain without using real money. It's perfect for:

- ✅ Testing features without risk
- ✅ Learning about DeFi safely
- ✅ Developing and debugging applications
- ✅ Experimenting with tokens and contracts

## 🚀 How to Enable Testnet Mode

### 1. Automatic Configuration
The application is already configured to use **Sepolia Testnet** by default.

### 2. Environment Variables (optional)
Create a `.env` file in the project root:

```env
# WalletConnect Project ID (optional)
VITE_WALLETCONNECT_PROJECT_ID=demo

# Sepolia RPC URL (optional - uses public by default)
VITE_SEPOLIA_RPC_URL=https://rpc.sepolia.org

# Contract addresses (already configured)
VITE_DAI_CONTRACT_ADDRESS=0x1D70D57ccD2798323232B2dD027B3aBcA5C00091
VITE_USDC_CONTRACT_ADDRESS=0xC891481A0AaC630F4D89744ccD2C7D2C4215FD47
```

## 💰 Getting Test ETH

To use the application you need test ETH (not real):

### Recommended Faucets:
1. **Official Sepolia Faucet**: https://sepoliafaucet.com/
2. **Alchemy Faucet**: https://sepoliafaucet.com/
3. **Infura Faucet**: https://www.infura.io/faucet/sepolia

### Steps:
1. Connect your wallet (MetaMask, etc.)
2. Go to one of the faucets
3. Paste your wallet address
4. Receive test ETH (free)

## 🔗 Useful Links

- **Sepolia Explorer**: https://sepolia.etherscan.io
- **Sepolia Faucet**: https://sepoliafaucet.com/
- **Sepolia Documentation**: https://ethereum.org/en/developers/docs/networks/#sepolia

## 🎯 Features Available on Testnet

### Test Tokens:
- **DAI Test**: `0x1D70D57ccD2798323232B2dD027B3aBcA5C00091`
- **USDC Test**: `0xC891481A0AaC630F4D89744ccD2C7D2C4215FD47`

### Available Operations:
- ✅ View token balances
- ✅ Transfer tokens
- ✅ Approve spending
- ✅ Token minting (for testing)
- ✅ View transaction history

## 🛡️ Security

- **Do not use real money** on testnet
- Testnet tokens have no real value
- Transactions are free (only test gas)
- Perfect for experimenting without risk

## 🔧 Troubleshooting

### "Wrong Network Detected"
- Make sure you are connected to Sepolia in your wallet
- In MetaMask: Settings → Networks → Add Network
- Chain ID: 11155111
- RPC URL: https://rpc.sepolia.org

### "Insufficient funds"
- Get test ETH from a faucet
- Faucets usually give 0.1-0.5 test ETH

### Failed Transactions
- Verify you have enough ETH for gas
- Make sure you are on the correct network
- Check the logs in the browser console

## 🎉 Ready to Test!

Your application is configured for testnet. Connect your wallet and start experimenting safely with DeFi.

---

**Note**: This is a demo application. The contracts and tokens are for educational purposes only.
