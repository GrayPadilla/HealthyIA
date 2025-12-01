/**
 * 📊 SISTEMA DE MÉTRICAS - Healthy IA
 * 
 * Este archivo implementa un sistema completo de métricas para monitorear:
 * 1. Métricas de rendimiento (tiempo de carga)
 * 2. Métricas de uso (consultas a Firebase)
 * 3. Métricas de calidad del código (errores y warnings)
 * 4. Métricas del asistente IA (tiempo de respuesta)
 * 
 * @author Healthy IA Team
 * @version 1.0.0
 */

// ============================================
// 📦 ALMACENAMIENTO DE MÉTRICAS
// ============================================

/**
 * Objeto global que almacena todas las métricas recopiladas
 * Se guarda en localStorage para persistencia entre sesiones
 */
const Metricas = {
  // Métricas de rendimiento
  rendimiento: {
    tiemposCarga: [], // Array de tiempos de carga de funciones
    tiempoTotalCarga: null, // Tiempo total de carga de la página
    funcionesMedidas: [] // Lista de funciones que se han medido
  },
  
  // Métricas de uso
  uso: {
    consultasFirebase: [], // Array de consultas realizadas a Firebase
    totalConsultas: 0, // Contador total de consultas
    consultasExitosas: 0, // Consultas exitosas
    consultasFallidas: 0 // Consultas fallidas
  },
  
  // Métricas de calidad
  calidad: {
    errores: [], // Array de errores capturados
    warnings: [], // Array de warnings capturados
    totalErrores: 0, // Contador total de errores
    totalWarnings: 0 // Contador total de warnings
  },
  
  // Métricas del asistente IA
  asistenteIA: {
    tiemposRespuesta: [], // Array de tiempos de respuesta del asistente
    promedioRespuesta: null, // Tiempo promedio de respuesta
    totalMensajes: 0, // Total de mensajes procesados
    apiUsada: [] // API utilizada para cada respuesta
  },
  
  // Metadata
  metadata: {
    fechaInicio: new Date().toISOString(), // Fecha de inicio de la sesión
    ultimaActualizacion: null, // Última vez que se actualizaron las métricas
    version: '1.0.0'
  }
};

// ============================================
// 🚀 INICIALIZACIÓN DEL SISTEMA
// ============================================

/**
 * Inicializa el sistema de métricas
 * Carga métricas guardadas desde localStorage y configura listeners
 */
function inicializarMetricas() {
  console.log('📊 Inicializando sistema de métricas...');
  
  // Cargar métricas guardadas desde localStorage
  cargarMetricasDesdeStorage();
  
  // Configurar captura de errores globales
  configurarCapturaErrores();
  
  // Medir tiempo de carga inicial de la página
  medirTiempoCargaPagina();
  
  // Guardar métricas periódicamente
  setInterval(guardarMetricasEnStorage, 30000); // Cada 30 segundos
  
  console.log('✅ Sistema de métricas inicializado');
}

/**
 * Carga las métricas guardadas desde localStorage
 */
function cargarMetricasDesdeStorage() {
  try {
    const metricasGuardadas = localStorage.getItem('healthyIA_metricas');
    if (metricasGuardadas) {
      const metricas = JSON.parse(metricasGuardadas);
      // Mantener solo las últimas 100 entradas para no saturar el storage
      if (metricas.rendimiento.tiemposCarga.length > 100) {
        metricas.rendimiento.tiemposCarga = metricas.rendimiento.tiemposCarga.slice(-100);
      }
      if (metricas.uso.consultasFirebase.length > 100) {
        metricas.uso.consultasFirebase = metricas.uso.consultasFirebase.slice(-100);
      }
      if (metricas.asistenteIA.tiemposRespuesta.length > 100) {
        metricas.asistenteIA.tiemposRespuesta = metricas.asistenteIA.tiemposRespuesta.slice(-100);
      }
      Object.assign(Metricas, metricas);
      console.log('📥 Métricas cargadas desde localStorage');
    }
  } catch (error) {
    console.warn('⚠️ No se pudieron cargar las métricas guardadas:', error);
  }
}

/**
 * Guarda las métricas en localStorage
 */
function guardarMetricasEnStorage() {
  try {
    Metricas.metadata.ultimaActualizacion = new Date().toISOString();
    localStorage.setItem('healthyIA_metricas', JSON.stringify(Metricas));
  } catch (error) {
    console.warn('⚠️ No se pudieron guardar las métricas:', error);
  }
}

