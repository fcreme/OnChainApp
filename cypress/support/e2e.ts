// ***********************************************************
// This example support/e2e.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Prevent uncaught exception from failing tests
Cypress.on('uncaught:exception', (err, runnable) => {
  // returning false here prevents Cypress from failing the test
  return false
})

// Add custom commands for wallet interactions
declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to mock wallet connection
       */
      mockWalletConnection(): Chainable<void>
      
      /**
       * Custom command to wait for wallet connection
       */
      waitForWalletConnection(): Chainable<void>
      
      /**
       * Custom command to check if connected to Sepolia
       */
      checkSepoliaNetwork(): Chainable<void>
    }
  }
}
