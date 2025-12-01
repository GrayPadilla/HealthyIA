/// <reference types="cypress" />

describe('🧪 Prueba funcional - Evaluación de hábitos (Alissa)', () => {

    beforeEach(() => {
        // Asegúrate de que el servidor esté corriendo (npm start)
        cy.visit('http://127.0.0.1:8080/Salud/Vista/IA-opciones/IA-opciones.html');
    });

    // ======================================================
    // CP-07: Validar inicio del cuestionario
    // ======================================================
    it('CP-07: Validar inicio del cuestionario', () => {
        // Hacer clic en la opción de evaluación
        cy.get('.option-card[data-mode="evaluacion"]').click();

        // Verificar redirección correcta
        cy.url().should('include', 'asistente-ia.html');

        // Verificar que el modo se guardó correctamente
        cy.window().then(win => {
        const modo = win.localStorage.getItem('asistenteModo');
        expect(modo).to.equal('evaluacion');
        });

        // Verificar mensaje inicial del cuestionario
        cy.get('#userInput').type('hola{enter}');
        cy.get('#chatContainer').should('contain.text', 'Alissa').and('contain.text', 'hábitos alimenticios');
    });

    // ======================================================
    // CP-08: Validar progreso del cuestionario
    // ======================================================
    it('CP-08: Validar progreso del cuestionario', () => {
        // Entrar directo al modo asistente (simular paso anterior)
        cy.visit('http://127.0.0.1:8080/Salud/Vista/asistente-ia/asistente-ia.html');

        // Forzar modo "evaluación" en localStorage
        cy.window().then(win => {
        win.localStorage.setItem('asistenteModo', 'evaluacion');
        });

        // Escribir una respuesta intermedia
        cy.get('#userInput').type('como mucha grasa');
        cy.get('#sendBtn').click();

        // Validar que el sistema muestre siguiente mensaje de recomendación
        cy.get('#chatContainer', { timeout: 5000 })
        .should('contain', '🍟')
        .and('contain', 'grasas saludables');
    });

    // ======================================================
    // CP-09: Validar envío final al motor de IA
    // ======================================================
    it('CP-09: Validar envío final al motor de IA', () => {
        // Entrar al asistente
        cy.visit('http://127.0.0.1:8080/Salud/Vista/asistente-ia/asistente-ia.html');

        // Forzar modo "evaluación"
        cy.window().then(win => {
        win.localStorage.setItem('asistenteModo', 'evaluacion');
        });

        // Simular completar todas las preguntas con datos personales
        cy.get('#userInput').type('Tengo 24 años, mido 1.75m y peso 70kg');
        cy.get('#sendBtn').click();

        // Verificar mensaje final de evaluación completada
        cy.get('#chatContainer', { timeout: 7000 }).should('contain', 'IMC').and('contain', 'rango saludable').and(($chat) => {
            const text = $chat.text().toLowerCase();
            expect(text).to.match(/(salud|evaluación|objetivo|peso|imc)/);
        });
    });

});