// ============================================
// ⏱️ MÉTRICAS DE RENDIMIENTO
// ============================================

/**
 * Mide el tiempo de ejecución de una función
 * Usa console.time() y console.timeEnd() internamente
 * 
 * @param {string} nombreFuncion - Nombre identificador de la función
 * @param {Function} funcion - Función a medir
 * @returns {Promise|any} - Resultado de la función
 * 
 * @example
 * await medirTiempoFuncion('cargarDatosUsuario', async () => {
 *   return await cargarDatosUsuario();
 * });
 */
function medirTiempoFuncion(nombreFuncion, funcion) {
  const inicio = performance.now();
  console.time(`⏱️ ${nombreFuncion}`);
  
  try {
    const resultado = funcion();
    
    // Si es una promesa, medir su resolución
    if (resultado instanceof Promise) {
      return resultado
        .then(res => {
          const fin = performance.now();
          const tiempo = fin - inicio;
          registrarTiempoCarga(nombreFuncion, tiempo);
          console.timeEnd(`⏱️ ${nombreFuncion}`);
          return res;
        })
        .catch(error => {
          const fin = performance.now();
          const tiempo = fin - inicio;
          registrarTiempoCarga(nombreFuncion, tiempo, true);
          console.timeEnd(`⏱️ ${nombreFuncion}`);
          throw error;
        });
    } else {
      // Función síncrona
      const fin = performance.now();
      const tiempo = fin - inicio;
      registrarTiempoCarga(nombreFuncion, tiempo);
      console.timeEnd(`⏱️ ${nombreFuncion}`);
      return resultado;
    }
  } catch (error) {
    const fin = performance.now();
    const tiempo = fin - inicio;
    registrarTiempoCarga(nombreFuncion, tiempo, true);
    console.timeEnd(`⏱️ ${nombreFuncion}`);
    throw error;
  }
}

/**
 * Registra un tiempo de carga en las métricas
 * 
 * @param {string} nombreFuncion - Nombre de la función
 * @param {number} tiempo - Tiempo en milisegundos
 * @param {boolean} conError - Si la función terminó con error
 */
function registrarTiempoCarga(nombreFuncion, tiempo, conError = false) {
  const registro = {
    funcion: nombreFuncion,
    tiempo: tiempo.toFixed(2),
    timestamp: new Date().toISOString(),
    conError: conError
  };
  
  Metricas.rendimiento.tiemposCarga.push(registro);
  Metricas.rendimiento.funcionesMedidas.push(nombreFuncion);
  
  // Mantener solo las últimas 100 mediciones
  if (Metricas.rendimiento.tiemposCarga.length > 100) {
    Metricas.rendimiento.tiemposCarga.shift();
  }
  
  // Log para el desarrollador
  console.log(`📊 Métrica de rendimiento: ${nombreFuncion} - ${tiempo.toFixed(2)}ms`);
}

/**
 * Mide el tiempo total de carga de la página
 */
function medirTiempoCargaPagina() {
  if (document.readyState === 'complete') {
    const tiempoCarga = performance.timing.loadEventEnd - performance.timing.navigationStart;
    Metricas.rendimiento.tiempoTotalCarga = tiempoCarga;
    console.log(`📊 Tiempo de carga de la página: ${tiempoCarga}ms`);
  } else {
    window.addEventListener('load', () => {
      const tiempoCarga = performance.timing.loadEventEnd - performance.timing.navigationStart;
      Metricas.rendimiento.tiempoTotalCarga = tiempoCarga;
      console.log(`📊 Tiempo de carga de la página: ${tiempoCarga}ms`);
    });
  }
}

// ============================================
// 🔥 MÉTRICAS DE USO (FIREBASE)
// ============================================

/**
 * Registra una consulta a Firebase
 * Esta función debe llamarse antes de cada consulta a Firebase
 * 
 * @param {string} tipoConsulta - Tipo de consulta (ej: 'getDocs', 'setDoc', 'getDoc')
 * @param {string} coleccion - Nombre de la colección
 * @param {object} detalles - Detalles adicionales de la consulta
 * 
 * @example
 * registrarConsultaFirebase('getDocs', 'usuarios', { filtro: 'email' });
 */
