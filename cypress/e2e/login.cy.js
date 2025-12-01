describe('Inicio de sesión - Healthy IA', () => {
    const baseUrl = 'http://127.0.0.1:8080'; // ajustar si live-server muestra otro puerto

    beforeEach(() => {
        cy.visit(`${baseUrl}/Salud/Vista/Registrar-login/register-login.html?mode=login`);
    });

    it('CP-04: No permite iniciar sesión si los campos están vacíos', () => {
        cy.get('#loginSubmit').click();
        // Espera un poco por si hay redirección
        cy.wait(500);
        // Asegura que sigue en la misma página
        cy.url().should('include', 'register-login.html');
    });

    it('CP-05: Inicia sesión con credenciales válidas', () => {
        // Usa un usuario que exista en tu Firestore (o puedes simular con cuentas de prueba)
        cy.get('#email').clear().type('bchavezos@ucvvirtual.edu.pe');
        cy.get('#password').clear().type('contraseña');
        cy.get('#loginSubmit').click();

        // Espera la redirección a la página principal o dashboard
        cy.url().should('include', 'lista-comidas/lista-comidas.html');
    });

    it('CP-06: Muestra mensaje de contraseña incorrecta', () => {
        cy.get('#email').clear().type('usuario@ejemplo.com');
        cy.get('#password').clear().type('contrasenaErronea');

        // Escuchar el alert
        cy.on('window:alert', (mensaje) => {
            expect(mensaje).to.match(/Usuario no encontrado|Contraseña incorrecta|error/i);
        });

        cy.get('#loginSubmit').click();
    });
});
