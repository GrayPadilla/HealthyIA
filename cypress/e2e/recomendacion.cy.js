describe('🧪 Prueba funcional - Recomendaciones de menú (Alissa)', () => {

  beforeEach(() => {
    // Visitamos la página de opciones de IA antes de cada prueba
    cy.visit('http://127.0.0.1:8080/Salud/Vista/IA-opciones/IA-opciones.html');
  });

  it('CP-10: Generar recomendación básica', () => {
    // Hacer clic en la opción de recomendaciones
    cy.get('.option-card[data-mode="recomendacion"]').click();

    // Verificar redirección correcta
    cy.url().should('include', 'asistente-ia.html');

    // Confirmar que el modo se guardó correctamente en localStorage
    cy.window().then(win => {
      const modo = win.localStorage.getItem('asistenteModo');
      expect(modo).to.equal('recomendacion');
    });

    // Enviar un mensaje de solicitud de recomendación
    cy.get('#userInput').type('Quiero una recomendación para el desayuno{enter}');

    // Esperar a que aparezca el mensaje del sistema con menú
    cy.get('#chatContainer', { timeout: 10000 })
      .should('contain.text', '🍳')
      .and('contain.text', 'desayuno');
  });

  // ✅ CP-08 adaptado (recomendacion.cy.js)
    it('CP-11: Actualizar recomendación con nuevos hábitos', () => {
    cy.get('.option-card[data-mode="recomendacion"]').click();

    cy.url().should('include', 'asistente-ia.html');

    cy.get('#userInput').type('He cambiado mis hábitos y quiero una nueva recomendación{enter}');

    cy.get('#chatContainer', { timeout: 10000 })
        .should('contain.text', 'recomendación')
        .and(($div) => {
        const text = $div.text();
        expect(
            text.includes('menú') || text.includes('completa tu evaluación'),
            'Debe contener menú o mensaje de evaluación'
        ).to.be.true;
        });
    });

  it('CP-12: Validar menús sin datos suficientes', () => {
    cy.get('.option-card[data-mode="recomendacion"]').click();
    cy.url().should('include', 'asistente-ia.html');

    // Enviar mensaje sin datos de perfil
    cy.get('#userInput').type('No tengo datos todavía{enter}');

    // Verificar mensaje que indica falta de datos
    cy.get('#chatContainer', { timeout: 10000 }).should(($div) => {
    const text = $div.text().toLowerCase();
    expect(text.includes('evaluación') || text.includes('inicia sesión') || text.includes('hábitos'), 'Debe contener algún mensaje de falta de datos o sesión').to.be.true;
    expect(text).to.include('recomendaciones');
  });
  });

});
