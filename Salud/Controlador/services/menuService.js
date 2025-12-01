/**
 * 🍽️ Servicio de Gestión de Menús
 * Gestiona menús diarios para cafeterías
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
import { validateData, sanitizeInput, validateNumber } from "../utils/securityUtils.js";
// El sistema de métricas se carga globalmente
// consultaFirebaseConMetricas estará disponible desde window si metricas.js está cargado
// Si no está disponible, se usan las funciones de Firebase directamente

// Función helper para obtener consultaFirebaseConMetricas de forma segura
function obtenerConsultaConMetricas() {
  // Intentar obtener desde window (si metricas.js está cargado)
  if (typeof window !== 'undefined' && typeof window.consultaFirebaseConMetricas === 'function') {
    return window.consultaFirebaseConMetricas;
  }
  // Si no está disponible, retornar null para usar funciones directas
  return null;
}

/**
 * Esquema de validación para menús
 */
const MENU_SCHEMA = {
  nombre: { type: 'string', required: true },
  descripcion: { type: 'string', required: true },
  precio: { type: 'number', required: true, min: 0 },
  calorias: { type: 'number', required: true, min: 0 },
  categoria: { type: 'string', required: true },
  ingredientes: { type: 'array', required: true },
  disponible: { type: 'boolean', required: false },
  fechaPublicacion: { type: 'string', required: false },
  imagen: { type: 'string', required: false },
  alergenos: { type: 'array', required: false },
  tiempoPreparacion: { type: 'number', required: false },
  stock: { type: 'number', required: false, min: 0 }
};

/**
 * Crea un nuevo menú
 * @param {object} menuData - Datos del menú
 * @param {string} cafeteriaId - ID de la cafetería
 * @returns {Promise<object>} - Resultado de la operación
 */
