describe('Dashboard – Healthy IA (admin)', () => {

    beforeEach(() => {
        cy.visit('http://127.0.0.1:8080/Administrador/admin/admin.html', {
            onBeforeLoad(win) {

                // ░░░ SIMULACIÓN DE USUARIO LOGUEADO ░░░
                Object.defineProperty(win, 'auth', {
                    value: {
                        onAuthStateChanged: (cb) => {
                            cb({ uid: "test-uid" });   // <-- finge que Firebase autentica
                        }
                    }
                });

                // ░░░ SIMULAMOS TAMBIÉN LAS FUNCIONES FIREBASE USADAS EN EL DASHBOARD ░░░
                Object.defineProperty(win, 'db', {
                    value: {
                        collection: () => ({
                            get: () => Promise.resolve({
                                size: 1, 
                                docs: [{ data: () => ({}) }]
                            })
                        })
                    }
                });
            }
        });
    });

    // -----------------------------------------------------------
    // CP-41: Navegar al Dashboard activa la sección
    // -----------------------------------------------------------
    it('CP-41: Navegar al Dashboard activa la sección', () => {
        cy.get('.menu-item[data-section="dashboard"]').click();
        cy.get('#dashboard').should('have.class', 'active-section');
        cy.get('#section-title').should('contain', 'Dashboard');
    });

    // -----------------------------------------------------------
    // CP-42: loadDashboardStats se ejecuta al abrir dashboard
    // -----------------------------------------------------------
    it('CP-42: loadDashboardStats se ejecuta al abrir dashboard', () => {
        cy.get('.menu-item[data-section="dashboard"]').click();

        cy.get('.stat-card .stat-info h3', { timeout: 6000 })
            .should('exist')
            .each($v => {
                const num = parseInt($v.text().trim(), 10);
                expect(num).to.be.a('number');
            });
    });

    // ------------------------------------------------------------------
    // CP-43: Verificar las tarjetas de métricas visibles
    // ------------------------------------------------------------------
    it('CP-43: Tarjetas del dashboard visibles', () => {
        cy.get('.menu-item[data-section="dashboard"]').click();

        cy.get('.dashboard-card').should('have.length.at.least', 3);

        cy.get('.dashboard-card').each((card) => {
            cy.wrap(card).should('be.visible');
        });
    });

    // ------------------------------------------------------------------
    // CP-44: Botón "Actualizar Predicción" existe y se desactiva temporalmente
    // ------------------------------------------------------------------
    it('CP-44: Botón actualizar predicción desactiva y activa correctamente', () => {
        cy.get('.menu-item[data-section="dashboard"]').click();

        cy.get('#update-prediction').as('btn');

        cy.window().then(win => {
            win.actualizarPredicciones = cy.stub().resolves();
        });

        cy.get('@btn').click();

        // Se desactiva
        cy.get('@btn').should('be.disabled');

        // Después se debe reactivar
        cy.wait(700);
        cy.get('@btn').should('not.be.disabled');
    });

    // ------------------------------------------------------------------
    // CP-45: Botón de actualización invoca actualizarPredicciones()
    // ------------------------------------------------------------------
    it('CP-45: actualizarPredicciones es invocada al presionar botón', () => {
        cy.get('.menu-item[data-section="dashboard"]').click();

        cy.window().then(win => {
            win.actualizarPredicciones = cy.stub().resolves().as('pred');
        });

        cy.get('#update-prediction').click();

        cy.get('@pred').should('have.been.called');
    });

    // ------------------------------------------------------------------
    // CP-46: Placeholders de gráficos existen
    // ------------------------------------------------------------------
    it('CP-46: Placeholders de gráficos inicializados', () => {
        cy.get('.menu-item[data-section="dashboard"]').click();

        cy.get('.chart-placeholder').should('have.length.at.least', 1);

        cy.get('.chart-placeholder').each(ph => {
            cy.wrap(ph).should('contain.html', 'fa-chart-bar');
        });
    });

    // ------------------------------------------------------------------
    // CP-47: Cambio de periodo en reportes (si el dashboard usa select)
    // ------------------------------------------------------------------
    it('CP-47: Cambio de periodo ejecuta cargarReportes()', () => {
        cy.window().then(win => {
            win.cargarReportes = cy.stub().as('reports');
        });

        cy.get('.menu-item[data-section="dashboard"]').click();

        cy.get('#report-period').select('mensual');
        cy.get('@reports').should('have.been.calledWith', 'mensual');
    });

    // ------------------------------------------------------------------
    // CP-48: Dashboard actualiza datos al volver desde otra sección
    // ------------------------------------------------------------------
    it('CP-48: Volver al Dashboard vuelve a llamar loadDashboardStats()', () => {
        cy.window().then(win => {
            win.loadDashboardStats = cy.stub().as('stats');
        });

        // ir a otra sección
        cy.get('.menu-item[data-section="users"]').click();

        // regresar al dashboard
        cy.get('.menu-item[data-section="dashboard"]').click();

        cy.get('@stats').should('have.been.called');
    });

    // ------------------------------------------------------------------
    // CP-49: Dashboard muestra valores numéricos válidos
    // ------------------------------------------------------------------
    it('CP-49: Las tarjetas muestran valores numéricos', () => {
        cy.get('.menu-item[data-section="dashboard"]').click();

        cy.get('.dashboard-card .value').each(value => {
            cy.wrap(value).invoke('text').then(t => {
                expect(t.trim()).to.match(/^\d+$/);
            });
        });
    });

    // ------------------------------------------------------------------
    // CP-50: Validar que no se dupliquen listeners del Dashboard
    // ------------------------------------------------------------------
    it('CP-50: No duplica listeners en update-prediction', () => {
        cy.get('.menu-item[data-section="dashboard"]').click();

        cy.window().then(win => {
            win.actualizarPredicciones = cy.stub().as('pred');
        });

        // clic varias veces para detectar duplicados
        cy.get('#update-prediction').click();
        cy.wait(200);
        cy.get('#update-prediction').click();
        cy.wait(200);

        cy.get('@pred').should('have.callCount', 2); // sólo 1 por clic
    });

});
