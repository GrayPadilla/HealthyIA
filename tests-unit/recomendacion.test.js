/**
 * @jest-environment jsdom
 */

import { handleRecomendacionMode } from '../Salud/Controlador/C-asistente-ia/alissa-smart-copy.js';

// Simulamos un contexto vacío
const fakeContext = { personalData: null };

describe('🧪 Recomendaciones de menú - Alissa', () => {

    test('CP-10: Generar recomendación básica', async () => {
        // ✅ ahora el contexto tiene datos para permitir recomendaciones
        const contextConDatos = { personalData: { imc: 22.5, imcCategory: 'Peso normal' } };
        const respuesta = await handleRecomendacionMode("quiero una recomendación para el desayuno", contextConDatos);
        
        expect(typeof respuesta).toBe("string");
        expect(respuesta).toContain("🍳");
        expect(respuesta.toLowerCase()).toContain("desayuno");
    });

    test('CP-11: Actualizar recomendación con nuevos hábitos', async () => {
        const contextConDatos = { personalData: { imc: 22.5, imcCategory: 'Peso normal' } };
        const respuesta = await handleRecomendacionMode("he cambiado mis hábitos y quiero nueva recomendación", contextConDatos);
        
        expect(typeof respuesta).toBe("string");
        expect(respuesta).toMatch(/actualizado|nuevo menú|hábitos/i);
        expect(respuesta).toContain("🔄"); // símbolo de actualización
    });

    test('CP-12: Validar menús sin datos suficientes', async () => {
        const respuesta = await handleRecomendacionMode("no tengo datos", fakeContext);
        
        expect(typeof respuesta).toBe("string");
        expect(respuesta).toMatch(/complete|evaluación|personalizadas/i);
        expect(respuesta).toContain("⚠️"); // símbolo de advertencia
    });
});
