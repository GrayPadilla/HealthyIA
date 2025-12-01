describe('Gestión de Usuarios – Healthy IA (admin)', () => {

    const baseUrl = 'http://127.0.0.1:8080'; // Ajusta si tu live-server usa otro puerto

    beforeEach(() => {
        cy.clearCookies();
        cy.clearLocalStorage();
        cy.visit(`${baseUrl}/Administrador/admin/admin.html`);
    });

    // ------------------------------------------------------------------
    // CP-31: Navegar a la sección Usuarios
    // ------------------------------------------------------------------
    it('CP-31: Navegar a Gestión de Usuarios', () => {
        cy.get('.menu-item[data-section="users"]').click();
        cy.get('#users').should('have.class', 'active-section');
        cy.get('#section-title').should('contain', 'Usuarios');
    });

    // ------------------------------------------------------------------
    // CP-32: Validar que el filtro de búsqueda existe y funciona
    // ------------------------------------------------------------------
    it('CP-32: Buscar usuario por nombre/email (real)', () => {
        cy.get('.menu-item[data-section="users"]').click();
        cy.get('#users table tbody tr', { timeout: 10000 })
            .should('have.length.at.least', 1)
            .first()
            .then($row => {
                const nombre = $row.find('td').eq(0).text().trim();
                const email = $row.find('td').eq(1).text().trim();
                const terminoBusqueda = nombre || email;
                cy.get('#users input[type="text"]').clear().type(terminoBusqueda);
                cy.get('#users table tbody tr')
                    .should('have.length', 1)
                    .first()
                    .should('contain', terminoBusqueda);
            });
    });

    // ------------------------------------------------------------------
    // CP-33: Mostrar modal de edición de usuario
    // ------------------------------------------------------------------
    it('CP-33: Mostrar modal al editar usuario', () => {
        cy.get('.menu-item[data-section="users"]').click();

        cy.get('#users table tbody tr', { timeout: 8000 })
            .should('have.length.at.least', 1);

        cy.get('.action-btn.edit-btn[data-type="user"]').first().click();

        cy.get('#user-modal').should('be.visible');
        cy.get('#user-email').should('not.have.value', '');
    });

    // ------------------------------------------------------------------
    // CP-34: Validar campos obligatorios en el modal
    // ------------------------------------------------------------------
    it('CP-34: Validación de campos obligatorios en modal', () => {
        cy.get('.menu-item[data-section="users"]').click();
        cy.get('#users table tbody tr').should('have.length.at.least', 1);
        cy.get('.action-btn.edit-btn[data-type="user"]').first().click();
        cy.get('#user-email').clear();
        cy.on('window:alert', msg => {
            expect(msg).to.match(/obligatorio/i);
        });
        cy.get('#user-form button[type="submit"]').click();
    });

    // ------------------------------------------------------------------
    // CP-35: Guardar cambios en un usuario
    // ------------------------------------------------------------------
    it('CP-35: Guardar actualización exitosa de usuario', () => {
        cy.get('.menu-item[data-section="users"]').click();
        cy.get('#users table tbody tr', { timeout: 8000 })
            .should('have.length.at.least', 1);
        cy.get('.action-btn.edit-btn[data-type="user"]').first().click();
        cy.get('#user-nombre').clear().type('Usuario Modificado');
        cy.get('#user-rol').select('admin');
        cy.on('window:alert', msg => {
            expect(msg).to.include('guardado');
        });
        cy.get('#user-form button[type="submit"]').click();
        cy.get('#user-modal').should('not.be.visible');
    });

    // ------------------------------------------------------------------
    // CP-36: Cambiar estado de usuario a Inactivo
    // ------------------------------------------------------------------
    it('CP-36: Cambiar estado Activo → Inactivo', () => {
        cy.get('.menu-item[data-section="users"]').click();
        cy.get('#users table tbody tr', { timeout: 8000 })
            .should('have.length.at.least', 1);
        cy.get('.action-btn.edit-btn[data-type="user"]').first().click();
        cy.get('#user-activo').select('false');
        cy.on('window:alert', msg => {
            expect(msg).to.include('guardado');
        });
        cy.get('#user-form button[type="submit"]').click();
    });

    // ------------------------------------------------------------------
    // CP-38: Verificar carga mínima de tabla de usuarios
    // ------------------------------------------------------------------
    it('CP-38: Verificar tabla inicial de usuarios', () => {
        cy.get('.menu-item[data-section="users"]').click();

        cy.get('#users table thead tr th').should('have.length.at.least', 6);
        cy.get('#users table tbody').should('exist');
    });

    // ------------------------------------------------------------------
    // CP-39: Seleccionar filtrado por columna (si aplica en UI)
    // ------------------------------------------------------------------
    it('CP-39: Filtrar por rol usuario/admin si el sistema lo soporta', () => {
        cy.get('.menu-item[data-section="users"]').click();

        cy.get('#users table tbody').then(tbody => {
            tbody[0].innerHTML = `
                <tr><td>A</td><td>a@a.com</td><td>usuario</td><td>-</td><td>Activo</td><td></td></tr>
                <tr><td>B</td><td>b@b.com</td><td>administrador</td><td>-</td><td>Activo</td><td></td></tr>
            `;
        });

        cy.get('#users input[type="text"]').type('administrador');

        cy.get('#users table tbody tr')
            .should('have.length', 1)
            .and('contain', 'administrador');
    });

    // ------------------------------------------------------------------
    // CP-40: Validar actualización de usuario inválida (email mal formado)
    // ------------------------------------------------------------------
    it('CP-40: Email inválido en edición de usuario', () => {
        cy.get('.menu-item[data-section="users"]').click();
        cy.get('#users table tbody tr', { timeout: 8000 })
            .should('have.length.at.least', 1);
        cy.get('.action-btn.edit-btn[data-type="user"]').first().click();
        cy.get('#user-email').clear().type('correo_invalido');
        cy.on('window:alert', msg => {
            expect(msg).to.match(/email.*inválido|incorrecto/i);
        });
        cy.get('#user-form button[type="submit"]').click();
    });

});
