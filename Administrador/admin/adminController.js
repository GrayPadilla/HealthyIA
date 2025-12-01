// adminController.js
// Controlador del Panel de Administración - con subida de imágenes a Firebase Storage
// Cargarlo en admin.html con: <script type="module" src="adminController.js"></script>

// Importar Firebase - IMPORTANTE: debe estar antes de cualquier uso
console.log("🔵 [adminController] Iniciando import de Firebase...");
import { db, app } from "../../Salud/Controlador/firebase.js"; // Ruta corregida (tu estructura)
console.log("🔵 [adminController] Import de Firebase completado");
console.log("🔵 [adminController] db después del import:", db);
console.log("🔵 [adminController] app después del import:", app);
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.1.0/firebase-firestore.js";

import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from "https://www.gstatic.com/firebasejs/10.1.0/firebase-storage.js";

// global para mantener referencias a los charts y evitar duplicados
const charts = window.__adminCharts = window.__adminCharts || {};
window.__chartPresets = window.__chartPresets || {};

/* ---------------------------
   Prevención de múltiples inits
   --------------------------- */
if (window.adminControllerInitialized) {
  console.warn("adminController ya inicializado");
} else {
  window.adminControllerInitialized = true;
}

/* ---------------------------
   Debug / Validación inicial
   --------------------------- */
console.log("🔵 adminController cargado.");
console.log("🔵 Intentando importar Firebase...");

// Verificar Firebase después de un pequeño delay para asegurar que se cargó
setTimeout(async () => {
  try {
    console.log("🔍 Verificando Firebase DB:", db);
    console.log("🔍 Tipo de db:", typeof db);
    
    if (!db) {
      console.error("❌ ERROR: 'db' es undefined o null!");
      console.error("🔄 Intentando recargar Firebase...");
      
      // Intentar recargar Firebase
      try {
        const firebaseModule = await import("../../Salud/Controlador/firebase.js");
        if (firebaseModule.db) {
          console.log("✅ Firebase recargado, pero db no se puede reasignar directamente");
          console.warn("⚠️ Recarga la página (Ctrl+F5) para que Firebase se inicialice correctamente");
        }
      } catch (importErr) {
        console.error("❌ Error al recargar Firebase:", importErr);
      }
    } else {
      console.log("✅ Firebase DB inicializado correctamente");
      console.log("📊 Información de db:", {
        type: typeof db,
        constructor: db.constructor?.name,
        app: db.app?.name || "N/A"
      });
      
      // Probar una consulta simple para verificar que funciona
      try {
        const testRef = collection(db, "menus");
        const testSnap = await getDocs(testRef);
        console.log(`✅ Test de conexión exitoso: ${testSnap.size} menús encontrados en Firebase`);
      } catch (testErr) {
        console.error("❌ Error en test de conexión:", testErr);
        console.error("📋 Detalles:", testErr.code, testErr.message);
      }
    }
  } catch (err) {
    console.error("❌ Error al verificar Firebase:", err);
  }
}, 1000);

/* ---------------------------
   Helpers
   --------------------------- */
function byId(id) { return document.getElementById(id); }
function qSel(sel) { return document.querySelector(sel); }
function formatDateISO(d) {
  const date = d ? new Date(d) : new Date();
  return date.toISOString().split("T")[0];
}
function safeNum(v) { return v === undefined || v === null || v === "" ? 0 : Number(v); }
function showModal(modalEl) { if (modalEl) modalEl.style.display = "flex"; }
function hideModal(modalEl) { if (modalEl) modalEl.style.display = "none"; }

const storage = (() => {
  try {
    if (!app) {
      console.error("❌ App de Firebase no está disponible para Storage");
      return null;
    }
    const storageInstance = getStorage(app);
    console.log("✅ Firebase Storage inicializado correctamente");
    return storageInstance;
  } catch (e) {
    console.error("❌ Error al inicializar Storage:", e);
    return null;
  }
})();

/* ---------------------------
   Funciones de Storage
   --------------------------- */
