/**
 * @jest-environment jsdom
 */

import { handleConsultasMode } from '../Salud/Controlador/C-asistente-ia/alissa-smart-copy.js';

describe('🧪 Unit tests - Predicción de demanda y ajuste (Alissa)', () => {

  test('CP-22: Generar predicción semanal - Alissa debe devolver una predicción con 7 días y cifras', async () => {
    // Stub predictDemand en window
    window.predictDemand = jest.fn().mockResolvedValue({
      periodo: 'semanal',
      prediccion: [
        { date: '2025-11-30', predicted: 120 },
        { date: '2025-12-01', predicted: 130 },
        { date: '2025-12-02', predicted: 125 },
        { date: '2025-12-03', predicted: 140 },
        { date: '2025-12-04', predicted: 135 },
        { date: '2025-12-05', predicted: 150 },
        { date: '2025-12-06', predicted: 145 }
      ],
      resumen: 'Se espera un aumento gradual, pico el día 2025-12-05 con 150 raciones.'
    });

    // Llamada que debe activar el bloque de predicción
    const message = 'Genera una predicción semanal de demanda para la cafetería Central';
    const context = {}; // contexto simulado si tu función lo usa

    const respuesta = await handleConsultasMode(message, context);
    expect(typeof respuesta).toBe('string');

    const lower = respuesta.toLowerCase();
    expect(lower).toMatch(/prediccion|predicción|semanal/);

    // Debe contener al menos algunos números grandes (120, 150...) -> regex robusta
    const hasNumbers = /\b(1[0-9]{2}|[2-9][0-9])\b/.test(lower) || /150/.test(lower);
    expect(hasNumbers).toBe(true);
  });

  test('CP-23: Validar precisión de predicción - Alissa debe reportar precisión o métrica de validación', async () => {
    // Inyectar histórico y stubs
    const historico = [
      { date: '2025-11-16', consumed: 110 }, { date: '2025-11-17', consumed: 115 },
      { date: '2025-11-18', consumed: 120 }, { date: '2025-11-19', consumed: 125 },
      { date: '2025-11-20', consumed: 130 }, { date: '2025-11-21', consumed: 128 },
      { date: '2025-11-22', consumed: 132 }, { date: '2025-11-23', consumed: 127 },
      { date: '2025-11-24', consumed: 135 }, { date: '2025-11-25', consumed: 140 },
      { date: '2025-11-26', consumed: 138 }, { date: '2025-11-27', consumed: 142 },
      { date: '2025-11-28', consumed: 145 }, { date: '2025-11-29', consumed: 150 }
    ];
    window.localStorage.setItem('historico_consumo', JSON.stringify(historico));
    window.localStorage.setItem('asistenteModo', 'consultas');

    // predictDemand devuelve métricas
    window.predictDemand = jest.fn().mockResolvedValue({
      periodo: 'semanal',
      prediccion: [
        { date: '2025-11-30', predicted: 152 },
        { date: '2025-12-01', predicted: 155 },
        { date: '2025-12-02', predicted: 150 },
        { date: '2025-12-03', predicted: 148 },
        { date: '2025-12-04', predicted: 160 },
        { date: '2025-12-05', predicted: 170 },
        { date: '2025-12-06', predicted: 165 }
      ],
      metrics: { mse: 18.4, rmse: 4.29, r2: 0.92, accuracy_pct: 92 }
    });

    // evaluatePrediction (si tu código la usa) también stub
    window.evaluatePrediction = jest.fn().mockResolvedValue({
      mse: 18.4, rmse: 4.29, r2: 0.92, accuracy_pct: 92
    });

    const message = '¿Puedes predecir la demanda para la próxima semana y decirme qué tan precisa es la predicción?';
    const context = {};

    const respuesta = await handleConsultasMode(message, context);
    expect(typeof respuesta).toBe('string');

    const lower = respuesta.toLowerCase();
    const hasMetric = /\b\d{1,3}%\b/.test(lower) || /accuracy|precisi[oó]n|rmse|mse|r2/.test(lower) || /\b92\b/.test(lower);
    expect(hasMetric).toBe(true);
  });

  test('CP-24: Ajustar producción basado en predicción - Alissa debe ofrecer ajustes y confirmar aplicación', async () => {
    // stub predictDemand con subida al final de la semana
    window.predictDemand = jest.fn().mockResolvedValue({
      periodo: 'semanal',
      prediccion: [
        { date: '2025-11-30', predicted: 100 },
        { date: '2025-12-01', predicted: 120 },
        { date: '2025-12-02', predicted: 140 },
        { date: '2025-12-03', predicted: 160 },
        { date: '2025-12-04', predicted: 180 },
        { date: '2025-12-05', predicted: 200 },
        { date: '2025-12-06', predicted: 220 }
      ],
      resumen: 'Crecimiento importante hacia finales de semana'
    });

    // stub applyProductionAdjustment para confirmar
    window.applyProductionAdjustment = jest.fn().mockResolvedValue({
      status: 'ok',
      applied: [{ date: '2025-12-05', action: 'aumentar', percent: 20 }],
      message: 'Ajustes aplicados correctamente en sistema de producción'
    });

    const message = 'Según la predicción, ajusta la producción para reducir desperdicios y dime qué cambios aplicaste.';
    const context = {};

    const respuesta = await handleConsultasMode(message, context);
    expect(typeof respuesta).toBe('string');

    const lower = respuesta.toLowerCase();

    const mentionsAdjustment = /aumentar|reducir|reducci[oó]n|incremento|%|porcentaje|ajust/i.test(lower);
    const mentionsApplied = /ajust(es)? aplicad|aplicad|confirmad|programad|hecho|ok|éxito|success/.test(lower);

    expect(mentionsAdjustment).toBe(true);
    expect(mentionsApplied).toBe(true);
  });

});
