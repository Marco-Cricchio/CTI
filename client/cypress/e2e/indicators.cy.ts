describe('Indicators CRUD Flow', () => {
  beforeEach(() => {
    // Esegui il login e arriva sulla dashboard prima di ogni test
    cy.login();
    // Il comando login già ci porta alla dashboard, non serve visitare di nuovo
  });

  it('should create a new indicator successfully (happy path)', () => {
    // Test di Creazione Indicatore (Happy Path)
    // Scenario: L'utente apre la modale, compila il form e crea un nuovo indicatore
    
    const newIndicator = {
      id: 'new-indicator-123',
      value: '10.0.0.1',
      type: 'ip',
      threat_level: 'critical',
      is_active: true,
      first_seen: new Date().toISOString(),
      last_seen: new Date().toISOString(),
      created_by: {
        id: 'user-123',
        email: 'analyst@cyberforge.com',
        role: 'analyst'
      }
    };

    // Mock della richiesta POST per creare indicatore
    cy.intercept('POST', '**/indicators', {
      statusCode: 201,
      body: newIndicator,
    }).as('createIndicator');

    // Mock per refreshing della lista dopo creazione
    cy.intercept('GET', '**/indicators?*', {
      statusCode: 200,
      body: {
        data: [newIndicator, ...require('../fixtures/indicators.json').data],
        total: 5,
        page: 1,
        limit: 10
      }
    }).as('refreshIndicators');

    // Mock per refreshing delle stats
    cy.intercept('GET', '**/indicators/stats', {
      statusCode: 200,
      body: {
        newIocs24h: 13, // Incrementato di 1
        criticalAlerts: 4, // Incrementato di 1 per critical
        totalActiveIndicators: 48, // Incrementato di 1
        activeInvestigations: 5,
        dataFeeds: 8
      }
    }).as('refreshStats');

    // Azioni: apertura modale e compilazione form
    cy.get('[data-cy=new-indicator-button]').click();
    
    // Verifica che la modale sia aperta
    cy.get('[data-cy=modal]').should('be.visible');
    cy.get('[data-cy=indicator-form]').should('be.visible');

    // Compila i campi del form
    cy.get('[data-cy=indicator-form-value]').type('10.0.0.1');
    cy.get('[data-cy=indicator-form-type]').select('ip');
    cy.get('[data-cy=indicator-form-threat-level]').select('critical');
    
    // Submit del form
    cy.get('[data-cy=indicator-form-submit]').click();

    // Asserzioni
    cy.wait('@createIndicator').then((interception) => {
      expect(interception.request.body).to.deep.include({
        value: '10.0.0.1',
        type: 'ip',
        threat_level: 'critical'
      });
    });

    // Verifica che la modale si chiuda
    cy.get('[data-cy=modal]').should('not.exist');

    // Attendi refresh dei dati
    cy.wait(['@refreshIndicators', '@refreshStats']);

    // Verifica che il nuovo indicatore appaia nella tabella
    cy.get('[data-cy=indicator-table]').should('contain', '10.0.0.1');
    cy.get('[data-cy=indicator-table]').should('contain', 'critical');
  });

  it('should edit an existing indicator successfully', () => {
    // Test di Modifica Indicatore
    // Scenario: L'utente modifica un indicatore esistente dalla tabella
    
    const originalIndicator = require('../fixtures/indicators.json').data[0];
    const updatedIndicator = {
      ...originalIndicator,
      threat_level: 'critical', // Cambiamo da 'high' a 'critical'
      last_seen: new Date().toISOString()
    };

    // Mock della richiesta PATCH per aggiornare indicatore
    cy.intercept('PATCH', `**/indicators/${originalIndicator.id}`, {
      statusCode: 200,
      body: updatedIndicator,
    }).as('updateIndicator');

    // Mock per refreshing della lista dopo modifica
    const updatedList = require('../fixtures/indicators.json');
    updatedList.data[0] = updatedIndicator;
    
    cy.intercept('GET', '**/indicators?*', {
      statusCode: 200,
      body: updatedList
    }).as('refreshIndicatorsAfterEdit');

    // Mock per refreshing delle stats
    cy.intercept('GET', '**/indicators/stats', {
      statusCode: 200,
      body: {
        newIocs24h: 12,
        criticalAlerts: 4, // Incrementato perché abbiamo cambiato high -> critical
        totalActiveIndicators: 47,
        activeInvestigations: 5,
        dataFeeds: 8
      }
    }).as('refreshStatsAfterEdit');

    // Azioni: clicca sul pulsante di modifica del primo indicatore
    cy.get(`[data-cy=edit-button-${originalIndicator.id}]`).click();
    
    // Verifica che la modale sia aperta con i dati precompilati
    cy.get('[data-cy=modal]').should('be.visible');
    cy.get('[data-cy=indicator-form]').should('be.visible');
    cy.get('[data-cy=indicator-form-value]').should('have.value', originalIndicator.value);
    cy.get('[data-cy=indicator-form-type]').should('have.value', originalIndicator.type);
    cy.get('[data-cy=indicator-form-threat-level]').should('have.value', originalIndicator.threat_level);

    // Modifica il threat level
    cy.get('[data-cy=indicator-form-threat-level]').select('critical');
    
    // Submit del form
    cy.get('[data-cy=indicator-form-submit]').click();

    // Asserzioni
    cy.wait('@updateIndicator').then((interception) => {
      expect(interception.request.body).to.deep.include({
        value: originalIndicator.value,
        type: originalIndicator.type,
        threat_level: 'critical'
      });
    });

    // Verifica che la modale si chiuda
    cy.get('[data-cy=modal]').should('not.exist');

    // Attendi refresh dei dati
    cy.wait(['@refreshIndicatorsAfterEdit', '@refreshStatsAfterEdit']);

    // Verifica che l'indicatore nella tabella mostri i dati aggiornati
    cy.get(`[data-cy=indicator-row-${originalIndicator.id}]`).should('contain', 'critical');
  });

  it('should delete an indicator successfully', () => {
    // Test di Eliminazione Indicatore
    // Scenario: L'utente elimina un indicatore dalla tabella
    
    const indicatorToDelete = require('../fixtures/indicators.json').data[0];
    
    // Mock della richiesta DELETE
    cy.intercept('DELETE', `**/indicators/${indicatorToDelete.id}`, {
      statusCode: 200,
      body: { message: 'Indicator deleted successfully' },
    }).as('deleteIndicator');

    // Mock per refreshing della lista dopo eliminazione (senza l'elemento eliminato)
    const remainingIndicators = require('../fixtures/indicators.json');
    remainingIndicators.data = remainingIndicators.data.slice(1); // Rimuovi il primo elemento
    remainingIndicators.total = 3;
    
    cy.intercept('GET', '**/indicators?*', {
      statusCode: 200,
      body: remainingIndicators
    }).as('refreshIndicatorsAfterDelete');

    // Mock per refreshing delle stats
    cy.intercept('GET', '**/indicators/stats', {
      statusCode: 200,
      body: {
        newIocs24h: 11, // Decrementato di 1
        criticalAlerts: 2, // Decrementato se era critical
        totalActiveIndicators: 46, // Decrementato di 1
        activeInvestigations: 5,
        dataFeeds: 8
      }
    }).as('refreshStatsAfterDelete');

    // Stub della finestra di conferma del browser
    cy.window().then((win) => {
      cy.stub(win, 'confirm').returns(true);
    });

    // Verifica che l'indicatore sia presente nella tabella
    cy.get(`[data-cy=indicator-row-${indicatorToDelete.id}]`).should('exist');
    cy.get(`[data-cy=indicator-row-${indicatorToDelete.id}]`).should('contain', indicatorToDelete.value);

    // Azioni: clicca sul pulsante di eliminazione
    cy.get(`[data-cy=delete-button-${indicatorToDelete.id}]`).click();

    // Asserzioni
    cy.wait('@deleteIndicator');

    // Attendi refresh dei dati
    cy.wait(['@refreshIndicatorsAfterDelete', '@refreshStatsAfterDelete']);

    // Verifica che l'indicatore sia scomparso dalla tabella
    cy.get(`[data-cy=indicator-row-${indicatorToDelete.id}]`).should('not.exist');
    cy.get('[data-cy=indicator-table]').should('not.contain', indicatorToDelete.value);
  });

  it('should show validation errors for empty form submission', () => {
    // Test di Validazione del Form
    // Scenario: Il form di creazione mostra errori di validazione se inviato vuoto
    
    // Azioni: apertura modale
    cy.get('[data-cy=new-indicator-button]').click();
    
    // Verifica che la modale sia aperta
    cy.get('[data-cy=modal]').should('be.visible');
    cy.get('[data-cy=indicator-form]').should('be.visible');

    // Verifica che i campi abbiano gli attributi required
    cy.get('[data-cy=indicator-form-value]').should('have.attr', 'required');

    // Verifica che il campo sia vuoto
    cy.get('[data-cy=indicator-form-value]').should('have.value', '');
    
    // Prova a submitare il form vuoto - il browser dovrebbe bloccare la submission
    cy.get('[data-cy=indicator-form-submit]').click();

    // Asserzioni: verifica che la modale rimanga aperta (il form non è stato submitato)
    cy.get('[data-cy=modal]').should('be.visible');
    cy.get('[data-cy=indicator-form]').should('be.visible');
  });

  it('should handle form validation with invalid data', () => {
    // Test aggiuntivo: gestione errori di validazione dal backend
    // Scenario: Il backend ritorna errori di validazione per dati non validi
    
    // Mock della richiesta POST che ritorna errore di validazione
    cy.intercept('POST', '**/indicators', {
      statusCode: 400,
      body: {
        message: ['value must be a valid IP address'],
        error: 'Bad Request',
        statusCode: 400
      },
    }).as('createIndicatorValidationError');

    // Azioni: apertura modale e compilazione con dati non validi
    cy.get('[data-cy=new-indicator-button]').click();
    
    cy.get('[data-cy=indicator-form]').should('be.visible');

    // Inserisci un IP non valido
    cy.get('[data-cy=indicator-form-value]').type('not-a-valid-ip');
    cy.get('[data-cy=indicator-form-type]').select('ip');
    cy.get('[data-cy=indicator-form-threat-level]').select('medium');
    
    // Submit del form
    cy.get('[data-cy=indicator-form-submit]').click();

    // Asserzioni: verifica che la richiesta venga inviata ma fallisca
    cy.wait('@createIndicatorValidationError');

    // La modale dovrebbe rimanere aperta per permettere correzioni
    cy.get('[data-cy=modal]').should('be.visible');

    // Il form dovrebbe essere ancora visibile per le correzioni
    cy.get('[data-cy=indicator-form]').should('be.visible');
  });

  it('should show filter elements are functional', () => {
    // Test semplificato: verifica che i filtri siano visibili e interattivi
    // Scenario: L'utente può interagire con i filtri della tabella
    
    // Verifica che i filtri siano visibili e abbiano le opzioni corrette
    cy.get('[data-cy=filter-type]').should('be.visible');
    cy.get('[data-cy=filter-threat-level]').should('be.visible');

    // Mock per filtro per tipo IP
    cy.intercept('GET', '**/indicators?*type=ip*', {
      statusCode: 200,
      body: {
        data: [require('../fixtures/indicators.json').data[0]],
        total: 1,
        page: 1,
        limit: 10
      }
    }).as('filterByTypeIP');

    // Test che i filtri siano funzionali
    cy.get('[data-cy=filter-type]').select('ip');
    cy.wait('@filterByTypeIP');
    
    // Verifica che il filtro sia stato applicato correttamente
    cy.get('[data-cy=filter-type]').should('have.value', 'ip');
    
    // Reset del filtro
    cy.get('[data-cy=filter-type]').select('');
    cy.get('[data-cy=filter-type]').should('have.value', '');
  });
});