async function uploadImageFile(file) {
  if (!file) return null;
  if (!storage) throw new Error("Firebase Storage no inicializado");

  // Generar ruta única
  const safeName = `${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
  const path = `menus/${safeName}`;
  const sRef = storageRef(storage, path);

  // subir
  const snapshot = await uploadBytes(sRef, file);
  const url = await getDownloadURL(sRef);
  return { url, path };
}

async function deleteImageByPath(path) {
  if (!path) return;
  if (!storage) {
    console.warn("No hay storage; no se puede eliminar imagen:", path);
    return;
  }
  try {
    const sRef = storageRef(storage, path);
    await deleteObject(sRef);
  } catch (e) {
    // No hacer fail fatales si no existe o no tiene permisos
    console.warn("No se pudo eliminar imagen en Storage:", e);
  }
}

// llamar muy temprano, por ejemplo en tu initUI o DOMContentLoaded
function showSection(sectionId) {
  // remover active de todas las secciones
  document.querySelectorAll('.content-section').forEach(s => {
    s.classList.remove('active-section');
  });
  // añadir la activa
  const sec = document.getElementById(sectionId);
  if (sec) {
    sec.classList.add('active-section');
    // actualizar título visible (si tienes #section-title)
    const title = sec.querySelector('h2') || sec.querySelector('h1');
    const sectionTitleElem = document.getElementById('section-title');
    if (sectionTitleElem && title) sectionTitleElem.textContent = title.textContent;
  }
}

// attach menu handlers temprano
document.querySelectorAll('.menu-item[data-section]').forEach(item => {
  item.addEventListener('click', (e) => {
    const target = item.dataset.section;
    // mostrar inmediatamente la sección (sin esperar a firestore)
    showSection(target);
    // después continúa la lógica (p. ej. cargar datos si es necesario)
  });
});

/* ---------------------------
   MENÚS (cargar + mostrar)
   --------------------------- */
async function cargarMenus() {
  try {
    console.log("🔄 Iniciando carga de menús...");
    console.log("🔍 Verificando db:", db);
    
    if (!db) {
      console.error("❌ Firestore no inicializado, intentando recargar...");
      // Intentar recargar Firebase
      try {
        const { db: newDb } = await import("../../Salud/Controlador/firebase.js");
        if (newDb) {
          console.log("✅ Firebase recargado, pero db no se puede reasignar");
          mostrarNotificacion("⚠️ Firebase no inicializado. Recarga la página (Ctrl+F5).", "error");
          const tbody = document.querySelector("#menus tbody");
          if (tbody) {
            tbody.innerHTML = `
              <tr>
                <td colspan="6" style="text-align: center; padding: 2rem; color: #ef4444;">
                  <p>⚠️ Error: Firebase no está inicializado</p>
                  <p style="font-size: 0.9rem; margin-top: 10px;">Recarga la página (Ctrl+F5) e intenta de nuevo</p>
                </td>
              </tr>
            `;
          }
          return;
        }
      } catch (importErr) {
        console.error("❌ Error al recargar Firebase:", importErr);
      }
      throw new Error("Firestore no inicializado");
    }

    console.log("✅ Firebase inicializado, obteniendo menús...");
    const ref = collection(db, "menus");
    let snap;
    
    try {
      console.log("📋 Intentando obtener menús ordenados por fecha...");
      snap = await getDocs(query(ref, orderBy("creado", "desc")));
      console.log(`✅ Menús obtenidos con orden: ${snap.size} documentos`);
    } catch (orderError) {
      console.warn("⚠️ Error con orderBy, obteniendo sin ordenar:", orderError.message);
      try {
        snap = await getDocs(ref);
        console.log(`✅ Menús obtenidos sin ordenar: ${snap.size} documentos`);
      } catch (getError) {
        console.error("❌ Error al obtener menús:", getError);
        throw getError;
      }
    }

    let html = "";
    let menusCount = 0;
    
    snap.forEach(s => {
      const d = s.data();
      menusCount++;

      html += `
        <tr>
          <td>
            <div class="td-title">${d.nombre || "Sin nombre"}</div>
          </td>
          <td>${d.descripcion || ""}</td>
          <td>${d.calorias ?? 0}</td>
          <td>S/ ${d.precio !== undefined ? Number(d.precio).toFixed(2) : "0.00"}</td>
          <td><span class="status ${d.activo ? "active" : "inactive"}">
              ${d.activo ? "ACTIVO" : "Inactivo"}</span>
          </td>
          <td>
            <div class="action-buttons">
              <button class="action-btn edit-btn" data-id="${s.id}" data-type="menu">
                <i class="fas fa-edit"></i>
              </button>
              <button class="action-btn delete-btn" data-id="${s.id}" data-type="menu">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    });

    const tbody = document.querySelector("#menus tbody");
    if (tbody) {
      if (html === "") {
        tbody.innerHTML = `
          <tr>
            <td colspan="6" style="text-align: center; padding: 2rem;">
              <p>No hay menús registrados aún</p>
              <p style="font-size: 0.9rem; margin-top: 10px; color: #64748b;">Haz clic en "Nuevo Menú" para agregar uno</p>
            </td>
          </tr>
        `;
      } else {
        tbody.innerHTML = html;
      }
    }

    attachTableActionListeners();
    console.log(`✅ ${menusCount} menús cargados y mostrados correctamente`);

  } catch (e) {
    console.error("❌ Error en cargarMenus:", e);
    console.error("📋 Detalles del error:", {
      name: e.name,
      message: e.message,
      code: e.code,
      stack: e.stack
    });
    
    const tbody = document.querySelector("#menus tbody");
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 2rem; color: #ef4444;">
            <p>❌ Error al cargar menús</p>
            <p style="font-size: 0.9rem; margin-top: 10px;">${e.message || "Error desconocido"}</p>
            <p style="font-size: 0.8rem; margin-top: 10px; color: #64748b;">Abre la consola (F12) para más detalles</p>
          </td>
        </tr>
      `;
    }
    
    // Solo mostrar notificación si no es un error de inicialización (ya se mostró arriba)
    if (!e.message?.includes("no inicializado")) {
      mostrarNotificacion(`Error cargando menús: ${e.message || "Error desconocido"}`, "error");
    }
  }
}

/* ---------------------------
   ACTUALIZAR CATEGORÍAS "Ensaladas" A "Almuerzo" EN FIREBASE
   --------------------------- */
async function actualizarCategoriasEnsaladas() {
  try {
    if (!db) {
      console.warn("⚠️ Firebase no inicializado, no se pueden actualizar categorías");
      return;
    }

    console.log("🔄 Actualizando categorías 'Ensaladas' a 'Almuerzo'...");
    const menusSnap = await getDocs(collection(db, "menus"));
    let actualizados = 0;
    
    const updatePromises = [];
    menusSnap.forEach(docSnapshot => {
      const data = docSnapshot.data();
      if (data.categoria === "Ensaladas") {
        const docRef = doc(db, "menus", docSnapshot.id);
        updatePromises.push(
          updateDoc(docRef, { categoria: "Almuerzo" })
            .then(() => {
              actualizados++;
              console.log(`✅ Menú "${data.nombre}" actualizado de Ensaladas a Almuerzo`);
            })
            .catch(err => {
              console.warn(`⚠️ No se pudo actualizar menú ${docSnapshot.id}:`, err);
            })
        );
      }
    });

    if (updatePromises.length > 0) {
      await Promise.all(updatePromises);
      console.log(`✅✅✅ ${actualizados} menú(s) actualizado(s) de Ensaladas a Almuerzo`);
      if (actualizados > 0) {
        mostrarNotificacion(`✅ ${actualizados} menú(s) actualizado(s) a categoría Almuerzo`, "success");
        // Recargar menús después de actualizar
        setTimeout(async () => {
          await cargarMenus();
        }, 500);
      }
    } else {
      console.log("✅ No hay menús con categoría 'Ensaladas' para actualizar");
    }
  } catch (error) {
    console.error("❌ Error actualizando categorías:", error);
  }
}

/* ---------------------------
   AGREGAR MENÚS DE EJEMPLO POR CATEGORÍA (uno en cada categoría si no existe)
   --------------------------- */
async function asegurarMenusPorCategoria() {
  try {
    if (!db) {
      console.warn("⚠️ Firebase no inicializado, no se pueden agregar menús de ejemplo");
      return;
    }

    const menusSnap = await getDocs(collection(db, "menus"));
    const categoriasExistentes = new Set();
    
    // Verificar qué categorías ya tienen menús
    menusSnap.forEach(docSnapshot => {
      const data = docSnapshot.data();
      if (data.activo !== false && data.categoria) {
        let categoria = data.categoria;
        // Convertir "Ensaladas" a "Almuerzo" (solo para el conteo, la actualización se hace en otra función)
        if (categoria === "Ensaladas") {
          categoria = "Almuerzo";
        }
        categoriasExistentes.add(categoria);
      }
    });

    const menusEjemplo = {
      "Desayuno": {
        nombre: "Desayuno Energético",
        precio: 15.00,
        descripcion: "Desayuno completo con huevos, pan integral, frutas frescas y café. Ideal para comenzar el día con energía.",
        calorias: 420,
        categoria: "Desayuno",
        activo: true,
        proteinas: 20,
        carbohidratos: 45,
        grasas: 15,
        fibra: 8,
        azucar: 12,
        sodio: 450,
        tiempo: "20 minutos",
        dificultad: "Fácil",
        ingredientes: ["Huevos (2 unidades)", "Pan integral (2 rebanadas)", "Aguacate (1/2 unidad)", "Tomate (1 unidad)", "Café (1 taza)"],
        preparacion: "1. Cocinar huevos revueltos.\n2. Tostar pan integral.\n3. Cortar aguacate y tomate.\n4. Servir con café caliente.",
        tags: ["energético", "completo", "saludable"],
        beneficios: ["Alto en proteínas", "Rico en fibra", "Energía duradera"]
      },
      "Almuerzo": {
        nombre: "Pollo a la Plancha con Arroz",
        precio: 18.00,
        descripcion: "Pechuga de pollo a la plancha con arroz integral y ensalada fresca. Plato balanceado y nutritivo.",
        calorias: 480,
        categoria: "Almuerzo",
        activo: true,
        proteinas: 35,
        carbohidratos: 50,
        grasas: 12,
        fibra: 6,
        azucar: 5,
        sodio: 600,
        tiempo: "25 minutos",
        dificultad: "Fácil",
        ingredientes: ["Pechuga de pollo (200g)", "Arroz integral (150g)", "Lechuga (100g)", "Tomate (1 unidad)", "Aceite de oliva (1 cucharada)"],
        preparacion: "1. Cocinar pollo a la plancha.\n2. Preparar arroz integral.\n3. Preparar ensalada fresca.\n4. Servir todo junto.",
        tags: ["proteína", "balanceado", "nutritivo"],
        beneficios: ["Alto en proteínas", "Bajo en grasas", "Completo y nutritivo"]
      },
      "Cena": {
        nombre: "Salmón con Verduras al Vapor",
        precio: 22.00,
        descripcion: "Salmón fresco con verduras al vapor y puré de camote. Cena ligera y saludable.",
        calorias: 380,
        categoria: "Cena",
        activo: true,
        proteinas: 30,
        carbohidratos: 35,
        grasas: 14,
        fibra: 7,
        azucar: 8,
        sodio: 500,
        tiempo: "30 minutos",
        dificultad: "Media",
        ingredientes: ["Salmón (150g)", "Brócoli (100g)", "Zanahoria (100g)", "Camote (150g)", "Limón (1/2 unidad)"],
        preparacion: "1. Cocinar salmón a la plancha.\n2. Cocinar verduras al vapor.\n3. Preparar puré de camote.\n4. Servir con limón.",
        tags: ["ligero", "saludable", "omega-3"],
        beneficios: ["Rico en omega-3", "Bajo en calorías", "Fácil digestión"]
      }
    };

    const menusCollection = collection(db, "menus");
    let menusAgregados = 0;

    // Agregar un menú por cada categoría que no tenga menús
    for (const [categoria, menuData] of Object.entries(menusEjemplo)) {
      if (!categoriasExistentes.has(categoria)) {
        try {
          const menuCompleto = {
            ...menuData,
            creado: new Date().toISOString(),
            imagenURL: "../../imagenes/comidas.jpg"
          };
          
          console.log(`🎁 Creando menú de ejemplo para categoría ${categoria}:`, menuCompleto.nombre);
          await addDoc(menusCollection, menuCompleto);
          menusAgregados++;
          categoriasExistentes.add(categoria);
        } catch (error) {
          console.error(`❌ Error agregando menú de ${categoria}:`, error);
        }
      }
    }

    if (menusAgregados > 0) {
      console.log(`✅✅✅ ${menusAgregados} menú(s) de ejemplo creado(s) exitosamente!`);
      mostrarNotificacion(`🎁 ${menusAgregados} menú(s) de ejemplo agregado(s) automáticamente`, "success");
      
      // Recargar menús y actualizar dashboard
      setTimeout(async () => {
        try {
          await cargarMenus();
          if (typeof window.actualizarDashboard === "function") {
            await window.actualizarDashboard();
          }
        } catch (err) {
          console.warn("⚠️ Error al actualizar después de agregar menús de ejemplo:", err);
        }
      }, 500);
    } else {
      console.log("✅ Todas las categorías ya tienen menús");
    }
  } catch (error) {
    console.error("❌ Error al agregar menús de ejemplo por categoría:", error);
    console.warn("⚠️ Los menús de ejemplo no se pudieron agregar automáticamente");
  }
}

/* ---------------------------
   AGREGAR MENÚ DE EJEMPLO AUTOMÁTICAMENTE (después de guardar un menú)
   --------------------------- */
async function agregarMenuEjemplo() {
  try {
    if (!db) {
      console.warn("⚠️ Firebase no inicializado, no se puede agregar menú de ejemplo");
      return;
    }

    // Menú de ejemplo con datos completos
    const menuEjemplo = {
      nombre: "Ensalada Mediterránea Premium",
      precio: 18.50,
      descripcion: "Deliciosa ensalada fresca con ingredientes de la más alta calidad: lechuga romana, tomates cherry, aceitunas kalamata, queso feta, pepino, cebolla morada y aderezo de limón y aceite de oliva extra virgen.",
      calorias: 320,
      categoria: "Ensaladas",
      activo: true,
      proteinas: 12,
      carbohidratos: 25,
      grasas: 18,
      fibra: 8,
      azucar: 6,
      sodio: 450,
      tiempo: "15 minutos",
      dificultad: "Fácil",
      ingredientes: [
        "Lechuga romana fresca (200g)",
        "Tomates cherry (150g)",
        "Aceitunas kalamata (50g)",
        "Queso feta (80g)",
        "Pepino (100g)",
        "Cebolla morada (50g)",
        "Aceite de oliva extra virgen (2 cucharadas)",
        "Limón (1 unidad)",
        "Sal y pimienta al gusto"
      ],
      preparacion: "1. Lava y corta la lechuga romana en trozos medianos.\n2. Corta los tomates cherry por la mitad.\n3. Corta el pepino en rodajas finas.\n4. Corta la cebolla morada en aros delgados.\n5. Mezcla todos los vegetales en un bowl grande.\n6. Agrega las aceitunas kalamata y el queso feta desmenuzado.\n7. Prepara el aderezo mezclando aceite de oliva, jugo de limón, sal y pimienta.\n8. Vierte el aderezo sobre la ensalada y mezcla suavemente.\n9. Sirve inmediatamente para mantener la frescura.",
      tags: ["saludable", "fresco", "vegetariano", "mediterráneo", "ligero"],
      beneficios: [
        "Rica en fibra y antioxidantes",
        "Baja en calorías y grasas saturadas",
        "Fuente de vitaminas A, C y K",
        "Ayuda a mantener la hidratación",
        "Ideal para una dieta balanceada"
      ],
      creado: new Date().toISOString(),
      imagenURL: "../../imagenes/comidas.jpg" // Imagen por defecto
    };

    console.log("🎁 Creando menú de ejemplo:", menuEjemplo.nombre);
    
    const menusCollection = collection(db, "menus");
    const docRef = await addDoc(menusCollection, menuEjemplo);
    
    console.log("✅✅✅ Menú de ejemplo creado exitosamente!");
    console.log("🆔 ID del menú de ejemplo:", docRef.id);
    console.log("📋 Datos del menú de ejemplo:", menuEjemplo);
    
    // Mostrar notificación
    mostrarNotificacion("🎁 Menú de ejemplo agregado automáticamente: " + menuEjemplo.nombre, "success");
    
    // Recargar menús y actualizar dashboard después de agregar el ejemplo
    setTimeout(async () => {
      try {
        await cargarMenus();
        if (typeof window.actualizarDashboard === "function") {
          await window.actualizarDashboard();
        }
      } catch (err) {
        console.warn("⚠️ Error al actualizar después de agregar menú de ejemplo:", err);
      }
    }, 500);
    
    return docRef.id;
  } catch (error) {
    console.error("❌ Error al agregar menú de ejemplo:", error);
    // No mostrar error al usuario, solo loguear
    console.warn("⚠️ El menú de ejemplo no se pudo agregar, pero el menú principal se guardó correctamente");
  }
}

/* ---------------------------
   GUARDAR O CREAR NUEVO MENÚ (con imagen)
   --------------------------- */
window.guardarMenu = async function (e) {
  // e puede ser evento del form
  if (e && typeof e.preventDefault === "function") e.preventDefault();

  console.log("🔥🔥🔥 ===== INICIANDO GUARDADO DE MENÚ =====");
  console.log("🔥 Paso 1: Verificando Firebase...");
  
  // Verificación inicial de Firebase
  try {
    console.log("🔍 Verificando variable db:", db);
    console.log("🔍 Tipo de db:", typeof db);
    console.log("🔍 db es null?:", db === null);
    console.log("🔍 db es undefined?:", db === undefined);
    
    if (!db) {
      console.error("❌❌❌ ERROR CRÍTICO: db es:", db);
      console.error("❌ Firebase no está inicializado correctamente");
      
      // Intentar recargar Firebase
      try {
        const { db: newDb } = await import("../../Salud/Controlador/firebase.js");
        if (newDb) {
          console.log("✅ Firebase recargado exitosamente");
          // No podemos reasignar db directamente, pero podemos intentar usar newDb
          throw new Error("Firebase no inicializado. Recarga la página completa (Ctrl+F5).");
        }
      } catch (importError) {
        console.error("❌ Error al recargar Firebase:", importError);
      }
      
      throw new Error("Firestore no inicializado. Verifica la conexión con Firebase. Recarga la página (Ctrl+F5).");
    }
    
    console.log("✅ Firebase conectado correctamente");
    console.log("✅ Tipo de db:", db.constructor?.name);
    console.log("✅ App de Firebase:", db.app?.name || "N/A");
    
    // Verificar si es edición o creación
    const menuId = byId("menu-id")?.value || "";
    const esEdicion = menuId !== "";
    console.log(esEdicion ? "✏️ Modo: EDITAR menú" : "➕ Modo: CREAR nuevo menú");

    // Obtener valores de los campos
    const nombreInput = byId("menu-name");
    const precioInput = byId("menu-price");
    const descripcionInput = byId("menu-description");
    const caloriasInput = byId("menu-calories");
    const categoriaInput = byId("menu-category");

    console.log("📝 Leyendo valores del formulario...");
    console.log("- nombreInput:", nombreInput);
    console.log("- precioInput:", precioInput);

    const nombre = (nombreInput?.value || "").trim();
    const precioStr = (precioInput?.value || "").trim();
    const descripcion = (descripcionInput?.value || "").trim();
    const caloriasStr = (caloriasInput?.value || "").trim();
    const categoria = (categoriaInput?.value || "").trim();

    console.log("📋 Valores capturados:", {
      nombre,
      precioStr,
      descripcion,
      caloriasStr,
      categoria
    });

    // Validar campos requeridos ANTES de convertir a número
    const camposFaltantes = [];
    if (!nombre) camposFaltantes.push("Nombre del Menú");
    if (!precioStr || isNaN(precioStr) || parseFloat(precioStr) <= 0) camposFaltantes.push("Precio");
    if (!descripcion) camposFaltantes.push("Descripción");
    if (!caloriasStr || isNaN(caloriasStr) || parseInt(caloriasStr) <= 0) camposFaltantes.push("Calorías");
    if (!categoria) camposFaltantes.push("Categoría");

    if (camposFaltantes.length > 0) {
      const mensaje = `⚠️ Completa los campos requeridos:\n${camposFaltantes.join("\n- ")}`;
      mostrarNotificacion(mensaje, "error");
      alert(mensaje);
      console.error("❌ Campos faltantes:", camposFaltantes);
      return;
    }

    // Convertir a números después de validar que existan
    const precio = safeNum(precioStr);
    const calorias = safeNum(caloriasStr);

    // Campos adicionales (opcionales) para detalle
    const proteinas = safeNum(byId("menu-proteinas")?.value);
    const carbohidratos = safeNum(byId("menu-carbohidratos")?.value);
    const grasas = safeNum(byId("menu-grasas")?.value);
    const fibra = safeNum(byId("menu-fibra")?.value);
    const azucar = safeNum(byId("menu-azucar")?.value);
    const sodio = safeNum(byId("menu-sodio")?.value);
    const tiempo = (byId("menu-tiempo")?.value || "");
    const dificultad = (byId("menu-dificultad")?.value || "");
    const ingredientesRaw = (byId("menu-ingredientes")?.value || ""); // comma separated
    const preparacion = (byId("menu-preparacion")?.value || "");
    const tagsRaw = (byId("menu-tags")?.value || ""); // comma separated
    const beneficiosRaw = (byId("menu-beneficios")?.value || ""); // comma separated

    const ingredientes = ingredientesRaw.split(",").map(s => s.trim()).filter(Boolean);
    const tags = tagsRaw.split(",").map(s => s.trim()).filter(Boolean);
    const beneficios = beneficiosRaw.split(",").map(s => s.trim()).filter(Boolean);

    // Intentar leer input file (si existe en tu form)
    let imagenInfo = null;
    const fileInput = byId("menu-image");
    if (fileInput && fileInput.files && fileInput.files.length > 0) {
      try {
        mostrarNotificacion("Subiendo imagen...", "info");
        console.log("📤 Iniciando subida de imagen...");
        
        // Verificar que Storage esté disponible
        if (!storage) {
          throw new Error("Firebase Storage no está inicializado. El menú se guardará sin imagen.");
        }
        
        imagenInfo = await uploadImageFile(fileInput.files[0]); // {url, path}
        console.log("✅ Imagen subida exitosamente:", imagenInfo);
        mostrarNotificacion("✅ Imagen subida exitosamente", "success");
      } catch (uploadErr) {
        console.error("❌ Error subiendo imagen:", uploadErr);
        console.error("📋 Detalles del error:", {
          code: uploadErr.code,
          message: uploadErr.message,
          name: uploadErr.name,
          stack: uploadErr.stack
        });
        
        // Detectar si es error de CORS
        const isCorsError = uploadErr.message?.includes("CORS") || 
                           uploadErr.message?.includes("blocked") ||
                           uploadErr.name === "NetworkError" ||
                           uploadErr.code === "storage/unauthorized";
        
        if (isCorsError) {
          // Error de CORS - continuar sin imagen (no mostrar alert molesto)
          console.warn("⚠️ Error de CORS en Storage. El menú se guardará sin imagen.");
          mostrarNotificacion("⚠️ No se pudo subir la imagen. El menú se guardará sin imagen.", "warning");
        } else {
          mostrarNotificacion("⚠️ No se pudo subir la imagen (continuando sin imagen)", "warning");
        }
        imagenInfo = null;
      }
    }

    // Preparar documento
    const docData = {
      nombre,
      precio,
      descripcion,
      calorias,
      categoria,
      activo: true,
      // campos opcionales extendidos para comida-detalle
      proteinas: proteinas || 0,
      carbohidratos: carbohidratos || 0,
      grasas: grasas || 0,
      fibra: fibra || 0,
      azucar: azucar || 0,
      sodio: sodio || 0,
      tiempo: tiempo || "",
      dificultad: dificultad || "",
      ingredientes: ingredientes || [],
      preparacion: preparacion || "",
      tags: tags || [],
      beneficios: beneficios || []
    };

    // Solo agregar fecha de creación si es nuevo menú
    if (!esEdicion) {
      docData.creado = new Date().toISOString();
    }

    // Manejar imagen
    if (imagenInfo) {
      // Nueva imagen subida
      docData.imagenURL = imagenInfo.url;
      docData.imagenNombre = imagenInfo.path; // ruta en storage
    } else if (esEdicion) {
      // Si estamos editando y no hay nueva imagen, mantener la imagen existente
      try {
        const docRef = doc(db, "menus", menuId);
        const menuDoc = await getDoc(docRef);
        if (menuDoc.exists()) {
          const existingData = menuDoc.data();
          if (existingData.imagenURL) {
            docData.imagenURL = existingData.imagenURL;
            docData.imagenNombre = existingData.imagenNombre;
          }
        }
      } catch (err) {
        console.warn("No se pudo obtener imagen existente:", err);
      }
    }

    // Guardar o actualizar documento en Firestore
    console.log("💾 Guardando en Firestore...");
    console.log("📦 Datos a guardar:", JSON.stringify(docData, null, 2));
    console.log("🔍 Verificando db:", db);
    console.log("🔍 Tipo de db:", typeof db);
    
    if (!db) {
      const errorMsg = "ERROR CRÍTICO: Firebase no está inicializado. Recarga la página (Ctrl+F5).";
      mostrarNotificacion(errorMsg, "error");
      alert(errorMsg);
      throw new Error(errorMsg);
    }
    
    let menuIdFinal = menuId;
    
    try {
      // Mostrar notificación de guardado
      mostrarNotificacion("💾 Guardando menú en Firebase...", "info");
      
      if (esEdicion) {
        // Actualizar menú existente
        console.log("🔄 Actualizando menú existente con ID:", menuId);
        const docRef = doc(db, "menus", menuId);
        console.log("📝 Documento referencia:", docRef);
        await updateDoc(docRef, docData);
        console.log("✅ Menú actualizado exitosamente en Firestore!");
        mostrarNotificacion("✅ Menú actualizado exitosamente", "success");
      } else {
        // Crear nuevo menú
        console.log("➕ Creando nuevo menú en Firestore...");
        const menusCollection = collection(db, "menus");
        console.log("📚 Colección de menús:", menusCollection);
        
        console.log("🚀 Ejecutando addDoc con datos:", docData);
        
        const docRef = await addDoc(menusCollection, docData);
        menuIdFinal = docRef.id;
        
        console.log("✅✅✅ addDoc completado exitosamente!");
        console.log("🆔 ID del menú creado:", menuIdFinal);
        
        // Verificar que se guardó correctamente
        console.log("🔍 Verificando documento guardado...");
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const verifyDoc = await getDoc(docRef);
        if (verifyDoc.exists()) {
          console.log("✅✅✅ VERIFICACIÓN EXITOSA: El documento existe en Firestore!");
          console.log("📄 Datos verificados:", verifyDoc.data());
          mostrarNotificacion("✅ Menú creado y guardado exitosamente en Firebase", "success");
        } else {
          console.error("❌❌❌ ERROR: El documento no existe después de crearlo!");
          const errorMsg = "ERROR: El menú se intentó guardar pero no aparece en Firebase.\n\nPosibles causas:\n1. Las reglas de seguridad de Firestore están bloqueando la escritura\n2. Problema de permisos\n3. Error de red\n\nRevisa la consola (F12) para más detalles.";
          mostrarNotificacion(errorMsg, "error");
          alert(errorMsg);
          throw new Error("Documento no existe después de crearlo");
        }
      }
      
      console.log("📋 Datos guardados correctamente:", docData);
    } catch (firestoreError) {
      console.error("❌❌❌ ERROR AL GUARDAR EN FIRESTORE:", firestoreError);
      console.error("📋 Detalles completos del error:", {
        name: firestoreError.name,
        code: firestoreError.code,
        message: firestoreError.message,
        stack: firestoreError.stack
      });
      
      let errorMessage = "❌ Error al guardar en Firebase";
      let solucion = "";
      
      if (firestoreError.code === "permission-denied") {
        errorMessage = "❌ PERMISO DENEGADO\n\nLas reglas de seguridad de Firestore están bloqueando la escritura.";
        solucion = "\n\n🔧 SOLUCIÓN:\n1. Ve a: https://console.firebase.google.com\n2. Selecciona tu proyecto: salud-5ac61\n3. Ve a: Firestore Database > Reglas\n4. Cambia las reglas a:\n\nrules_version = '2';\nservice cloud.firestore {\n  match /databases/{database}/documents {\n    match /menus/{document=**} {\n      allow read, write: if true;\n    }\n  }\n}\n\n5. Haz clic en 'Publicar'";
      } else if (firestoreError.code === "unavailable") {
        errorMessage = "❌ FIREBASE NO DISPONIBLE\n\nVerifica tu conexión a Internet.";
        solucion = "\n\n🔧 SOLUCIÓN:\n1. Verifica tu conexión a Internet\n2. Recarga la página (Ctrl+F5)\n3. Intenta de nuevo";
      } else if (firestoreError.code === "unauthenticated") {
        errorMessage = "❌ NO AUTENTICADO\n\nNecesitas configurar las reglas de Firestore.";
        solucion = "\n\n🔧 SOLUCIÓN:\nAjusta las reglas de seguridad de Firestore para permitir escritura sin autenticación (solo para desarrollo)";
      } else {
        errorMessage = `❌ ERROR: ${firestoreError.code || "Desconocido"}\n\n${firestoreError.message || "Error al guardar en Firebase"}`;
        solucion = "\n\n🔧 VERIFICA:\n1. Abre la consola del navegador (F12)\n2. Revisa los errores detallados\n3. Verifica las reglas de Firestore\n4. Verifica tu conexión a Internet";
      }
      
      console.error("📋 Mensaje de error completo:", errorMessage);
      console.error("📋 Solución sugerida:", solucion);
      
      mostrarNotificacion(errorMessage, "error");
      
      // Mostrar alerta con información detallada
      alert(`${errorMessage}${solucion}\n\n📝 Código de error: ${firestoreError.code || "N/A"}\n📝 Mensaje: ${firestoreError.message}\n\n💡 Abre la consola (F12) para ver más detalles.`);
      
      // Re-lanzar el error para debugging
      throw firestoreError;
    }
    
    // Cerrar modal después de guardar exitosamente
    document.getElementById('menu-modal').style.display = 'none';
    
    // Limpiar formulario
    const menuForm = byId("menu-form");
    if (menuForm) {
      menuForm.reset();
      // Limpiar ID de edición
      byId("menu-id").value = "";
      // Restaurar título del modal
      byId("menu-modal-title").textContent = "Agregar Nuevo Menú";
      // Limpiar también el input de archivo y vista previa
      const fileInput = byId("menu-image");
      if (fileInput) {
        fileInput.value = "";
      }
      const filePreview = byId("file-preview");
      if (filePreview) {
        filePreview.style.display = "none";
      }
    }
    
    // Recargar menús en la tabla inmediatamente
    await cargarMenus();
    
    // Actualizar dashboard inmediatamente
    console.log("🔄 Actualizando dashboard después de guardar menú...");
    if (typeof window.actualizarDashboard === "function") {
      try {
        await window.actualizarDashboard();
        console.log("✅ Dashboard actualizado correctamente");
      } catch (err) {
        console.error("❌ Error actualizando dashboard:", err);
      }
    } else {
      console.warn("⚠️ Función actualizarDashboard no disponible");
      // Forzar actualización manual
      try {
        if (!db) throw new Error("Firestore no inicializado");
        const menusSnap = await getDocs(collection(db, "menus"));
        let menusActivos = 0;
        menusSnap.forEach(doc => {
          if (doc.data().activo !== false) menusActivos++;
        });
        const menusEl = byId("stat-menus");
        if (menusEl) {
          menusEl.textContent = menusActivos.toString();
          console.log(`✅ Contador de menús actualizado manualmente: ${menusActivos}`);
        }
      } catch (err) {
        console.error("❌ Error en actualización manual:", err);
      }
    }
    
    // Cerrar modal después de un breve delay para que se vea la notificación
    setTimeout(() => {
      const menuModal = byId("menu-modal");
      if (menuModal) {
        hideModal(menuModal);
      }
      mostrarNotificacion("💡 El menú ya está visible en la pantalla principal", "info");
    }, 1500);

  } catch (err) {
    console.error("❌❌❌ ERROR GENERAL AL GUARDAR MENÚ:", err);
    console.error("📋 Tipo de error:", err.constructor.name);
    console.error("📋 Mensaje:", err.message);
    console.error("📋 Stack:", err.stack);
    
    let errorMsg = `Error al guardar menú: ${err.message || "Error desconocido"}`;
    
    // Mensajes específicos según el tipo de error
    if (err.code === "permission-denied") {
      errorMsg = "❌ Permiso denegado. Verifica las reglas de seguridad de Firestore.";
    } else if (err.code === "unavailable") {
      errorMsg = "❌ Firebase no disponible. Verifica tu conexión a Internet.";
    } else if (err.message?.includes("Firestore no inicializado")) {
      errorMsg = "❌ Firebase no está inicializado. Recarga la página.";
    }
    
    mostrarNotificacion(errorMsg, "error");
    
    // Mostrar alerta más detallada
    alert(`ERROR AL GUARDAR MENÚ:\n\n${errorMsg}\n\nPor favor:\n1. Abre la consola del navegador (F12)\n2. Verifica los errores mostrados\n3. Revisa las reglas de seguridad de Firestore\n4. Verifica tu conexión a Internet`);
    
    // Re-lanzar el error para debugging
    throw err;
  }
};

/* ---------------------------
   INVENTARIO (sin cambios funcionales)
   --------------------------- */
async function cargarInventario() {
  try {
    if (!db) throw new Error("Firestore no inicializado (db undefined)");
    const ref = collection(db, "inventario");
    let snap;
    try {
      snap = await getDocs(query(ref, orderBy("nombre")));
    } catch (e) {
      console.warn("orderBy('nombre') falló, usando getDocs sin orderBy:", e);
      snap = await getDocs(ref);
    }

    let html = "";
    snap.forEach(s => {
      const d = s.data();
      html += `
        <tr>
          <td>${d.nombre || ""}</td>
          <td>${d.categoria || ""}</td>
          <td>${d.stock_actual ?? 0} ${d.unidad || ""}</td>
          <td>${d.stock_minimo ?? 0}</td>
          <td><span class="status ${d.stock_actual <= (d.stock_minimo||0) ? "warning" : "active"}">${d.stock_actual <= (d.stock_minimo||0) ? "Bajo" : "Normal"}</span></td>
          <td>${d.fecha_actualizacion ? formatDateISO(d.fecha_actualizacion) : "N/A"}</td>
          <td>
            <div class="action-buttons">
              <button class="action-btn edit-btn" data-id="${s.id}" data-type="inventory"><i class="fas fa-edit"></i></button>
              <button class="action-btn delete-btn" data-id="${s.id}" data-type="inventory"><i class="fas fa-trash"></i></button>
            </div>
          </td>
        </tr>`;
    });
    const tbody = qSel("#inventory tbody");
    if (tbody) tbody.innerHTML = html;
    attachTableActionListeners();
  } catch (e) {
    console.error("cargarInventario:", e);
  }
}

async function registrarInventario(data, id) {
  try {
    if (!db) throw new Error("Firestore no inicializado (db undefined)");
    if (id) {
      const ref = doc(db, "inventario", id);
      await updateDoc(ref, {
        nombre: data.nombre,
        categoria: data.categoria,
        stock_actual: safeNum(data.stock_actual),
        stock_minimo: safeNum(data.stock_minimo),
        fecha_actualizacion: new Date().toISOString()
      });
    } else {
      await addDoc(collection(db, "inventario"), {
        nombre: data.nombre,
        categoria: data.categoria,
        stock_actual: safeNum(data.stock_actual),
        stock_minimo: safeNum(data.stock_minimo),
        unidad: data.unidad || "",
        fecha_actualizacion: new Date().toISOString()
      });
    }
    hideModal(byId("inventory-modal"));
    await cargarInventario();
    mostrarNotificacion("Inventario guardado", "success");
  } catch (e) {
    console.error("registrarInventario:", e);
    mostrarNotificacion("Error guardando inventario", "error");
  }
}

/* ---------------------------
   DESPERDICIOS (sin cambios)
   --------------------------- */
async function cargarDesperdicios() {
  try {
    if (!db) throw new Error("Firestore no inicializado (db undefined)");
    const ref = collection(db, "desperdicios");
    let snap;
    try {
      snap = await getDocs(query(ref, orderBy("fecha", "desc")));
    } catch (e) {
      console.warn("orderBy('fecha') falló, usando getDocs sin orderBy:", e);
      snap = await getDocs(ref);
    }

    let html = "";
    snap.forEach(s => {
      const d = s.data();
      html += `
        <tr>
          <td>${d.fecha ? formatDateISO(d.fecha) : "N/A"}</td>
          <td>${d.producto || ""}</td>
          <td>${d.cantidad ?? 0} ${d.unidad || ""}</td>
          <td>${d.motivo || ""}</td>
          <td>S/ ${d.costo ? Number(d.costo).toFixed(2) : "0.00"}</td>
          <td>
            <div class="action-buttons">
              <button class="action-btn edit-btn" data-id="${s.id}" data-type="waste"><i class="fas fa-edit"></i></button>
              <button class="action-btn delete-btn" data-id="${s.id}" data-type="waste"><i class="fas fa-trash"></i></button>
            </div>
          </td>
        </tr>`;
    });
    const tbody = qSel("#waste tbody");
    if (tbody) tbody.innerHTML = html;
    attachTableActionListeners();
  } catch (e) {
    console.error("cargarDesperdicios:", e);
  }
}

async function registrarDesperdicio(data, id) {
  try {
    if (!db) throw new Error("Firestore no inicializado (db undefined)");
    if (id) {
      const ref = doc(db, "desperdicios", id);
      await updateDoc(ref, {
        fecha: data.fecha,
        producto: data.producto,
        cantidad: safeNum(data.cantidad),
        costo: safeNum(data.costo),
        motivo: data.motivo || ""
      });
    } else {
      await addDoc(collection(db, "desperdicios"), {
        fecha: data.fecha,
        producto: data.producto,
        cantidad: safeNum(data.cantidad),
        costo: safeNum(data.costo),
        motivo: data.motivo || ""
      });
    }
    hideModal(byId("waste-modal"));
    await cargarDesperdicios();
    mostrarNotificacion("Desperdicio guardado", "success");
  } catch (e) {
    console.error("registrarDesperdicio:", e);
    mostrarNotificacion("Error guardando desperdicio", "error");
  }
}

/* ---------------------------
   USUARIOS (sin cambios)
   --------------------------- */
async function cargarUsuarios(filter = "") {
  try {
    if (!db) {
      console.error("Firestore no inicializado (db undefined)");
      mostrarNotificacion("Error: Firebase no inicializado", "error");
      return;
    }
    
    console.log("🔄 Cargando usuarios desde Firebase...");
    const ref = collection(db, "usuarios");
    let snap;
    
    try {
      // Intentar ordenar por fecha de registro
      snap = await getDocs(query(ref, orderBy("registradoEn", "desc")));
    } catch (e) {
      console.warn("orderBy('registradoEn') falló, usando getDocs sin orderBy:", e);
      try {
        // Intentar ordenar por otro campo
        snap = await getDocs(query(ref, orderBy("email", "asc")));
      } catch (e2) {
        console.warn("orderBy('email') también falló, usando getDocs sin orderBy:", e2);
        snap = await getDocs(ref);
      }
    }

    if (!snap || snap.empty) {
      console.log("No hay usuarios registrados en Firebase");
      const tbody = document.querySelector("#users tbody");
      if (tbody) {
        tbody.innerHTML = `
          <tr>
            <td colspan="6" style="text-align: center; padding: 2rem;">
              <p>No hay usuarios registrados aún</p>
            </td>
          </tr>
        `;
      }
      return;
    }

    let html = "";
    let usuariosEncontrados = 0;

    snap.forEach(s => {
      const d = s.data();
      
      // Obtener datos del usuario
      const email = d.email || "";
      const nombreCompleto = d.nombre || d.nombreCompleto || email.split("@")[0];
      const nombre = nombreCompleto;
      const rol = d.rol || "usuario";
      const estado = d.activo !== false ? "Activo" : "Inactivo";
      const registradoEn = d.registradoEn || d.creado || d.fechaCreacion || "";
      
      // Filtrar si hay filtro aplicado
      if (filter && !email.toLowerCase().includes(filter.toLowerCase()) && 
          !nombre.toLowerCase().includes(filter.toLowerCase())) {
        return;
      }

      usuariosEncontrados++;
      
      // Formatear fecha
      let fechaFormateada = "N/A";
      if (registradoEn) {
        try {
          if (typeof registradoEn === 'string') {
            fechaFormateada = registradoEn.split("T")[0];
          } else if (registradoEn.toDate) {
            fechaFormateada = registradoEn.toDate().toISOString().split("T")[0];
          }
        } catch (e) {
          fechaFormateada = "N/A";
        }
      }

      html += `
        <tr>
          <td>${nombre}</td>
          <td>${email}</td>
          <td><span class="role-badge role-${rol.toLowerCase()}">${rol}</span></td>
          <td>${fechaFormateada}</td>
          <td><span class="status ${estado === 'Activo' ? 'active' : 'inactive'}">${estado}</span></td>
          <td>
            <div class="action-buttons">
              <button class="action-btn edit-btn" data-id="${s.id}" data-type="user"><i class="fas fa-edit"></i></button>
              <button class="action-btn delete-btn" data-id="${s.id}" data-type="user"><i class="fas fa-trash"></i></button>
            </div>
          </td>
        </tr>
      `;
    });

    const tbody = document.querySelector("#users tbody");
    if (tbody) {
      if (usuariosEncontrados === 0 && filter) {
        tbody.innerHTML = `
          <tr>
            <td colspan="6" style="text-align: center; padding: 2rem;">
              <p>No se encontraron usuarios que coincidan con "${filter}"</p>
            </td>
          </tr>
        `;
      } else {
        tbody.innerHTML = html;
      }
    }
    
    attachTableActionListeners();
    console.log(`✅ ${usuariosEncontrados} usuarios cargados desde Firebase`);
    
    // Actualizar contador en dashboard
    actualizarContadorUsuarios(usuariosEncontrados);
    
  } catch (e) {
    console.error("Error cargando usuarios:", e);
    mostrarNotificacion(`Error al cargar usuarios: ${e.message}`, "error");
    const tbody = document.querySelector("#users tbody");
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 2rem; color: #ef4444;">
            <p>Error al cargar usuarios: ${e.message}</p>
          </td>
        </tr>
      `;
    }
  }
}

