describe('Events Table', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('should display events table structure', () => {
    cy.get('table').should('be.visible')
    cy.get('table thead').should('contain', 'Type')
    cy.get('table thead').should('contain', 'Token')
    cy.get('table thead').should('contain', 'Amount')
    cy.get('table thead').should('contain', 'From')
    cy.get('table thead').should('contain', 'To')
    cy.get('table thead').should('contain', 'Tx')
  })

  it('should show empty table when no events', () => {
    cy.get('table tbody tr').should('have.length', 0)
  })

  it('should have correct table headers', () => {
    cy.get('table thead tr th').should('have.length', 6)
    cy.get('table thead tr th').first().should('contain', 'Type')
    cy.get('table thead tr th').last().should('contain', 'Tx')
  })

  it('should navigate to transaction history page', () => {
    cy.visit('/transfers')
    cy.get('h1').should('contain', 'Transaction History')
    cy.get('p').should('contain', 'Here you can see all transactions performed')
  })

  it('should show empty state message on transfers page', () => {
    cy.visit('/transfers')
    cy.get('div').should('contain', 'No transactions yet')
    cy.get('div').should('contain', 'Perform a transfer or approval to see the history')
  })

  it('should have navigation link to transfers page', () => {
    cy.visit('/')
    cy.get('a[href="/transfers"]').should('contain', 'View All Transactions')
  })

  it('should have back to dashboard link on transfers page', () => {
    cy.visit('/transfers')
    cy.get('a[href="/"]').should('contain', 'Back to Dashboard')
  })
})
