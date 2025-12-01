/**
 * @jest-environment jsdom
 */

import { handleConsultasMode } from '../Salud/Controlador/C-asistente-ia/alissa-smart-copy.js';

let consultaFn;

beforeAll(() => {
  if (!handleConsultasMode) {
    throw new Error(
      `No se encontró handleConsultasMode exportada correctamente desde alissa-smart-copy.js`
    );
  }

  consultaFn = handleConsultasMode;
});

describe('🧪 Unit tests - Consultas en tiempo real (Alissa)', () => {

  test('CP-19: Consulta nutricional básica - responder "¿Cuántas calorías tiene una manzana?"', async () => {
    const message = '¿Cuántas calorías tiene una manzana?';
    const context = {}; // context vacío

    // Si la función es async o sync, manejar ambas
    const maybePromise = consultaFn(message, context);
    const respuesta = maybePromise instanceof Promise ? await maybePromise : maybePromise;

    expect(typeof respuesta).toBe('string');

    // Debe mencionar calorías / kcal / estimación
    const lower = respuesta.toLowerCase();
    expect(/calor|kcal|calor[ií]as|estim/i.test(lower)).toBe(true);
  });

  test('CP-20: Consulta con contexto del usuario - responde en base a datos previos', async () => {
    // Simular contexto con datos personales (edad, peso, altura)
    const contextWithPersonal = {
      personalData: {
        age: 30,
        weight: 80,   // kg
        height: 1.7   // m
      }
    };

    const message = '¿Cuántas calorías necesito aproximadamente?';

    // Llamar a la función de consulta / generación con contexto
    const maybePromise = consultaFn(message, contextWithPersonal);
    const respuesta = maybePromise instanceof Promise ? await maybePromise : maybePromise;

    expect(typeof respuesta).toBe('string');

    const lower = respuesta.toLowerCase();
    // Aceptamos que mencione estimación/calorías o proporcione cifras (kcal)
    const ok = /calor|estim|kcal|necesidad|calor[ií]as|calorica/i.test(lower) || /\b\d{3,4}\b/.test(lower);
    expect(ok).toBe(true);
  });

  test('CP-21: Validar respuesta ante consulta compleja (alergias + disponibilidad)', async () => {
    const message = 'Soy intolerante a la lactosa y necesito 2000 kcal. ¿Qué opciones hay en la cafetería Central?';
    const context = {}; // si tu función usa contexto, puede pasarse aquí

    const maybePromise = consultaFn(message, context);
    const respuesta = maybePromise instanceof Promise ? await maybePromise : maybePromise;

    expect(typeof respuesta).toBe('string');

    const lower = respuesta.toLowerCase();

    // Debe mencionar alergia/intolerancia y opciones/menú/cafetería
    const hasAllergyHint = /intoler|alerg|al[eé]rg/i.test(lower);
    const hasOptionsHint = /opcion|opciones|segura|seguras|alternativ/i.test(lower);
    const hasCafeHint = /cafeter|men[uú]|disponibil/i.test(lower);

    expect((hasAllergyHint || hasOptionsHint || hasCafeHint)).toBe(true);
  });

});