function registrarConsultaFirebase(tipoConsulta, coleccion, detalles = {}) {
  const registro = {
    tipo: tipoConsulta,
    coleccion: coleccion,
    timestamp: new Date().toISOString(),
    detalles: detalles
  };
  
  Metricas.uso.consultasFirebase.push(registro);
  Metricas.uso.totalConsultas++;
  
  // Log para el desarrollador
  console.log(`🔥 Consulta Firebase: ${tipoConsulta} en colección "${coleccion}"`, detalles);
  
  // Mantener solo las últimas 100 consultas
  if (Metricas.uso.consultasFirebase.length > 100) {
    Metricas.uso.consultasFirebase.shift();
  }
}

/**
 * Registra el resultado de una consulta a Firebase
 * 
 * @param {string} tipoConsulta - Tipo de consulta
 * @param {boolean} exitosa - Si la consulta fue exitosa
 * @param {number} tiempoRespuesta - Tiempo de respuesta en ms (opcional)
 */
function registrarResultadoConsultaFirebase(tipoConsulta, exitosa, tiempoRespuesta = null) {
  if (exitosa) {
    Metricas.uso.consultasExitosas++;
    console.log(`✅ Consulta Firebase exitosa: ${tipoConsulta}${tiempoRespuesta ? ` (${tiempoRespuesta.toFixed(2)}ms)` : ''}`);
  } else {
    Metricas.uso.consultasFallidas++;
    console.error(`❌ Consulta Firebase fallida: ${tipoConsulta}`);
  }
}

/**
 * Wrapper para consultas Firebase que automáticamente registra métricas
 * 
 * @param {string} tipoConsulta - Tipo de consulta
 * @param {string} coleccion - Nombre de la colección
 * @param {Function} consultaFuncion - Función que realiza la consulta
 * @returns {Promise} - Resultado de la consulta
 * 
 * @example
 * const resultado = await consultaFirebaseConMetricas(
 *   'getDocs',
 *   'usuarios',
 *   () => getDocs(query(collection(db, 'usuarios')))
 * );
 */
async function consultaFirebaseConMetricas(tipoConsulta, coleccion, consultaFuncion) {
  const inicio = performance.now();
  registrarConsultaFirebase(tipoConsulta, coleccion);
  
  try {
    const resultado = await consultaFuncion();
    const fin = performance.now();
    const tiempo = fin - inicio;
    registrarResultadoConsultaFirebase(tipoConsulta, true, tiempo);
    return resultado;
  } catch (error) {
    const fin = performance.now();
    const tiempo = fin - inicio;
    registrarResultadoConsultaFirebase(tipoConsulta, false, tiempo);
    registrarError('Firebase', error, { tipoConsulta, coleccion });
    throw error;
  }
}

// ============================================
// ⚠️ MÉTRICAS DE CALIDAD (ERRORES Y WARNINGS)
// ============================================

// Guardar referencias originales ANTES de interceptar para evitar bucles infinitos
// IMPORTANTE: Estas deben ser funciones nativas, no interceptadas
let originalConsoleError = null;
let originalConsoleWarn = null;
let capturaErroresConfigurada = false;
let dentroDeRegistrarError = false;
let dentroDeRegistrarWarning = false;

// Función para obtener el console.error original de forma segura
function obtenerConsoleErrorOriginal() {
  if (originalConsoleError) {
    return originalConsoleError;
  }
  // Si no está guardado, obtenerlo directamente del objeto console
  // Esto evita problemas si el script se carga múltiples veces
  const consoleObj = window.console || console;
  return consoleObj.error ? consoleObj.error.bind(consoleObj) : function() {};
}

// Función para obtener el console.warn original de forma segura
function obtenerConsoleWarnOriginal() {
  if (originalConsoleWarn) {
    return originalConsoleWarn;
  }
  const consoleObj = window.console || console;
  return consoleObj.warn ? consoleObj.warn.bind(consoleObj) : function() {};
}

/**
 * Configura la captura global de errores y warnings
 */
