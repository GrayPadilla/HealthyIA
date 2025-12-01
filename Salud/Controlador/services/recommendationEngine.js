/**
 * Motor de IA para Recomendaciones Personalizadas
 * Analiza datos del usuario y genera recomendaciones basadas en modelos de nutrición
 */

import { db } from "../firebase.js";
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-firestore.js";

/**
 * Calcula las necesidades calóricas diarias basadas en la fórmula de Harris-Benedict
 * @param {number} peso - Peso en kg
 * @param {number} altura - Altura en cm
 * @param {number} edad - Edad en años
 * @param {string} genero - Género (masculino/femenino)
 * @param {string} actividadFisica - Nivel de actividad física
 * @returns {number} Calorías diarias necesarias
 */
export function calcularNecesidadesCaloricas(peso, altura, edad, genero, actividadFisica = 'sedentario') {
  // Convertir altura a metros
  const alturaMetros = altura / 100;
  
  // Calcular TMB (Tasa Metabólica Basal) usando fórmula de Harris-Benedict
  let tmb;
  if (genero.toLowerCase().includes('m') || genero.toLowerCase().includes('masculino')) {
    // Fórmula para hombres
    tmb = 88.362 + (13.397 * peso) + (4.799 * alturaMetros * 100) - (5.677 * edad);
  } else {
    // Fórmula para mujeres
    tmb = 447.593 + (9.247 * peso) + (3.098 * alturaMetros * 100) - (4.330 * edad);
  }

  // Factores de actividad física
  const factoresActividad = {
    'sedentario': 1.2,        // Poco o ningún ejercicio
    'ligero': 1.375,          // Ejercicio ligero 1-3 días/semana
    'moderado': 1.55,         // Ejercicio moderado 3-5 días/semana
    'intenso': 1.725,         // Ejercicio intenso 6-7 días/semana
    'muy-intenso': 1.9        // Ejercicio muy intenso, trabajo físico
  };

  const factor = factoresActividad[actividadFisica] || factoresActividad['sedentario'];
  return Math.round(tmb * factor);
}

/**
 * Calcula la distribución de macronutrientes según objetivos
 * @param {number} caloriasTotales - Calorías diarias totales
 * @param {string} objetivo - Objetivo nutricional (perder-peso, ganar-peso, mantener-peso, ganar-musculo)
 * @returns {object} Distribución de macronutrientes
 */
export function calcularMacronutrientes(caloriasTotales, objetivo) {
  let proteinas, carbohidratos, grasas;

  switch (objetivo) {
    case 'perder-peso':
      // 30% proteínas, 40% carbohidratos, 30% grasas
      proteinas = Math.round((caloriasTotales * 0.30) / 4); // 4 kcal por gramo
      carbohidratos = Math.round((caloriasTotales * 0.40) / 4);
      grasas = Math.round((caloriasTotales * 0.30) / 9); // 9 kcal por gramo
      break;
    
    case 'ganar-musculo':
      // 35% proteínas, 45% carbohidratos, 20% grasas
      proteinas = Math.round((caloriasTotales * 0.35) / 4);
      carbohidratos = Math.round((caloriasTotales * 0.45) / 4);
      grasas = Math.round((caloriasTotales * 0.20) / 9);
      break;
    
    case 'ganar-peso':
      // 25% proteínas, 50% carbohidratos, 25% grasas
      proteinas = Math.round((caloriasTotales * 0.25) / 4);
      carbohidratos = Math.round((caloriasTotales * 0.50) / 4);
      grasas = Math.round((caloriasTotales * 0.25) / 9);
      break;
    
    default: // mantener-peso o mejorar-salud
      // 30% proteínas, 45% carbohidratos, 25% grasas
      proteinas = Math.round((caloriasTotales * 0.30) / 4);
      carbohidratos = Math.round((caloriasTotales * 0.45) / 4);
      grasas = Math.round((caloriasTotales * 0.25) / 9);
  }

  return {
    proteinas, // gramos
    carbohidratos, // gramos
    grasas, // gramos
    calorias: caloriasTotales
  };
}

/**
 * Analiza el perfil del usuario y genera recomendaciones personalizadas
 * @param {string} userEmail - Email del usuario
 * @returns {Promise<object>} Análisis completo y recomendaciones
 */
