// src/lib/web3.ts
import { http, createConfig } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { 
  injected, 
  metaMask, 
  walletConnect,
  coinbaseWallet,
  safe
} from 'wagmi/connectors';

const walletConnectProjectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'demo'

// Múltiples RPC URLs para mejor confiabilidad en testnet
const sepoliaRpcUrls = [
  import.meta.env.VITE_SEPOLIA_RPC_URL,
  'https://rpc.sepolia.org',
  'https://ethereum-sepolia.publicnode.com',
  'https://sepolia.drpc.org'
].filter(Boolean)

export const config = createConfig({
  chains: [sepolia],
  connectors: [
    // MetaMask (más compatible con Ethereum)
    metaMask(),
    
    // Injected wallets (incluye Phantom si soporta Ethereum)
    injected({
      target: 'metaMask',
      shimDisconnect: true,
    }),
    
    // WalletConnect (soporta múltiples wallets)
    walletConnect({ 
      projectId: walletConnectProjectId,
      showQrModal: true,
      metadata: {
        name: 'Web3 Challenge',
        description: 'DeFi testing application',
        url: 'https://web3-challenge-react-blockchain-int.vercel.app',
        icons: ['https://avatars.githubusercontent.com/u/37784886']
      }
    }),
    
    // Coinbase Wallet
    coinbaseWallet({
      appName: 'Web3 Challenge',
      appLogoUrl: 'https://avatars.githubusercontent.com/u/37784886'
    }),
    
    // Safe Wallet
    safe()
  ],
  transports: {
    [sepolia.id]: http(sepoliaRpcUrls[0] || 'https://rpc.sepolia.org'),
  },
});

// Configuración específica para testnet
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

// Lista de wallets recomendadas para Ethereum
export const RECOMMENDED_WALLETS = [
  {
    name: 'MetaMask',
    description: 'La wallet más popular para Ethereum',
    url: 'https://metamask.io/',
    icon: '🦊'
  },
  {
    name: 'WalletConnect',
    description: 'Conecta cualquier wallet compatible',
    url: 'https://walletconnect.com/',
    icon: '🔗'
  },
  {
    name: 'Coinbase Wallet',
    description: 'Wallet oficial de Coinbase',
    url: 'https://www.coinbase.com/wallet',
    icon: '🪙'
  },
  {
    name: 'Trust Wallet',
    description: 'Wallet móvil popular',
    url: 'https://trustwallet.com/',
    icon: '🛡️'
  }
]