function configurarCapturaErrores() {
  // Prevenir múltiples configuraciones
  if (capturaErroresConfigurada) {
    return;
  }
  capturaErroresConfigurada = true;
  
  // Guardar referencias originales ANTES de interceptar
  // Usar una copia directa para evitar problemas de referencia
  try {
    if (!originalConsoleError) {
      // Obtener la función original directamente
      const consoleObj = window.console || console;
      originalConsoleError = Function.prototype.bind.call(consoleObj.error, consoleObj);
    }
    if (!originalConsoleWarn) {
      const consoleObj = window.console || console;
      originalConsoleWarn = Function.prototype.bind.call(consoleObj.warn, consoleObj);
    }
  } catch (e) {
    // Si falla, usar funciones vacías para evitar errores
    originalConsoleError = function() {};
    originalConsoleWarn = function() {};
  }
  
  // Capturar errores no manejados
  window.addEventListener('error', (event) => {
    registrarError('JavaScript', event.error || event.message, {
      archivo: event.filename,
      linea: event.lineno,
      columna: event.colno
    });
  });
  
  // Capturar promesas rechazadas
  window.addEventListener('unhandledrejection', (event) => {
    registrarError('Promise', event.reason, {
      tipo: 'unhandledrejection'
    });
  });
  
  // Interceptar console.error para capturar errores
  // IMPORTANTE: Usar una bandera para evitar bucles infinitos
  console.error = function(...args) {
    // Solo registrar si no estamos dentro de registrarError para evitar bucle infinito
    if (!dentroDeRegistrarError) {
      dentroDeRegistrarError = true;
      try {
        registrarError('Console', args.join(' '), { tipo: 'console.error' });
      } catch (e) {
        // Si hay error al registrar, usar el console.error original
        originalConsoleError('Error al registrar error:', e);
      } finally {
        dentroDeRegistrarError = false;
      }
    }
    // Siempre llamar al console.error original
    originalConsoleError.apply(console, args);
  };
  
  // Interceptar console.warn para capturar warnings
  console.warn = function(...args) {
    // Solo registrar si no estamos dentro de registrarWarning para evitar bucle infinito
    if (!dentroDeRegistrarWarning) {
      dentroDeRegistrarWarning = true;
      try {
        registrarWarning('Console', args.join(' '), { tipo: 'console.warn' });
      } catch (e) {
        // Si hay error al registrar, usar el console.warn original
        originalConsoleWarn('Error al registrar warning:', e);
      } finally {
        dentroDeRegistrarWarning = false;
      }
    }
    // Siempre llamar al console.warn original
    originalConsoleWarn.apply(console, args);
  };
}

/**
 * Registra un error en las métricas
 * 
 * @param {string} tipo - Tipo de error
 * @param {Error|string} error - Objeto Error o mensaje de error
 * @param {object} contexto - Contexto adicional del error
 */
function registrarError(tipo, error, contexto = {}) {
  // Si ya estamos dentro de registrarError, NO hacer nada para evitar bucle infinito
  if (dentroDeRegistrarError) {
    return;
  }
  
  dentroDeRegistrarError = true;
  
  try {
    const registro = {
      tipo: tipo,
      mensaje: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : null,
      timestamp: new Date().toISOString(),
      contexto: contexto
    };
    
    Metricas.calidad.errores.push(registro);
    Metricas.calidad.totalErrores++;
    
    // Mantener solo los últimos 50 errores
    if (Metricas.calidad.errores.length > 50) {
      Metricas.calidad.errores.shift();
    }
    
    // Log para el desarrollador - USAR función segura que NUNCA llama a console.error
    try {
      const logOriginal = obtenerConsoleErrorOriginal();
      if (logOriginal && typeof logOriginal === 'function') {
        logOriginal(`❌ Error registrado [${tipo}]:`, error, contexto);
      }
    } catch (logError) {
      // Si falla el log, simplemente ignorar para evitar más errores
    }
    
    // Guardar métricas después de registrar error (con manejo de errores)
    try {
      guardarMetricasEnStorage();
    } catch (e) {
      // Si falla guardar, no hacer nada para evitar más errores
    }
  } catch (e) {
    // Si hay error al registrar, intentar usar el console.error original de forma segura
    try {
      const logOriginal = obtenerConsoleErrorOriginal();
      if (logOriginal && typeof logOriginal === 'function') {
        logOriginal('Error crítico al registrar error:', e);
      }
    } catch (logError) {
      // Si incluso esto falla, no hacer nada más
    }
  } finally {
    dentroDeRegistrarError = false;
  }
}

/**
 * Registra un warning en las métricas
 * 
 * @param {string} tipo - Tipo de warning
 * @param {string} mensaje - Mensaje de warning
 * @param {object} contexto - Contexto adicional del warning
 */
