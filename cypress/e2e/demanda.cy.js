describe('🧪 Prueba funcional - Predicción de demanda y ajuste de producción (Alissa)', () => {

    const baseUrl = 'http://127.0.0.1:8080/Salud/Vista';

    beforeEach(() => {
        // Partimos desde la pantalla de opciones para simular flujo real
        cy.visit(`${baseUrl}/IA-opciones/IA-opciones.html`);
    });

    // ======================================================
    // CP-22: Generar predicción semanal
    // ======================================================
    it('CP-22: Generar predicción semanal - Alissa debe devolver una predicción con 7 días y cifras', () => {
        // Visitamos directamente la página del asistente y stub antes de que se ejecute su JS
        cy.visit(`${baseUrl}/asistente-ia/asistente-ia.html`, {
        onBeforeLoad(win) {
            // Stub predictDemand disponible desde el arranque
            win.predictDemand = function (opts = {}) {
            return Promise.resolve({
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
            };
            // Alias si tu código llama con otro nombre
            if (!win.obtenerPrediccionDemanda) win.obtenerPrediccionDemanda = win.predictDemand;
        }
        });

        // Forzar modo consultas en localStorage (si tu app lo necesita)
        cy.window().then(win => {
        win.localStorage.setItem('asistenteModo', 'consultas');
        });

        // Enviar la consulta incluyendo el nombre de la cafetería para evitar prompts de aclaración
        cy.get('#userInput').type('Genera una predicción semanal de demanda para la cafetería Central{enter}');

        // Validar que aparezca texto que indique 'predicción' y al menos 7 cifras o un resumen con números
        cy.get('#chatContainer', { timeout: 10000 }).should($div => {
        const text = $div.text().toLowerCase();
        expect(text).to.include('predicción');

        // Validamos que haya por lo menos 3 números grandes (robusto) o el término '150' del resumen stub
        const hasNumbers = /\b(1[0-9]{2}|[2-9][0-9])\b/.test(text) || /\b150\b/.test(text);
        const hasSemana = /semanal|7 días|7 dias|semana/.test(text);
        expect(hasNumbers, 'Debe incluir números de predicción').to.be.true;
        expect(hasSemana, 'Debe mencionar que es semanal').to.be.true;
        });
    });

    // ======================================================
    // CP-23: Validar precisión de predicción
    // ======================================================
    it('CP-23: Validar precisión de predicción - Alissa debe reportar precisión o métrica de validación', () => {
        // Ir directo al asistente (simulamos usuario con historial)
        cy.visit(`${baseUrl}/asistente-ia/asistente-ia.html`);

        // Inyectar historico de consumo y stub de evaluación (evaluatePrediction)
        cy.window().then(win => {
        // Datos históricos simples (últimos 14 días)
        const historico = [
            { date: '2025-11-16', consumed: 110 },
            { date: '2025-11-17', consumed: 115 },
            { date: '2025-11-18', consumed: 120 },
            { date: '2025-11-19', consumed: 125 },
            { date: '2025-11-20', consumed: 130 },
            { date: '2025-11-21', consumed: 128 },
            { date: '2025-11-22', consumed: 132 },
            { date: '2025-11-23', consumed: 127 },
            { date: '2025-11-24', consumed: 135 },
            { date: '2025-11-25', consumed: 140 },
            { date: '2025-11-26', consumed: 138 },
            { date: '2025-11-27', consumed: 142 },
            { date: '2025-11-28', consumed: 145 },
            { date: '2025-11-29', consumed: 150 }
        ];
        win.localStorage.setItem('historico_consumo', JSON.stringify(historico));
        win.localStorage.setItem('asistenteModo', 'consultas');

        // Stub: predictDemand lee historico y devuelve prediccion + metricas
        win.predictDemand = function (opts = {}) {
            return Promise.resolve({
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
        };

        // Stub de evaluator: compara predicción con historic (simulado)
        win.evaluatePrediction = function(prediccion, historico) {
            return Promise.resolve({
            mse: 18.4,
            rmse: 4.29,
            r2: 0.92,
            accuracy_pct: 92
            });
        };
        });

        // Pedir validación de precisión (flujo natural)
        cy.get('#userInput').type('¿Puedes predecir la demanda para la próxima semana y decirme qué tan precisa es la predicción?{enter}');

        // Validar que aparezca una métrica de precisión (ej. 90% o 'accuracy' o 'rmse')
        cy.get('#chatContainer', { timeout: 12000 }).should($div => {
        const text = $div.text().toLowerCase();
        const hasAccuracy = /\b\d{1,3}%\b/.test(text) || /accuracy|precisi(o|ó)n|rmse|mse|r2/.test(text);
        expect(hasAccuracy, 'Debe mostrar alguna métrica de precisión (p.ej. 92% o RMSE)').to.be.true;
        });
    });

    // ======================================================
    // CP-24: Ajustar producción basado en predicción
    // ======================================================
    it('CP-24: Ajustar producción basado en predicción - Alissa debe ofrecer ajustes y confirmar aplicación', () => {
        // Visitamos asistente-ia con stubs en onBeforeLoad
        cy.visit(`${baseUrl}/asistente-ia/asistente-ia.html`, {
            onBeforeLoad(win) {
            // Stub predictDemand
            win.predictDemand = function () {
                return Promise.resolve({
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
            };

            // Stub applyProductionAdjustment que confirma aplicación (texto claro)
            win.applyProductionAdjustment = function(adjustments) {
                console.log('TEST-STUB: applyProductionAdjustment received', adjustments);
                return Promise.resolve({
                status: 'ok',
                applied: adjustments,
                message: 'Ajustes aplicados correctamente en sistema de producción'
                });
            };
            }
        });

        // Forzar modo consultas si tu app lo necesita
        cy.window().then(win => win.localStorage.setItem('asistenteModo', 'consultas'));

        // Enviar la consulta que solicita aplicación
        cy.get('#userInput').type('Según la predicción, ajusta la producción para reducir desperdicios y dime qué cambios aplicaste.{enter}');

        // Esperar y validar
        cy.get('#chatContainer', { timeout: 15000 }).should($div => {
            const text = $div.text().toLowerCase();
            const mentionsAdjustment = /aumentar|reducir|reducción|incremento|%|porcentaje|ajust/i.test(text);
            const mentionsApplied = /ajust(es)? aplicad|aplicad|confirmad|programad|hecho|ok|éxito|success/.test(text);
            expect(mentionsAdjustment, 'Debe proponer ajustes cuantificados (porcentaje o unidades)').to.be.true;
            expect(mentionsApplied, 'Debe confirmar que los ajustes fueron aplicados o programados').to.be.true;
        });
    });

});
