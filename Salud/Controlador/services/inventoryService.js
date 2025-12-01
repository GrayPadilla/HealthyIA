/**
 * 📦 Servicio de Gestión de Inventario
 * Gestiona inventario y alertas de stock
 * @version 1.0.0
 */

import { db } from "../firebase.js";
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  deleteDoc, 
  updateDoc,
  Timestamp 
} from "https://www.gstatic.com/firebasejs/10.1.0/firebase-firestore.js";
import { validateData, validateNumber } from "../utils/securityUtils.js";
// El sistema de métricas se carga globalmente

/**
 * Esquema de validación para inventario
 */
const INVENTORY_SCHEMA = {
  nombre: { type: 'string', required: true },
  categoria: { type: 'string', required: true },
  stockActual: { type: 'number', required: true, min: 0 },
  stockMinimo: { type: 'number', required: true, min: 0 },
  stockMaximo: { type: 'number', required: false, min: 0 },
  unidad: { type: 'string', required: true },
  precioUnitario: { type: 'number', required: false, min: 0 },
  fechaVencimiento: { type: 'string', required: false },
  proveedor: { type: 'string', required: false }
};

/**
 * Crea un nuevo producto en inventario
 * @param {object} productData - Datos del producto
 * @param {string} cafeteriaId - ID de la cafetería
 * @returns {Promise<object>} - Resultado de la operación
 */