function registrarWarning(tipo, mensaje, contexto = {}) {
  // Si ya estamos dentro de registrarWarning, NO hacer nada para evitar bucle infinito
  if (dentroDeRegistrarWarning) {
    return;
  }
  
  dentroDeRegistrarWarning = true;
  
  try {
    const registro = {
      tipo: tipo,
      mensaje: String(mensaje),
      timestamp: new Date().toISOString(),
      contexto: contexto
    };
    
    Metricas.calidad.warnings.push(registro);
    Metricas.calidad.totalWarnings++;
    
    // Mantener solo los últimos 50 warnings
    if (Metricas.calidad.warnings.length > 50) {
      Metricas.calidad.warnings.shift();
    }
    
    // Log para el desarrollador - USAR función segura que NUNCA llama a console.warn
    try {
      const logOriginal = obtenerConsoleWarnOriginal();
      if (logOriginal && typeof logOriginal === 'function') {
        logOriginal(`⚠️ Warning registrado [${tipo}]:`, mensaje, contexto);
      }
    } catch (logError) {
      // Si falla el log, simplemente ignorar para evitar más errores
    }
  } catch (e) {
    // Si hay error al registrar, intentar usar el console.warn original de forma segura
    try {
      const logOriginal = obtenerConsoleWarnOriginal();
      if (logOriginal && typeof logOriginal === 'function') {
        logOriginal('Error crítico al registrar warning:', e);
      }
    } catch (logError) {
      // Si incluso esto falla, no hacer nada más
    }
  } finally {
    dentroDeRegistrarWarning = false;
  }
}

// ============================================
// 🤖 MÉTRICAS DEL ASISTENTE IA
// ============================================

/**
 * Mide el tiempo de respuesta del asistente IA
 * Esta función debe llamarse cuando el asistente IA comienza a procesar un mensaje
 * 
 * @param {string} mensajeUsuario - Mensaje del usuario
 * @param {Function} funcionIA - Función que procesa el mensaje
 * @returns {Promise} - Respuesta del asistente IA
 * 
 * @example
 * const respuesta = await medirTiempoRespuestaIA(
 *   'Hola Alissa',
 *   () => processMessage('Hola Alissa')
 * );
 */
async function medirTiempoRespuestaIA(mensajeUsuario, funcionIA) {
  const inicio = performance.now();
  console.time('🤖 Tiempo de respuesta IA');
  
  try {
    const respuesta = await funcionIA();
    const fin = performance.now();
    const tiempo = fin - inicio;
    
    registrarTiempoRespuestaIA(tiempo, 'exitoso', mensajeUsuario);
    console.timeEnd('🤖 Tiempo de respuesta IA');
    
    return respuesta;
  } catch (error) {
    const fin = performance.now();
    const tiempo = fin - inicio;
    
    registrarTiempoRespuestaIA(tiempo, 'error', mensajeUsuario, error);
    console.timeEnd('🤖 Tiempo de respuesta IA');
    
    throw error;
  }
}

/**
 * Registra el tiempo de respuesta del asistente IA
 * 
 * @param {number} tiempo - Tiempo en milisegundos
 * @param {string} estado - Estado de la respuesta ('exitoso' o 'error')
 * @param {string} mensaje - Mensaje del usuario
 * @param {Error} error - Error si hubo alguno
 * @param {string} apiUsada - API utilizada (opcional)
 */
function registrarTiempoRespuestaIA(tiempo, estado, mensaje, error = null, apiUsada = 'local') {
  const registro = {
    tiempo: tiempo.toFixed(2),
    estado: estado,
    mensaje: mensaje.substring(0, 100), // Limitar longitud del mensaje
    timestamp: new Date().toISOString(),
    apiUsada: apiUsada,
    error: error ? error.message : null
  };
  
  Metricas.asistenteIA.tiemposRespuesta.push(registro);
  Metricas.asistenteIA.totalMensajes++;
  Metricas.asistenteIA.apiUsada.push(apiUsada);
  
  // Calcular promedio de tiempos de respuesta
  const tiempos = Metricas.asistenteIA.tiemposRespuesta.map(r => parseFloat(r.tiempo));
  const promedio = tiempos.reduce((a, b) => a + b, 0) / tiempos.length;
  Metricas.asistenteIA.promedioRespuesta = promedio.toFixed(2);
  
  // Log para el desarrollador
  console.log(`🤖 Métrica IA: ${tiempo.toFixed(2)}ms (${estado}) - API: ${apiUsada}`);
  
  // Mantener solo las últimas 100 respuestas
  if (Metricas.asistenteIA.tiemposRespuesta.length > 100) {
    Metricas.asistenteIA.tiemposRespuesta.shift();
  }
  
  // Guardar métricas después de registrar respuesta
  guardarMetricasEnStorage();
}

