/**
 * 🔔 Servicio de Alertas
 * Gestiona alertas de inventario y pronósticos
 * @version 1.0.0
 */

import { db } from "../firebase.js";
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  updateDoc,
  Timestamp 
} from "https://www.gstatic.com/firebasejs/10.1.0/firebase-firestore.js";
// El sistema de métricas se carga globalmente
import { predecirDemandaCafeteria } from "./predictionService.js";
import { obtenerProductosStockBajo } from "./inventoryService.js";

/**
 * Configura alertas de inventario
 * @param {string} cafeteriaId - ID de la cafetería
 * @param {object} config - Configuración de alertas
 * @returns {Promise<object>} - Resultado de la operación
 */
export async function configurarAlertasInventario(cafeteriaId, config) {
  try {
    const alertaConfigRef = doc(db, 'alertasConfig', cafeteriaId);
    
    const configuracion = {
      cafeteriaId: cafeteriaId,
      alertaStockBajo: config.alertaStockBajo !== undefined ? config.alertaStockBajo : true,
      umbralStockBajo: config.umbralStockBajo || 20, // Porcentaje
      alertaStockAgotado: config.alertaStockAgotado !== undefined ? config.alertaStockAgotado : true,
      alertaDesperdicio: config.alertaDesperdicio !== undefined ? config.alertaDesperdicio : true,
      umbralDesperdicio: config.umbralDesperdicio || 10, // Porcentaje
      alertaPrediccion: config.alertaPrediccion !== undefined ? config.alertaPrediccion : true,
      frecuenciaAlertas: config.frecuenciaAlertas || 'diaria', // diaria, semanal, mensual
      notificacionesEmail: config.notificacionesEmail !== undefined ? config.notificacionesEmail : false,
      emailContacto: config.emailContacto || '',
      fechaActualizacion: Timestamp.now()
    };
    
    if (typeof consultaFirebaseConMetricas === 'function') {
      await consultaFirebaseConMetricas('setDoc', 'alertasConfig', () => setDoc(alertaConfigRef, configuracion, { merge: true }));
    } else {
      await setDoc(alertaConfigRef, configuracion, { merge: true });
    }
    
    return {
      success: true,
      configuracion: configuracion
    };
  } catch (error) {
    console.error('Error al configurar alertas:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Obtiene la configuración de alertas
 * @param {string} cafeteriaId - ID de la cafetería
 * @returns {Promise<object>} - Configuración de alertas
 */
export async function obtenerConfiguracionAlertas(cafeteriaId) {
  try {
    const alertaConfigRef = doc(db, 'alertasConfig', cafeteriaId);
    const configDoc = typeof consultaFirebaseConMetricas === 'function'
      ? await consultaFirebaseConMetricas('getDoc', 'alertasConfig', () => getDoc(alertaConfigRef))
      : await getDoc(alertaConfigRef);
    
    if (!configDoc.exists()) {
      // Configuración por defecto
      return {
        success: true,
        configuracion: {
          alertaStockBajo: true,
          umbralStockBajo: 20,
          alertaStockAgotado: true,
          alertaDesperdicio: true,
          umbralDesperdicio: 10,
          alertaPrediccion: true,
          frecuenciaAlertas: 'diaria',
          notificacionesEmail: false,
          emailContacto: ''
        }
      };
    }
    
    return {
      success: true,
      configuracion: configDoc.data()
    };
  } catch (error) {
    console.error('Error al obtener configuración:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Verifica y genera alertas de inventario
 * @param {string} cafeteriaId - ID de la cafetería
 * @returns {Promise<object>} - Resultado de la verificación
 */
export async function verificarYGenerarAlertas(cafeteriaId) {
  try {
    const config = await obtenerConfiguracionAlertas(cafeteriaId);
    
    if (!config.success) {
      return {
        success: false,
        error: 'Error al obtener configuración'
      };
    }
    
    const alertasGeneradas = [];
    
    // Verificar stock bajo
    if (config.configuracion.alertaStockBajo) {
      const productosBajo = await obtenerProductosStockBajo(cafeteriaId);
      if (productosBajo.success) {
        for (const producto of productosBajo.productos) {
          const porcentajeStock = (producto.stockActual / producto.stockMinimo) * 100;
          if (porcentajeStock <= config.configuracion.umbralStockBajo) {
            await crearAlerta(cafeteriaId, 'stock_bajo', {
              producto: producto.nombre,
              stockActual: producto.stockActual,
              stockMinimo: producto.stockMinimo,
              porcentaje: porcentajeStock.toFixed(2)
            });
            alertasGeneradas.push({
              tipo: 'stock_bajo',
              producto: producto.nombre
            });
          }
        }
      }
    }
    
    // Verificar predicciones (demanda alta vs stock bajo)
    if (config.configuracion.alertaPrediccion) {
      const fecha = new Date().toISOString().split('T')[0];
      const predicciones = await predecirDemandaCafeteria(cafeteriaId, fecha);
      
      if (predicciones.success) {
        for (const pred of predicciones.predicciones) {
          const menu = pred.menu;
          const stockActual = menu.stock || 0;
          const demandaPredicha = pred.demandaPredicha;
          
          if (stockActual < demandaPredicha * 0.5) {
            await crearAlerta(cafeteriaId, 'demanda_alta', {
              menu: menu.nombre,
              stockActual: stockActual,
              demandaPredicha: demandaPredicha,
              diferencia: demandaPredicha - stockActual
            });
            alertasGeneradas.push({
              tipo: 'demanda_alta',
              menu: menu.nombre
            });
          }
        }
      }
    }
    
    return {
      success: true,
      alertasGeneradas: alertasGeneradas.length,
      alertas: alertasGeneradas
    };
  } catch (error) {
    console.error('Error al verificar alertas:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Crea una alerta
 * @param {string} cafeteriaId - ID de la cafetería
 * @param {string} tipo - Tipo de alerta
 * @param {object} datos - Datos de la alerta
 */
async function crearAlerta(cafeteriaId, tipo, datos) {
  try {
    // Verificar si ya existe una alerta similar no leída
    const q = query(
      collection(db, 'alertas'),
      where('cafeteriaId', '==', cafeteriaId),
      where('tipo', '==', tipo),
      where('leida', '==', false),
      orderBy('fecha', 'desc')
    );
    
    const existing = typeof consultaFirebaseConMetricas === 'function'
      ? await consultaFirebaseConMetricas('getDocs', 'alertas', () => getDocs(q))
      : await getDocs(q);
    
    // Si existe una alerta reciente (últimas 24 horas), no crear otra
    if (!existing.empty) {
      const ultimaAlerta = existing.docs[0].data();
      const horasDesdeUltima = (Date.now() - ultimaAlerta.fecha.toMillis()) / (1000 * 60 * 60);
      if (horasDesdeUltima < 24) {
        return; // Ya existe una alerta reciente
      }
    }
    
    const mensajes = {
      stock_bajo: `Stock bajo de ${datos.producto}. Stock actual: ${datos.stockActual}, Mínimo: ${datos.stockMinimo}`,
      stock_agotado: `Stock agotado de ${datos.producto}`,
      demanda_alta: `Demanda predicha alta para ${datos.menu}. Stock actual: ${datos.stockActual}, Demanda predicha: ${datos.demandaPredicha}`,
      desperdicio_alto: `Desperdicio alto detectado: ${datos.motivo}`
    };
    
    const alertaRef = doc(collection(db, 'alertas'));
    if (typeof consultaFirebaseConMetricas === 'function') {
      await consultaFirebaseConMetricas('setDoc', 'alertas', () => setDoc(alertaRef, {
        tipo: tipo,
        cafeteriaId: cafeteriaId,
        mensaje: mensajes[tipo] || 'Alerta generada',
        datos: datos,
        fecha: Timestamp.now(),
        leida: false,
        prioridad: tipo === 'stock_agotado' ? 'alta' : tipo === 'demanda_alta' ? 'media' : 'baja'
      }));
    } else {
      await setDoc(alertaRef, {
        tipo: tipo,
        cafeteriaId: cafeteriaId,
        mensaje: mensajes[tipo] || 'Alerta generada',
        datos: datos,
        fecha: Timestamp.now(),
        leida: false,
        prioridad: tipo === 'stock_agotado' ? 'alta' : tipo === 'demanda_alta' ? 'media' : 'baja'
      });
    }
  } catch (error) {
    console.error('Error al crear alerta:', error);
  }
}

/**
 * Obtiene pronósticos de consumo
 * @param {string} cafeteriaId - ID de la cafetería
 * @param {number} dias - Número de días a pronosticar
 * @returns {Promise<object>} - Pronósticos de consumo
 */
export async function obtenerPronosticosConsumo(cafeteriaId, dias = 7) {
  try {
    const pronosticos = [];
    const fechaActual = new Date();
    
    for (let i = 0; i < dias; i++) {
      const fecha = new Date(fechaActual);
      fecha.setDate(fecha.getDate() + i);
      const fechaStr = fecha.toISOString().split('T')[0];
      
      const predicciones = await predecirDemandaCafeteria(cafeteriaId, fechaStr);
      
      if (predicciones.success) {
        const demandaTotal = predicciones.predicciones.reduce((sum, p) => sum + p.demandaPredicha, 0);
        
        pronosticos.push({
          fecha: fechaStr,
          demandaTotal: demandaTotal,
          totalMenus: predicciones.totalMenus,
          predicciones: predicciones.predicciones
        });
      }
    }
    
    return {
      success: true,
      pronosticos: pronosticos,
      periodo: `${dias} días`
    };
  } catch (error) {
    console.error('Error al obtener pronósticos:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Programa verificación automática de alertas
 * @param {string} cafeteriaId - ID de la cafetería
 * @param {string} frecuencia - Frecuencia de verificación (diaria, semanal, mensual)
 */
export async function programarVerificacionAlertas(cafeteriaId, frecuencia = 'diaria') {
  try {
    const programacionRef = doc(db, 'programacionesAlertas', cafeteriaId);
    
    if (typeof consultaFirebaseConMetricas === 'function') {
      await consultaFirebaseConMetricas('setDoc', 'programacionesAlertas', () => setDoc(programacionRef, {
        cafeteriaId: cafeteriaId,
        frecuencia: frecuencia,
        ultimaVerificacion: Timestamp.now(),
        proximaVerificacion: calcularProximaVerificacion(frecuencia),
        activa: true
      }, { merge: true }));
    } else {
      await setDoc(programacionRef, {
        cafeteriaId: cafeteriaId,
        frecuencia: frecuencia,
        ultimaVerificacion: Timestamp.now(),
        proximaVerificacion: calcularProximaVerificacion(frecuencia),
        activa: true
      }, { merge: true });
    }
    
    return {
      success: true
    };
  } catch (error) {
    console.error('Error al programar verificación:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Calcula la próxima fecha de verificación
 * @param {string} frecuencia - Frecuencia de verificación
 * @returns {Timestamp} - Próxima fecha de verificación
 */
function calcularProximaVerificacion(frecuencia) {
  const ahora = new Date();
  const proxima = new Date();
  
  switch (frecuencia) {
    case 'diaria':
      proxima.setDate(proxima.getDate() + 1);
      break;
    case 'semanal':
      proxima.setDate(proxima.getDate() + 7);
      break;
    case 'mensual':
      proxima.setMonth(proxima.getMonth() + 1);
      break;
    default:
      proxima.setDate(proxima.getDate() + 1);
  }
  
  return Timestamp.fromDate(proxima);
}

