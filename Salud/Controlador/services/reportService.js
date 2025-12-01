/**
 * 📊 Servicio de Reportes
 * Genera reportes de consumo y desperdicio
 * @version 1.0.0
 */

import { db } from "../firebase.js";
import { 
  collection, 
  doc,
  getDocs, 
  getDoc,
  query, 
  where, 
  orderBy,
  Timestamp,
  startAt,
  endAt
} from "https://www.gstatic.com/firebasejs/10.1.0/firebase-firestore.js";
// El sistema de métricas se carga globalmente

/**
 * Obtiene reporte de consumo
 * @param {string} cafeteriaId - ID de la cafetería
 * @param {string} fechaInicio - Fecha de inicio (YYYY-MM-DD)
 * @param {string} fechaFin - Fecha de fin (YYYY-MM-DD)
 * @returns {Promise<object>} - Reporte de consumo
 */
export async function obtenerReporteConsumo(cafeteriaId, fechaInicio, fechaFin) {
  try {
    const inicio = Timestamp.fromDate(new Date(fechaInicio));
    const fin = Timestamp.fromDate(new Date(fechaFin + 'T23:59:59'));
    
    // Obtener consumo
    const qConsumo = query(
      collection(db, 'consumo'),
      where('cafeteriaId', '==', cafeteriaId),
      where('timestamp', '>=', inicio),
      where('timestamp', '<=', fin),
      orderBy('timestamp', 'desc')
    );
    
    const consumoSnapshot = typeof consultaFirebaseConMetricas === 'function'
      ? await consultaFirebaseConMetricas('getDocs', 'consumo', () => getDocs(qConsumo))
      : await getDocs(qConsumo);
    const consumo = [];
    
    consumoSnapshot.forEach(doc => {
      consumo.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // Agrupar por menú
    const consumoPorMenu = {};
    let totalConsumido = 0;
    
    consumo.forEach(item => {
      if (!consumoPorMenu[item.menuId]) {
        consumoPorMenu[item.menuId] = {
          menuId: item.menuId,
          cantidad: 0,
          fechas: []
        };
      }
      consumoPorMenu[item.menuId].cantidad += item.cantidad;
      consumoPorMenu[item.menuId].fechas.push(item.fecha);
      totalConsumido += item.cantidad;
    });
    
    // Obtener detalles de menús
    const menus = [];
    for (const menuId of Object.keys(consumoPorMenu)) {
      const menuRef = doc(db, 'menus', menuId);
      const menuDoc = typeof consultaFirebaseConMetricas === 'function'
        ? await consultaFirebaseConMetricas('getDoc', 'menus', () => getDoc(menuRef))
        : await getDoc(menuRef);
      if (menuDoc.exists()) {
        menus.push({
          ...menuDoc.data(),
          consumo: consumoPorMenu[menuId].cantidad
        });
      }
    }
    
    return {
      success: true,
      reporte: {
        fechaInicio: fechaInicio,
        fechaFin: fechaFin,
        totalConsumido: totalConsumido,
        consumoPorMenu: consumoPorMenu,
        menus: menus,
        totalMenus: Object.keys(consumoPorMenu).length
      }
    };
  } catch (error) {
    console.error('Error al obtener reporte de consumo:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Obtiene reporte de desperdicio
 * @param {string} cafeteriaId - ID de la cafetería
 * @param {string} fechaInicio - Fecha de inicio (YYYY-MM-DD)
 * @param {string} fechaFin - Fecha de fin (YYYY-MM-DD)
 * @returns {Promise<object>} - Reporte de desperdicio
 */
export async function obtenerReporteDesperdicio(cafeteriaId, fechaInicio, fechaFin) {
  try {
    const inicio = Timestamp.fromDate(new Date(fechaInicio));
    const fin = Timestamp.fromDate(new Date(fechaFin + 'T23:59:59'));
    
    const q = query(
      collection(db, 'desperdicios'),
      where('cafeteriaId', '==', cafeteriaId),
      where('fecha', '>=', inicio),
      where('fecha', '<=', fin),
      orderBy('fecha', 'desc')
    );
    
    const snapshot = typeof consultaFirebaseConMetricas === 'function'
      ? await consultaFirebaseConMetricas('getDocs', 'desperdicios', () => getDocs(q))
      : await getDocs(q);
    const desperdicios = [];
    let totalCosto = 0;
    const desperdicioPorProducto = {};
    const desperdicioPorMotivo = {};
    
    snapshot.forEach(doc => {
      const data = doc.data();
      desperdicios.push({
        id: doc.id,
        ...data
      });
      
      totalCosto += data.costoEstimado || 0;
      
      // Agrupar por producto
      if (!desperdicioPorProducto[data.producto]) {
        desperdicioPorProducto[data.producto] = {
          cantidad: 0,
          costo: 0
        };
      }
      desperdicioPorProducto[data.producto].cantidad += data.cantidad;
      desperdicioPorProducto[data.producto].costo += data.costoEstimado || 0;
      
      // Agrupar por motivo
      if (!desperdicioPorMotivo[data.motivo]) {
        desperdicioPorMotivo[data.motivo] = {
          cantidad: 0,
          costo: 0,
          ocurrencias: 0
        };
      }
      desperdicioPorMotivo[data.motivo].cantidad += data.cantidad;
      desperdicioPorMotivo[data.motivo].costo += data.costoEstimado || 0;
      desperdicioPorMotivo[data.motivo].ocurrencias += 1;
    });
    
    return {
      success: true,
      reporte: {
        fechaInicio: fechaInicio,
        fechaFin: fechaFin,
        totalDesperdicios: desperdicios.length,
        totalCosto: totalCosto,
        desperdicios: desperdicios,
        desperdicioPorProducto: desperdicioPorProducto,
        desperdicioPorMotivo: desperdicioPorMotivo,
        productosAfectados: Object.keys(desperdicioPorProducto).length
      }
    };
  } catch (error) {
    console.error('Error al obtener reporte de desperdicio:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Obtiene reporte completo (consumo + desperdicio)
 * @param {string} cafeteriaId - ID de la cafetería
 * @param {string} periodo - 'semana', 'mes', 'trimestre'
 * @returns {Promise<object>} - Reporte completo
 */
export async function obtenerReporteCompleto(cafeteriaId, periodo = 'mes') {
  try {
    const fechaFin = new Date();
    let fechaInicio = new Date();
    
    switch (periodo) {
      case 'semana':
        fechaInicio.setDate(fechaInicio.getDate() - 7);
        break;
      case 'mes':
        fechaInicio.setMonth(fechaInicio.getMonth() - 1);
        break;
      case 'trimestre':
        fechaInicio.setMonth(fechaInicio.getMonth() - 3);
        break;
      default:
        fechaInicio.setMonth(fechaInicio.getMonth() - 1);
    }
    
    const fechaInicioStr = fechaInicio.toISOString().split('T')[0];
    const fechaFinStr = fechaFin.toISOString().split('T')[0];
    
    const [consumo, desperdicio] = await Promise.all([
      obtenerReporteConsumo(cafeteriaId, fechaInicioStr, fechaFinStr),
      obtenerReporteDesperdicio(cafeteriaId, fechaInicioStr, fechaFinStr)
    ]);
    
    if (!consumo.success || !desperdicio.success) {
      return {
        success: false,
        error: 'Error al generar reportes'
      };
    }
    
    // Calcular métricas adicionales
    const eficiencia = consumo.reporte.totalConsumido > 0
      ? ((consumo.reporte.totalConsumido - desperdicio.reporte.totalDesperdicios) / consumo.reporte.totalConsumido) * 100
      : 100;
    
    const reduccionDesperdicio = calcularReduccionDesperdicio(cafeteriaId, periodo);
    
    return {
      success: true,
      reporte: {
        periodo: periodo,
        fechaInicio: fechaInicioStr,
        fechaFin: fechaFinStr,
        consumo: consumo.reporte,
        desperdicio: desperdicio.reporte,
        metricas: {
          eficiencia: eficiencia.toFixed(2),
          reduccionDesperdicio: reduccionDesperdicio,
          costoTotalDesperdicio: desperdicio.reporte.totalCosto,
          totalConsumido: consumo.reporte.totalConsumido
        }
      }
    };
  } catch (error) {
    console.error('Error al obtener reporte completo:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Calcula la reducción de desperdicio comparado con el período anterior
 * @param {string} cafeteriaId - ID de la cafetería
 * @param {string} periodo - Período actual
 * @returns {number} - Porcentaje de reducción
 */
async function calcularReduccionDesperdicio(cafeteriaId, periodo) {
  try {
    const fechaFin = new Date();
    let fechaInicioActual = new Date();
    let fechaInicioAnterior = new Date();
    
    switch (periodo) {
      case 'semana':
        fechaInicioActual.setDate(fechaInicioActual.getDate() - 7);
        fechaInicioAnterior.setDate(fechaInicioAnterior.getDate() - 14);
        break;
      case 'mes':
        fechaInicioActual.setMonth(fechaInicioActual.getMonth() - 1);
        fechaInicioAnterior.setMonth(fechaInicioAnterior.getMonth() - 2);
        break;
      case 'trimestre':
        fechaInicioActual.setMonth(fechaInicioActual.getMonth() - 3);
        fechaInicioAnterior.setMonth(fechaInicioAnterior.getMonth() - 6);
        break;
    }
    
    const actual = await obtenerReporteDesperdicio(
      cafeteriaId,
      fechaInicioActual.toISOString().split('T')[0],
      fechaFin.toISOString().split('T')[0]
    );
    
    const anterior = await obtenerReporteDesperdicio(
      cafeteriaId,
      fechaInicioAnterior.toISOString().split('T')[0],
      fechaInicioActual.toISOString().split('T')[0]
    );
    
    if (anterior.reporte.totalCosto === 0) {
      return 0;
    }
    
    const reduccion = ((anterior.reporte.totalCosto - actual.reporte.totalCosto) / anterior.reporte.totalCosto) * 100;
    return reduccion.toFixed(2);
  } catch (error) {
    console.error('Error al calcular reducción:', error);
    return 0;
  }
}