// ============================================
// 📊 GENERACIÓN DE REPORTES
// ============================================

/**
 * Genera un reporte completo de todas las métricas
 * Este reporte se muestra en la consola con formato legible
 * 
 * @returns {object} - Objeto con el reporte de métricas
 */
function generarReporteMetricas() {
  const reporte = {
    fecha: new Date().toLocaleString('es-ES'),
    rendimiento: {
      tiempoTotalCarga: Metricas.rendimiento.tiempoTotalCarga
        ? `${Metricas.rendimiento.tiempoTotalCarga}ms`
        : 'No disponible',
      totalFuncionesMedidas: Metricas.rendimiento.tiemposCarga.length,
      promedioTiempo: calcularPromedioTiempos(),
      funcionesMasLentas: obtenerFuncionesMasLentas(5)
    },
    uso: {
      totalConsultas: Metricas.uso.totalConsultas,
      consultasExitosas: Metricas.uso.consultasExitosas,
      consultasFallidas: Metricas.uso.consultasFallidas,
      tasaExito: Metricas.uso.totalConsultas > 0
        ? `${((Metricas.uso.consultasExitosas / Metricas.uso.totalConsultas) * 100).toFixed(2)}%`
        : '0%'
    },
    calidad: {
      totalErrores: Metricas.calidad.totalErrores,
      totalWarnings: Metricas.calidad.totalWarnings,
      ultimosErrores: Metricas.calidad.errores.slice(-5)
    },
    asistenteIA: {
      totalMensajes: Metricas.asistenteIA.totalMensajes,
      promedioRespuesta: Metricas.asistenteIA.promedioRespuesta
        ? `${Metricas.asistenteIA.promedioRespuesta}ms`
        : 'No disponible',
      tiempoMasRapido: obtenerTiempoMasRapido(),
      tiempoMasLento: obtenerTiempoMasLento()
    }
  };
  
  return reporte;
}

/**
 * Muestra el reporte de métricas en la consola con formato visual
 */
function mostrarReporteMetricas() {
  const reporte = generarReporteMetricas();
  
  console.log('%c📊 REPORTE DE MÉTRICAS - Healthy IA', 'font-size: 20px; font-weight: bold; color: #2563eb;');
  console.log('='.repeat(60));
  console.log(`Fecha: ${reporte.fecha}`);
  console.log('');
  
  console.log('%c⏱️ MÉTRICAS DE RENDIMIENTO', 'font-size: 16px; font-weight: bold; color: #10b981;');
  console.log(`  • Tiempo de carga de la página: ${reporte.rendimiento.tiempoTotalCarga}`);
  console.log(`  • Total de funciones medidas: ${reporte.rendimiento.totalFuncionesMedidas}`);
  console.log(`  • Tiempo promedio: ${reporte.rendimiento.promedioTiempo}`);
  console.log(`  • Funciones más lentas:`, reporte.rendimiento.funcionesMasLentas);
  console.log('');
  
  console.log('%c🔥 MÉTRICAS DE USO (Firebase)', 'font-size: 16px; font-weight: bold; color: #f59e0b;');
  console.log(`  • Total de consultas: ${reporte.uso.totalConsultas}`);
  console.log(`  • Consultas exitosas: ${reporte.uso.consultasExitosas}`);
  console.log(`  • Consultas fallidas: ${reporte.uso.consultasFallidas}`);
  console.log(`  • Tasa de éxito: ${reporte.uso.tasaExito}`);
  console.log('');
  
  console.log('%c⚠️ MÉTRICAS DE CALIDAD', 'font-size: 16px; font-weight: bold; color: #ef4444;');
  console.log(`  • Total de errores: ${reporte.calidad.totalErrores}`);
  console.log(`  • Total de warnings: ${reporte.calidad.totalWarnings}`);
  if (reporte.calidad.ultimosErrores.length > 0) {
    console.log(`  • Últimos errores:`, reporte.calidad.ultimosErrores);
  }
  console.log('');
  
  console.log('%c🤖 MÉTRICAS DEL ASISTENTE IA', 'font-size: 16px; font-weight: bold; color: #8b5cf6;');
  console.log(`  • Total de mensajes: ${reporte.asistenteIA.totalMensajes}`);
  console.log(`  • Tiempo promedio de respuesta: ${reporte.asistenteIA.promedioRespuesta}`);
  console.log(`  • Tiempo más rápido: ${reporte.asistenteIA.tiempoMasRapido}`);
  console.log(`  • Tiempo más lento: ${reporte.asistenteIA.tiempoMasLento}`);
  console.log('');
  
  console.log('='.repeat(60));
  console.log('%c💡 Tip: Usa Metricas en la consola para ver todas las métricas', 'color: #6b7280; font-style: italic;');
}

