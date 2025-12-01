describe('Control de Desperdicios – Healthy IA (admin)', () => {

    const baseUrl = 'http://127.0.0.1:8080'; // AJUSTAR PUERTO

    beforeEach(() => {
        cy.clearCookies();
        cy.clearLocalStorage();
        cy.visit(`${baseUrl}/Administrador/admin/admin.html`);
    });

    // ---------------------------------------------------------
    // CP-23: Navegar correctamente hacia la sección Desperdicios
    // ---------------------------------------------------------
    it('CP-23: Navegar a Control de Desperdicios', () => {
        cy.get('.menu-item[data-section="waste"]').should('be.visible').click();
        cy.get('#waste', { timeout: 15000 })
            .should('have.class', 'active-section')
            .and('be.visible');
        cy.get('#waste h2').should('contain', 'Control de Desperdicios');
    });

    // ---------------------------------------------------------
    // CP-24: Validar campos obligatorios en Control de Desperdicios
    // ---------------------------------------------------------
    it('CP-24: Validar campos obligatorios', () => {
        cy.get('.menu-item[data-section="waste"]').click();
        cy.get('#waste', { timeout: 10000 })
            .should('have.class', 'active-section')
            .and('be.visible');
        cy.get('#add-waste-btn').should('be.visible').click();
        cy.on('window:alert', (msg) => {
            expect(msg).to.match(/obligatorio|faltante|completar/i);
        });
        cy.get('#waste-form button[type="submit"]').click();
    });

    // ---------------------------------------------------------
    // CP-25: Registrar desperdicio correctamente
    // ---------------------------------------------------------
    it('CP-25: Registro exitoso de desperdicio', () => {
        cy.get('.menu-item[data-section="waste"]').click();
        cy.get('#add-waste-btn').click();

        cy.get('#waste-fecha').type('2025-01-10');
        cy.get('#waste-producto').type('Tomate');
        cy.get('#waste-cantidad').type('5');
        cy.get('#waste-costo').type('12.5');
        cy.get('#waste-motivo').type('Producto en mal estado');

        cy.on('window:alert', (msg) => {
            expect(msg).to.include('guardado');
        });

        cy.get('#waste-form button[type="submit"]').click();

        cy.get('#waste-modal').should('not.be.visible');
    });

    // ---------------------------------------------------------
    // CP-26: Validación de campos numéricos (Cantidad / Costo)
    // ---------------------------------------------------------
    it('CP-26: Validar campos numéricos de desperdicio', () => {
        cy.get('.menu-item[data-section="waste"]').click();
        cy.get('#add-waste-btn').click();

        cy.get('#waste-cantidad').type('XYZ');
        cy.get('#waste-cantidad').should('have.value', '0');
        cy.get('#waste-costo').type('ABC');
        cy.get('#waste-costo').should('have.value', '0');
    });

    // ---------------------------------------------------------
    // CP-27: Edición de desperdicio en tabla
    // ---------------------------------------------------------
    it('CP-27: Editar un registro de desperdicio', () => {
        cy.get('.menu-item[data-section="waste"]').click();
        cy.wait(1500);
        cy.get('#waste table tbody tr', { timeout: 7000 })
            .should('have.length.at.least', 1);
        cy.get('.action-btn[data-type="waste"]').first().click();
        cy.get('#waste-modal')
            .should('be.visible');
        cy.get('#waste-producto')
            .clear()
            .type('Tomate');
        cy.on('window:alert', (msg) => {
            expect(msg).to.include('guardado');
        });
        cy.get('#waste-form button[type="submit"]').click();
        cy.get('#waste-modal').should('not.be.visible');
    });

    // ---------------------------------------------------------
    // CP-28: Eliminación de desperdicio
    // ---------------------------------------------------------
    it('CP-28: Eliminar un registro de desperdicio (real)', () => {
        cy.get('.menu-item[data-section="waste"]').click();
        cy.get('#waste table tbody tr', { timeout: 10000 })
            .should('have.length.at.least', 1)
            .then(($rows) => {
                const initial = $rows.length;
                cy.on('window:confirm', () => true);
                cy.get('#waste table tbody tr')
                    .first()
                    .within(() => {
                        cy.get('.action-btn.delete-btn[data-type="waste"]').click();
                    });
                cy.get('#waste table tbody tr', { timeout: 20000 })
                    .should('have.length', initial - 1);
            });
    });

    // ---------------------------------------------------------
    // CP-29: Validar métricas de desperdicio semanal/mensual visibles
    // ---------------------------------------------------------
    it('CP-29: Métricas de desperdicio visibles en UI', () => {
        cy.get('.menu-item[data-section="waste"]').click();

        cy.get('.waste-stat-card').should('have.length.at.least', 2);

        cy.get('.waste-stat-card').eq(0)
            .should('contain', 'Desperdicio Semanal');

        cy.get('.waste-stat-card').eq(1)
            .should('contain', 'Ahorro Mensual');
    });

});
