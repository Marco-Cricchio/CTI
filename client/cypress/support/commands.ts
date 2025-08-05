/// <reference types="cypress" />

// Custom command for user login
Cypress.Commands.add('login', (email = 'analyst@cyberforge.com', password = 'password123') => {
  // Mock della risposta di login
  cy.intercept('POST', '**/auth/login', {
    statusCode: 200,
    body: {
      accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3OC05MGFiLWNkZWYtMTIzNC01Njc4OTBhYmNkZWYiLCJlbWFpbCI6ImFuYWx5c3RAY3liZXJmb3JnZS5jb20iLCJyb2xlIjoiYW5hbHlzdCIsImlhdCI6MTczMzQyNDAwMCwiZXhwIjoxNzMzNDI3NjAwfQ.fake_jwt_token_for_testing',
    },
  }).as('loginRequest');

  // Mock delle API che vengono chiamate dopo il login (dashboard)
  cy.intercept('GET', '**/indicators/stats', { fixture: 'stats.json' }).as('getStats');
  cy.intercept('GET', '**/indicators*', { fixture: 'indicators.json' }).as('getIndicators');

  cy.visit('/login');
  cy.get('[data-cy=email-input]').type(email);
  cy.get('[data-cy=password-input]').type(password);
  cy.get('[data-cy=login-button]').click();

  // Attendi che le chiamate API post-login siano completate
  cy.wait(['@loginRequest', '@getStats', '@getIndicators']);
  
  // Verifica che siamo stati reindirizzati alla dashboard
  cy.url().should('include', '/');
  cy.get('[data-cy=logout-button]').should('be.visible');
});

// Custom command for creating an indicator via API (for test setup)
Cypress.Commands.add('createIndicator', (indicator = {}) => {
  const defaultIndicator = {
    id: 'test-indicator-' + Date.now(),
    value: '192.168.1.100',
    type: 'ip',
    threat_level: 'medium',
    is_active: true,
    first_seen: new Date().toISOString(),
    last_seen: new Date().toISOString(),
    created_by: {
      id: 'user-123',
      email: 'analyst@cyberforge.com',
      role: 'analyst'
    }
  };

  const newIndicator = { ...defaultIndicator, ...indicator };
  
  cy.intercept('POST', '/api/indicators', {
    statusCode: 201,
    body: newIndicator,
  }).as('createIndicatorRequest');

  return cy.wrap(newIndicator);
});

declare global {
  namespace Cypress {
    interface Chainable {
      login(email?: string, password?: string): Chainable<void>
      createIndicator(indicator?: any): Chainable<any>
    }
  }
}