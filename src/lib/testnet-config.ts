// Testnet-specific configuration
export const TESTNET_SETTINGS = {
  network: {
    name: 'Sepolia Testnet',
    chainId: 11155111,
    currency: 'SEP',
    explorer: 'https://sepolia.etherscan.io',
    rpcUrl: 'https://rpc.sepolia.org'
  },

  // Faucets for getting test ETH
  faucets: [
    {
      name: 'Sepolia Faucet',
      url: 'https://sepoliafaucet.com/',
      description: 'Official Sepolia faucet'
    },
    {
      name: 'Alchemy Sepolia Faucet',
      url: 'https://sepoliafaucet.com/',
      description: 'Alchemy faucet'
    },
    {
      name: 'Infura Sepolia Faucet',
      url: 'https://www.infura.io/faucet/sepolia',
      description: 'Infura faucet'
    }
  ],

  // Available test tokens
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

  // Application settings
  app: {
    isTestnet: true,
    showTestnetBanner: true,
    allowMinting: true,
    maxMintAmount: '1000',
    transactionTimeout: 30000
  }
}

export const getTokenInfo = (symbol: 'DAI' | 'USDC') => {
  return TESTNET_SETTINGS.testTokens[symbol]
}

export const isTestnet = () => {
  return TESTNET_SETTINGS.app.isTestnet
}

export const getFaucetUrls = () => {
  return TESTNET_SETTINGS.faucets
}