/**
 * Calcula el tiempo promedio de las funciones medidas
 * 
 * @returns {string} - Tiempo promedio en ms
 */
function calcularPromedioTiempos() {
  if (Metricas.rendimiento.tiemposCarga.length === 0) {
    return 'No disponible';
  }
  
  const tiempos = Metricas.rendimiento.tiemposCarga.map(r => parseFloat(r.tiempo));
  const promedio = tiempos.reduce((a, b) => a + b, 0) / tiempos.length;
  return `${promedio.toFixed(2)}ms`;
}

/**
 * Obtiene las funciones más lentas
 * 
 * @param {number} cantidad - Cantidad de funciones a retornar
 * @returns {array} - Array de funciones más lentas
 */
function obtenerFuncionesMasLentas(cantidad = 5) {
  if (Metricas.rendimiento.tiemposCarga.length === 0) {
    return [];
  }
  
  const funciones = [...Metricas.rendimiento.tiemposCarga]
    .sort((a, b) => parseFloat(b.tiempo) - parseFloat(a.tiempo))
    .slice(0, cantidad)
    .map(r => ({
      funcion: r.funcion,
      tiempo: `${r.tiempo}ms`
    }));
  
  return funciones;
}

/**
 * Obtiene el tiempo más rápido de respuesta del asistente IA
 * 
 * @returns {string} - Tiempo más rápido en ms
 */
function obtenerTiempoMasRapido() {
  if (Metricas.asistenteIA.tiemposRespuesta.length === 0) {
    return 'No disponible';
  }
  
  const tiempos = Metricas.asistenteIA.tiemposRespuesta.map(r => parseFloat(r.tiempo));
  const minimo = Math.min(...tiempos);
  return `${minimo.toFixed(2)}ms`;
}

/**
 * Obtiene el tiempo más lento de respuesta del asistente IA
 * 
 * @returns {string} - Tiempo más lento en ms
 */
function obtenerTiempoMasLento() {
  if (Metricas.asistenteIA.tiemposRespuesta.length === 0) {
    return 'No disponible';
  }
  
  const tiempos = Metricas.asistenteIA.tiemposRespuesta.map(r => parseFloat(r.tiempo));
  const maximo = Math.max(...tiempos);
  return `${maximo.toFixed(2)}ms`;
}

// ============================================
// 🌐 EXPORTAR PARA USO GLOBAL
// ============================================

// Hacer disponible globalmente
window.Metricas = Metricas;
window.inicializarMetricas = inicializarMetricas;
window.medirTiempoFuncion = medirTiempoFuncion;
window.registrarConsultaFirebase = registrarConsultaFirebase;
window.consultaFirebaseConMetricas = consultaFirebaseConMetricas;
window.medirTiempoRespuestaIA = medirTiempoRespuestaIA;
window.registrarTiempoRespuestaIA = registrarTiempoRespuestaIA;
window.registrarError = registrarError;
window.registrarWarning = registrarWarning;
window.generarReporteMetricas = generarReporteMetricas;
window.mostrarReporteMetricas = mostrarReporteMetricas;

// Inicializar automáticamente cuando se carga el script
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', inicializarMetricas);
} else {
  inicializarMetricas();
}

// Mostrar reporte automáticamente después de 5 segundos de carga
setTimeout(() => {
  mostrarReporteMetricas();
}, 5000);

// Mostrar reporte cuando se presiona una combinación de teclas (Ctrl + Shift + M)
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.shiftKey && e.key === 'M') {
    e.preventDefault();
    mostrarReporteMetricas();
  }
});

console.log('📊 Sistema de métricas cargado. Presiona Ctrl+Shift+M para ver el reporte.');