export async function analizarPerfilUsuario(userEmail) {
  try {
    // Obtener datos del usuario desde Firestore
    const usuariosRef = collection(db, "usuarios");
    const q = query(usuariosRef, where("email", "==", userEmail));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error('Usuario no encontrado');
    }

    const userData = querySnapshot.docs[0].data();
    const evaluacionHabitos = userData.evaluacionHabitos || {};
    const respuestas = evaluacionHabitos.respuestas || {};

    // Extraer datos del usuario
    const peso = parseFloat(userData.peso) || 70;
    const altura = parseFloat(userData.altura) || 170;
    const edad = parseInt(userData.edad) || 30;
    const genero = userData.genero || 'femenino';
    const preferenciaDieta = userData.preferenciaDieta || 'sin-restriccion';
    const restricciones = userData.restricciones || [];
    const objetivoNutricional = respuestas.objetivoNutricional || 'mejorar-salud';
    const actividadFisica = mapearActividadFisica(respuestas.actividadFisica);

    // Calcular necesidades nutricionales
    const caloriasNecesarias = calcularNecesidadesCaloricas(peso, altura, edad, genero, actividadFisica);
    const macronutrientes = calcularMacronutrientes(caloriasNecesarias, objetivoNutricional);

    // Calcular IMC
    const alturaMetros = altura / 100;
    const imc = peso / (alturaMetros * alturaMetros);
    const categoriaIMC = categorizarIMC(imc);

    // Generar recomendaciones personalizadas
    const recomendaciones = generarRecomendacionesPersonalizadas({
      peso,
      altura,
      edad,
      genero,
      imc,
      categoriaIMC,
      preferenciaDieta,
      restricciones,
      objetivoNutricional,
      caloriasNecesarias,
      macronutrientes,
      evaluacionHabitos: respuestas
    });

    return {
      perfil: {
        peso,
        altura,
        edad,
        genero,
        imc: imc.toFixed(1),
        categoriaIMC,
        preferenciaDieta,
        restricciones,
        objetivoNutricional
      },
      necesidadesNutricionales: {
        calorias: caloriasNecesarias,
        macronutrientes
      },
      recomendaciones,
      fechaAnalisis: new Date().toISOString()
    };

  } catch (error) {
    console.error('Error al analizar perfil del usuario:', error);
    throw error;
  }
}

/**
 * Mapea la respuesta de actividad física a nivel estándar
 */
function mapearActividadFisica(actividadFisica) {
  const mapeo = {
    '0': 'sedentario',
    '1-2': 'ligero',
    '3-4': 'moderado',
    '5-mas': 'intenso'
  };
  return mapeo[actividadFisica] || 'sedentario';
}

/**
 * Categoriza el IMC
 */
function categorizarIMC(imc) {
  if (imc < 18.5) return 'Bajo peso';
  if (imc < 25) return 'Normal';
  if (imc < 30) return 'Sobrepeso';
  return 'Obesidad';
}

/**
 * Genera recomendaciones personalizadas basadas en el análisis
 */
function generarRecomendacionesPersonalizadas(datos) {
  const recomendaciones = {
    desayuno: [],
    almuerzo: [],
    cena: [],
    snacks: [],
    consejos: []
  };

  // Recomendaciones basadas en IMC
  if (datos.categoriaIMC === 'Sobrepeso' || datos.categoriaIMC === 'Obesidad') {
    recomendaciones.consejos.push('Prioriza alimentos bajos en calorías y altos en fibra para ayudarte a sentirte satisfecho.');
    recomendaciones.consejos.push('Incluye proteínas magras en cada comida para mantener la masa muscular durante la pérdida de peso.');
  } else if (datos.categoriaIMC === 'Bajo peso') {
    recomendaciones.consejos.push('Incluye alimentos ricos en calorías saludables como nueces, aguacate y aceites saludables.');
    recomendaciones.consejos.push('Aumenta la frecuencia de comidas para facilitar la ganancia de peso de forma saludable.');
  }

  // Recomendaciones basadas en objetivo nutricional
  if (datos.objetivoNutricional === 'perder-peso') {
    recomendaciones.consejos.push(`Mantén un déficit calórico moderado. Tu objetivo diario es aproximadamente ${datos.caloriasNecesarias - 500} calorías.`);
    recomendaciones.consejos.push('Prioriza alimentos con alta densidad nutricional y baja densidad calórica.');
  } else if (datos.objetivoNutricional === 'ganar-musculo') {
    recomendaciones.consejos.push(`Asegúrate de consumir al menos ${datos.macronutrientes.proteinas}g de proteínas al día para apoyar el crecimiento muscular.`);
    recomendaciones.consejos.push('Consume proteínas dentro de 30 minutos después del ejercicio.');
  }

  // Recomendaciones basadas en preferencias dietéticas
  if (datos.preferenciaDieta === 'vegetariana') {
    recomendaciones.consejos.push('Incluye fuentes de proteína vegetal como legumbres, quinoa, tofu y tempeh en tus comidas.');
  } else if (datos.preferenciaDieta === 'vegana') {
    recomendaciones.consejos.push('Asegúrate de obtener vitamina B12 a través de alimentos fortificados o suplementos.');
    recomendaciones.consejos.push('Combina legumbres con cereales para obtener proteínas completas.');
  } else if (datos.preferenciaDieta === 'keto') {
    recomendaciones.consejos.push('Mantén los carbohidratos por debajo de 50g al día para mantener la cetosis.');
    recomendaciones.consejos.push('Prioriza grasas saludables como aguacate, nueces y aceite de oliva.');
  }

  // Recomendaciones basadas en evaluación de hábitos
  if (datos.evaluacionHabitos) {
    if (datos.evaluacionHabitos.frecuenciaComidas === '2' || datos.evaluacionHabitos.frecuenciaComidas === '3') {
      recomendaciones.consejos.push('Intenta aumentar a 4-5 comidas al día para mantener tu metabolismo activo y evitar picos de hambre.');
    }

    if (datos.evaluacionHabitos.consumoAgua === 'menos-4' || datos.evaluacionHabitos.consumoAgua === '4-6') {
      recomendaciones.consejos.push('Aumenta tu consumo de agua a al menos 7-8 vasos al día para mantener una hidratación óptima.');
    }

    if (datos.evaluacionHabitos.frutasVerduras === '0-1' || datos.evaluacionHabitos.frutasVerduras === '2-3') {
      recomendaciones.consejos.push('Intenta incluir al menos 5 porciones de frutas y verduras al día para obtener vitaminas y fibra.');
    }
  }

  // Recomendaciones de distribución calórica por comida
  const caloriasDesayuno = Math.round(datos.caloriasNecesarias * 0.25);
  const caloriasAlmuerzo = Math.round(datos.caloriasNecesarias * 0.35);
  const caloriasCena = Math.round(datos.caloriasNecesarias * 0.30);
  const caloriasSnacks = Math.round(datos.caloriasNecesarias * 0.10);

  recomendaciones.distribucionCalorica = {
    desayuno: caloriasDesayuno,
    almuerzo: caloriasAlmuerzo,
    cena: caloriasCena,
    snacks: caloriasSnacks
  };

  return recomendaciones;
}

