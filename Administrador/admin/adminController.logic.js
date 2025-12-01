// adminController.logic.js
// Lógica “pura” extraída de adminController.js para pruebas unitarias.
// Todas las funciones aceptan inyección de dependencias (db, firestoreFns, storageFns, domHelpers).

/**
 * Utils
 */
export function safeNum(v) {
  return v === undefined || v === null || v === "" ? 0 : Number(v);
}

export function formatDateISO(d) {
  const date = d ? new Date(d) : new Date();
  return date.toISOString().split("T")[0];
}

/**
 * waitForFirebase
 * simple helper para verificar que db/app esté listo
 */
export async function waitForFirebase(db, attempts = 10, delayMs = 150) {
  let i = 0;
  while ((!db || typeof db === "undefined") && i < attempts) {
    await new Promise(r => setTimeout(r, delayMs));
    i++;
  }
  return !!db;
}

/* ---------------------------------------------
   Storage helpers (upload / delete)
   --------------------------------------------- */

export async function uploadImageFile(storage, storageFns = {}, file) {
  // returns { url, path } or null
  if (!file) return null;
  if (!storage) throw new Error("Firebase Storage no inicializado");

  const safeName = `${Date.now()}_${String(file.name || "file").replace(/\s+/g, "_")}`;
  const path = `menus/${safeName}`;

  const refFn = storageFns.ref;
  const uploadFn = storageFns.uploadBytes || storageFns.put; // allow different SDKs
  const getUrlFn = storageFns.getDownloadURL;

  if (!refFn || !uploadFn || !getUrlFn) {
    throw new Error("storageFns incompletos");
  }

  const sRef = refFn(storage, path);
  await uploadFn(sRef, file);
  const url = await getUrlFn(sRef);
  return { url, path };
}

export async function deleteImageByPath(storage, storageFns = {}, path) {
  if (!path) return { ok: true, message: "no path provided" };
  if (!storage) {
    // no-op: permitimos tests sin instancia de storage
    return { ok: false, message: "storage not initialized" };
  }
  try {
    const sRef = storageFns.ref(storage, path);
    await storageFns.deleteObject(sRef);
    return { ok: true };
  } catch (err) {
    // swallow and return false so UI can decide
    console.warn("deleteImageByPath error:", err);
    return { ok: false, error: err };
  }
}

/* ---------------------------------------------
   Menus: cargar, crear ejemplo, guardar/actualizar, eliminar
   (simplificados para lógica / test)
   --------------------------------------------- */

/**
 * cargarMenusLogic
 * - db: firestore instance
 * - firestoreFns: { collection, query, orderBy, getDocs }
 * returns array of { id, ...data }
 */
export async function cargarMenusLogic(db, firestoreFns = {}) {
  if (!db) throw new Error("Firestore no inicializado");

  const { collection, query, orderBy, getDocs } = firestoreFns;
  if (!collection || !getDocs) throw new Error("firestoreFns incompletos");

  const ref = collection(db, "menus");
  let snap;
  try {
    snap = await getDocs(query(ref, orderBy ? orderBy("creado", "desc") : undefined));
  } catch (err) {
    // fallback a getDocs(ref) if orderBy no está soportado por el mock
    snap = await getDocs(ref);
  }

  const menus = [];
  if (!snap) return menus;

  // snap.forEach may be present, otherwise handle .docs array
  if (typeof snap.forEach === "function") {
    snap.forEach(docSnap => {
      menus.push({ id: docSnap.id, ...docSnap.data() });
    });
  } else if (Array.isArray(snap.docs)) {
    snap.docs.forEach(d => menus.push({ id: d.id, ...d.data() }));
  }
  return menus;
}

/**
 * agregarMenuEjemploLogic
 * Agrega un menú "ejemplo" (útil para UI que crea un draft)
 * - returns id or null
 */
export async function agregarMenuEjemploLogic(db, firestoreFns = {}, base = {}) {
  if (!db) throw new Error("Firestore no inicializado");
  const { collection, addDoc } = firestoreFns;
  if (!collection || !addDoc) throw new Error("firestoreFns incompletos");

  const nowISO = new Date().toISOString();
  const menu = {
    titulo: base.titulo || "Menú ejemplo",
    descripcion: base.descripcion || "Descripción de ejemplo",
    createdAt: nowISO,
    creado: nowISO,
    activo: true,
    categorias: base.categorias || [],
    imagen: base.imagen || null
  };

  const docRef = await addDoc(collection(db, "menus"), menu);
  return docRef && (docRef.id || docRef.id === 0) ? docRef.id : null;
}