// Función para actualizar contador de usuarios en el dashboard
function actualizarContadorUsuarios(total) {
  const statEls = document.querySelectorAll(".stat-info h3");
  if (statEls && statEls.length >= 1) {
    statEls[0].textContent = total.toLocaleString();
  }
}

window.cargarUsuarios = cargarUsuarios;

// ---------------- Detectar y mostrar inconsistencias ----------------
function detectarInconsistencias(reportData) {
  const warnings = [];

  if (!reportData || typeof reportData !== 'object') {
    warnings.push('Datos no válidos o faltantes');
    return warnings;
  }

  // ejemplo: desperdicio negativo o NaN
  if (Array.isArray(reportData.wasteTrend?.values) &&
      reportData.wasteTrend.values.some(v => typeof v !== 'number' || isNaN(v) || v < 0)) {
    warnings.push('Se detectaron valores inválidos en Tendencias de Desperdicio');
  }

  // ejemplo: counts NaN o negativos en categories
  if (Array.isArray(reportData.categoryConsumption?.values) &&
      reportData.categoryConsumption.values.some(v => typeof v !== 'number' || isNaN(v) || v < 0)) {
    warnings.push('Se detectaron valores inválidos en Consumo por Categoría');
  }

  // ejemplo: preferencias vacías o datos incoherentes
  if (!Array.isArray(reportData.preferences?.values) || reportData.preferences.values.length === 0) {
    warnings.push('Preferencias de usuarios incompletas');
  }

  return warnings;
}

