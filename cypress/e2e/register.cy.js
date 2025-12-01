describe('Registro de perfil - Healthy IA', () => {
    const baseUrl = 'http://127.0.0.1:8080'; // Ajustar si live-server usa otro puerto

    beforeEach(() => {
        cy.clearCookies();
        cy.clearLocalStorage();
        cy.visit(`${baseUrl}/Salud/Vista/Registrar-login/register-login.html?mode=register`);
    });

    it('CP-01: Validar campos obligatorios del perfil', () => {
        cy.on('window:alert', (mensaje) => {
            expect(mensaje).to.equal('⚠️ Todos los campos son obligatorios.');
        });

        // Hacer clic sin llenar el formulario
        cy.get('#registerSubmit').click();

        cy.wait(500); // Espera corta para capturar el alert
    });

    it('CP-02: Registro exitoso de perfil', () => {
        cy.get('#email').clear().type('usuario@gmail.com');
        cy.get('#password').clear().type('ContraseñaSegura123');
        cy.get('#confirmPassword').clear().type('ContraseñaSegura123');
        cy.get('#edad').clear().type('25');
        cy.get('#genero').clear().type('Masculino');
        cy.get('#altura').clear().type('170');
        cy.get('#peso').clear().type('70');

        // Escuchar el alert del navegador
        cy.on('window:alert', (msg) => {
            expect(msg).to.include('✅ Registro guardado correctamente');
        });

        cy.get('#registerSubmit').click();

        // Verificar la redirección
        cy.url({ timeout: 10000 }).should('include', `${baseUrl}/Salud/Vista/lista-comidas/lista-comidas.html`);
    });

    it('CP-03: Validar usuario duplicado', () => {
        cy.get('#email').clear().type('bchavezos@ucvvirtual.edu.pe');
        cy.get('#password').clear().type('ContraseñaSegura123');
        cy.get('#confirmPassword').clear().type('ContraseñaSegura123');
        cy.get('#edad').clear().type('30');
        cy.get('#genero').clear().type('Femenino');
        cy.get('#altura').clear().type('160');
        cy.get('#peso').clear().type('60');

        cy.on('window:alert', (msg) => {
            expect(msg).to.include('Usuario ya registrado');
        });

        cy.get('#registerSubmit').click();
    });
});
