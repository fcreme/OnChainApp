// Configuración específica para testnet
export const TESTNET_SETTINGS = {
  // Información de la red
  network: {
    name: 'Sepolia Testnet',
    chainId: 11155111,
    currency: 'SEP',
    explorer: 'https://sepolia.etherscan.io',
    rpcUrl: 'https://rpc.sepolia.org'
  },
  
  // Faucets para obtener ETH de prueba
  faucets: [
    {
      name: 'Sepolia Faucet',
      url: 'https://sepoliafaucet.com/',
      description: 'Faucet oficial de Sepolia'
    },
    {
      name: 'Alchemy Sepolia Faucet',
      url: 'https://sepoliafaucet.com/',
      description: 'Faucet de Alchemy'
    },
    {
      name: 'Infura Sepolia Faucet',
      url: 'https://www.infura.io/faucet/sepolia',
      description: 'Faucet de Infura'
    }
  ],
  
  // Tokens de prueba disponibles
  testTokens: {
    DAI: {
      address: '0x1D70D57ccD2798323232B2dD027B3aBcA5C00091',
      symbol: 'DAI',
      decimals: 18,
      name: 'Dai Stablecoin (Test)'
    },
    USDC: {
      address: '0xC891481A0AaC630F4D89744ccD2C7D2C4215FD47',
      symbol: 'USDC',
      decimals: 6,
      name: 'USD Coin (Test)'
    }
  },
  
  // Configuración de la aplicación
  app: {
    isTestnet: true,
    showTestnetBanner: true,
    allowMinting: true, // Permitir minting en testnet
    maxMintAmount: '1000', // Cantidad máxima para minting
    transactionTimeout: 30000 // 30 segundos
  }
}

// Función para obtener información del token
export const getTokenInfo = (symbol: 'DAI' | 'USDC') => {
  return TESTNET_SETTINGS.testTokens[symbol]
}

// Función para verificar si estamos en testnet
export const isTestnet = () => {
  return TESTNET_SETTINGS.app.isTestnet
}

// Función para obtener URLs de faucet
export const getFaucetUrls = () => {
  return TESTNET_SETTINGS.faucets
}