function mostrarAdvertenciaReportes(warnings) {
  const el = document.getElementById('report-warning');
  if (!el) return;
  if (!warnings || warnings.length === 0) {
    el.style.display = 'none';
    el.textContent = '';
    return;
  }
  el.style.display = 'block';
  el.textContent = 'Datos inconsistentes detectados: ' + warnings.join('; ');
}

// ---------------- Helper: paleta de colores ----------------
// --- Fallback seguro por si generatePalette no ha sido definido aún ---
if (typeof window.generatePalette !== 'function') {
  window.generatePalette = function(n) {
    const base = [
      "rgba(43,124,255,0.85)",
      "rgba(16,185,129,0.85)",
      "rgba(245,158,11,0.85)",
      "rgba(239,68,68,0.85)",
      "rgba(99,102,241,0.85)",
      "rgba(236,72,153,0.85)",
      "rgba(20,184,166,0.85)",
      "rgba(59,130,246,0.85)",
      "rgba(250,204,21,0.85)",
      "rgba(124,58,237,0.85)"
    ];
    if (!n || n <= 0) return [];
    if (n <= base.length) return base.slice(0, n);
    const out = [];
    for (let i = 0; i < n; i++) out.push(base[i % base.length]);
    return out;
  };
}

// (opcional) exponer globalmente si algún lugar lo llama como window.generatePalette
window.generatePalette = generatePalette;

