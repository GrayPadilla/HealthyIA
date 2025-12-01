/**
 * 🔍 Loader para servicios de consultas de menús
 * Hace disponibles las funciones globalmente para el asistente IA
 */

import { 
  buscarMenus, 
  analizarConsultaNutricional, 
  obtenerInfoNutricional,
  obtenerMenusRecomendados,
  verificarDisponibilidad
} from './menuQueryService.js';

// Hacer disponibles globalmente
window.buscarMenus = buscarMenus;
window.analizarConsultaNutricional = analizarConsultaNutricional;
window.obtenerInfoNutricional = obtenerInfoNutricional;
window.obtenerMenusRecomendados = obtenerMenusRecomendados;
window.verificarDisponibilidad = verificarDisponibilidad;

console.log('✅ Servicios de consultas de menús cargados');

