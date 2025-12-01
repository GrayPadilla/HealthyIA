/**
 * @jest-environment jsdom
 */

import { handleEvaluacionMode } from '../Salud/Controlador/C-asistente-ia/alissa-smart-copy.js';
// Mocks de context (simulan la información analizada)
const fakeContext = { personalData: null };

describe('🧪 Evaluación de hábitos - Alissa', () => {

  test('CP-07: Validar inicio del cuestionario', () => {
    const respuesta = handleEvaluacionMode("hola", fakeContext);
    expect(respuesta).toContain("evaluar tus hábitos");
  });

  test('CP-08: Validar progreso del cuestionario', () => {
    const respuesta = handleEvaluacionMode("como mucha grasa", fakeContext);
    expect(respuesta).toContain("🍟");
    expect(respuesta).toContain("grasas saludables");
  });

  test('CP-09: Validar envío final al motor de IA (simulado)', () => {
    const contextConDatos = { personalData: { imc: 24.5, imcCategory: 'Peso normal' } };
    const respuesta = handleEvaluacionMode("tengo 24 años y peso 70kg", contextConDatos);
    expect(respuesta).toMatch(/IMC|rango saludable|Evaluación/);
  });

});
