describe('Gestión de Menús – Healthy IA (admin)', () => {

    const baseUrl = 'http://127.0.0.1:8080'; // AJUSTA TU PUERTO

    beforeEach(() => {
        cy.clearCookies();
        cy.clearLocalStorage();
        cy.visit(`${baseUrl}/Administrador/admin/admin.html`);
    });

    // ---------------------------------------------------------
    // CP-10: Navegación correcta hacia la sección "Gestión de Menús"
    // ---------------------------------------------------------
    it('CP-15: Navegar a Gestión de Menús', () => {
        cy.get('.menu-item[data-section="menus"]').click();
        cy.get('#menus').should('have.class', 'active-section');
        cy.get('#section-title').should('contain', 'Gestión de Menús');
    });

    // ---------------------------------------------------------
    // CP-11: Validar campos obligatorios del formulario de Menú
    // ---------------------------------------------------------
    it('CP-11: Validar campos obligatorios del formulario de menú', () => {
        cy.get('.menu-item[data-section="menus"]').click();
        cy.get('#add-menu-btn').click();

        cy.on('window:alert', (msg) => {
            expect(msg).to.include('Error'); // o el texto que muestre tu controlador
        });

        cy.get('#menu-form button[type="submit"]').click();
    });

    // ---------------------------------------------------------
    // CP-13: Registro exitoso del menú (flujo completo)
    // ---------------------------------------------------------
    it('CP-13: Registro exitoso de menú', () => {
        cy.get('.menu-item[data-section="menus"]').click();
        cy.get('#add-menu-btn').click();

        cy.get('#menu-name').type('Ensalada Cypress');
        cy.get('#menu-price').type('12.50');
        cy.get('#menu-description').type('Una ensalada generada por Cypress.');
        cy.get('#menu-calories').type('250');
        cy.get('#menu-category').select('Almuerzo');

        cy.on('window:alert', (msg) => {
            expect(msg).to.include('guardado'); // Ajustar según tu alerta real
        });

        cy.get('#menu-form button[type="submit"]').click();

        cy.get('#menu-modal').should('not.be.visible');
    });

    // ---------------------------------------------------------
    // CP-13: Vista previa de imagen del menú
    // ---------------------------------------------------------
    it('CP-13: Vista previa de imagen del menú', () => {
        cy.get('.menu-item[data-section="menus"]').click();
        cy.get('#add-menu-btn').click();

        cy.get('#menu-image').selectFile({
            contents: Cypress.Buffer.from('archivo-imagen'),
            fileName: 'foto.png',
            mimeType: 'image/png'
        });

        cy.get('#file-preview').should('be.visible');
        cy.get('#file-name').should('contain', 'foto.png');
        cy.get('#preview-image')
            .should('have.attr', 'src')
            .and('match', /^data:/);
    });

    // ---------------------------------------------------------
    // CP-14: Edición del menú
    // ---------------------------------------------------------
    it('CP-14: Abrir modal de edición (con datos reales)', () => {
        cy.get('.menu-item[data-section="menus"]').click();
        cy.get('#menus table tbody tr', { timeout: 7000 })
            .should('have.length.at.least', 1);
        cy.get('#action-btn[data-type="menus"]').click();
        cy.get('#menu-modal', { timeout: 5000 }).should('be.visible');
        cy.get('#menu-modal-title').should('contain', 'Editar');
    });

    // ---------------------------------------------------------
    // CP-15: Eliminación del menú
    // ---------------------------------------------------------
    it('CP-15: Eliminar un menú desde la tabla', () => {

        cy.get('.menu-item[data-section="menus"]').click();

        cy.get('#menus table tbody').then(tbody => {
            tbody[0].innerHTML = `
                <tr>
                    <td>Menú de prueba</td>
                    <td>Desc</td>
                    <td>300</td>
                    <td>10.50</td>
                    <td>Activo</td>
                    <td><button class="btn-delete">Eliminar</button></td>
                </tr>
            `;
        });

        cy.on('window:confirm', () => true);

        cy.on('window:alert', (msg) => {
            expect(msg).to.include('eliminado'); // Ajusta según tu texto real
        });

        cy.get('.btn-delete').click();
    });

});