/**
 * guardarMenuLogic
 * Guarda o actualiza un menú, gestiona subida de imagen si se provee
 * - data: objeto del formulario del menú (titulo, descripcion, precio, etc.)
 * - id: si existe, hace update; si no, crea nuevo
 * - db, firestoreFns, storage, storageFns son inyectados para test
 * returns { ok: true, id, created, updated } o { ok: false, message }
 */
export async function guardarMenuLogic(db, firestoreFns = {}, storage, storageFns = {}, data = {}, id = null) {
  if (!db) throw new Error("Firestore no inicializado");
  const { collection, doc: docFn, setDoc, addDoc, updateDoc } = firestoreFns;
  if (!collection) throw new Error("firestoreFns incompletos");

  try {
    // 1) Si hay archivo, subirlo
    let imagenMeta = null;
    if (data.file) {
      imagenMeta = await uploadImageFile(storage, storageFns, data.file); // throws si storage mal
    }

    // Preparar payload
    const payload = {
      titulo: data.titulo || "",
      descripcion: data.descripcion || "",
      precio: safeNum(data.precio),
      categorias: data.categorias || [],
      imagen: imagenMeta ? imagenMeta.url : (data.imagen || null),
      imagenPath: imagenMeta ? imagenMeta.path : (data.imagenPath || null),
      actualizadoEn: new Date().toISOString(),
      creado: data.creado || new Date().toISOString(),
      activo: (typeof data.activo === "boolean") ? data.activo : true
    };

    if (id) {
      // update path
      if (!docFn || !updateDoc) throw new Error("firestoreFns.updateDoc no disponible");
      const ref = docFn(db, "menus", id);
      await updateDoc(ref, payload);
      return { ok: true, id, updated: true };
    } else {
      if (!addDoc) throw new Error("firestoreFns.addDoc no disponible");
      const ref = await addDoc(collection(db, "menus"), payload);
      return { ok: true, id: ref.id || null, created: true };
    }
  } catch (err) {
    return { ok: false, message: err.message || String(err) };
  }
}

/**
 * eliminarMenuLogic
 * - elimina documento y opcionalmente la imagen asociada
 */
export async function eliminarMenuLogic(db, firestoreFns = {}, storage, storageFns = {}, id, imagenPath = null) {
  if (!db) throw new Error("Firestore no inicializado");
  const { doc: docFn, deleteDoc } = firestoreFns;
  if (!docFn || !deleteDoc) throw new Error("firestoreFns incompletos");

  try {
    // eliminar doc
    const ref = docFn(db, "menus", id);
    await deleteDoc(ref);
    // eliminar imagen si existe y storage disponible
    if (imagenPath) {
      await deleteImageByPath(storage, storageFns, imagenPath);
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err };
  }
}

/* ---------------------------------------------
   Inventario, desperdicios, usuarios y reportes
   --------------------------------------------- */

/**
 * registrarInventarioLogic (create/update)
 * - data: { nombre, categoria, stock_actual, stock_minimo, unidad }
 * - id: si presente hace update, si no crea nuevo
 */
export async function registrarInventarioLogic(db, firestoreFns = {}, data = {}, id = null) {
  if (!db) throw new Error("Firestore no inicializado");
  const { collection, addDoc, doc: docFn, updateDoc } = firestoreFns;
  if (!collection) throw new Error("firestoreFns incompletos");

  const safe = v => (v === undefined || v === null || v === "" ? 0 : Number(v));

  if (id) {
    const ref = docFn(db, "inventario", id);
    await updateDoc(ref, {
      nombre: data.nombre,
      categoria: data.categoria,
      stock_actual: safe(data.stock_actual),
      stock_minimo: safe(data.stock_minimo),
      fecha_actualizacion: new Date().toISOString()
    });
    return { ok: true, updated: true };
  } else {
    const col = collection(db, "inventario");
    await addDoc(col, {
      nombre: data.nombre,
      categoria: data.categoria,
      stock_actual: safe(data.stock_actual),
      stock_minimo: safe(data.stock_minimo),
      unidad: data.unidad || "",
      fecha_actualizacion: new Date().toISOString()
    });
    return { ok: true, created: true };
  }
}

/**
 * cargarInventarioLogic
 */
export async function cargarInventarioLogic(db, firestoreFns = {}) {
  if (!db) throw new Error("Firestore no inicializado");
  const { collection, getDocs } = firestoreFns;
  const ref = collection(db, "inventario");
  const snap = await getDocs(ref);
  const arr = [];
  if (typeof snap.forEach === "function") {
    snap.forEach(s => arr.push({ id: s.id, ...s.data() }));
  } else if (Array.isArray(snap.docs)) {
    snap.docs.forEach(d => arr.push({ id: d.id, ...d.data() }));
  }
  return arr;
}