// ---------------- Helper: normalizar colores para dataset ----------------
function normalizeColorsForDataset(type, labelsCount, datasetOptions = {}) {
  let bc = datasetOptions.backgroundColor;
  let brc = datasetOptions.borderColor;

  if (!bc) {
    if (type === "doughnut" || type === "pie" || labelsCount > 1) {
      bc = generatePalette(labelsCount);
    } else {
      bc = "rgba(239,68,68,1)";
    }
  }

  if (!brc) {
    if (Array.isArray(bc)) {
      brc = bc.map(c => c.replace(/0\.85\)/, "1)"));
    } else {
      brc = bc.toString().replace(/0\.85\)/, "1)");
    }
  }

  return { backgroundColor: bc, borderColor: brc };
}

// ---------- renderChart (reemplazo seguro, utiliza window.generatePalette y el objeto global charts) ----------
function renderChart(canvasId, chartType, dataObj = {}, extraOptions = {}) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) {
    console.error(`❌ No existe canvas con id: ${canvasId}`);
    return null;
  }

  // --- recuperar / preparar presets (persisten entre renders) ---
  const presets = window.__chartPresets || (window.__chartPresets = {});
  presets[canvasId] = presets[canvasId] || { datasetOptions: {}, extraOptions: {} };

  // fusionar datasetOptions entrantes con lo guardado (entrante tiene prioridad)
  const incomingDS = Object.assign({}, presets[canvasId].datasetOptions, dataObj.datasetOptions || {});
  // fusionar extraOptions (deep-ish para plugins,scales)
  const incomingExtra = Object.assign({}, presets[canvasId].extraOptions, extraOptions || {});
  // merge nested plugins.title y plugins.legend si existían
  incomingExtra.plugins = Object.assign({}, presets[canvasId].extraOptions?.plugins || {}, extraOptions?.plugins || {});
  incomingExtra.scales = Object.assign({}, presets[canvasId].extraOptions?.scales || {}, extraOptions?.scales || {});

  // Si no hay title.text explícito, usar dataObj.title o dataObj.label como texto del título
  if (!incomingExtra.plugins) incomingExtra.plugins = {};
  if (!incomingExtra.plugins.title) incomingExtra.plugins.title = {};
  incomingExtra.plugins.title.text = incomingExtra.plugins.title.text || dataObj.title || dataObj.label || "";

  // Asegurar que la leyenda no se desactive accidentalmente: si no viene, mantener true
  if (!incomingExtra.plugins.legend) incomingExtra.plugins.legend = { display: true };
  // guardar como presets (para la próxima render)
  presets[canvasId].datasetOptions = incomingDS;
  presets[canvasId].extraOptions = incomingExtra;

  // --- colores y comportamiento por defecto ---
  const labels = dataObj.labels || [];
  const labelsCount = labels.length || 1;

  // Si no vino backgroundColor / borderColor en incomingDS, calcularlo (pero respetar si vienen)
  if (!incomingDS.backgroundColor) {
    // Para desperdicio (wasteTrendChart) forzamos un rojo por defecto si el canvas coincide
    if (canvasId === "wasteTrendChart") {
      incomingDS.backgroundColor = "rgba(239,68,68,0.2)";
      incomingDS.borderColor = "rgba(239,68,68,1)";
      incomingDS.fill = true;
      incomingDS.tension = incomingDS.tension ?? 0.35;
    } else {
      // usar la paleta por etiquetas (reusa colorMaps si estás usando eso)
      const cm = ensureColorMapForCanvas ? ensureColorMapForCanvas(canvasId, labels) : null;
      // si tenemos map, crear array de colores por label
      if (cm && labelsCount > 1) {
        incomingDS.backgroundColor = labels.map(l => cm.map[l] || (generatePalette ? generatePalette(1)[0] : 'rgba(43,124,255,0.85)'));
        incomingDS.borderColor = Array.isArray(incomingDS.backgroundColor)
          ? incomingDS.backgroundColor.map(c => String(c).replace(/0\.85\)/, '1)'))
          : String(incomingDS.backgroundColor).replace(/0\.85\)/, '1)');
      } else {
        // single-color fallback
        const pal = (typeof generatePalette === 'function') ? generatePalette(1)[0] : 'rgba(43,124,255,0.85)';
        incomingDS.backgroundColor = pal;
        incomingDS.borderColor = String(pal).replace(/0\.85\)/, '1)');
      }
    }
  } else {
    // si sí vino backgroundColor pero no borderColor, derivar borderColor
    if (!incomingDS.borderColor) {
      if (Array.isArray(incomingDS.backgroundColor)) {
        incomingDS.borderColor = incomingDS.backgroundColor.map(c => String(c).replace(/0\.85\)/, '1)'));
      } else {
        incomingDS.borderColor = String(incomingDS.backgroundColor).replace(/0\.85\)/, '1)');
      }
    }
  }

  // construir dataset final
  const finalDataset = Object.assign({
    label: dataObj.label || "",
    data: dataObj.values || [],
    borderWidth: (dataObj.borderWidth !== undefined) ? dataObj.borderWidth : 2
  }, incomingDS);

  // --- destruir instancia anterior (si existe) ---
  try {
    if (charts[canvasId] && typeof charts[canvasId].destroy === 'function') {
      charts[canvasId].destroy();
      delete charts[canvasId];
      canvas._chartInstance = null;
    }
  } catch (err) {
    console.warn("⚠️ Error destruyendo chart previo:", err);
  }

  // opciones por defecto legibles (titulos y leyenda siempre visibles por defecto)
  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: !!incomingExtra.plugins?.title?.text,
        text: incomingExtra.plugins?.title?.text || "",
        color: '#0f172a',
        font: { size: 14 }
      },
      legend: {
        display: (incomingExtra.plugins?.legend?.display !== undefined) ? incomingExtra.plugins.legend.display : true,
        labels: { color: '#1f2937' }
      }
    },
    scales: {
      x: { ticks: { color: '#374151' }, grid: { color: 'rgba(0,0,0,0.06)' } },
      y: { ticks: { color: '#374151' }, grid: { color: 'rgba(0,0,0,0.06)' } }
    }
  };

  // merge inteligente: defaultOptions <- incomingExtra (plugins,scales ya fusionados arriba)
  const opts = Object.assign({}, defaultOptions, incomingExtra);
  // plugins ya están fusionados, pero asegurar nested merge
  opts.plugins = Object.assign({}, defaultOptions.plugins, incomingExtra.plugins || {});

  const config = {
    type: chartType,
    data: {
      labels: labels || [],
      datasets: [finalDataset]
    },
    options: opts
  };

  // crear chart
  const ctx = canvas.getContext('2d');
  const chart = new Chart(ctx, config);

  // guardar referencia
  charts[canvasId] = chart;
  try { canvas._chartInstance = chart; } catch(e){}

  return chart;
}

/* ---------------------------
   REPORTES (Chart.js) - sin cambios
   --------------------------- */
