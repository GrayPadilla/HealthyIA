/**
 * 🤖 Servicio de Predicción IA
 * Predice demanda de alimentos y sugiere ajustes en producción
 * @version 1.0.0
 */

import { db } from "../firebase.js";
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy,
  Timestamp
} from "https://www.gstatic.com/firebasejs/10.1.0/firebase-firestore.js";
// El sistema de métricas se carga globalmente

/**
 * Predice la demanda de un menú para una fecha específica
 * @param {string} menuId - ID del menú
 * @param {string} fecha - Fecha a predecir (YYYY-MM-DD)
 * @returns {Promise<object>} - Predicción de demanda
 */
export async function predecirDemandaMenu(menuId, fecha) {
  try {
    // Obtener historial de consumo del menú
    const historial = await obtenerHistorialConsumo(menuId, 30); // Últimos 30 días
    
    // Calcular factores
    const diaSemana = new Date(fecha).getDay();
    const esFinDeSemana = diaSemana === 0 || diaSemana === 6;
    
    // Algoritmo de predicción simple (promedio móvil ponderado)
    let prediccion = 0;
    
    if (historial.length > 0) {
      // Promedio de los últimos 7 días
      const ultimos7Dias = historial.slice(0, 7);
      const promedio7Dias = ultimos7Dias.reduce((sum, item) => sum + item.cantidad, 0) / ultimos7Dias.length;
      
      // Promedio de los últimos 30 días
      const promedio30Dias = historial.reduce((sum, item) => sum + item.cantidad, 0) / historial.length;
      
      // Ajuste por día de la semana
      const consumoPorDia = agruparPorDiaSemana(historial);
      const consumoDiaEspecifico = consumoPorDia[diaSemana] || promedio30Dias;
      
      // Predicción ponderada
      prediccion = (promedio7Dias * 0.5) + (promedio30Dias * 0.3) + (consumoDiaEspecifico * 0.2);
      
      // Ajuste para fines de semana
      if (esFinDeSemana) {
        prediccion = prediccion * 0.7; // Reducción del 30% en fines de semana
      }
      
      // Redondear a entero
      prediccion = Math.round(prediccion);
    } else {
      // Si no hay historial, usar valor por defecto
      prediccion = 10;
    }
    
    // Calcular intervalo de confianza
    const desviacion = calcularDesviacionEstandar(historial.map(item => item.cantidad));
    const intervaloConfianza = {
      inferior: Math.max(0, Math.round(prediccion - desviacion)),
      superior: Math.round(prediccion + desviacion)
    };
    
    return {
      success: true,
      prediccion: {
        menuId: menuId,
        fecha: fecha,
        demandaPredicha: prediccion,
        intervaloConfianza: intervaloConfianza,
        nivelConfianza: historial.length > 7 ? 'alto' : historial.length > 3 ? 'medio' : 'bajo',
        factores: {
          esFinDeSemana: esFinDeSemana,
          diaSemana: obtenerNombreDia(diaSemana),
          historialDisponible: historial.length
        }
      }
    };
  } catch (error) {
    console.error('Error al predecir demanda:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Predice la demanda para todos los menús de una cafetería
 * @param {string} cafeteriaId - ID de la cafetería
 * @param {string} fecha - Fecha a predecir (YYYY-MM-DD)
 * @returns {Promise<object>} - Predicciones para todos los menús
 */
export async function predecirDemandaCafeteria(cafeteriaId, fecha) {
  try {
    // Obtener todos los menús activos
    const q = query(
      collection(db, 'menus'),
      where('cafeteriaId', '==', cafeteriaId),
      where('disponible', '==', true)
    );
    
    const snapshot = typeof consultaFirebaseConMetricas === 'function'
      ? await consultaFirebaseConMetricas('getDocs', 'menus', () => getDocs(q))
      : await getDocs(q);
    const predicciones = [];
    
    for (const doc of snapshot.docs) {
      const menuId = doc.id;
      const prediccion = await predecirDemandaMenu(menuId, fecha);
      if (prediccion.success) {
        predicciones.push({
          menu: {
            id: menuId,
            nombre: doc.data().nombre,
            ...doc.data()
          },
          ...prediccion.prediccion
        });
      }
    }
    
    // Ordenar por demanda predicha (mayor a menor)
    predicciones.sort((a, b) => b.demandaPredicha - a.demandaPredicha);
    
    return {
      success: true,
      predicciones: predicciones,
      fecha: fecha,
      totalMenus: predicciones.length
    };
  } catch (error) {
    console.error('Error al predecir demanda de cafetería:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Sugiere ajustes en la producción basado en predicciones
 * @param {string} cafeteriaId - ID de la cafetería
 * @param {string} fecha - Fecha a predecir (YYYY-MM-DD)
 * @returns {Promise<object>} - Sugerencias de producción
 */
export async function sugerirAjustesProduccion(cafeteriaId, fecha) {
  try {
    const predicciones = await predecirDemandaCafeteria(cafeteriaId, fecha);
    
    if (!predicciones.success) {
      return {
        success: false,
        error: 'Error al obtener predicciones'
      };
    }
    
    const sugerencias = [];
    const diaSemana = new Date(fecha).getDay();
    const esFinDeSemana = diaSemana === 0 || diaSemana === 6;
    
    for (const pred of predicciones.predicciones) {
      const menu = pred.menu;
      const demandaPredicha = pred.demandaPredicha;
      const stockActual = menu.stock || 0;
      
      // Calcular sugerencia de producción
      const sugerencia = {
        menuId: menu.id,
        menuNombre: menu.nombre,
        demandaPredicha: demandaPredicha,
        stockActual: stockActual,
        accion: '',
        cantidadSugerida: 0,
        razon: ''
      };
      
      if (stockActual === 0) {
        // No hay stock, producir
        sugerencia.accion = 'producir';
        sugerencia.cantidadSugerida = demandaPredicha;
        sugerencia.razon = 'No hay stock disponible';
      } else if (stockActual < demandaPredicha * 0.5) {
        // Stock muy bajo, aumentar producción
        sugerencia.accion = 'aumentar';
        sugerencia.cantidadSugerida = demandaPredicha - stockActual;
        sugerencia.razon = `Stock bajo (${stockActual}) comparado con demanda predicha (${demandaPredicha})`;
      } else if (stockActual > demandaPredicha * 1.5) {
        // Stock muy alto, reducir producción
        sugerencia.accion = 'reducir';
        sugerencia.cantidadSugerida = stockActual - demandaPredicha;
        sugerencia.razon = `Stock alto (${stockActual}) comparado con demanda predicha (${demandaPredicha})`;
      } else {
        // Stock adecuado
        sugerencia.accion = 'mantener';
        sugerencia.cantidadSugerida = 0;
        sugerencia.razon = 'Stock adecuado para la demanda predicha';
      }
      
      // Ajuste por fin de semana
      if (esFinDeSemana && sugerencia.accion === 'aumentar') {
        sugerencia.cantidadSugerida = Math.round(sugerencia.cantidadSugerida * 0.7);
        sugerencia.razon += ' (ajustado para fin de semana)';
      }
      
      sugerencias.push(sugerencia);
    }
    
    // Calcular impacto total
    const impactoTotal = {
      reducirDesperdicio: sugerencias
        .filter(s => s.accion === 'reducir')
        .reduce((sum, s) => sum + s.cantidadSugerida, 0),
      aumentarProduccion: sugerencias
        .filter(s => s.accion === 'aumentar' || s.accion === 'producir')
        .reduce((sum, s) => sum + s.cantidadSugerida, 0),
      ahorroEstimado: 0 // Se calcularía con precios reales
    };
    
    return {
      success: true,
      sugerencias: sugerencias,
      impacto: impactoTotal,
      fecha: fecha
    };
  } catch (error) {
    console.error('Error al sugerir ajustes:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Obtiene historial de consumo de un menú
 * @param {string} menuId - ID del menú
 * @param {number} dias - Número de días de historial
 * @returns {Promise<array>} - Historial de consumo
 */
async function obtenerHistorialConsumo(menuId, dias = 30) {
  try {
    const fechaInicio = new Date();
    fechaInicio.setDate(fechaInicio.getDate() - dias);
    const inicio = Timestamp.fromDate(fechaInicio);
    
    const q = query(
      collection(db, 'consumo'),
      where('menuId', '==', menuId),
      where('timestamp', '>=', inicio),
      orderBy('timestamp', 'desc')
    );
    
    const snapshot = typeof consultaFirebaseConMetricas === 'function'
      ? await consultaFirebaseConMetricas('getDocs', 'consumo', () => getDocs(q))
      : await getDocs(q);
    const historial = [];
    
    snapshot.forEach(doc => {
      const data = doc.data();
      historial.push({
        fecha: data.fecha,
        cantidad: data.cantidad,
        timestamp: data.timestamp
      });
    });
    
    return historial;
  } catch (error) {
    console.error('Error al obtener historial:', error);
    return [];
  }
}

/**
 * Agrupa consumo por día de la semana
 * @param {array} historial - Historial de consumo
 * @returns {object} - Consumo por día de la semana
 */
function agruparPorDiaSemana(historial) {
  const consumoPorDia = {};
  
  historial.forEach(item => {
    const fecha = new Date(item.fecha);
    const diaSemana = fecha.getDay();
    
    if (!consumoPorDia[diaSemana]) {
      consumoPorDia[diaSemana] = [];
    }
    consumoPorDia[diaSemana].push(item.cantidad);
  });
  
  // Calcular promedio por día
  const promedios = {};
  Object.keys(consumoPorDia).forEach(dia => {
    const valores = consumoPorDia[dia];
    promedios[dia] = valores.reduce((sum, val) => sum + val, 0) / valores.length;
  });
  
  return promedios;
}

/**
 * Calcula la desviación estándar
 * @param {array} valores - Array de valores
 * @returns {number} - Desviación estándar
 */
function calcularDesviacionEstandar(valores) {
  if (valores.length === 0) return 0;
  
  const promedio = valores.reduce((sum, val) => sum + val, 0) / valores.length;
  const varianza = valores.reduce((sum, val) => sum + Math.pow(val - promedio, 2), 0) / valores.length;
  return Math.sqrt(varianza);
}

/**
 * Obtiene el nombre del día de la semana
 * @param {number} dia - Día de la semana (0-6)
 * @returns {string} - Nombre del día
 */
function obtenerNombreDia(dia) {
  const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  return dias[dia] || 'Desconocido';
}

