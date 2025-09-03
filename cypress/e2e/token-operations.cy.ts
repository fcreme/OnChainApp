describe('Token Operations', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  describe('Form Elements', () => {
    it('should display all form elements', () => {
      // Check for Material-UI form elements
      cy.get('[data-testid="approve-button"]').should('be.visible')
      cy.get('[data-testid="transfer-button"]').should('be.visible')
      cy.get('[data-testid="mint-button"]').should('be.visible')
      
      // Check for form fields (Material-UI TextField and Select)
      cy.get('input[placeholder="0.0"]').should('be.visible')
      cy.get('input[placeholder="0x..."]').should('be.visible')
      cy.get('div[role="button"]').contains('DAI').should('be.visible')
    })

    it('should have correct token options', () => {
      // Click on the select to open options
      cy.get('div[role="button"]').contains('DAI').click()
      cy.get('li[data-value="DAI"]').should('be.visible')
      cy.get('li[data-value="USDC"]').should('be.visible')
    })

    it('should have correct input placeholders', () => {
      cy.get('input[placeholder="0.0"]').should('be.visible')
      cy.get('input[placeholder="0x..."]').should('be.visible')
    })
  })

  describe('Form Interactions', () => {
    it('should allow selecting different tokens', () => {
      // Click on the select to open options
      cy.get('div[role="button"]').contains('DAI').click()
      cy.get('li[data-value="USDC"]').click()
      cy.get('div[role="button"]').should('contain', 'USDC')
    })

    it('should allow entering amount', () => {
      cy.get('input[placeholder="0.0"]').type('100')
      cy.get('input[placeholder="0.0"]').should('have.value', '100')
    })

    it('should allow entering address', () => {
      const testAddress = '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6'
      cy.get('input[placeholder="0x..."]').type(testAddress)
      cy.get('input[placeholder="0x..."]').should('have.value', testAddress)
    })
  })

  describe('Button States', () => {
    it('should have buttons in correct initial state', () => {
      // When not connected, buttons should be disabled
      cy.get('[data-testid="approve-button"]').should('be.disabled')
      cy.get('[data-testid="transfer-button"]').should('be.disabled')
      cy.get('[data-testid="mint-button"]').should('be.disabled')
    })

    it('should show connect wallet message when not connected', () => {
      cy.get('div').should('contain', 'Please connect your wallet to interact with the contracts')
    })
  })
})
