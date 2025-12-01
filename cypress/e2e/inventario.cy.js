describe('Gestión de Inventario – Healthy IA (admin)', () => {

    const baseUrl = 'http://127.0.0.1:8080'; // AJUSTAR PUERTO

    beforeEach(() => {
        cy.clearCookies();
        cy.clearLocalStorage();
        cy.visit(`${baseUrl}/Administrador/admin/admin.html`, {
            onBeforeLoad(win) {
                try { win.localStorage.setItem('usuarioActivo', 'test-admin-uid'); } catch (e) {}
            }
        });
        cy.window({ timeout: 10000 })
        .its('adminUIInitialized', { timeout: 10000 })
        .should('be.true');
    });

    // ---------------------------------------------------------
    // CP-16: Navegación correcta hacia la sección Inventario
    // ---------------------------------------------------------
    it('CP-16: Navegar a Gestión de Inventario', () => {
        cy.get('.menu-item[data-section="inventory"]').click();
        cy.window({ timeout: 10000 })
            .its('adminUIInitialized')
            .should('eq', true);
        cy.get('#inventory', { timeout: 10000 })
            .should('have.class', 'active-section')
            .and('be.visible');
        cy.get('#section-title').should('contain', 'Inventario');
    });

    // ---------------------------------------------------------
    // CP-17: Validar campos obligatorios del formulario de inventario
    // ---------------------------------------------------------
    it('CP-17: Validar campos obligatorios (modal inventario)', () => {
        cy.get('.menu-item[data-section="inventory"]').click();
        cy.get('#inventory', { timeout: 8000 })
            .should('have.class', 'active-section')
            .and('be.visible');
        cy.get('#add-inventory-btn').should('be.visible').click();
        cy.get('#inventory-modal', { timeout: 8000 })
            .should('exist')
            .and('be.visible');
        cy.get('#save-inventory', { timeout: 6000 })
            .should('exist')
            .and('be.visible')
            .click();
        cy.on('window:alert', (msg) => {
            expect(msg).to.match(/obligatorio|incompleto|error/i);
        });
    });

    // ---------------------------------------------------------
    // CP-22: Registrar producto correctamente
    // ---------------------------------------------------------
    it('CP-25: Registro exitoso de producto en inventario', () => {
        cy.get('.menu-item[data-section="inventory"]').click();
        cy.get('#add-inventory-btn').click();
        cy.get('#inventory-modal').should('be.visible');
        cy.get('#inv-nombre').type('Arroz Cypress');
        cy.get('#inv-categoria').type('Granos');
        cy.get('#inv-stock-actual').type('50');
        cy.get('#inv-stock-minimo').type('10');
        cy.on('window:alert', (msg) => {
            expect(msg).to.include('guardado');
        });
        cy.get('#inventory-form button[type="submit"]').click();
        cy.get('#inventory-modal').should('not.be.visible');
    });

    // ---------------------------------------------------------
    // CP-19: Validar que solo acepte números en stock
    // ---------------------------------------------------------
    it('CP-19: Validar campos numéricos en stock', () => {
        cy.get('.menu-item[data-section="inventory"]').click();
        cy.get('#add-inventory-btn').click();
        cy.get('#inv-stock-actual').type('ABC');
        cy.get('#inv-stock-actual').should('have.value', '0');
        cy.get('#inv-stock-minimo').type('XYZ');
        cy.get('#inv-stock-minimo').should('have.value', '0');
    });

    // ---------------------------------------------------------
    // CP-23: Abrir y editar producto existente
    // ---------------------------------------------------------
    it('CP-26: Abrir y editar producto existente', () => {
        cy.get('.menu-item[data-section="inventory"]').click();
        cy.wait(2000);
        cy.get('#inventory table tbody tr')
            .should('have.length.at.least', 1);
        cy.get('.action-btn.edit-btn').first().click();
        cy.get('#inventory-modal')
            .should('exist')
            .and('be.visible');
        cy.get('#inv-nombre').clear().type('Arroz Cypress Editado');
        cy.get('#inv-stock-actual').clear().type('99');
        cy.on('window:alert', (msg) => {
            expect(msg).to.include('actualizado');
        });
        cy.get('#inventory-form button[type="submit"]').click();
        cy.get('#inventory-modal').should('not.be.visible');
    });

    // ---------------------------------------------------------
    // CP-24: Eliminar un producto real desde la tabla
    // ---------------------------------------------------------
    it('CP-27: Eliminar un producto desde la tabla (real)', () => {
    cy.get('.menu-item[data-section="inventory"]').click();

    // espera a que la tabla cargue al menos 1 fila
    cy.get('#inventory table tbody tr', { timeout: 10000 })
        .should('have.length.at.least', 1)
        .then(($rows) => {
        const initial = $rows.length;

        // Asegurarnos de aceptar el confirm (poner antes del click)
        cy.on('window:confirm', () => true);

        // clickear el primer botón eliminar (o busca por producto específico)
        cy.get('#inventory table tbody tr').first().within(() => {
            cy.get('.action-btn.delete-btn').click();
        });

        // esperar a que la tabla se actualice (retry automático con timeout)
        cy.get('#inventory table tbody tr', { timeout: 20000 })
            .should('have.length', initial - 1);
        });
    });

    // ---------------------------------------------------------
    // CP-22: Comprobar indicadores visuales de stock (Bajo / Agotado)
    // ---------------------------------------------------------
    it('CP-22: Indicadores de stock bajo y agotado visibles', () => {
        cy.get('.menu-item[data-section="inventory"]').click();

        cy.get('.inventory-alerts .alert.warning')
            .should('contain', 'stock bajo');

        cy.get('.inventory-alerts .alert.danger')
            .should('contain', 'agotados');
    });

});
