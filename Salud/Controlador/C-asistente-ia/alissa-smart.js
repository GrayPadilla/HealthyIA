// Alissa Smart AI System v3.0

let chatContainer, userInput, sendBtn, volverBtn;
let conversationHistory = [];
let userProfile = {};

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
  // 📊 Medir tiempo de carga del asistente IA
  console.time("⏱️ Carga Asistente IA");
  chatContainer = document.getElementById('chatContainer');
  userInput = document.getElementById('userInput');
  sendBtn = document.getElementById('sendBtn');
  volverBtn = document.getElementById('volverBtn');
  
  if (!chatContainer || !userInput || !sendBtn || !volverBtn) {
    console.error('❌ Elementos no encontrados');
    return;
  }
  
  // Event listeners
  sendBtn.addEventListener('click', processMessage);
  userInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') processMessage();
  });
  volverBtn.addEventListener('click', () => window.history.back());
  
  userInput.focus();
  loadUserProfile();
  
  console.log('🚀 Alissa Smart AI v3.0 - Activado');
  checkAPIStatus();
  
  // 📊 Finalizar medición de tiempo de carga
  console.timeEnd("⏱️ Carga Asistente IA");
});

// Verificar estado de APIs
function checkAPIStatus() {
  if (typeof API_CONFIG !== 'undefined' && API_CONFIG.gemini.token && !API_CONFIG.gemini.token.includes('tu_token')) {
    console.log('✅ Gemini AI configurado - Usando IA real');
  } else {
    console.log('⚡ Usando sistema inteligente local avanzado');
  }
}

// Procesar mensaje
async function processMessage() {
  const message = userInput.value.trim();
  if (!message) return;
  
  addMessage(message, true);
  userInput.value = '';
  
  // Indicador de carga
  const loadingMsg = addMessage('⚡ Alissa está pensando...', false);
  
  // 📊 Medir tiempo de respuesta del asistente IA
  const inicio = performance.now();
  console.time('🤖 Tiempo de respuesta IA');
  
  try {
    let apiUsada = 'local';
    let response;
    
    // Intentar API de Gemini primero
    if (typeof API_CONFIG !== 'undefined' && API_CONFIG.gemini.token && !API_CONFIG.gemini.token.includes('tu_token')) {
      console.log('🧠 Intentando Gemini AI...');
      response = await callGeminiAPI(message);
      if (response) {
        apiUsada = 'gemini';
      }
    }
    
    // Si no funciona Gemini, usar sistema inteligente local
    if (!response) {
      console.log('💡 Usando sistema inteligente local...');
      response = await generateSmartResponse(message);
      apiUsada = 'local';
    }
    
    // 📊 Registrar tiempo de respuesta
    const fin = performance.now();
    const tiempo = fin - inicio;
    if (typeof console !== 'undefined' && console.timeEnd) {
      console.timeEnd('🤖 Tiempo de respuesta IA');
    }
    
    // Registrar métricas si están disponibles
    if (typeof registrarTiempoRespuestaIA === 'function') {
      registrarTiempoRespuestaIA(tiempo, 'exitoso', message, null, apiUsada);
    }
    
    // Remover indicador de carga y agregar respuesta
    chatContainer.removeChild(loadingMsg);
    addMessage(response, false);
    
    // Guardar en historial
    saveToHistory(message, response);
    
  } catch (error) {
    // 📊 Registrar error y tiempo
    const fin = performance.now();
    const tiempo = fin - inicio;
    if (typeof console !== 'undefined' && console.timeEnd) {
      console.timeEnd('🤖 Tiempo de respuesta IA');
    }
    
    // Registrar métricas si están disponibles
    if (typeof registrarTiempoRespuestaIA === 'function') {
      registrarTiempoRespuestaIA(tiempo, 'error', message, error, 'local');
    }
    
    console.error('❌ Error:', error);
    chatContainer.removeChild(loadingMsg);
    addMessage('Lo siento, ocurrió un error. Intentemos de nuevo.', false);
  }
}