// Reemplaza la función cargarReportes existente por esta versión unificada
async function cargarReportes(periodo = "month") {
  try {
    if (!db) throw new Error("Firestore no inicializado (db undefined)");
    console.log("📊 cargarReportes() usando fetchReportsFromFirestore. Período:", periodo);

    // Usar la función que ya agrupa y filtra por periodo (week/month/quarter)
    const data = await fetchReportsFromFirestore(periodo);
    // detectar inconsistencias y mostrar advertencia si las hay
    const inconsistencias = detectarInconsistencias(data);
    mostrarAdvertenciaReportes(inconsistencias);
    console.log("📊 Datos agregados recibidos:", data);

    // Ahora solo renderizamos los charts con esos datos (mantén colores y opciones)
    renderChart('categoryChart', 'bar', {
      labels: data.categoryConsumption.labels,
      values: data.categoryConsumption.values,
      label: 'Consumo por categoría',
      datasetOptions: {
        // Si quieres una paleta por etiqueta, `renderChart` la generará si no pasas colores
        backgroundColor: generatePalette(data.categoryConsumption.labels.length),
        borderColor: null
      }
    }, {
      plugins: { title: { display: true, text: 'Consumo por Categoría' }, legend: { display: false } },
      scales: { y: { beginAtZero: true } }
    });

    renderChart('wasteTrendChart', 'line', {
      labels: data.wasteTrend.labels,
      values: data.wasteTrend.values,
      label: 'Kg desperdiciados',
      datasetOptions: {
        borderColor: "rgba(239,68,68,1)",
        backgroundColor: "rgba(239,68,68,0.2)",
        fill: true,
        tension: 0.35
      }
    }, {
      plugins: { title: { display: true, text: 'Tendencias de Desperdicio' } },
      scales: { y: { beginAtZero: true } }
    });

    renderChart('preferenceChart', 'doughnut', {
      labels: data.preferences.labels,
      values: data.preferences.values,
      label: 'Preferencias',
      datasetOptions: {
        backgroundColor: generatePalette(data.preferences.labels.length),
        borderColor: null
      }
    }, {
      plugins: { title: { display: true, text: 'Preferencias de Usuarios' }, legend: { position: 'bottom' } }
    });

    renderChart('efficiencyChart', 'doughnut', {
      labels: data.efficiency.labels,
      values: data.efficiency.values,
      label: 'Eficiencia',
      datasetOptions: {
        backgroundColor: generatePalette(data.efficiency.labels.length),
        borderColor: null
      }
    }, {
      plugins: { title: { display: true, text: 'Eficiencia' }, legend: { position: 'bottom' } }
    });

    console.log("✅ cargarReportes: gráficos actualizados con datos por período:", periodo);
    mostrarNotificacion("✅ Reportes actualizados", "success");
  } catch (e) {
    console.error("❌ Error en cargarReportes unificada:", e);
    mostrarNotificacion("❌ Error generando reportes: " + e.message, "error");
  }
}
window.cargarReportes = cargarReportes;

window.fetchReportsFromFirestore = async function(period = 'month') {
  if (!db) throw new Error('Firestore (db) no está inicializado. Revisa la importación de firebase.js');

  // util: fecha en ISO YYYY-MM-DD
  const toISODate = (d) => {
    const dt = (typeof d === 'string') ? new Date(d) : d instanceof Date ? d : new Date(String(d));
    if (isNaN(dt)) return null;
    return dt.toISOString().slice(0,10);
  };

  // construir buckets para wasteTrend según period
  let wasteLabels = [];
  let startDateISO = null;

  if (period === 'week') {
    // últimos 7 días: etiquetas YYYY-MM-DD (desde 6 días atrás -> hoy)
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setUTCDate(d.getUTCDate() - i);
      wasteLabels.push(d.toISOString().slice(0,10));
    }
    startDateISO = wasteLabels[0];
  } else if (period === 'quarter') {
    // 12 semanas: labels Semana -11 ... Semana 0
    for (let i = 11; i >= 0; i--) wasteLabels.push(`Semana -${i}`);
    const d = new Date(); d.setUTCDate(d.getUTCDate() - (12 * 7)); startDateISO = d.toISOString().slice(0,10);
  } else { // month
    // 4 semanas labels Semana -3 ... Semana 0
    for (let i = 3; i >= 0; i--) wasteLabels.push(`Semana -${i}`);
    const d = new Date(); d.setUTCDate(d.getUTCDate() - 30); startDateISO = d.toISOString().slice(0,10);
  }

  const result = {
    categoryConsumption: { labels: [], values: [] },
    wasteTrend: { labels: wasteLabels.slice(), values: [] },
    preferences: { labels: [], values: [] },
    efficiency: { labels: [], values: [] }
  };

  // --- 1) categoryConsumption: usar 'menus' como aproximación por categoría
  try {
    const menusSnap = await getDocs(collection(db, 'menus'));
    const counts = {};
    menusSnap.forEach(doc => {
      const d = doc.data();
      if (!d) return;
      if (typeof d.activo !== 'undefined' && !d.activo) return; // ignorar inactivos
      const cat = (d.categoria || 'Sin categoría').toString();
      counts[cat] = (counts[cat] || 0) + 1;
    });
    result.categoryConsumption.labels = Object.keys(counts);
    result.categoryConsumption.values = Object.keys(counts).map(k => counts[k]);
    if (result.categoryConsumption.labels.length === 0) {
      result.categoryConsumption = { labels: ['Desayuno','Almuerzo','Cena','Bebidas'], values: [1,1,1,1] };
    }
  } catch (err) {
    console.warn('[Reports] error leyendo menus:', err);
    result.categoryConsumption = { labels: ['Desayuno','Almuerzo','Cena','Bebidas'], values: [1,1,1,1] };
  }

  // --- 2) wasteTrend: agrupar desperdicios por fecha o por semana (según period)
  try {
    const desperdiciosSnap = await getDocs(collection(db, 'desperdicios'));
    // inicializar buckets numéricos
    const wasteNums = (wasteLabels||[]).map(() => 0);

    desperdiciosSnap.forEach(doc => {
      const d = doc.data();
      if (!d || !d.fecha) return;
      // tu campo fecha viene como "YYYY-MM-DD" — aceptamos ISO parcial
      const fechaISO = toISODate(d.fecha);
      if (!fechaISO) return;
      if (startDateISO && fechaISO < startDateISO) return;

      if (period === 'week') {
        const idx = wasteLabels.indexOf(fechaISO);
        if (idx >= 0) wasteNums[idx] += Number(d.cantidad || 0);
      } else {
        // calcular week index desde startDateISO
        const start = new Date(startDateISO + 'T00:00:00Z');
        const cur = new Date(fechaISO + 'T00:00:00Z');
        const diffDays = Math.floor((cur - start) / (1000*60*60*24));
        const weekIndex = Math.floor(diffDays / 7);
        if (weekIndex >= 0 && weekIndex < wasteNums.length) wasteNums[weekIndex] += Number(d.cantidad || 0);
      }
    });

    result.wasteTrend.labels = wasteLabels;
    result.wasteTrend.values = wasteNums.map(v => Math.round(v));
  } catch (err) {
    console.warn('[Reports] error leyendo desperdicios:', err);
    result.wasteTrend = { labels: wasteLabels, values: wasteLabels.map(()=>0) };
  }

  // --- 3) preferences: contar usuarios por preferenciaDieta
  try {
    const usuariosSnap = await getDocs(collection(db, 'usuarios'));
    const prefs = {};
    usuariosSnap.forEach(doc => {
      const d = doc.data();
      if (!d) return;
      const pref = (d.preferenciaDieta || 'sin especificar').toString().toLowerCase();
      prefs[pref] = (prefs[pref] || 0) + 1;
    });
    result.preferences.labels = Object.keys(prefs);
    result.preferences.values = Object.keys(prefs).map(k => prefs[k]);
    if (result.preferences.labels.length === 0) {
      result.preferences = { labels: ['omnivora','vegetariana','vegana'], values: [1,1,1] };
    }
  } catch (err) {
    console.warn('[Reports] error leyendo usuarios:', err);
    result.preferences = { labels: ['omnivora','vegetariana','vegana'], values: [1,1,1] };
  }

  // --- 4) efficiency: % productos con stock_actual >= stock_minimo (inventario)
  try {
    const inventSnap = await getDocs(collection(db, 'inventario'));
    let total = 0, ok = 0;
    inventSnap.forEach(doc => {
      const d = doc.data();
      if (!d) return;
      total++;
      const actual = Number(d.stock_actual || 0);
      const minimo = Number(d.stock_minimo || 1);
      if (actual >= minimo) ok++;
    });
    const pct = total === 0 ? 0 : Math.round((ok/total)*100);
    result.efficiency = { labels: ['Inventario OK'], values: [pct] };
  } catch (err) {
    console.warn('[Reports] error leyendo inventario:', err);
    result.efficiency = { labels: ['Inventario OK'], values: [75] };
  }

  return result;
};

window.cargarReportes = async function() {
  console.log("⏳ Cargando reportes desde Firestore...");

  const period = document.getElementById('report-period')?.value || 'month';
  const data = await fetchReportsFromFirestore(period);

  console.log("📊 Datos recibidos para reportes:", data);

  renderChart('categoryChart', 'bar', data.categoryConsumption);
  renderChart('wasteTrendChart', 'line', data.wasteTrend);
  renderChart('preferenceChart', 'pie', data.preferences);
  renderChart('efficiencyChart', 'doughnut', data.efficiency);
};

document.getElementById("export-report-btn").addEventListener("click", async function() {
    console.log("📄 Generando informe global…");

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p', 'mm', 'a4');

    pdf.setFontSize(18);
    pdf.text("REPORTE INTEGRAL DE ANÁLISIS - ALISSA", 10, 20);

    pdf.setFontSize(12);
    pdf.text(`Fecha de emisión: ${new Date().toLocaleString()}`, 10, 28);

    // ============================
    //   INFORME SEMANAL
    // ============================
    pdf.setFontSize(16);
    pdf.addPage();
    pdf.text("ANÁLISIS — ÚLTIMA SEMANA", 10, 20);

    await cargarReportesInterno("week");
    await exportChartsBlock(pdf);

    // ============================
    //   INFORME MENSUAL
    // ============================
    pdf.addPage();
    pdf.setFontSize(16);
    pdf.text("ANÁLISIS — ÚLTIMO MES", 10, 20);

    await cargarReportesInterno("month");
    await exportChartsBlock(pdf);

    // ============================
    //   INFORME TRIMESTRAL
    // ============================
    pdf.addPage();
    pdf.setFontSize(16);
    pdf.text("ANÁLISIS — ÚLTIMO TRIMESTRE", 10, 20);

    await cargarReportesInterno("quarter");
    await exportChartsBlock(pdf);

    pdf.save(`reporte-completo-alissa.pdf`);
});

async function getChartImageDataURL(chart, width = 2400, height = 1200) {
  // chart: instancia de Chart.js
  if (!chart || !chart.canvas) {
    throw new Error("Chart inválido para exportación");
  }

  // Crear canvas HD temporal
  const exportCanvas = document.createElement("canvas");
  exportCanvas.width = width;
  exportCanvas.height = height;
  const ctx = exportCanvas.getContext("2d");

  // fondo blanco para evitar transparencia
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  // Dibujar el canvas del chart escalado al HD canvas
  // `chart.canvas` es el canvas original (DOM). Escalamos a la nueva resolución.
  ctx.drawImage(chart.canvas, 0, 0, width, height);

  return exportCanvas.toDataURL("image/png", 1.0);
}

