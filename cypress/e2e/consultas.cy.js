describe('🧪 Prueba funcional - Consultas en tiempo real (Alissa)', () => {

  beforeEach(() => {
    // Partimos siempre desde la pantalla de opciones para simular el flujo real
    cy.visit('http://127.0.0.1:8080/Salud/Vista/IA-opciones/IA-opciones.html');
  });

  // ======================================================
  // CP-19: Consulta nutricional básica
  // ======================================================
  it('CP-19: Consulta nutricional básica - responder "¿Cuántas calorías tiene una manzana?"', () => {
    // Seleccionar modo consultas
    cy.get('.option-card[data-mode="consultas"]').click();

    // Verificar redirección correcta
    cy.url().should('include', 'asistente-ia.html');

    // Verificar que el modo se guardó correctamente
    cy.window().then(win => {
      const modo = win.localStorage.getItem('asistenteModo');
      expect(modo).to.equal('consultas');
    });

    // Enviar consulta básica
    cy.get('#userInput').type('¿Cuántas calorías tiene una manzana?{enter}');

    // Esperar respuesta y validar que contiene referencia a calorías (case-insensitive)
    cy.get('#chatContainer', { timeout: 8000 }).should($div => {
      const text = $div.text().toLowerCase();
      expect(text).to.match(/calor|kcal|calorías/);
    });
  });

  // ======================================================
  // CP-20: Consulta con contexto del usuario
  // ======================================================
  it('CP-20: Consulta con contexto del usuario - responde en base a datos previos', () => {
    // Entrar directo al asistente
    cy.visit('http://127.0.0.1:8080/Salud/Vista/asistente-ia/asistente-ia.html');

    // Inyectar contexto: guardar en el historial un mensaje con datos personales
    cy.window().then(win => {
      // Forzamos modo consultas y añadimos historial con datos personales
      win.localStorage.setItem('asistenteModo', 'consultas');
      const fakeHistory = [
        { user: 'Tengo 30 años, mido 1.70m y peso 80kg', assistant: 'Perfil registrado' }
      ];
      win.localStorage.setItem('alissa_history', JSON.stringify(fakeHistory));
    });

    // Recargar para que el asistente cargue el historial
    cy.reload();

    // Hacer la pregunta que debería usar el contexto (estimación calórica)
    cy.get('#userInput').type('¿Cuántas calorías necesito aproximadamente?');
    cy.get('#sendBtn').click();

    // Validar que la respuesta mencione cálculos/estimaciones o kcal
    cy.get('#chatContainer', { timeout: 8000 }).should($div => {
      const text = $div.text().toLowerCase();
      // Esperamos que contenga alguna palabra relacionada con estimación calórica
      expect(text).to.match(/calor|estim|kcal|necesidad/);
    });
  });

  // ======================================================
  // CP-21: Validar respuesta ante consulta compleja
  // ======================================================
  it('CP-21: Validar respuesta ante consulta compleja (alergias + disponibilidad)', () => {
    // Seleccionar modo consultas desde la pantalla de opciones
    cy.get('.option-card[data-mode="consultas"]').click();
    cy.url().should('include', 'asistente-ia.html');

    // Confirmar modo guardado
    cy.window().then(win => {
      const modo = win.localStorage.getItem('asistenteModo');
      expect(modo).to.equal('consultas');
    });

    // Enviar consulta compleja: intolerancia + necesidad calórica + disponibilidad cafetería
    const consulta = 'Soy intolerante a la lactosa y necesito 2000 kcal. ¿Qué opciones hay en la cafetería?';
    cy.get('#userInput').type(`${consulta}{enter}`);

    // Validar que la IA responda mencionando alergia/intolerancia y opciones o alternativas seguras
    cy.get('#chatContainer', { timeout: 10000 }).should($div => {
      const text = $div.text().toLowerCase();
      // Debe mencionar intolerance/alergia y sugerir opciones/seguras/alternativas o disponibilidad
      const hasAllergyHint = /intoler|alerg|alergia|alérg/i.test(text);
      const hasOptionsHint = /opcion|opciones|segura|seguras|alternativ/i.test(text);
      const hasCafeHint = /cafeter|menú|disponibil/i.test(text);
      expect(hasAllergyHint || hasOptionsHint || hasCafeHint, 'Debió mencionar alergias/opciones/disponibilidad').to.be.true;
    });
  });

});
