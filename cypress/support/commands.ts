// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// Mock wallet connection for testing
Cypress.Commands.add('mockWalletConnection', () => {
  // Mock the wallet connection by intercepting wagmi hooks
  cy.window().then((win) => {
    // Mock useAccount hook
    cy.stub(win, 'useAccount').returns({
      address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
      isConnected: true,
      isConnecting: false,
      isDisconnected: false,
    })

    // Mock useChainId hook
    cy.stub(win, 'useChainId').returns(11155111) // Sepolia chainId
  })
})

// Wait for wallet connection
Cypress.Commands.add('waitForWalletConnection', () => {
  cy.get('[data-testid="connect-button"]', { timeout: 10000 }).should('exist')
  cy.get('[data-testid="wallet-address"]').should('be.visible')
})

// Check if connected to Sepolia network
Cypress.Commands.add('checkSepoliaNetwork', () => {
  cy.get('[data-testid="network-status"]').should('contain', 'Sepolia')
})

// Custom command to fill token form
Cypress.Commands.add('fillTokenForm', (token: string, amount: string, address?: string) => {
  cy.get('select[name="token"]').select(token)
  cy.get('input[name="amount"]').clear().type(amount)
  if (address) {
    cy.get('input[name="address"]').clear().type(address)
  }
})

// Custom command to check transaction status
Cypress.Commands.add('checkTransactionStatus', (status: string) => {
  cy.get('[data-testid="transaction-status"]').should('contain', status)
})

// Custom command to wait for balances to load
Cypress.Commands.add('waitForBalances', () => {
  cy.get('[data-testid="balances-loading"]').should('not.exist')
  cy.get('[data-testid="dai-balance"]').should('be.visible')
  cy.get('[data-testid="usdc-balance"]').should('be.visible')
})

// Add custom commands to Cypress namespace
declare global {
  namespace Cypress {
    interface Chainable {
      fillTokenForm(token: string, amount: string, address?: string): Chainable<void>
      checkTransactionStatus(status: string): Chainable<void>
      waitForBalances(): Chainable<void>
    }
  }
}