async function addChartToPDF(pdf, titulo, chartId, y) {
  if (y > 250) {
    pdf.addPage();
    y = 20;
  }

  pdf.setFontSize(15);
  pdf.text(titulo, 10, y);

  // obtener instancia del chart (priorizar canvas._chartInstance)
  const canvas = document.getElementById(chartId);
  if (!canvas) {
    console.warn(`❌ canvas ${chartId} no encontrado para exportar`);
    pdf.setFontSize(11);
    pdf.text("Gráfico no disponible", 10, y + 8);
    return;
  }

  const chart = canvas._chartInstance || charts[chartId];
  if (!chart) {
    console.warn(`⚠️ chart no encontrado en ${chartId} al exportar`);
    pdf.setFontSize(11);
    pdf.text("Gráfico no disponible", 10, y + 8);
    return;
  }

  try {
    const imgData = await getChartImageDataURL(chart, 2400, 1200); // alta resolución
    pdf.addImage(imgData, "PNG", 10, y + 5, 190, 90); // ajuste para caber en la página

    // Interpretación automática (usar datos de la instancia)
    const interpretacion = generarAnalisis(chart, titulo);
    pdf.setFontSize(11);

    // Para evitar que el texto se salga, dividir en líneas si es largo
    const split = pdf.splitTextToSize(interpretacion, 190);
    pdf.text(split, 10, y + 100);
  } catch (err) {
    console.error("❌ Error creando imagen del chart para PDF:", err);
    pdf.setFontSize(11);
    pdf.text("No se pudo exportar la imagen del gráfico.", 10, y + 8);
  }
}

function generarAnalisis(chart, titulo) {
    const data = chart.data.datasets[0].data;
    const labels = chart.data.labels;

    if (!data || data.length === 0) return "Sin datos suficientes para análisis";

    // Ejemplo simple:
    const maxIndex = data.indexOf(Math.max(...data));
    const minIndex = data.indexOf(Math.min(...data));

    let analisis = "";

    if (titulo.includes("Categoría")) {
        analisis = `La categoría con mayor consumo fue "${labels[maxIndex]}" con un valor de ${data[maxIndex]}, mientras que la de menor consumo fue "${labels[minIndex]}".`;
    }

    if (titulo.includes("Desperdicio")) {
        analisis = `Se identificó que el mayor desperdicio ocurrió en "${labels[maxIndex]}" alcanzando ${data[maxIndex]}. Esto sugiere necesidad de optimización.`;
    }

    if (titulo.includes("Preferencias")) {
        analisis = `Los usuarios prefieren mayormente "${labels[maxIndex]}", destacando su popularidad. Se recomienda priorizar este tipo de menú.`;
    }

    if (titulo.includes("Eficiencia")) {
        analisis = `La eficiencia más alta se observó en "${labels[maxIndex]}".`;
    }

    return analisis;
}

async function exportChartsBlock(pdf) {
    let y = 35;
    await addChartToPDF(pdf, "Consumo por Categoría", "categoryChart", y);
    y += 120;
    await addChartToPDF(pdf, "Tendencias de Desperdicio", "wasteTrendChart", y);
    y += 120;
    await addChartToPDF(pdf, "Preferencias de Usuarios", "preferenceChart", y);
    y += 120;
    await addChartToPDF(pdf, "Eficiencia de Producción", "efficiencyChart", y);
}

async function cargarReportesInterno(period) {
    const data = await fetchReportsFromFirestore(period);
    renderChart('categoryChart', 'bar', data.categoryConsumption);
    renderChart('wasteTrendChart', 'line', data.wasteTrend);
    renderChart('preferenceChart', 'pie', data.preferences);
    renderChart('efficiencyChart', 'doughnut', data.efficiency);
    await new Promise(r => setTimeout(r, 500)); // esperar render
}

/* ---------------------------
   ACCIONES: Edit / Delete (mejorado para eliminar imagen)
   --------------------------- */
function attachTableActionListeners() {
  // Edit buttons
  document.querySelectorAll(".edit-btn").forEach(btn => {
    if (btn.dataset._bound) return;
    btn.dataset._bound = "1";
    btn.addEventListener("click", async (e) => {
      const id = btn.dataset.id;
      const type = btn.dataset.type;
      if (type === "menu") {
        // Cargar datos del menú para editar
        try {
          if (!db) throw new Error("Firestore no inicializado");
          
          const docRef = doc(db, "menus", id);
          const menuDoc = await getDoc(docRef);
          
          if (!menuDoc.exists()) {
            mostrarNotificacion("Menú no encontrado", "error");
            return;
          }
          
          const menuData = menuDoc.data();
          console.log("📝 Cargando menú para editar:", menuData);
          
          // Llenar el formulario con los datos
          byId("menu-id").value = id;
          byId("menu-name").value = menuData.nombre || "";
          byId("menu-price").value = menuData.precio || "";
          byId("menu-description").value = menuData.descripcion || "";
          byId("menu-calories").value = menuData.calorias || "";
          byId("menu-category").value = menuData.categoria || "";
          
          // Campos nutricionales
          byId("menu-proteinas").value = menuData.proteinas || "";
          byId("menu-carbohidratos").value = menuData.carbohidratos || "";
          byId("menu-grasas").value = menuData.grasas || "";
          byId("menu-fibra").value = menuData.fibra || "";
          byId("menu-azucar").value = menuData.azucar || "";
          byId("menu-sodio").value = menuData.sodio || "";
          
          // Detalles de preparación
          byId("menu-tiempo").value = menuData.tiempo || "";
          byId("menu-dificultad").value = menuData.dificultad || "";
          byId("menu-ingredientes").value = Array.isArray(menuData.ingredientes) ? menuData.ingredientes.join(", ") : (menuData.ingredientes || "");
          byId("menu-preparacion").value = menuData.preparacion || "";
          byId("menu-tags").value = Array.isArray(menuData.tags) ? menuData.tags.join(", ") : (menuData.tags || "");
          byId("menu-beneficios").value = Array.isArray(menuData.beneficios) ? menuData.beneficios.join(", ") : (menuData.beneficios || "");
          
          // Mostrar imagen si existe
          if (menuData.imagenURL) {
            const filePreview = byId("file-preview");
            const previewImage = byId("preview-image");
            const fileName = byId("file-name");
            if (filePreview && previewImage && fileName) {
              previewImage.src = menuData.imagenURL;
              fileName.textContent = "Imagen actual del menú";
              filePreview.style.display = "block";
            }
          }
          
          // Cambiar título del modal
          byId("menu-modal-title").textContent = "Editar Menú";
          
          // Abrir modal
          showModal(byId("menu-modal"));
          
          mostrarNotificacion("Menú cargado para editar", "success");
        } catch (error) {
          console.error("Error cargando menú:", error);
          mostrarNotificacion("Error al cargar menú: " + error.message, "error");
        }
      } else if (type === "inventory") {
        const row = btn.closest("tr");
        if (!row) return;
        byId("inventory-id").value = id;
        byId("inv-nombre").value = row.children[0].textContent.trim();
        byId("inv-categoria").value = row.children[1].textContent.trim();
        byId("inv-stock-actual").value = row.children[2].textContent.trim().split(" ")[0] || 0;
        byId("inv-stock-minimo").value = row.children[3].textContent.trim() || 0;
        byId("inventory-modal-title").textContent = "Editar Producto";
        showModal(byId("inventory-modal"));
      } else if (type === "waste") {
        const row = btn.closest("tr");
        byId("waste-id").value = id;
        byId("waste-fecha").value = row.children[0].textContent.trim() || formatDateISO(new Date());
        byId("waste-producto").value = row.children[1].textContent.trim();
        byId("waste-cantidad").value = row.children[2].textContent.trim().split(" ")[0] || 0;
        byId("waste-motivo").value = row.children[3].textContent.trim();
        const costText = row.children[4].textContent.replace(/[^\d.,]/g, "").trim() || "0";
        byId("waste-costo").value = Number(costText.replace(",", "."));
        byId("waste-modal-title").textContent = "Editar Desperdicio";
        showModal(byId("waste-modal"));
      } else if (type === "user") {
        // Cargar datos del usuario para editar
        try {
          const userRef = doc(db, "usuarios", id);
          const userDoc = await getDoc(userRef);
          
          if (!userDoc.exists()) {
            mostrarNotificacion("Usuario no encontrado", "error");
            return;
          }
          
          const userData = userDoc.data();
          
          // Llenar formulario con datos del usuario
          byId("user-id").value = id;
          byId("user-nombre").value = userData.nombre || userData.nombreCompleto || "";
          byId("user-email").value = userData.email || "";
          byId("user-rol").value = userData.rol || "usuario";
          byId("user-activo").value = userData.activo !== false ? "true" : "false";
          
          // Cambiar título del modal
          byId("user-modal-title").textContent = "Editar Usuario";
          
          // Abrir modal
          showModal(byId("user-modal"));
          
          mostrarNotificacion("Usuario cargado para editar", "success");
        } catch (error) {
          console.error("Error cargando usuario:", error);
          mostrarNotificacion("Error al cargar usuario: " + error.message, "error");
        }
      }
    });
  });

  // Delete buttons (mejorado para borrar imagen en Storage si existe)
  document.querySelectorAll(".delete-btn").forEach(btn => {
    if (btn.dataset._boundDelete) return;
    btn.dataset._boundDelete = "1";
    btn.addEventListener("click", async (e) => {
      const id = btn.dataset.id;
      const type = btn.dataset.type;
      if (!confirm("¿Confirma eliminar este elemento?")) return;
      try {
        if (!db) throw new Error("Firestore no inicializado (db undefined)");

        if (type === "menu") {
          // 1) obtener doc para saber imagenNombre
          const docRef = doc(db, "menus", id);
          const snapshot = await getDoc(docRef);
          if (snapshot.exists()) {
            const data = snapshot.data();
            // 2) eliminar imagen en storage si existe imagenNombre
            if (data && data.imagenNombre) {
              try {
                await deleteImageByPath(data.imagenNombre);
              } catch (e) {
                console.warn("No se pudo eliminar imagen asociada (continuando):", e);
              }
            }
          }
          // 3) eliminar documento
          await deleteDoc(doc(db, "menus", id));
          await cargarMenus();
          // Actualizar dashboard
          if (typeof window.actualizarDashboard === "function") {
            await window.actualizarDashboard();
          }

        } else if (type === "inventory") {
          await deleteDoc(doc(db, "inventario", id));
          await cargarInventario();
          // Actualizar dashboard
          if (typeof window.actualizarDashboard === "function") {
            await window.actualizarDashboard();
          }
        } else if (type === "waste") {
          await deleteDoc(doc(db, "desperdicios", id));
          await cargarDesperdicios();
        } else if (type === "user") {
          await deleteDoc(doc(db, "usuarios", id));
          await cargarUsuarios();
          // Actualizar dashboard
          if (typeof window.actualizarDashboard === "function") {
            await window.actualizarDashboard();
          }
        }
        mostrarNotificacion("Elemento eliminado", "success");
      } catch (err) {
        console.error("Error eliminando:", err);
        mostrarNotificacion("Error al eliminar", "error");
      }
    });
  });
}

/* ---------------------------
   Notificaciones
   --------------------------- */
let activeNotifications = 0;
const MAX_NOTIFICATIONS = 3;
function mostrarNotificacion(mensaje, tipo = 'info') {
  // Exponer función globalmente
  window.mostrarNotificacion = mostrarNotificacion;
  if (activeNotifications >= MAX_NOTIFICATIONS) {
    const existing = document.querySelectorAll('.notification');
    if (existing.length > 0) { existing[0].remove(); activeNotifications--; }
  }
  const notification = document.createElement('div');
  notification.className = `notification ${tipo}`;
  notification.textContent = mensaje;
  notification.style.cssText = `
    position: fixed; top: ${20 + (activeNotifications * 70)}px; right: 20px;
    padding: 1rem 2rem; background: ${tipo === 'success' ? '#10b981' : tipo === 'error' ? '#ef4444' : '#3b82f6'};
    color: white; border-radius: 10px; z-index: 10000; font-weight: 600;
  `;
  document.body.appendChild(notification);
  activeNotifications++;
  const timeoutId = setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transition = 'opacity 0.3s';
    const removeTimeout = setTimeout(() => {
      if (notification.parentNode) { notification.parentNode.removeChild(notification); activeNotifications = Math.max(0, activeNotifications - 1); }
    }, 300);
    notification.addEventListener('click', () => { clearTimeout(timeoutId); clearTimeout(removeTimeout); if (notification.parentNode) { notification.parentNode.removeChild(notification); activeNotifications = Math.max(0, activeNotifications - 1); }});  
  }, 3000);
}