/**
 * registrarDesperdicioLogic (waste logging)
 */
export async function registrarDesperdicioLogic(db, firestoreFns = {}, data = {}) {
  if (!db) throw new Error("Firestore no inicializado");
  const { collection, addDoc } = firestoreFns;
  const col = collection(db, "desperdicios");
  await addDoc(col, {
    ...data,
    registradoEn: new Date().toISOString()
  });
  return { ok: true };
}

/**
 * cargarDesperdiciosLogic
 */
export async function cargarDesperdiciosLogic(db, firestoreFns = {}) {
  if (!db) throw new Error("Firestore no inicializado");
  const { collection, getDocs } = firestoreFns;
  const ref = collection(db, "desperdicios");
  const snap = await getDocs(ref);
  const arr = [];
  if (typeof snap.forEach === "function") {
    snap.forEach(s => arr.push({ id: s.id, ...s.data() }));
  } else if (Array.isArray(snap.docs)) {
    snap.docs.forEach(d => arr.push({ id: d.id, ...d.data() }));
  }
  return arr;
}

/**
 * cargarUsuariosLogic
 */
export async function cargarUsuariosLogic(db, firestoreFns = {}) {
  if (!db) throw new Error("Firestore no inicializado");
  const { collection, getDocs } = firestoreFns;
  const ref = collection(db, "usuarios");
  const snap = await getDocs(ref);
  const arr = [];
  if (typeof snap.forEach === "function") {
    snap.forEach(s => arr.push({ id: s.id, ...s.data() }));
  } else if (Array.isArray(snap.docs)) {
    snap.docs.forEach(d => arr.push({ id: d.id, ...d.data() }));
  }
  return arr;
}

/* ---------------------------------------------
   Reportes / Estadísticas
   --------------------------------------------- */

/**
 * loadDashboardStats
 * - obtiene counts y métricas básicas para el dashboard
 * returns object { menusCount, usersCount, inventarioCount, desperdiciosCount, ... }
 */
export async function loadDashboardStats(db, firestoreFns = {}) {
  if (!db) throw new Error("Firestore no inicializado");
  const { collection, getDocs, query, where } = firestoreFns;

  const stats = {
    menusCount: 0,
    usersCount: 0,
    inventarioCount: 0,
    desperdiciosCount: 0
  };

  // helper to safely count
  async function countCollection(name) {
    try {
      const ref = collection(db, name);
      const snap = await getDocs(ref);
      if (!snap) return 0;
      if (typeof snap.size === "number") return snap.size;
      if (Array.isArray(snap.docs)) return snap.docs.length;
      let cnt = 0;
      if (typeof snap.forEach === "function") {
        snap.forEach(() => cnt++);
        return cnt;
      }
      return 0;
    } catch (err) {
      return 0;
    }
  }

  stats.menusCount = await countCollection("menus");
  stats.usersCount = await countCollection("usuarios");
  stats.inventarioCount = await countCollection("inventario");
  stats.desperdiciosCount = await countCollection("desperdicios");

  return stats;
}

/* ---------------------------------------------
   Small helpers (notifications / table attachers)
   --------------------------------------------- */

/**
 * mostrarNotificacionLogic
 * - returns an object describing a notification that the UI can render
 */
export function mostrarNotificacionLogic(type = "info", message = "", timeout = 3000) {
  return { type, message, timeout, createdAt: Date.now() };
}

/**
 * attachTableActionListenersLogic
 * - purely returns mapping of expected handlers for UI to attach
 * - we return function placeholders so UI code can wire real implementations
 */
export function attachTableActionListenersLogic() {
  return {
    onEdit: (id) => ({ action: "edit", id }),
    onDelete: (id) => ({ action: "delete", id }),
    onToggleActive: (id, active) => ({ action: "toggle", id, active })
  };
}

/* ---------------------------------------------
   Exports summary
   --------------------------------------------- */

export default {
  safeNum,
  formatDateISO,
  waitForFirebase,
  uploadImageFile,
  deleteImageByPath,
  cargarMenusLogic,
  agregarMenuEjemploLogic,
  guardarMenuLogic,
  eliminarMenuLogic,
  registrarInventarioLogic,
  cargarInventarioLogic,
  registrarDesperdicioLogic,
  cargarDesperdiciosLogic,
  cargarUsuariosLogic,
  loadDashboardStats,
  mostrarNotificacionLogic,
  attachTableActionListenersLogic
};