export async function crearProductoInventario(productData, cafeteriaId) {
  try {
    const validation = validateData(productData, INVENTORY_SCHEMA);
    if (!validation.valid) {
      return {
        success: false,
        error: 'Datos inválidos',
        errors: validation.errors
      };
    }
    
    const productId = doc(collection(db, 'inventario')).id;
    const productRef = doc(db, 'inventario', productId);
    
    const product = {
      ...validation.data,
      id: productId,
      cafeteriaId: cafeteriaId,
      fechaCreacion: Timestamp.now(),
      fechaActualizacion: Timestamp.now(),
      estado: validation.data.stockActual <= validation.data.stockMinimo ? 'bajo' : 'normal'
    };
    
    if (typeof consultaFirebaseConMetricas === 'function') {
      await consultaFirebaseConMetricas('setDoc', 'inventario', () => setDoc(productRef, product));
    } else {
      await setDoc(productRef, product);
    }
    
    // Verificar si necesita alerta
    if (product.estado === 'bajo') {
      await crearAlertaInventario(productId, 'stock_bajo', product);
    }
    
    return {
      success: true,
      productId: productId,
      product: product
    };
  } catch (error) {
    console.error('Error al crear producto:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Obtiene todos los productos del inventario
 * @param {string} cafeteriaId - ID de la cafetería
 * @returns {Promise<array>} - Lista de productos
 */
export async function obtenerInventario(cafeteriaId) {
  try {
    const q = query(
      collection(db, 'inventario'),
      where('cafeteriaId', '==', cafeteriaId),
      orderBy('fechaActualizacion', 'desc')
    );
    
    const querySnapshot = typeof consultaFirebaseConMetricas === 'function'
      ? await consultaFirebaseConMetricas('getDocs', 'inventario', () => getDocs(q))
      : await getDocs(q);
    const productos = [];
    
    querySnapshot.forEach(doc => {
      productos.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return {
      success: true,
      productos: productos
    };
  } catch (error) {
    console.error('Error al obtener inventario:', error);
    return {
      success: false,
      error: error.message,
      productos: []
    };
  }
}

/**
 * Actualiza el stock de un producto
 * @param {string} productId - ID del producto
 * @param {number} cantidad - Cantidad a agregar/quitar (puede ser negativo)
 * @returns {Promise<object>} - Resultado de la operación
 */
export async function actualizarStock(productId, cantidad) {
  try {
    if (!validateNumber(cantidad)) {
      return {
        success: false,
        error: 'Cantidad inválida'
      };
    }
    
    const productRef = doc(db, 'inventario', productId);
    const productDoc = typeof consultaFirebaseConMetricas === 'function'
      ? await consultaFirebaseConMetricas('getDoc', 'inventario', () => getDoc(productRef))
      : await getDoc(productRef);
    
    if (!productDoc.exists()) {
      return {
        success: false,
        error: 'Producto no encontrado'
      };
    }
    
    const productData = productDoc.data();
    const nuevoStock = Math.max(0, productData.stockActual + cantidad);
    const estado = nuevoStock <= productData.stockMinimo ? 'bajo' : 'normal';
    
    if (typeof consultaFirebaseConMetricas === 'function') {
      await consultaFirebaseConMetricas('updateDoc', 'inventario', () => updateDoc(productRef, {
        stockActual: nuevoStock,
        estado: estado,
        fechaActualizacion: Timestamp.now()
      }));
    } else {
      await updateDoc(productRef, {
        stockActual: nuevoStock,
        estado: estado,
        fechaActualizacion: Timestamp.now()
      });
    }
    
    // Verificar alertas
    if (estado === 'bajo' && productData.estado !== 'bajo') {
      await crearAlertaInventario(productId, 'stock_bajo', { ...productData, stockActual: nuevoStock });
    }
    
    if (nuevoStock === 0) {
      await crearAlertaInventario(productId, 'stock_agotado', { ...productData, stockActual: nuevoStock });
    }
    
    return {
      success: true,
      nuevoStock: nuevoStock,
      estado: estado
    };
  } catch (error) {
    console.error('Error al actualizar stock:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Obtiene productos con stock bajo
 * @param {string} cafeteriaId - ID de la cafetería
 * @returns {Promise<array>} - Lista de productos con stock bajo
 */
export async function obtenerProductosStockBajo(cafeteriaId) {
  try {
    const q = query(
      collection(db, 'inventario'),
      where('cafeteriaId', '==', cafeteriaId),
      where('estado', '==', 'bajo')
    );
    
    const querySnapshot = typeof consultaFirebaseConMetricas === 'function'
      ? await consultaFirebaseConMetricas('getDocs', 'inventario', () => getDocs(q))
      : await getDocs(q);
    const productos = [];
    
    querySnapshot.forEach(doc => {
      productos.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return {
      success: true,
      productos: productos
    };
  } catch (error) {
    console.error('Error al obtener productos con stock bajo:', error);
    return {
      success: false,
      error: error.message,
      productos: []
    };
  }
}

/**
 * Crea una alerta de inventario
 * @param {string} productId - ID del producto
 * @param {string} tipo - Tipo de alerta
 * @param {object} productData - Datos del producto
 */
async function crearAlertaInventario(productId, tipo, productData) {
  try {
    const alertaRef = doc(collection(db, 'alertas'));
    if (typeof consultaFirebaseConMetricas === 'function') {
      await consultaFirebaseConMetricas('setDoc', 'alertas', () => setDoc(alertaRef, {
        tipo: tipo,
        productId: productId,
        producto: productData.nombre,
        cafeteriaId: productData.cafeteriaId,
        mensaje: tipo === 'stock_bajo' 
          ? `Stock bajo de ${productData.nombre}. Stock actual: ${productData.stockActual} ${productData.unidad}`
          : `Stock agotado de ${productData.nombre}`,
        fecha: Timestamp.now(),
        leida: false,
        prioridad: tipo === 'stock_agotado' ? 'alta' : 'media'
      }));
    } else {
      await setDoc(alertaRef, {
        tipo: tipo,
        productId: productId,
        producto: productData.nombre,
        cafeteriaId: productData.cafeteriaId,
        mensaje: tipo === 'stock_bajo' 
          ? `Stock bajo de ${productData.nombre}. Stock actual: ${productData.stockActual} ${productData.unidad}`
          : `Stock agotado de ${productData.nombre}`,
        fecha: Timestamp.now(),
        leida: false,
        prioridad: tipo === 'stock_agotado' ? 'alta' : 'media'
      });
    }
  } catch (error) {
    console.error('Error al crear alerta:', error);
  }
}

/**
 * Obtiene alertas de inventario
 * @param {string} cafeteriaId - ID de la cafetería
 * @param {boolean} soloNoLeidas - Solo alertas no leídas
 * @returns {Promise<array>} - Lista de alertas
 */
export async function obtenerAlertasInventario(cafeteriaId, soloNoLeidas = true) {
  try {
    let q;
    
    if (soloNoLeidas) {
      q = query(
        collection(db, 'alertas'),
        where('cafeteriaId', '==', cafeteriaId),
        where('leida', '==', false),
        orderBy('fecha', 'desc')
      );
    } else {
      q = query(
        collection(db, 'alertas'),
        where('cafeteriaId', '==', cafeteriaId),
        orderBy('fecha', 'desc')
      );
    }
    
    const querySnapshot = typeof consultaFirebaseConMetricas === 'function'
      ? await consultaFirebaseConMetricas('getDocs', 'alertas', () => getDocs(q))
      : await getDocs(q);
    const alertas = [];
    
    querySnapshot.forEach(doc => {
      alertas.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return {
      success: true,
      alertas: alertas
    };
  } catch (error) {
    console.error('Error al obtener alertas:', error);
    return {
      success: false,
      error: error.message,
      alertas: []
    };
  }
}

/**
 * Marca una alerta como leída
 * @param {string} alertaId - ID de la alerta
 * @returns {Promise<object>} - Resultado de la operación
 */
export async function marcarAlertaLeida(alertaId) {
  try {
    const alertaRef = doc(db, 'alertas', alertaId);
    if (typeof consultaFirebaseConMetricas === 'function') {
      await consultaFirebaseConMetricas('updateDoc', 'alertas', () => updateDoc(alertaRef, {
        leida: true,
        fechaLeida: Timestamp.now()
      }));
    } else {
      await updateDoc(alertaRef, {
        leida: true,
        fechaLeida: Timestamp.now()
      });
    }
    
    return {
      success: true
    };
  } catch (error) {
    console.error('Error al marcar alerta como leída:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Registra desperdicio de un producto
 * @param {string} productId - ID del producto
 * @param {number} cantidad - Cantidad desperdiciada
 * @param {string} motivo - Motivo del desperdicio
 * @returns {Promise<object>} - Resultado de la operación
 */
export async function registrarDesperdicio(productId, cantidad, motivo) {
  try {
    if (!validateNumber(cantidad, 0)) {
      return {
        success: false,
        error: 'Cantidad inválida'
      };
    }
    
    const productRef = doc(db, 'inventario', productId);
    const productDoc = typeof consultaFirebaseConMetricas === 'function'
      ? await consultaFirebaseConMetricas('getDoc', 'inventario', () => getDoc(productRef))
      : await getDoc(productRef);
    
    if (!productDoc.exists()) {
      return {
        success: false,
        error: 'Producto no encontrado'
      };
    }
    
    const productData = productDoc.data();
    const costoEstimado = (productData.precioUnitario || 0) * cantidad;
    
    // Registrar desperdicio
    const desperdicioRef = doc(collection(db, 'desperdicios'));
    const desperdicioData = {
      productId: productId,
      producto: productData.nombre,
      cafeteriaId: productData.cafeteriaId,
      cantidad: cantidad,
      unidad: productData.unidad,
      motivo: motivo,
      costoEstimado: costoEstimado,
      fecha: Timestamp.now()
    };
    
    if (typeof consultaFirebaseConMetricas === 'function') {
      await consultaFirebaseConMetricas('setDoc', 'desperdicios', () => setDoc(desperdicioRef, desperdicioData));
    } else {
      await setDoc(desperdicioRef, desperdicioData);
    }
    
    // Actualizar stock
    await actualizarStock(productId, -cantidad);
    
    return {
      success: true,
      costoEstimado: costoEstimado
    };
  } catch (error) {
    console.error('Error al registrar desperdicio:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