// Llamar a Gemini API
async function callGeminiAPI(message) {
  try {
    // 📊 Medir tiempo de respuesta de la API Gemini
    const inicio = performance.now();
    const prompt = createGeminiPrompt(message);
    
    const response = await fetch(`${API_CONFIG.gemini.url}?key=${API_CONFIG.gemini.token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }]
      })
    });
    
    const fin = performance.now();
    const tiempoRespuesta = fin - inicio;
    
    if (response.ok) {
      const data = await response.json();
      console.log(`📊 API Gemini respondió en ${tiempoRespuesta.toFixed(2)}ms`);
      return data.candidates[0].content.parts[0].text;
    }
    
    console.warn(`⚠️ API Gemini falló después de ${tiempoRespuesta.toFixed(2)}ms`);
    return null;
  } catch (error) {
    // 📊 El error ya está registrado por el sistema de métricas
    console.error('🔴 Error Gemini:', error);
    return null;
  }
}

// Crear prompt para Gemini
function createGeminiPrompt(message) {
  const userContext = analyzeMessage(message);
  const timeOfDay = getTimeOfDay();
  const history = conversationHistory.slice(-2);
  
  return `Eres Alissa, una asistente virtual de salud muy inteligente y empática.

CONTEXTO:
- Usuario: ${userContext.personalData ? JSON.stringify(userContext.personalData) : 'Datos limitados'}
- Hora: ${timeOfDay}
- Historial: ${history.length > 0 ? history.map(h => `U: ${h.user} | A: ${h.assistant.substring(0,100)}...`).join(' | ') : 'Nueva conversación'}

MENSAJE: "${message}"

INSTRUCCIONES:
1. Responde de manera conversacional y empática
2. Personaliza según el contexto del usuario
3. Da consejos específicos y prácticos
4. Usa emojis de manera natural
5. Si detectas datos personales (peso, altura, edad), calcula IMC y da recomendaciones precisas
6. Adapta el tono al momento del día
7. Responde en español de manera natural y fluida
8. Sé específica con números y recomendaciones

Responde como Alissa de manera inteligente y personalizada:`;
}

// Sistema inteligente local
async function generateSmartResponse(message) {
  // 📊 Medir tiempo de procesamiento del sistema local
  const inicio = performance.now();
  
  try {
    const context = analyzeMessage(message);
    const response = await createIntelligentResponse(message, context);
    
    const fin = performance.now();
    const tiempoProcesamiento = fin - inicio;
    console.log(`📊 Sistema local procesó en ${tiempoProcesamiento.toFixed(2)}ms`);
    
    return response;
  } catch (error) {
    console.error('Error al generar respuesta:', error);
    return 'Lo siento, ocurrió un error al procesar tu consulta. Por favor, intenta de nuevo.';
  }
}

// Analizar mensaje
function analyzeMessage(message) {
  const lower = message.toLowerCase();
  const context = {
    personalData: extractPersonalData(message),
    intent: detectIntent(lower),
    mood: detectMood(lower),
    urgency: detectUrgency(lower),
    timeContext: getTimeContext()
  };
  
  return context;
}

// Extraer datos personales
function extractPersonalData(message) {
  const data = {};
  
  // Edad
  const ageMatch = message.match(/(\d+)\s*(año|años)/);
  if (ageMatch) data.age = parseInt(ageMatch[1]);
  
  // Peso
  const weightMatch = message.match(/(\d+(?:\.\d+)?)\s*kg/);
  if (weightMatch) data.weight = parseFloat(weightMatch[1]);
  
  // Altura
  const heightMatch = message.match(/(\d+(?:\.\d+)?)\s*(?:m|metro|cm)/);
  if (heightMatch) {
    const height = parseFloat(heightMatch[1]);
    data.height = message.includes('cm') ? height / 100 : height;
  }
  
  // Calcular IMC
  if (data.weight && data.height) {
    data.imc = (data.weight / (data.height * data.height)).toFixed(1);
    data.imcCategory = getIMCCategory(parseFloat(data.imc));
  }
  
  return Object.keys(data).length > 0 ? data : null;
}

// Detectar intención
function detectIntent(message) {
  const lower = message.toLowerCase();
  
  // Consultas sobre menús y disponibilidad
  if (lower.includes('menú') || lower.includes('menu') || lower.includes('disponible') || 
      lower.includes('qué hay') || lower.includes('que hay') || lower.includes('ofrecen') ||
      lower.includes('tienen') || lower.includes('venden') || lower.includes('carta')) {
    return 'menu_query';
  }
  
  // Consultas nutricionales específicas
  if (lower.includes('calorías') || lower.includes('calorias') || lower.includes('nutrición') ||
      lower.includes('nutricion') || lower.includes('proteínas') || lower.includes('proteinas') ||
      lower.includes('carbohidratos') || lower.includes('grasas') || lower.includes('información nutricional')) {
    return 'nutrition_query';
  }
  
  // Consultas sobre ingredientes y alergenos
  if (lower.includes('ingrediente') || lower.includes('alérgeno') || lower.includes('alergeno') ||
      lower.includes('contiene') || lower.includes('lleva') || lower.includes('tiene')) {
    return 'ingredients_query';
  }
  
  if (lower.includes('plan') || lower.includes('dieta') || lower.includes('alimenta')) return 'nutrition';
  if (lower.includes('ejercicio') || lower.includes('rutina') || lower.includes('entrenar')) return 'exercise';
  if (lower.includes('peso') && (lower.includes('bajar') || lower.includes('perder'))) return 'weight_loss';
  if (lower.includes('peso') && (lower.includes('ganar') || lower.includes('subir'))) return 'weight_gain';
  if (lower.includes('estrés') || lower.includes('ansiedad')) return 'mental_health';
  if (lower.includes('sueño') || lower.includes('dormir')) return 'sleep';
  if (lower.includes('agua') || lower.includes('hidrat')) return 'hydration';
  if (lower.includes('hola') || lower.includes('buenos')) return 'greeting';
  return 'general';
}

// Detectar estado de ánimo
function detectMood(message) {
  if (message.includes('triste') || message.includes('mal')) return 'sad';
  if (message.includes('motivad') || message.includes('genial')) return 'motivated';
  if (message.includes('cansad') || message.includes('agotad')) return 'tired';
  if (message.includes('ansios') || message.includes('nervios')) return 'anxious';
  return 'neutral';
}

// Detectar urgencia
function detectUrgency(message) {
  const urgentWords = ['urgente', 'rápido', 'ya', 'ahora'];
  return urgentWords.some(word => message.includes(word)) ? 'high' : 'normal';
}

// Crear respuesta inteligente
async function createIntelligentResponse(message, context) {
  const timeOfDay = getTimeOfDay();
  let response = '';
  
  // Saludo contextual
  if (context.intent === 'greeting' || conversationHistory.length === 0) {
    const greetings = {
      'mañana': '¡Buenos días! ☀️',
      'tarde': '¡Buenas tardes! 🌅', 
      'noche': '¡Buenas noches! 🌙'
    };
    response += `${greetings[timeOfDay] || '¡Hola!'} Soy Alissa, tu asistente de salud personalizada. `;
  }
  
  // Respuesta personalizada según datos
  if (context.personalData) {
    response += generatePersonalizedResponse(context.personalData);
  } else {
    // Las consultas de menús son asíncronas
    const intentResponse = await generateIntentBasedResponse(context.intent, message);
    response += intentResponse;
  }
  
  // Añadir contexto emocional
  response += addEmotionalContext(context.mood);
  
  // Añadir contexto temporal
  response += addTimeContext(timeOfDay, message);
  
  return response;
}

// Respuesta personalizada
function generatePersonalizedResponse(data) {
  let response = `He analizado tu información personal:\n\n`;
  
  if (data.imc) {
    response += `📊 **Tu IMC:** ${data.imc} - ${data.imcCategory}\n\n`;
    
    if (data.age) {
      const recommendations = getAgeSpecificRecommendations(data.age);
      response += `🎯 **Para tu edad (${data.age} años):** ${recommendations}\n\n`;
    }
    
    // Recomendaciones según IMC
    if (parseFloat(data.imc) < 18.5) {
      response += `💪 **Plan para ganar peso saludable:**\n• Aumenta calorías con alimentos nutritivos\n• Incluye proteínas en cada comida\n• Ejercicios de fuerza 3-4 días/semana\n• Meta: 0.25-0.5kg por semana`;
    } else if (parseFloat(data.imc) > 25) {
      response += `⚖️ **Plan para pérdida de peso saludable:**\n• Déficit calórico moderado (300-500 cal/día)\n• Combina cardio con ejercicios de fuerza\n• Proteína: ${(data.weight * 1.6).toFixed(0)}g al día\n• Meta: 0.5-1kg por semana`;
    } else {
      response += `✅ **Mantén tu peso saludable:**\n• Alimentación balanceada\n• Ejercicio regular (150 min/semana)\n• Hidratación adecuada\n• Descanso de calidad`;
    }
  }
  
  return response + '\n\n¿Te gustaría que elabore un plan más detallado?';
}

// Respuesta según intención
async function generateIntentBasedResponse(intent, message) {
  // Consultas que requieren acceso a datos en tiempo real
  if (intent === 'menu_query' || intent === 'nutrition_query' || intent === 'ingredients_query') {
    return await generateMenuQueryResponse(message, intent);
  }
  
  const responses = {
    nutrition: generateNutritionResponse(message),
    exercise: generateExerciseResponse(message),
    weight_loss: generateWeightLossResponse(),
    weight_gain: generateWeightGainResponse(),
    mental_health: generateMentalHealthResponse(),
    sleep: generateSleepResponse(),
    hydration: generateHydrationResponse(),
    general: generateGeneralResponse(message)
  };
  
  return responses[intent] || responses.general;
}

// Respuestas específicas por categoría
function generateNutritionResponse(message) {
  if (message.includes('desayuno')) {
    return `🍳 **Desayuno perfecto:**\n• Proteína: huevos, yogur griego o avena\n• Fibra: frutas o verduras\n• Grasas saludables: nueces o aguacate\n• Hidratación: agua o té sin azúcar\n\n¿Tienes restricciones alimentarias?`;
  }
  return `🥗 **Nutrición balanceada:**\n• 50% vegetales y frutas\n• 25% proteínas magras\n• 25% carbohidratos complejos\n• Grasas saludables en cada comida\n\n**Frecuencia:** 4-5 comidas al día\n**Hidratación:** 8-10 vasos de agua`;
}

function generateExerciseResponse(message) {
  if (message.includes('principiante')) {
    return `🏃‍♀️ **Rutina para principiantes:**\n\n**Semana 1-2:**\n• 20 min caminata diaria\n• 2 días ejercicios básicos:\n  - 10 sentadillas\n  - 5 flexiones (modificadas)\n  - 30 seg plancha\n\n**Progresión gradual y descanso adecuado**`;
  }
  return `💪 **Plan de ejercicio semanal:**\n• Lunes: Cardio (30 min)\n• Martes: Fuerza tren superior\n• Miércoles: Descanso activo\n• Jueves: Fuerza tren inferior\n• Viernes: HIIT (20 min)\n• Fin de semana: Actividad recreativa`;
}

function generateWeightLossResponse() {
  return `⚖️ **Estrategia para pérdida de peso:**\n\n**1. Déficit calórico:** 300-500 cal/día\n**2. Macros:** Proteína alta, carbos complejos\n**3. Ejercicio:** Cardio + fuerza\n**4. Hábitos:** Registro alimentario, horarios regulares\n\n**Meta realista:** 0.5-1kg por semana`;
}

function generateWeightGainResponse() {
  return `📈 **Plan para ganar peso:**\n\n**1. Superávit calórico:** +300-500 cal/día\n**2. Alimentos densos:** Nueces, aguacate, aceite de oliva\n**3. Frecuencia:** 5-6 comidas pequeñas\n**4. Ejercicio:** Fuerza 3-4 días/semana\n\n**Meta:** 0.25-0.5kg por semana`;
}

function generateMentalHealthResponse() {
  return `🧘‍♀️ **Manejo del estrés:**\n\n**Técnicas inmediatas:**\n• Respiración 4-7-8\n• Caminata de 5 minutos\n• Técnica 5-4-3-2-1\n\n**Largo plazo:**\n• Meditación diaria\n• Ejercicio regular\n• Conexiones sociales\n• Tiempo en naturaleza`;
}

function generateSleepResponse() {
  return `😴 **Optimización del sueño:**\n\n**Rutina nocturna:**\n• 2h antes: última comida pesada\n• 1h antes: sin pantallas\n• 30min antes: actividades relajantes\n\n**Ambiente:** Oscuro, fresco (18-22°C), silencioso\n**Horarios:** Consistentes, 7-9 horas`;
}

function generateHydrationResponse() {
  return `💧 **Hidratación inteligente:**\n\n**Necesidad diaria:** Peso x 35ml\n**Timing óptimo:**\n• Al despertar: 500ml\n• Antes de comidas: 250ml\n• Durante ejercicio: cada 15-20min\n\n**Señales:** Orina amarillo claro, sin sed constante`;
}

function generateGeneralResponse(message) {
  return `Como tu asistente de salud, puedo ayudarte con:\n\n🥗 Planes nutricionales personalizados\n💪 Rutinas de ejercicio adaptadas\n😴 Optimización del sueño\n🧘‍♀️ Manejo del estrés\n⚖️ Control de peso saludable\n🍽️ Consultas sobre menús disponibles\n📊 Información nutricional en tiempo real\n\n¿En qué aspecto específico te gustaría enfocarte?`;
}

/**
 * Genera respuesta para consultas sobre menús y nutrición
 * @param {string} message - Mensaje del usuario
 * @param {string} intent - Intención detectada
 * @returns {Promise<string>} - Respuesta generada
 */
async function generateMenuQueryResponse(message, intent) {
  try {
    // Cargar servicio de consultas de menús dinámicamente
    if (typeof buscarMenus === 'undefined') {
      // Si el servicio no está disponible, usar respuesta genérica
      return generateMenuQueryFallback(message, intent);
    }
    
    // Obtener ID de cafetería del usuario (por defecto usar 'default' o del localStorage)
    const cafeteriaId = localStorage.getItem('cafeteriaId') || 'default';
    const fecha = new Date().toISOString().split('T')[0];
    
    // Analizar consulta nutricional
    const criterios = analizarConsultaNutricional ? analizarConsultaNutricional(message) : {};
    criterios.cafeteriaId = cafeteriaId;
    criterios.fecha = fecha;
    
    if (intent === 'menu_query') {
      // Buscar menús disponibles
      const menus = await buscarMenus(criterios);
      
      if (menus.length === 0) {
        return `Lo siento, no encontré menús disponibles que coincidan con tu búsqueda para hoy (${fecha}).\n\nPuedo ayudarte a:\n• Buscar menús de otras fechas\n• Recomendarte opciones similares\n• Responder preguntas sobre nutrición\n\n¿Qué te gustaría hacer?`;
      }
      
      let respuesta = `🍽️ **Menús disponibles para hoy (${fecha}):**\n\n`;
      
      menus.slice(0, 5).forEach((menu, index) => {
        respuesta += `${index + 1}. **${menu.nombre}**\n`;
        respuesta += `   • Calorías: ${menu.calorias} kcal\n`;
        if (menu.precio) respuesta += `   • Precio: S/ ${menu.precio.toFixed(2)}\n`;
        if (menu.stock !== undefined) respuesta += `   • Stock: ${menu.stock} disponibles\n`;
        respuesta += `   • ${menu.descripcion}\n\n`;
      });
      
      if (menus.length > 5) {
        respuesta += `\n_Y hay ${menus.length - 5} menús más disponibles. ¿Te gustaría ver más opciones?_\n`;
      }
      
      return respuesta;
    } else if (intent === 'nutrition_query') {
      // Buscar menús con información nutricional específica
      const menus = await buscarMenus(criterios);
      
      if (menus.length === 0) {
        return `No encontré menús que coincidan con los criterios nutricionales que buscas.\n\n¿Te gustaría que busque con otros criterios o te ayude con información nutricional general?`;
      }
      
      let respuesta = `📊 **Menús que coinciden con tu búsqueda nutricional:**\n\n`;
      
      menus.slice(0, 3).forEach((menu, index) => {
        respuesta += `${index + 1}. **${menu.nombre}**\n`;
        respuesta += `   📊 Información nutricional:\n`;
        respuesta += `   • Calorías: ${menu.calorias} kcal\n`;
        if (menu.proteinas) respuesta += `   • Proteínas: ${menu.proteinas}g\n`;
        if (menu.carbohidratos) respuesta += `   • Carbohidratos: ${menu.carbohidratos}g\n`;
        if (menu.grasas) respuesta += `   • Grasas: ${menu.grasas}g\n`;
        if (menu.fibra) respuesta += `   • Fibra: ${menu.fibra}g\n`;
        respuesta += `\n`;
      });
      
      return respuesta;
    } else if (intent === 'ingredients_query') {
      // Buscar información sobre ingredientes
      const menus = await buscarMenus({ ...criterios, nombre: message });
      
      if (menus.length === 0) {
        return `No encontré información sobre ese plato en el menú de hoy.\n\nPuedo ayudarte con:\n• Buscar en otras fechas\n• Información sobre ingredientes similares\n• Consultas nutricionales generales`;
      }
      
      const menu = menus[0];
      let respuesta = `🔍 **Información sobre ${menu.nombre}:**\n\n`;
      
      if (menu.ingredientes && menu.ingredientes.length > 0) {
        respuesta += `📝 **Ingredientes:**\n`;
        menu.ingredientes.forEach(ing => {
          respuesta += `   • ${ing}\n`;
        });
        respuesta += `\n`;
      }
      
      if (menu.alergenos && menu.alergenos.length > 0) {
        respuesta += `⚠️ **Alérgenos:**\n`;
        menu.alergenos.forEach(alergeno => {
          respuesta += `   • ${alergeno}\n`;
        });
        respuesta += `\n`;
      } else {
        respuesta += `✅ No se registran alérgenos comunes para este plato.\n\n`;
      }
      
      if (menu.descripcion) {
        respuesta += `📖 ${menu.descripcion}\n`;
      }
      
      return respuesta;
    }
    
    return generateMenuQueryFallback(message, intent);
  } catch (error) {
    console.error('Error al generar respuesta de menús:', error);
    return generateMenuQueryFallback(message, intent);
  }
}

/**
 * Respuesta de respaldo para consultas de menús
 * @param {string} message - Mensaje del usuario
 * @param {string} intent - Intención detectada
 * @returns {string} - Respuesta de respaldo
 */
function generateMenuQueryFallback(message, intent) {
  if (intent === 'menu_query') {
    return `Puedo ayudarte a consultar los menús disponibles. Por favor, especifica:\n\n• ¿Qué tipo de comida buscas? (desayuno, almuerzo, cena)\n• ¿Tienes alguna restricción dietética? (vegetariano, vegano, sin gluten)\n• ¿Cuántas calorías máximo quieres?\n\nEjemplo: "¿Qué menús vegetarianos hay disponibles para el almuerzo?"`;
  } else if (intent === 'nutrition_query') {
    return `Puedo ayudarte con información nutricional. Puedes preguntarme sobre:\n\n• Calorías de un plato específico\n• Contenido de proteínas, carbohidratos, grasas\n• Menús bajos en calorías\n• Opciones altas en proteínas\n\nEjemplo: "¿Qué menús tienen menos de 400 calorías?"`;
  } else if (intent === 'ingredients_query') {
    return `Puedo ayudarte con información sobre ingredientes y alérgenos. Puedes preguntarme:\n\n• ¿Qué ingredientes tiene un plato?\n• ¿Contiene algún alérgeno específico?\n• ¿Es apto para vegetarianos/veganos?\n\nEjemplo: "¿Qué ingredientes tiene la ensalada César?"`;
  }
  
  return `Puedo ayudarte con consultas sobre menús y nutrición. ¿Qué te gustaría saber?`;
}

// Funciones de apoyo
function addEmotionalContext(mood) {
  const contexts = {
    sad: '\n\n💙 Recuerda: cuidar tu salud es un acto de amor propio. Cada pequeño paso cuenta.',
    motivated: '\n\n🎉 ¡Me encanta tu motivación! Aprovechemos esta energía para crear hábitos duraderos.',
    tired: '\n\n😌 Entiendo que te sientes cansado/a. Empecemos con cambios pequeños y manejables.',
    anxious: '\n\n🤗 La ansiedad es normal. Vamos paso a paso, sin presión.'
  };
  return contexts[mood] || '';
}

function addTimeContext(timeOfDay, message) {
  if (timeOfDay === 'mañana' && message.includes('desayuno')) {
    return '\n\n🌅 **Perfecto timing!** El desayuno con proteína te dará energía para todo el día.';
  } else if (timeOfDay === 'noche' && message.includes('cena')) {
    return '\n\n🌙 **Para esta noche:** Opta por comidas ligeras y evita pantallas antes de dormir.';
  }
  return '';
}

function getAgeSpecificRecommendations(age) {
  if (age < 25) return 'Enfócate en establecer hábitos duraderos. Tu metabolismo es muy activo.';
  if (age < 40) return 'Momento perfecto para optimizar tu salud. Combina fuerza con cardio.';
  if (age < 60) return 'Prioriza masa muscular y salud cardiovascular. Incluye flexibilidad.';
  return 'Enfócate en funcionalidad y equilibrio. Ejercicios de bajo impacto son ideales.';
}

function getIMCCategory(imc) {
  if (imc < 18.5) return 'Bajo peso';
  if (imc < 25) return 'Peso normal';
  if (imc < 30) return 'Sobrepeso';
  return 'Obesidad';
}

function getTimeOfDay() {
  const hour = new Date().getHours();
  if (hour < 12) return 'mañana';
  if (hour < 18) return 'tarde';
  return 'noche';
}

function getTimeContext() {
  const now = new Date();
  return {
    hour: now.getHours(),
    day: now.getDay(),
    timeOfDay: getTimeOfDay()
  };
}

// Funciones de utilidad
function addMessage(message, isUser = false) {
  const messageDiv = document.createElement('div');
  messageDiv.className = isUser ? 'user-message' : 'ia-message';
  
  const messageP = document.createElement('p');
  messageP.innerHTML = message
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>')
    .replace(/• /g, '&bull; ');
  
  messageDiv.appendChild(messageP);
  chatContainer.appendChild(messageDiv);
  chatContainer.scrollTop = chatContainer.scrollHeight;
  
  return messageDiv;
}

function saveToHistory(user, assistant) {
  conversationHistory.push({ user, assistant, timestamp: Date.now() });
  if (conversationHistory.length > 10) {
    conversationHistory = conversationHistory.slice(-10);
  }
  
  // Guardar en localStorage
  try {
    localStorage.setItem('alissa_history', JSON.stringify(conversationHistory));
  } catch (e) {
    console.log('No se pudo guardar el historial');
  }
}

function loadUserProfile() {
  try {
    const history = localStorage.getItem('alissa_history');
    if (history) {
      conversationHistory = JSON.parse(history);
      console.log('📚 Historial cargado:', conversationHistory.length, 'mensajes');
    }
  } catch (e) {
    console.log('No se pudo cargar el historial');
  }
}