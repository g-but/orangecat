describe('Intelligent Onboarding', () => {
  it('recommends a path and advances', () => {
    // Use dev route to bypass auth for local smoke
    cy.visit('/dev/onboarding')

    // Fill description
    cy.get('[data-testid="onboarding-description"]').should('be.visible').type(
      'We run a local cat shelter with volunteers and need funding for food and medical supplies. We want a collective to manage donations.'
    )

    // Analyze
    cy.get('[data-testid="onboarding-analyze"]').should('not.be.disabled').click()

    // Recommendation appears
    cy.get('[data-testid="onboarding-recommended-title"]').should('be.visible')

    // Advance
    cy.get('[data-testid="onboarding-next"]').click()

    // Final choice tiles visible
    cy.get('[data-testid="onboarding-create-org"], [data-testid="onboarding-create-personal"]').should('exist')
  })
})