/**
 * Obtiene menús recomendados basados en el análisis del usuario
 * @param {string} userEmail - Email del usuario
 * @param {string} cafeteriaId - ID de la cafetería
 * @returns {Promise<Array>} Lista de menús recomendados
 */
export async function obtenerMenusRecomendados(userEmail, cafeteriaId = 'default') {
  try {
    const analisis = await analizarPerfilUsuario(userEmail);
    
    // Obtener menús disponibles desde Firestore
    const menusRef = collection(db, "menus");
    const q = query(menusRef, where("cafeteriaId", "==", cafeteriaId), where("disponible", "==", true));
    const querySnapshot = await getDocs(q);

    const menusDisponibles = [];
    querySnapshot.forEach((doc) => {
      menusDisponibles.push({ id: doc.id, ...doc.data() });
    });

    // Filtrar y puntuar menús según el perfil del usuario
    const menusPuntuados = menusDisponibles.map(menu => {
      let puntuacion = 0;
      const razones = [];

      // Puntuación por calorías
      const caloriasMenu = menu.calorias || 0;
      const caloriasObjetivo = analisis.necesidadesNutricionales.calorias;
      const diferenciaCalorias = Math.abs(caloriasMenu - caloriasObjetivo);
      if (diferenciaCalorias < 100) {
        puntuacion += 30;
        razones.push('Calorías adecuadas para tu objetivo');
      } else if (diferenciaCalorias < 200) {
        puntuacion += 20;
      } else {
        puntuacion += 10;
      }

      // Puntuación por preferencia dietética
      if (analisis.perfil.preferenciaDieta === 'vegetariana' && menu.categoria?.toLowerCase().includes('vegetariano')) {
        puntuacion += 25;
        razones.push('Alineado con tu dieta vegetariana');
      } else if (analisis.perfil.preferenciaDieta === 'vegana' && menu.categoria?.toLowerCase().includes('vegano')) {
        puntuacion += 25;
        razones.push('Alineado con tu dieta vegana');
      }

      // Puntuación por restricciones
      const tieneRestriccion = analisis.perfil.restricciones.some(restriccion => {
        const alergenos = menu.alergenos || [];
        return alergenos.some(alergeno => 
          alergeno.toLowerCase().includes(restriccion.toLowerCase())
        );
      });
      if (!tieneRestriccion) {
        puntuacion += 20;
      } else {
        puntuacion -= 50; // Penalizar si tiene alérgenos
      }

      // Puntuación por proteínas (si el objetivo es ganar músculo)
      if (analisis.perfil.objetivoNutricional === 'ganar-musculo') {
        const proteinasMenu = menu.proteinas || 0;
        if (proteinasMenu >= 25) {
          puntuacion += 15;
          razones.push('Alto contenido de proteínas');
        }
      }

      // Puntuación por disponibilidad
      if (menu.stock > 0) {
        puntuacion += 10;
      }

      return {
        ...menu,
        puntuacion,
        razones,
        porcentajeMatch: Math.min(100, Math.max(0, puntuacion))
      };
    });

    // Ordenar por puntuación descendente
    menusPuntuados.sort((a, b) => b.puntuacion - a.puntuacion);

    return {
      analisis,
      menusRecomendados: menusPuntuados.slice(0, 10), // Top 10
      fechaGeneracion: new Date().toISOString()
    };

  } catch (error) {
    console.error('Error al obtener menús recomendados:', error);
    throw error;
  }
}