export async function crearMenu(menuData, cafeteriaId) {
  try {
    // Validar datos
    const validation = validateData(menuData, MENU_SCHEMA);
    if (!validation.valid) {
      return {
        success: false,
        error: 'Datos inválidos',
        errors: validation.errors
      };
    }
    
    const menuId = doc(collection(db, 'menus')).id;
    const menuRef = doc(db, 'menus', menuId);
    
    const menu = {
      ...validation.data,
      id: menuId,
      cafeteriaId: cafeteriaId,
      disponible: validation.data.disponible !== undefined ? validation.data.disponible : true,
      fechaCreacion: Timestamp.now(),
      fechaPublicacion: validation.data.fechaPublicacion || new Date().toISOString().split('T')[0],
      stock: validation.data.stock || 0,
      vecesPedido: 0,
      rating: 0,
      totalRatings: 0
    };
    
    const consultaConMetricas = obtenerConsultaConMetricas();
    if (consultaConMetricas) {
      await consultaConMetricas('setDoc', 'menus', () => setDoc(menuRef, menu));
    } else {
      await setDoc(menuRef, menu);
    }
    
    return {
      success: true,
      menuId: menuId,
      menu: menu
    };
  } catch (error) {
    console.error('Error al crear menú:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Obtiene todos los menús de una cafetería
 * @param {string} cafeteriaId - ID de la cafetería
 * @param {string} fecha - Fecha para filtrar (opcional)
 * @returns {Promise<array>} - Lista de menús
 */
export async function obtenerMenus(cafeteriaId, fecha = null) {
  try {
    let q;
    
    if (fecha) {
      q = query(
        collection(db, 'menus'),
        where('cafeteriaId', '==', cafeteriaId),
        where('fechaPublicacion', '==', fecha),
        orderBy('fechaCreacion', 'desc')
      );
    } else {
      q = query(
        collection(db, 'menus'),
        where('cafeteriaId', '==', cafeteriaId),
        orderBy('fechaCreacion', 'desc')
      );
    }
    
    // Usar consultaFirebaseConMetricas si está disponible, sino usar getDocs directamente
    const consultaConMetricas = obtenerConsultaConMetricas();
    const querySnapshot = consultaConMetricas
      ? await consultaConMetricas('getDocs', 'menus', () => getDocs(q))
      : await getDocs(q);
    const menus = [];
    
    querySnapshot.forEach(doc => {
      menus.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return {
      success: true,
      menus: menus
    };
  } catch (error) {
    console.error('Error al obtener menús:', error);
    return {
      success: false,
      error: error.message,
      menus: []
    };
  }
}

/**
 * Obtiene un menú por ID
 * @param {string} menuId - ID del menú
 * @returns {Promise<object>} - Datos del menú
 */
export async function obtenerMenuPorId(menuId) {
  try {
    const menuRef = doc(db, 'menus', menuId);
    // Usar consultaFirebaseConMetricas si está disponible, sino usar getDoc directamente
    const consultaConMetricas = obtenerConsultaConMetricas();
    const menuDoc = consultaConMetricas
      ? await consultaConMetricas('getDoc', 'menus', () => getDoc(menuRef))
      : await getDoc(menuRef);
    
    if (!menuDoc.exists()) {
      return {
        success: false,
        error: 'Menú no encontrado'
      };
    }
    
    return {
      success: true,
      menu: {
        id: menuDoc.id,
        ...menuDoc.data()
      }
    };
  } catch (error) {
    console.error('Error al obtener menú:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Actualiza un menú
 * @param {string} menuId - ID del menú
 * @param {object} updates - Datos a actualizar
 * @returns {Promise<object>} - Resultado de la operación
 */
export async function actualizarMenu(menuId, updates) {
  try {
    // Validar solo los campos que se están actualizando
    const schema = {};
    Object.keys(updates).forEach(key => {
      if (MENU_SCHEMA[key]) {
        schema[key] = MENU_SCHEMA[key];
      }
    });
    
    if (Object.keys(schema).length > 0) {
      const validation = validateData(updates, schema);
      if (!validation.valid) {
        return {
          success: false,
          error: 'Datos inválidos',
          errors: validation.errors
        };
      }
      updates = validation.data;
    }
    
    const menuRef = doc(db, 'menus', menuId);
    updates.fechaActualizacion = Timestamp.now();
    
    const consultaConMetricas = obtenerConsultaConMetricas();
    if (consultaConMetricas) {
      await consultaConMetricas('updateDoc', 'menus', () => updateDoc(menuRef, updates));
    } else {
      await updateDoc(menuRef, updates);
    }
    
    return {
      success: true
    };
  } catch (error) {
    console.error('Error al actualizar menú:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Elimina un menú
 * @param {string} menuId - ID del menú
 * @returns {Promise<object>} - Resultado de la operación
 */
export async function eliminarMenu(menuId) {
  try {
    const menuRef = doc(db, 'menus', menuId);
    const consultaConMetricas = obtenerConsultaConMetricas();
    if (consultaConMetricas) {
      await consultaConMetricas('deleteDoc', 'menus', () => deleteDoc(menuRef));
    } else {
      await deleteDoc(menuRef);
    }
    
    return {
      success: true
    };
  } catch (error) {
    console.error('Error al eliminar menú:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Obtiene menús disponibles para una fecha específica
 * @param {string} cafeteriaId - ID de la cafetería
 * @param {string} fecha - Fecha en formato YYYY-MM-DD
 * @returns {Promise<array>} - Lista de menús disponibles
 */
export async function obtenerMenusDisponibles(cafeteriaId, fecha) {
  try {
    const q = query(
      collection(db, 'menus'),
      where('cafeteriaId', '==', cafeteriaId),
      where('fechaPublicacion', '==', fecha),
        where('disponible', '==', true)
    );
    
    const consultaConMetricas = obtenerConsultaConMetricas();
    const querySnapshot = consultaConMetricas
      ? await consultaConMetricas('getDocs', 'menus', () => getDocs(q))
      : await getDocs(q);
    const menus = [];
    
    querySnapshot.forEach(doc => {
      const menuData = doc.data();
      // Verificar stock
      if (menuData.stock === undefined || menuData.stock > 0) {
        menus.push({
          id: doc.id,
          ...menuData
        });
      }
    });
    
    return {
      success: true,
      menus: menus
    };
  } catch (error) {
    console.error('Error al obtener menús disponibles:', error);
    return {
      success: false,
      error: error.message,
      menus: []
    };
  }
}

/**
 * Publica menús para un día específico
 * @param {string} cafeteriaId - ID de la cafetería
 * @param {string} fecha - Fecha en formato YYYY-MM-DD
 * @param {array} menuIds - IDs de los menús a publicar
 * @returns {Promise<object>} - Resultado de la operación
 */
export async function publicarMenusDiarios(cafeteriaId, fecha, menuIds) {
  try {
    const resultados = [];
    
    for (const menuId of menuIds) {
      const result = await actualizarMenu(menuId, {
        fechaPublicacion: fecha,
        disponible: true
      });
      resultados.push({ menuId, ...result });
    }
    
    return {
      success: true,
      resultados: resultados
    };
  } catch (error) {
    console.error('Error al publicar menús:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Registra un pedido de menú (para estadísticas)
 * @param {string} menuId - ID del menú
 * @param {number} cantidad - Cantidad pedida
 * @returns {Promise<object>} - Resultado de la operación
 */
export async function registrarPedidoMenu(menuId, cantidad = 1) {
  try {
    const menuRef = doc(db, 'menus', menuId);
    const consultaConMetricas = obtenerConsultaConMetricas();
    const menuDoc = consultaConMetricas
      ? await consultaConMetricas('getDoc', 'menus', () => getDoc(menuRef))
      : await getDoc(menuRef);
    
    if (!menuDoc.exists()) {
      return {
        success: false,
        error: 'Menú no encontrado'
      };
    }
    
    const menuData = menuDoc.data();
    const nuevasVecesPedido = (menuData.vecesPedido || 0) + cantidad;
    const nuevoStock = menuData.stock !== undefined ? Math.max(0, menuData.stock - cantidad) : undefined;
    
    // Reutilizar la misma variable consultaConMetricas
    if (consultaConMetricas) {
      await consultaConMetricas('updateDoc', 'menus', () => updateDoc(menuRef, {
        vecesPedido: nuevasVecesPedido,
        stock: nuevoStock,
        fechaActualizacion: Timestamp.now()
      }));
    } else {
      await updateDoc(menuRef, {
        vecesPedido: nuevasVecesPedido,
        stock: nuevoStock,
        fechaActualizacion: Timestamp.now()
      });
    }
    
    // Registrar en consumo
    await registrarConsumo(menuId, cantidad);
    
    return {
      success: true
    };
  } catch (error) {
    console.error('Error al registrar pedido:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Registra consumo de un menú
 * @param {string} menuId - ID del menú
 * @param {number} cantidad - Cantidad consumida
 */
async function registrarConsumo(menuId, cantidad) {
  try {
    const consumoRef = doc(collection(db, 'consumo'));
    const fecha = new Date().toISOString().split('T')[0];
    
    const consultaConMetricas = obtenerConsultaConMetricas();
    if (consultaConMetricas) {
      await consultaConMetricas('setDoc', 'consumo', () => setDoc(consumoRef, {
        menuId: menuId,
        cantidad: cantidad,
        fecha: fecha,
        timestamp: Timestamp.now()
      }));
    } else {
      await setDoc(consumoRef, {
        menuId: menuId,
        cantidad: cantidad,
        fecha: fecha,
        timestamp: Timestamp.now()
      });
    }
  } catch (error) {
    console.error('Error al registrar consumo:', error);
  }
}

// Función auxiliar para obtener cafeteriaId desde usuario autenticado
async function obtenerCafeteriaId() {
  try {
    const usuarioActivo = localStorage.getItem('usuarioActivo');
    if (!usuarioActivo) return 'default';
    
    // Buscar usuario en Firebase para obtener su cafeteriaId
    const usuariosRef = collection(db, 'usuarios');
    const q = query(usuariosRef, where('email', '==', usuarioActivo));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const userData = querySnapshot.docs[0].data();
      return userData.cafeteriaId || 'default';
    }
    
    return 'default';
  } catch (error) {
    console.error('Error al obtener cafeteriaId:', error);
    return 'default';
  }
}

