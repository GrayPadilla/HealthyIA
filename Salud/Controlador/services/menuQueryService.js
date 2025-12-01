/**
 * 🔍 Servicio de Consultas de Menús (Optimizado para tu Firestore actual)
 * Compatible con menuService.js sin requerir campos nutricionales obligatorios
 */

import { obtenerMenusDisponibles, obtenerMenuPorId } from "./menuService.js";
import { db } from "../firebase.js";
import { 
  collection, 
  getDocs, 
  query, 
  where 
} from "https://www.gstatic.com/firebasejs/10.1.0/firebase-firestore.js";

/* -------------------- BÚSQUEDA DE MENÚS -------------------- */
export async function buscarMenus(criterios) {
  try {
    const { 
      cafeteriaId, 
      fecha, 
      categoria, 
      maxCalorias, 
      minProteinas, 
      vegetariano, 
      vegano,
      nombre 
    } = criterios;
    
    // Si hay fecha, usar obtenerMenusDisponibles()
    if (fecha) {
      const menusResp = await obtenerMenusDisponibles(cafeteriaId, fecha);
      if (!menusResp.success) return [];

      let menus = menusResp.menus;

      // ==== Filtros opcionales (no revienta aunque falten campos) ====
      if (categoria) menus = menus.filter(m => m.categoria === categoria);
      if (maxCalorias) menus = menus.filter(m => (m.calorias || 0) <= maxCalorias);
      if (minProteinas) menus = menus.filter(m => (m.proteinas || 0) >= minProteinas);

      if (vegetariano) {
        menus = menus.filter(m => 
          m.tags && (m.tags.includes("vegetariano") || m.tags.includes("vegano"))
        );
      }
      if (vegano) {
        menus = menus.filter(m => m.tags && m.tags.includes("vegano"));
      }

      if (nombre) {
        const n = nombre.toLowerCase();
        menus = menus.filter(m => m.nombre.toLowerCase().includes(n));
      }

      return menus;
    }

    // ========== Sin fecha: buscar menús disponibles ==========
    const qMenus = query(
      collection(db, "menus"),
      where("cafeteriaId", "==", cafeteriaId),
      where("disponible", "==", true)
    );

    const snap = await getDocs(qMenus);
    const resultados = [];

    snap.forEach(doc => {
      const data = doc.data();
      const menu = { id: doc.id, ...data };

      // Aplicar filtros (seguros)
      if (categoria && menu.categoria !== categoria) return;
      if (maxCalorias && (menu.calorias || 0) > maxCalorias) return;
      if (minProteinas && (menu.proteinas || 0) < minProteinas) return;

      if (vegetariano && (!menu.tags || !menu.tags.includes("vegetariano"))) return;
      if (vegano && (!menu.tags || !menu.tags.includes("vegano"))) return;

      if (nombre && !menu.nombre.toLowerCase().includes(nombre.toLowerCase())) return;

      resultados.push(menu);
    });

    return resultados;

  } catch (error) {
    console.error("Error al buscar menús:", error);
    return [];
  }
}

/* -------------------- INFO NUTRICIONAL -------------------- */
export async function obtenerInfoNutricional(menuId) {
  try {
    const resp = await obtenerMenuPorId(menuId);
    if (!resp.success) return null;

    const m = resp.menu;

    return {
      nombre: m.nombre,
      descripcion: m.descripcion,
      calorias: m.calorias || 0,
      proteinas: m.proteinas || 0,
      carbohidratos: m.carbohidratos || 0,
      grasas: m.grasas || 0,
      fibra: m.fibra || 0,
      azucar: m.azucar || 0,
      sodio: m.sodio || 0,
      ingredientes: m.ingredientes || [],
      alergenos: m.alergenos || [],
      tags: m.tags || []
    };

  } catch (error) {
    console.error("Error nutricional:", error);
    return null;
  }
}

/* -------------------- RECOMENDACIONES -------------------- */
export async function obtenerMenusRecomendados(preferencias, cafeteriaId, fecha = null) {
  try {
    const criterios = {
      cafeteriaId,
      fecha: fecha || new Date().toISOString().split("T")[0],
      maxCalorias: preferencias.maxCalorias,
      minProteinas: preferencias.minProteinas,
      vegetariano: preferencias.vegetariano,
      vegano: preferencias.vegano
    };

    let menus = await buscarMenus(criterios);

    menus.sort((a, b) => {
      const scoreA = (a.rating || 0) * 0.7 + Math.min((a.vecesPedido || 0) / 100, 1) * 0.3;
      const scoreB = (b.rating || 0) * 0.7 + Math.min((b.vecesPedido || 0) / 100, 1) * 0.3;
      return scoreB - scoreA;
    });

    return menus.slice(0, 5);

  } catch (error) {
    console.error("Error recomendaciones:", error);
    return [];
  }
}

/* -------------------- DISPONIBILIDAD -------------------- */
export async function verificarDisponibilidad(menuId, fecha) {
  try {
    const resp = await obtenerMenuPorId(menuId);
    if (!resp.success) {
      return { disponible: false, razon: "Menú no encontrado" };
    }

    const m = resp.menu;

    if (!m.disponible) return { disponible: false, razon: "Menú no disponible" };
    if (m.fechaPublicacion !== fecha)
      return { disponible: false, razon: "Menú no coincide con la fecha", fechaPublicacion: m.fechaPublicacion };

    if (m.stock !== undefined && m.stock <= 0)
      return { disponible: false, razon: "Sin stock", stock: m.stock };

    return {
      disponible: true,
      stock: m.stock,
      precio: m.precio
    };

  } catch (error) {
    console.error("Error disponibilidad:", error);
    return { disponible: false, razon: "Error interno" };
  }
}

/* -------------------- ANALIZAR TEXTO -------------------- */
export function analizarConsultaNutricional(texto) {
  const t = texto.toLowerCase();
  const criterios = {
    maxCalorias: null,
    minProteinas: null,
    categoria: null,
    vegetariano: false,
    vegano: false,
    nombre: null
  };

  const calMatch = t.match(/(?:menos de|máximo|hasta)\s*(\d+)\s*cal/);
  if (calMatch) criterios.maxCalorias = parseInt(calMatch[1]);

  const protMatch = t.match(/(?:más de|al menos)\s*(\d+)\s*g\s*proteínas?/);
  if (protMatch) criterios.minProteinas = parseInt(protMatch[1]);

  if (t.includes("vegetariano")) criterios.vegetariano = true;
  if (t.includes("vegano")) { criterios.vegano = true; criterios.vegetariano = true; }

  const categorias = ["desayuno", "almuerzo", "cena", "snack", "bebida"];
  for (const c of categorias) {
    if (t.includes(c)) criterios.categoria = c;
  }

  const posibles = ["pollo", "pescado", "ensalada", "pasta", "pizza", "hamburguesa"];
  posibles.forEach(n => {
    if (t.includes(n)) criterios.nombre = n;
  });

  return criterios;
}