/* ---------------------------
   Exponer cargarSeccion (llama admin.js)
   --------------------------- */
window.cargarSeccion = async function (seccion) {
  console.log(`🔄 Cargando sección: ${seccion}`);
  try {
    switch (seccion) {
      case "menus": 
        console.log("📋 Cargando menús...");
        await cargarMenus(); 
        break;
      case "inventory": 
        await cargarInventario(); 
        break;
      case "waste": 
        await cargarDesperdicios(); 
        break;
      case "users": 
        await cargarUsuarios(); 
        break;
      case "reports": 
        const rp = document.getElementById('report-period');
        const periodValue = rp ? rp.value : 'week';
        await cargarReportes(periodValue);
        break;
      default: 
        /* dashboard or none */ 
        break;
    }
  } catch (error) {
    console.error(`❌ Error cargando sección ${seccion}:`, error);
  }
};

/* ---------------------------
   DOMContentLoaded — listeners para modales, formularios, botones
   --------------------------- */
document.addEventListener("DOMContentLoaded", () => {

  // INVENTARIO - abrir modal
  const addInvBtn = byId("add-inventory-btn");
  if (addInvBtn) {
    addInvBtn.addEventListener("click", () => {
      byId("inventory-id").value = "";
      byId("inv-nombre").value = "";
      byId("inv-categoria").value = "";
      byId("inv-stock-actual").value = 0;
      byId("inv-stock-minimo").value = 0;
      byId("inventory-modal-title").textContent = "Agregar Producto";
      showModal(byId("inventory-modal"));
    });
  }

  // DESPERDICIO - abrir modal
  const addWasteBtn = byId("add-waste-btn");
  if (addWasteBtn) {
    addWasteBtn.addEventListener("click", () => {
      byId("waste-id").value = "";
      byId("waste-fecha").value = formatDateISO(new Date());
      byId("waste-producto").value = "";
      byId("waste-cantidad").value = 0;
      byId("waste-costo").value = 0;
      byId("waste-motivo").value = "";
      byId("waste-modal-title").textContent = "Registrar Desperdicio";
      showModal(byId("waste-modal"));
    });
  }

  // Modal close buttons (shared class .close-modal)
  document.querySelectorAll(".close-modal").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const modal = btn.closest(".modal");
      if (modal) hideModal(modal);
    });
  });

  // INVENTORY FORM submit
  const invForm = byId("inventory-form");
  if (invForm) {
    invForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const id = byId("inventory-id").value || null;
      const data = {
        nombre: byId("inv-nombre").value,
        categoria: byId("inv-categoria").value,
        stock_actual: byId("inv-stock-actual").value,
        stock_minimo: byId("inv-stock-minimo").value
      };
      await registrarInventario(data, id);
    });
  }

  // WASTE FORM submit
  const wasteForm = byId("waste-form");
  if (wasteForm) {
    wasteForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const id = byId("waste-id").value || null;
      const data = {
        fecha: byId("waste-fecha").value,
        producto: byId("waste-producto").value,
        cantidad: byId("waste-cantidad").value,
        costo: byId("waste-costo").value,
        motivo: byId("waste-motivo").value
      };
      await registrarDesperdicio(data, id);
    });
  }

  // USER FORM submit
  const userForm = byId("user-form");
  if (userForm) {
    userForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const id = byId("user-id").value;
      if (!id) {
        mostrarNotificacion("Error: ID de usuario no encontrado", "error");
        return;
      }
      
      try {
        const userRef = doc(db, "usuarios", id);
        const userData = {
          nombre: byId("user-nombre").value.trim(),
          nombreCompleto: byId("user-nombre").value.trim(),
          email: byId("user-email").value.trim(),
          rol: byId("user-rol").value,
          activo: byId("user-activo").value === "true"
        };
        
        await updateDoc(userRef, userData);
        mostrarNotificacion("✅ Usuario actualizado exitosamente", "success");
        
        // Cerrar modal
        hideModal(byId("user-modal"));
        
        // Recargar lista de usuarios
        await cargarUsuarios();
        
        // Actualizar dashboard
        if (typeof window.actualizarDashboard === "function") {
          await window.actualizarDashboard();
        }
      } catch (error) {
        console.error("Error actualizando usuario:", error);
        mostrarNotificacion("Error al actualizar usuario: " + error.message, "error");
      }
    });
  }

  // MENÚ: No añadir listener aquí porque admin.js ya lo maneja
  // Esto evita duplicación de listeners
  const menuForm = byId("menu-form");
  if (menuForm) {
    console.log("✅ Formulario de menú encontrado (manejado por admin.js)");
  }

  // Usuarios search (opcional)
  const userSearchInput = qSel("#users .user-filters input[type='text']");
  if (userSearchInput) {
    userSearchInput.addEventListener("input", (e) => {
      cargarUsuarios(e.target.value);
    });
  }

  // Report period change
  const rp = byId("report-period");
  if (rp) {
    rp.addEventListener("change", () => {
      cargarReportes(rp.value);
    });
  }

  // When page loads, load dashboard numbers from Firebase
  // Esperar a que Firebase esté inicializado
  async function waitForFirebase(maxAttempts = 10) {
    for (let i = 0; i < maxAttempts; i++) {
      if (db) {
        console.log("✅ Firebase está listo, cargando dashboard...");
        return true;
      }
      console.log(`⏳ Esperando Firebase... (intento ${i + 1}/${maxAttempts})`);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    return false;
  }

  // Cargar dashboard cuando esté listo
  (async () => {
    try {
      console.log("📊 Iniciando carga del dashboard...");
      
      const firebaseReady = await waitForFirebase();
      
      if (!firebaseReady) {
        console.error("❌ Firebase no está disponible después de esperar");
        updateDashboardStats(0, 0, 0, 0);
        return;
      }

      await loadDashboardStats();
      
      // Actualizar categorías "Ensaladas" a "Almuerzo" y agregar menús de ejemplo
      setTimeout(async () => {
        await actualizarCategoriasEnsaladas();
        await asegurarMenusPorCategoria();
      }, 2000);
    } catch (err) {
      console.error("❌ Error cargando estadísticas:", err);
      updateDashboardStats(0, 0, 0, 0);
    }
  })();

  // Función para cargar estadísticas del dashboard
  async function loadDashboardStats() {
    try {
      if (!db) {
        console.warn("⚠️ Firestore no inicializado en loadDashboardStats");
        updateDashboardStats(0, 0, 0, 0);
        return;
      }

      console.log("📊 Cargando estadísticas del dashboard desde Firebase...");

      // Cargar usuarios
      let usuariosActivos = 0;
      try {
        const usersSnap = await getDocs(collection(db, "usuarios"));
        usuariosActivos = usersSnap.size || 0;
        console.log(`✅ Usuarios encontrados: ${usuariosActivos}`);
      } catch (err) {
        console.error("❌ Error cargando usuarios:", err);
        console.error("📋 Detalles:", err.code, err.message);
        usuariosActivos = 0;
      }

      // Cargar menús activos
      let menusActivos = 0;
      try {
        const menusSnap = await getDocs(collection(db, "menus"));
        console.log(`📋 Total de documentos en colección 'menus': ${menusSnap.size}`);
        
        if (menusSnap.empty) {
          console.log("ℹ️ No hay menús en Firebase aún");
        } else {
          menusSnap.forEach(doc => {
            const data = doc.data();
            console.log(`📄 Menú ID: ${doc.id}, Nombre: ${data.nombre || 'Sin nombre'}, Activo: ${data.activo}`);
            if (data.activo !== false) {
              menusActivos++;
            }
          });
        }
        console.log(`✅ Menús activos encontrados: ${menusActivos}`);
      } catch (err) {
        console.error("❌ Error cargando menús:", err);
        console.error("📋 Detalles:", err.code, err.message);
        if (err.code === "permission-denied") {
          console.error("❌ PERMISO DENEGADO: Verifica las reglas de Firestore");
        }
        menusActivos = 0;
      }

      // Cargar desperdicios para calcular reducción
      let reduccionDesperdicio = 0;
      try {
        const desperdiciosSnap = await getDocs(collection(db, "desperdicios"));
        const totalDesperdicios = desperdiciosSnap.size || 0;
        reduccionDesperdicio = totalDesperdicios > 0 ? 0 : 0;
        console.log(`✅ Desperdicios encontrados: ${totalDesperdicios}`);
      } catch (err) {
        console.error("❌ Error cargando desperdicios:", err);
        reduccionDesperdicio = 0;
      }

      // Cargar productos en inventario
      let productosInventario = 0;
      try {
        const inventarioSnap = await getDocs(collection(db, "inventario"));
        productosInventario = inventarioSnap.size || 0;
        console.log(`✅ Productos en inventario: ${productosInventario}`);
      } catch (err) {
        console.error("❌ Error cargando inventario:", err);
        productosInventario = 0;
      }

      // Actualizar el dashboard
      updateDashboardStats(usuariosActivos, menusActivos, reduccionDesperdicio, productosInventario);
      
      console.log(`✅✅✅ Dashboard actualizado correctamente:`);
      console.log(`   - Usuarios: ${usuariosActivos}`);
      console.log(`   - Menús: ${menusActivos}`);
      console.log(`   - Inventario: ${productosInventario}`);
    } catch (err) {
      console.error("❌ Error en loadDashboardStats:", err);
      console.error("📋 Stack:", err.stack);
      updateDashboardStats(0, 0, 0, 0);
    }
  }
  
  // Exponer función globalmente
  window.loadDashboardStats = loadDashboardStats;

  // Función para actualizar las estadísticas en el dashboard
  function updateDashboardStats(usuarios, menus, desperdicio, inventario) {
    const usuariosEl = byId("stat-usuarios");
    const menusEl = byId("stat-menus");
    const desperdicioEl = byId("stat-desperdicio");
    const inventarioEl = byId("stat-inventario");

    if (usuariosEl) usuariosEl.textContent = usuarios.toLocaleString();
    if (menusEl) menusEl.textContent = menus.toString();
    if (desperdicioEl) desperdicioEl.textContent = `${desperdicio}%`;
    if (inventarioEl) inventarioEl.textContent = inventario.toString();
  }

  // Exponer función para actualizar dashboard cuando se crean/eliminan elementos
  window.actualizarDashboard = async function() {
    console.log("🔄 Actualizando dashboard...");
    if (!db) {
      console.warn("⚠️ Firebase no está listo, esperando...");
      const firebaseReady = await waitForFirebase(5);
      if (!firebaseReady) {
        console.error("❌ Firebase no disponible para actualizar dashboard");
        return;
      }
    }
    await loadDashboardStats();
  };
  
  // Exponer waitForFirebase globalmente
  window.waitForFirebase = waitForFirebase;

});

/* ---------------------------
   Detectar navegación del menú lateral
   --------------------------- */
document.querySelectorAll(".menu-item").forEach(item => {
  item.addEventListener("click", () => {
    const section = item.getAttribute("data-section");
    if (section === "users") {
      console.log("🔄 Cargando usuarios desde adminController.js...");
      cargarUsuarios();
    }
  });
});
