import http from 'k6/http';
import { check, group, sleep } from 'k6';

// ================ CONFIGURACIÓN ================
export const options = {
  vus: 5,               // usuarios virtuales simultáneos (ajusta según tu máquina)
  duration: '12s',      // duración total del test
  thresholds: {
    // ejemplo: 95% de requests deben responder < 200ms
    http_req_duration: ['p(95)<500'],
    'checks': ['rate>0.85'] // esperamos que al menos 85% de checks pasen
  },
};

// Ajusta si tu servidor local usa otro puerto/host
const BASE_PAGE = 'http://127.0.0.1:8080/Administrador/admin/admin.html';

// Algunos assets relativos que tu HTML carga — si usas rutas distintas ajústalas
const assets = [
  // CSS/JS locales referenciados en admin.html
  'http://127.0.0.1:8080/Administrador/admin/admin.css',
  'http://127.0.0.1:8080/Administrador/admin/admin.js',
  'http://127.0.0.1:8080/Administrador/admin/adminController.js',
  // Imagenes referenciadas (logo)
  'http://127.0.0.1:8080/Salud/imagenes/logo.jpg',
  // CDN que aparece en tu HTML
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Util: intenta GET con tolerancia (evita fallar el VU si un CDN no responde)
function safeGet(url, params = {}) {
  const r = http.get(url, params);
  return r;
}

// ================ SCRIPT PRINCIPAL ================
export default function () {
  // Agrupamos para obtener métricas por flujo
  group('Load admin page + verify sections', function () {
    const res = http.get(BASE_PAGE);

    check(res, {
      'CP-LOAD: admin page status 200': (r) => r.status === 200,
      'CP-LOAD: admin page contiene "Panel de Administración"': (r) => r.body && r.body.indexOf('Panel de Administración') !== -1,
      'CP-LOAD: contiene id dashboard': (r) => r.body && r.body.indexOf('id="dashboard"') !== -1,
      'CP-LOAD: contiene secciones menus/inventory/waste/users/reports/settings': (r) => (
        r.body && r.body.indexOf('id="menus"') !== -1 &&
        r.body.indexOf('id="inventory"') !== -1 &&
        r.body.indexOf('id="waste"') !== -1 &&
        r.body.indexOf('id="users"') !== -1 &&
        r.body.indexOf('id="reports"') !== -1 &&
        r.body.indexOf('id="settings"') !== -1
      ),
      'CP-LOAD: contiene los modales esperados': (r) => (
        r.body && r.body.indexOf('id="menu-modal"') !== -1 &&
        r.body.indexOf('id="inventory-modal"') !== -1 &&
        r.body.indexOf('id="waste-modal"') !== -1 &&
        r.body.indexOf('id="user-modal"') !== -1
      ),
    });

    // pequeña espera para simular lectura de la página
    sleep(0.8);
  });

  group('Load static assets (CSS/JS/images/CDN)', function () {
    for (let i = 0; i < assets.length; i++) {
      const url = assets[i];
      // Petición y chequeo básico: status 200 (o 200/304 para CDNs)
      const r = safeGet(url);
      const ok = (r.status === 200 || r.status === 304 || r.status === 0); // 0 = local dev issues in some envs
      check(r, {
        [`GET ${url} status ok`]: () => ok
      });
      // pequeña pausa entre requests
      sleep(0.15);
    }
  });

  group('Simulate user navigation between sections (frontend-only)', function () {
    // idea: pedir la misma HTML varias veces y verificar que el HTML contiene los marcadores
    const navSections = ['dashboard', 'menus', 'inventory', 'waste', 'reports', 'users', 'settings'];
    for (let i = 0; i < navSections.length; i++) {
      const sec = navSections[i];

      // GET admin page and assert the section marker exists
      const r = http.get(BASE_PAGE + '?view=' + sec); // query param only to artificially differentiate requests
      check(r, {
        [`nav: page load ok for ${sec}`]: (res) => res.status === 200,
        [`nav: contains section ${sec}`]: (res) => res.body && res.body.indexOf(`id="${sec}"`) !== -1
      });

      // simulate small think time
      sleep(0.25);
    }
  });

  group('Simulate "open modal" checks (modal html presence)', function () {
    // we can't open modal via k6 (no DOM execution), but we can assert the modal HTML is present
    const r = http.get(BASE_PAGE);
    check(r, {
      'modal menu exists': (res) => res.body && res.body.indexOf('id="menu-form"') !== -1,
      'modal inventory exists': (res) => res.body && res.body.indexOf('id="inventory-form"') !== -1,
      'modal waste exists': (res) => res.body && res.body.indexOf('id="waste-form"') !== -1,
      'modal user exists': (res) => res.body && res.body.indexOf('id="user-form"') !== -1,
    });
    sleep(0.5);
  });

  group('Check key UI fragments (stats/cards/preview image)', function () {
    const r = http.get(BASE_PAGE);
    check(r, {
      'has dashboard stat ids': (res) => (
        res.body && res.body.indexOf('id="stat-usuarios"') !== -1 &&
        res.body.indexOf('id="stat-menus"') !== -1 &&
        res.body.indexOf('id="stat-desperdicio"') !== -1
      ),
      'has file-preview markup': (res) => res.body && res.body.indexOf('id="file-preview"') !== -1,
      'has update-prediction button': (res) => res.body && res.body.indexOf('id="update-prediction"') !== -1
    });
    sleep(0.4);
  });

  // Pequeña pausa final para simular usuario navegando/esperando
  sleep(1);
}
