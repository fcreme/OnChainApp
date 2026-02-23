// src/lib/web3.ts
import { http, createConfig, fallback } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { 
  injected, 
  metaMask, 
  walletConnect,
  coinbaseWallet,
  safe
} from 'wagmi/connectors';

const walletConnectProjectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'demo'

// Multiple RPC URLs for better testnet reliability
const sepoliaRpcUrls = [
  import.meta.env.VITE_SEPOLIA_RPC_URL,
  'https://rpc.sepolia.org',
  'https://ethereum-sepolia.publicnode.com',
  'https://sepolia.drpc.org'
].filter(Boolean)

export const config = createConfig({
  chains: [sepolia],
  connectors: [
    metaMask(),

    // Injected wallets (includes Phantom if it supports Ethereum)
    injected({
      target: 'metaMask',
      shimDisconnect: true,
    }),
    
    walletConnect({ 
      projectId: walletConnectProjectId,
      showQrModal: true,
      metadata: {
        name: 'Onchain',
        description: 'Modern DeFi token management interface',
        url: 'https://on-chain-app-git-main-felipe-cremerius-projects.vercel.app',
        icons: ['https://avatars.githubusercontent.com/u/37784886']
      }
    }),
    
    coinbaseWallet({
      appName: 'Onchain',
      appLogoUrl: 'https://avatars.githubusercontent.com/u/37784886'
    }),
    
    safe()
  ],
  transports: {
    [sepolia.id]: fallback([
      http('https://ethereum-sepolia-rpc.publicnode.com'),
      http('https://sepolia.drpc.org'),
      http('https://rpc.sepolia.org'),
      ...(import.meta.env.VITE_SEPOLIA_RPC_URL ? [http(import.meta.env.VITE_SEPOLIA_RPC_URL)] : []),
    ]),
  },
  pollingInterval: 4_000,
});

// Testnet-specific configuration
export const TESTNET_CONFIG = {
  chainId: sepolia.id,
  chainName: 'Sepolia Testnet',
  nativeCurrency: {
    name: 'Sepolia Ether',
    symbol: 'SEP',
    decimals: 18,
  },
  rpcUrls: sepoliaRpcUrls,
  blockExplorerUrls: ['https://sepolia.etherscan.io'],
  faucetUrl: 'https://sepoliafaucet.com/',
}

// Recommended wallets for Ethereum
export const RECOMMENDED_WALLETS = [
  {
    name: 'MetaMask',
    description: 'The most popular Ethereum wallet',
    url: 'https://metamask.io/',
    icon: '🦊'
  },
  {
    name: 'WalletConnect',
    description: 'Connect any compatible wallet',
    url: 'https://walletconnect.com/',
    icon: '🔗'
  },
  {
    name: 'Coinbase Wallet',
    description: 'Official Coinbase wallet',
    url: 'https://www.coinbase.com/wallet',
    icon: '🪙'
  },
  {
    name: 'Trust Wallet',
    description: 'Popular mobile wallet',
    url: 'https://trustwallet.com/',
    icon: '🛡️'
  }
]
