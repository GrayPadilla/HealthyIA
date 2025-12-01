// Variables globales
let chatContainer, userInput, sendBtn, volverBtn;

// Inicialización cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
  // Obtener elementos del DOM
  chatContainer = document.getElementById('chatContainer');
  userInput = document.getElementById('userInput');
  sendBtn = document.getElementById('sendBtn');
  volverBtn = document.getElementById('volverBtn');
  
  // Verificar que todos los elementos existen
  if (!chatContainer || !userInput || !sendBtn || !volverBtn) {
    console.error('No se pudieron encontrar todos los elementos necesarios');
    return;
  }
  
  // Event listeners
  sendBtn.addEventListener('click', processMessage);
  
  userInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      processMessage();
    }
  });
  
  volverBtn.addEventListener('click', function() {
    window.history.back();
  });
  
  // Focus inicial
  userInput.focus();
  
  // Cargar perfil de usuario guardado
  loadUserProfile();
  
  console.log('🤖 Alissa IA System v2.0 - Sistema Inteligente Activado');
  console.log('🔍 Detectando APIs disponibles...');
  
  // Detectar qué APIs están configuradas
  checkAvailableAPIs();
});

// La configuración de API se carga desde config.js

// Función para procesar mensaje del usuario
async function processMessage() {
  const message = userInput.value.trim();
  
  if (!message) {
    return;
  }
  
  // Agregar mensaje del usuario
  addMessage(message, true);
  userInput.value = '';
  
  // Mostrar indicador de carga
  addMessage('Escribiendo...', false);
  
  try {
    // Intentar usar API real primero
    let response = await getAIResponse(message);
    
    // Si falla la API, usar respuesta simulada inteligente
    if (!response) {
      response = getSimulatedResponse(message);
    }
    
    // Remover indicador de carga
    if (chatContainer.lastChild) {
      chatContainer.removeChild(chatContainer.lastChild);
    }
    
    // Agregar respuesta de IA
    addMessage(response, false);
    
  } catch (error) {
    console.error('Error procesando mensaje:', error);
    
    // Remover indicador de carga
    if (chatContainer.lastChild) {
      chatContainer.removeChild(chatContainer.lastChild);
    }
    
    // Usar respuesta simulada como fallback
    const fallbackResponse = getSimulatedResponse(message);
    addMessage(fallbackResponse, false);
  }
}

// Función principal para obtener respuesta de IA
async function getAIResponse(message) {
  // Crear contexto dinámico basado en la conversación
  const userContext = analyzeUserContext(message);
  const conversationHistory = getConversationHistory();
  
  // Crear prompt especializado y dinámico
  const dynamicPrompt = createDynamicHealthPrompt(message, userContext, conversationHistory);

  // Intentar diferentes APIs en orden de preferencia
  try {
    console.log('🤖 Intentando conectar con IA real...');
    
    // 1. Intentar Gemini primero (es gratuito y muy bueno)
    if (API_CONFIG.gemini.token && !API_CONFIG.gemini.token.includes('tu_token')) {
      console.log('🧠 Usando Gemini AI...');
      const response = await callGemini(dynamicPrompt);
      if (response) {
        saveConversationHistory(message, response);
        return response;
      }
    }
    
    // 2. Intentar OpenAI
    if (API_CONFIG.openai.token && !API_CONFIG.openai.token.includes('tu_token')) {
      console.log('🔥 Usando OpenAI GPT...');
      const response = await callOpenAI(dynamicPrompt);
      if (response) {
        saveConversationHistory(message, response);
        return response;
      }
    }
    
    // 3. Intentar Hugging Face
    if (API_CONFIG.huggingface.token && !API_CONFIG.huggingface.token.includes('tu_token')) {
      console.log('🤗 Usando Hugging Face...');
      const response = await callHuggingFace(dynamicPrompt);
      if (response) {
        saveConversationHistory(message, response);
        return response;
      }
    }
    
    console.log('⚠️ No hay tokens de API configurados, usando sistema inteligente local');
    return null;
    
  } catch (error) {
    console.error('Error en getAIResponse:', error);
    return null;
  }
}

// Variables para historial de conversación
let conversationHistory = [];
let userProfile = {};

// Crear prompt dinámico y contextual
function createDynamicHealthPrompt(message, userContext, history) {
  const currentTime = new Date();
  const timeOfDay = getTimeOfDay(currentTime);
  const contextualGreeting = getContextualGreeting(timeOfDay);
  
  let prompt = `Eres Alissa, una asistente virtual de salud altamente inteligente y empática. Tu personalidad es profesional pero amigable, siempre buscas personalizar tus respuestas.

$CONTEXTO_TEMPORAL:
- Hora actual: ${timeOfDay}
- Fecha: ${currentTime.toLocaleDateString('es-ES')}

$PERFIL_USUARIO:
${userContext.hasPersonalData ? `
- Datos conocidos: ${JSON.stringify(userContext, null, 2)}
- IMC calculado: ${userContext.imc || 'No disponible'}
` : '- Primera interacción o datos limitados'}

$HISTORIAL_CONVERSACION:
${history.length > 0 ? history.map(item => `Usuario: ${item.user}\nAlissa: ${item.assistant}`).join('\n---\n') : 'Nueva conversación'}

$MENSAJE_ACTUAL:
"${message}"

$INSTRUCCIONES_RESPUESTA:
1. Analiza el contexto completo (datos personales, historial, momento del día)
2. Proporciona una respuesta completamente personalizada y contextual
3. Si es una continuación de conversación previa, reférencela naturalmente
4. Incluye recomendaciones específicas basadas en el perfil del usuario
5. Usa un tono conversacional y empático
6. Si detectas datos de salud, proporciona cálculos precisos (IMC, calorías, etc.)
7. Adapta las sugerencias al momento del día (desayuno por la mañana, etc.)
8. Responde en español de manera natural y fluida

Responde como Alissa, de manera inteligente, contextual y personalizada:`;
  
  return prompt;
}

// Analizar contexto del usuario de manera más profunda
function analyzeUserContext(message) {
  const context = extractPersonalInfo(message);
  
  // Detectar intenciones más complejas
  context.intent = analyzeComplexIntent(message);
  context.mood = analyzeMood(message);
  context.urgency = analyzeUrgency(message);
  context.specificGoals = extractSpecificGoals(message);
  
  // Calcular IMC si tenemos datos
  if (context.weight && context.height) {
    context.imc = (context.weight / (context.height * context.height)).toFixed(1);
    context.imcCategory = getIMCCategory(parseFloat(context.imc));
  }
  
  // Actualizar perfil de usuario
  updateUserProfile(context);
  
  return context;
}

// Analizar intención compleja
function analyzeComplexIntent(message) {
  const lowerMessage = message.toLowerCase();
  
  // Intenciones complejas
  if (lowerMessage.includes('no puedo') || lowerMessage.includes('dificil') || lowerMessage.includes('problema')) {
    return 'seeking_help';
  }
  if (lowerMessage.includes('rapido') || lowerMessage.includes('urgente') || lowerMessage.includes('ya')) {
    return 'urgent_need';
  }
  if (lowerMessage.includes('como') && (lowerMessage.includes('empezar') || lowerMessage.includes('comenzar'))) {
    return 'beginner_guidance';
  }
  if (lowerMessage.includes('mejor') || lowerMessage.includes('comparar') || lowerMessage.includes('diferencia')) {
    return 'comparison_needed';
  }
  if (lowerMessage.includes('por que') || lowerMessage.includes('porque') || lowerMessage.includes('razón')) {
    return 'explanation_needed';
  }
  
  return analyzeIntent(lowerMessage);
}

// Analizar estado de ánimo
function analyzeMood(message) {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('triste') || lowerMessage.includes('deprimid') || lowerMessage.includes('mal')) {
    return 'sad';
  }
  if (lowerMessage.includes('ansios') || lowerMessage.includes('nervios') || lowerMessage.includes('estrés')) {
    return 'anxious';
  }
  if (lowerMessage.includes('motivad') || lowerMessage.includes('emocionad') || lowerMessage.includes('genial')) {
    return 'motivated';
  }
  if (lowerMessage.includes('cansad') || lowerMessage.includes('agotad') || lowerMessage.includes('sin energía')) {
    return 'tired';
  }
  
  return 'neutral';
}

// Analizar urgencia
function analyzeUrgency(message) {
  const urgentWords = ['urgente', 'rapido', 'ya', 'ahora', 'inmediato', 'prisa'];
  return urgentWords.some(word => message.toLowerCase().includes(word)) ? 'high' : 'normal';
}

// Extraer objetivos específicos
function extractSpecificGoals(message) {
  const goals = [];
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('tonificar')) goals.push('tonificar');
  if (lowerMessage.includes('flexibilidad')) goals.push('flexibilidad');
  if (lowerMessage.includes('resistencia')) goals.push('resistencia');
  if (lowerMessage.includes('masa muscular')) goals.push('masa_muscular');
  if (lowerMessage.includes('grasa abdominal')) goals.push('grasa_abdominal');
  if (lowerMessage.includes('energia')) goals.push('energia');
  if (lowerMessage.includes('sueño')) goals.push('mejor_sueno');
  
  return goals;
}

// Obtener momento del día
function getTimeOfDay(date) {
  const hour = date.getHours();
  if (hour < 6) return 'madrugada';
  if (hour < 12) return 'mañana';
  if (hour < 18) return 'tarde';
  return 'noche';
}

// Saludo contextual
function getContextualGreeting(timeOfDay) {
  const greetings = {
    'madrugada': '¡Qué madrugador/a! 🌙',
    'mañana': '¡Buenos días! ☀️',
    'tarde': '¡Buenas tardes! 🌅',
    'noche': '¡Buenas noches! 🌃'
  };
  return greetings[timeOfDay] || '¡Hola!';
}

// Guardar historial de conversación
function saveConversationHistory(userMessage, assistantResponse) {
  conversationHistory.push({
    user: userMessage,
    assistant: assistantResponse,
    timestamp: new Date().toISOString()
  });
  
  // Mantener solo los últimos 5 intercambios
  if (conversationHistory.length > 5) {
    conversationHistory = conversationHistory.slice(-5);
  }
}

// Obtener historial de conversación
function getConversationHistory() {
  return conversationHistory.slice(-3); // Últimos 3 intercambios
}

// Actualizar perfil de usuario
function updateUserProfile(newContext) {
  userProfile = { ...userProfile, ...newContext };
  
  // Guardar en localStorage para persistencia
  try {
    localStorage.setItem('alissa_user_profile', JSON.stringify(userProfile));
  } catch (e) {
    console.log('No se pudo guardar el perfil del usuario');
  }
}

// Cargar perfil de usuario
function loadUserProfile() {
  try {
    const saved = localStorage.getItem('alissa_user_profile');
    if (saved) {
      userProfile = JSON.parse(saved);
      console.log('💾 Perfil de usuario cargado:', userProfile);
    }
  } catch (e) {
    console.log('No se pudo cargar el perfil del usuario');
  }
}

// Verificar APIs disponibles
function checkAvailableAPIs() {
  let availableAPIs = [];
  
  if (API_CONFIG.gemini.token && !API_CONFIG.gemini.token.includes('tu_token')) {
    availableAPIs.push('🧠 Google Gemini');
  }
  if (API_CONFIG.openai.token && !API_CONFIG.openai.token.includes('tu_token')) {
    availableAPIs.push('🔥 OpenAI GPT');
  }
  if (API_CONFIG.huggingface.token && !API_CONFIG.huggingface.token.includes('tu_token')) {
    availableAPIs.push('🤗 Hugging Face');
  }
  
  if (availableAPIs.length > 0) {
    console.log('✅ APIs configuradas:', availableAPIs.join(', '));
    console.log('🎆 Alissa usará IA real para respuestas inteligentes!');
  } else {
    console.log('⚠️ No hay APIs configuradas');
    console.log('🧠 Alissa usará el sistema inteligente local avanzado');
  }
}

// Función mejorada para respuestas locales completamente dinámicas
function generateIntelligentLocalResponse(message, userContext) {
  // Crear respuesta contextual dinámica
  const timeOfDay = getTimeOfDay(new Date());
  const greeting = getContextualGreeting(timeOfDay);
  const history = getConversationHistory();
  
  // Respuesta personalizada basada en el contexto completo
  let response = '';
  
  // Añadir saludo contextual si es primera interacción
  if (history.length === 0) {
    response += `${greeting} Soy Alissa, tu asistente de salud personalizada. `;
  }
  
  // Procesar según intención y contexto
  if (userContext.hasPersonalData) {
    response += generatePersonalizedResponse(message, userContext);
  } else {
    // Respuesta inteligente basada en intención
    const intent = userContext.intent || analyzeIntent(message.toLowerCase());
    response += generateContextualResponse(message, intent, message.toLowerCase());
  }
  
  // Añadir contexto temporal si es relevante
  if (timeOfDay === 'mañana' && (message.toLowerCase().includes('desayuno') || message.toLowerCase().includes('mañana'))) {
    response += '\n\n🌅 **Perfect timing para el desayuno!** Las mejores opciones matutinas incluyen proteína y fibra para mantenerte energízado/a.';
  } else if (timeOfDay === 'noche' && (message.toLowerCase().includes('cena') || message.toLowerCase().includes('dormir'))) {
    response += '\n\n🌃 **Para esta noche:** Opta por comidas ligeras y evita pantallas 1 hora antes de dormir.';
  }
  
  // Añadir motivación personalizada según estado de ánimo
  if (userContext.mood === 'sad') {
    response += '\n\n💪 Recuerda: cuidar tu salud es un acto de amor propio. Estás dando pasos importantes.';
  } else if (userContext.mood === 'motivated') {
    response += '\n\n🎆 ¡Me encanta tu motivación! Aprovechemos esta energía para crear hábitos duraderos.';
  } else if (userContext.mood === 'tired') {
    response += '\n\n😌 Entiendo que te sientes cansado/a. Empecemos con pequeños cambios que no te agoten más.';
  }
  
  // Guardar interacción en el historial
  saveConversationHistory(message, response);
  
  return response;
}

// Función para llamar OpenAI API
async function callOpenAI(prompt) {
  try {
    const response = await fetch(API_CONFIG.openai.url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_CONFIG.openai.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: API_CONFIG.openai.model,
        messages: [
          {
            role: 'system',
            content: 'Eres Alissa, una asistente virtual especializada en salud y bienestar. Respondes de manera profesional, empática y con recomendaciones prácticas sobre nutrición, ejercicio y salud general.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: 0.7
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.choices[0].message.content;
    }
    
    return null;
  } catch (error) {
    console.error('Error llamando OpenAI:', error);
    return null;
  }
}

// Función para llamar Gemini API
async function callGemini(prompt) {
  try {
    const response = await fetch(`${API_CONFIG.gemini.url}?key=${API_CONFIG.gemini.token}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.candidates[0].content.parts[0].text;
    }
    
    return null;
  } catch (error) {
    console.error('Error llamando Gemini:', error);
    return null;
  }
}

// Función para llamar Hugging Face API
async function callHuggingFace(message) {
  try {
    const response = await fetch(API_CONFIG.huggingface.url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_CONFIG.huggingface.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: message
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.generated_text || data[0]?.generated_text;
    }
    
    return null;
  } catch (error) {
    console.error('Error llamando Hugging Face:', error);
    return null;
  }
}

// Función para agregar mensaje al chat
function addMessage(message, isUser = false) {
  const messageDiv = document.createElement('div');
  messageDiv.className = isUser ? 'user-message' : 'ia-message';
  
  const messageP = document.createElement('p');
  
  // Convertir formato de texto a HTML
  let formattedMessage = message
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Negrita
    .replace(/\n/g, '<br>') // Saltos de línea
    .replace(/• /g, '&bull; '); // Viñetas
  
  messageP.innerHTML = formattedMessage;
  messageDiv.appendChild(messageP);
  
  chatContainer.appendChild(messageDiv);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Función para generar respuesta inteligente como ChatGPT
function getSimulatedResponse(message) {
  console.log('🧠 Generando respuesta inteligente local...');
  
  // Análisis contextual avanzado
  const userContext = analyzeUserContext(message);
  
  // Usar el nuevo sistema inteligente dinámico
  return generateIntelligentLocalResponse(message, userContext);
}

// Función principal de análisis contextual
function analyzeAndRespond(originalMessage, lowerMessage) {
  // Extraer información personal si está disponible
  const personalInfo = extractPersonalInfo(lowerMessage);
  
  // Casos específicos con información personal
  if (personalInfo.hasPersonalData) {
    return generatePersonalizedResponse(originalMessage, personalInfo);
  }
  
  // Análisis de intención y contexto
  const intent = analyzeIntent(lowerMessage);
  return generateContextualResponse(originalMessage, intent, lowerMessage);
}

// Extraer información personal del mensaje
function extractPersonalInfo(message) {
  const info = {
    hasPersonalData: false,
    age: null,
    weight: null,
    height: null,
    gender: null,
    goals: [],
    conditions: []
  };
  
  // Extraer edad
  const ageMatch = message.match(/(\d+)\s*(año|años|year)/);
  if (ageMatch) {
    info.age = parseInt(ageMatch[1]);
    info.hasPersonalData = true;
  }
  
  // Extraer peso
  const weightMatch = message.match(/(\d+(?:\.\d+)?)\s*kg/);
  if (weightMatch) {
    info.weight = parseFloat(weightMatch[1]);
    info.hasPersonalData = true;
  }
  
  // Extraer altura
  const heightMatch = message.match(/(\d+(?:\.\d+)?)\s*(?:m|metro|cm)/);
  if (heightMatch) {
    const height = parseFloat(heightMatch[1]);
    info.height = message.includes('cm') ? height / 100 : height;
    info.hasPersonalData = true;
  }
  
  // Detectar género
  if (message.includes('mujer') || message.includes('femenino') || message.includes('ella')) {
    info.gender = 'female';
    info.hasPersonalData = true;
  } else if (message.includes('hombre') || message.includes('masculino') || message.includes('él')) {
    info.gender = 'male';
    info.hasPersonalData = true;
  }
  
  // Detectar objetivos
  if (message.includes('bajar') || message.includes('perder') || message.includes('adelgazar')) {
    info.goals.push('weight_loss');
    info.hasPersonalData = true;
  }
  if (message.includes('subir') || message.includes('ganar') || message.includes('aumentar')) {
    info.goals.push('weight_gain');
    info.hasPersonalData = true;
  }
  if (message.includes('músculo') || message.includes('masa') || message.includes('fuerza')) {
    info.goals.push('muscle_gain');
    info.hasPersonalData = true;
  }
  
  return info;
}

// Generar respuesta personalizada basada en datos
function generatePersonalizedResponse(message, info) {
  let response = "¡Perfecto! He analizado tu información personal:\\n\\n";
  
  // Calcular IMC si tenemos peso y altura
  if (info.weight && info.height) {
    const imc = info.weight / (info.height * info.height);
    const imcCategory = getIMCCategory(imc);
    response += `📊 **Tu IMC:** ${imc.toFixed(1)} - ${imcCategory}\\n\\n`;
  }
  
  // Recomendaciones basadas en edad
  if (info.age) {
    if (info.age < 25) {
      response += `🎯 **Para tu edad (${info.age} años):** Enfócate en establecer hábitos saludables duraderos. Tu metabolismo es más activo, aprovecha para construir una base sólida.\\n\\n`;
    } else if (info.age < 40) {
      response += `🎯 **Para tu edad (${info.age} años):** Es el momento perfecto para optimizar tu salud. Combina ejercicio de fuerza con cardio para mantener tu metabolismo.\\n\\n`;
    } else if (info.age < 60) {
      response += `🎯 **Para tu edad (${info.age} años):** Prioriza la preservación de masa muscular y la salud cardiovascular. Incluye ejercicios de flexibilidad.\\n\\n`;
    } else {
      response += `🎯 **Para tu edad (${info.age} años):** Enfócate en mantener la funcionalidad, equilibrio y densidad ósea. Ejercicios de bajo impacto son ideales.\\n\\n`;
    }
  }
  
  // Recomendaciones específicas por objetivo
  if (info.goals.includes('weight_loss')) {
    const caloricDeficit = info.weight ? Math.round(info.weight * 25 - 500) : 1500;
    response += `🎯 **Plan para perder peso:**\\n`;
    response += `• Déficit calórico: aproximadamente ${caloricDeficit} calorías/día\\n`;
    response += `• Combina cardio (3-4 días) con fuerza (2-3 días)\\n`;
    response += `• Proteína: ${info.weight ? (info.weight * 1.6).toFixed(0) : '80-100'}g al día\\n`;
    response += `• Pérdida saludable: 0.5-1kg por semana\\n\\n`;
  }
  
  if (info.goals.includes('muscle_gain')) {
    const calories = info.weight ? Math.round(info.weight * 35 + 300) : 2500;
    response += `💪 **Plan para ganar músculo:**\\n`;
    response += `• Superávit calórico: aproximadamente ${calories} calorías/día\\n`;
    response += `• Entrenamiento de fuerza 4-5 días/semana\\n`;
    response += `• Proteína: ${info.weight ? (info.weight * 2).toFixed(0) : '120-150'}g al día\\n`;
    response += `• Descanso: 7-9 horas de sueño\\n\\n`;
  }
  
  // Consideraciones por género
  if (info.gender === 'female') {
    response += `♀️ **Consideraciones especiales:**\\n`;
    response += `• Incluye hierro (carnes rojas, espinacas, lentejas)\\n`;
    response += `• Calcio para salud ósea (lácteos, almendras)\\n`;
    response += `• Ácido fólico (verduras verdes, cítricos)\\n\\n`;
  } else if (info.gender === 'male') {
    response += `♂️ **Consideraciones especiales:**\\n`;
    response += `• Mayor requerimiento calórico (+300-500 cal)\\n`;
    response += `• Enfoque en proteína post-entrenamiento\\n`;
    response += `• Zinc para recuperación (carnes, nueces)\\n\\n`;
  }
  
  response += "¿Te gustaría que elabore un plan más detallado basado en esta información?";
  return response;
}

// Categorías de IMC
function getIMCCategory(imc) {
  if (imc < 18.5) return "Bajo peso";
  if (imc < 25) return "Peso normal";
  if (imc < 30) return "Sobrepeso";
  return "Obesidad";
}

// Analizar intención del mensaje
function analyzeIntent(message) {
  const intents = {
    nutrition: ['plan', 'dieta', 'comida', 'alimenta', 'nutri', 'comer', 'receta'],
    exercise: ['ejercicio', 'rutina', 'entrenar', 'gym', 'deporte', 'actividad', 'físico'],
    weightLoss: ['bajar', 'perder', 'adelgazar', 'peso', 'delgad'],
    weightGain: ['subir', 'ganar', 'aumentar', 'peso', 'músculo'],
    health: ['salud', 'enfermedad', 'síntoma', 'dolor', 'medicina'],
    wellness: ['bienestar', 'estrés', 'sueño', 'dormir', 'relajar'],
    hydration: ['agua', 'hidrat', 'beber', 'líquido'],
    supplements: ['vitamina', 'suplemento', 'mineral'],
    greeting: ['hola', 'buenos', 'buenas', 'saludos'],
    thanks: ['gracias', 'perfecto', 'excelente', 'genial'],
    goodbye: ['adiós', 'chao', 'hasta luego', 'nos vemos']
  };
  
  for (const [intent, keywords] of Object.entries(intents)) {
    if (keywords.some(keyword => message.includes(keyword))) {
      return intent;
    }
  }
  
  return 'general';
}

// Generar respuesta contextual
function generateContextualResponse(originalMessage, intent, lowerMessage) {
  switch (intent) {
    case 'nutrition':
      return generateNutritionResponse(lowerMessage);
    case 'exercise':
      return generateExerciseResponse(lowerMessage);
    case 'weightLoss':
      return generateWeightLossResponse(lowerMessage);
    case 'weightGain':
      return generateWeightGainResponse(lowerMessage);
    case 'wellness':
      return generateWellnessResponse(lowerMessage);
    case 'hydration':
      return generateHydrationResponse();
    case 'supplements':
      return generateSupplementsResponse();
    case 'greeting':
      return generateGreetingResponse();
    case 'thanks':
      return generateThanksResponse();
    case 'goodbye':
      return generateGoodbyeResponse();
    default:
      return generateIntelligentDefault(originalMessage);
  }
}

// Respuestas específicas por categoría
function generateNutritionResponse(message) {
  if (message.includes('desayuno')) {
    return "🍳 **Ideas para un desayuno saludable:**\\n\\n• Avena con frutas rojas y nueces\\n• Tostada integral con aguacate y huevo\\n• Yogur griego con granola y miel\\n• Smoothie verde con espinacas y plátano\\n• Huevos revueltos con vegetales\\n\\n¿Tienes preferencias específicas o restricciones alimentarias?";
  }
  
  if (message.includes('almuerzo') || message.includes('comida')) {
    return "🍽️ **Opciones de almuerzo balanceado:**\\n\\n• Pechuga de pollo con quinoa y vegetales\\n• Salmón al horno con batata y brócoli\\n• Ensalada de atún con garbanzos y aguacate\\n• Bowl de tofu con arroz integral y edamame\\n• Lentejas con verduras y pan integral\\n\\n¿Cocinas en casa o necesitas opciones para llevar?";
  }
  
  if (message.includes('cena')) {
    return "🌙 **Cenas ligeras y nutritivas:**\\n\\n• Sopa de verduras con proteína\\n• Ensalada con pollo o pescado\\n• Tortilla de vegetales\\n• Yogur con frutas y granola\\n• Sándwich integral ligero\\n\\n**Tip:** Cena al menos 2 horas antes de dormir para mejor digestión.";
  }
  
  return "🥗 **Principios de nutrición saludable:**\\n\\nUna alimentación balanceada incluye:\\n\\n• **50% del plato:** Vegetales y frutas\\n• **25% del plato:** Proteína magra\\n• **25% del plato:** Carbohidratos complejos\\n• **Grasas saludables:** Aceite de oliva, aguacate, nueces\\n\\n**Frecuencia:** 5-6 comidas pequeñas al día\\n**Hidratación:** 8-10 vasos de agua\\n\\n¿Hay algún aspecto específico de la nutrición que te interese más?";
}

function generateExerciseResponse(message) {
  if (message.includes('principiante') || message.includes('empezar') || message.includes('comenzar')) {
    return "🏃‍♀️ **Rutina para principiantes (4 semanas):**\\n\\n**Semana 1-2:**\\n• 20 min caminata diaria\\n• 2 días de ejercicios básicos:\\n  - 10 sentadillas\\n  - 5 flexiones (rodillas si es necesario)\\n  - 30 seg plancha\\n  - 10 abdominales\\n\\n**Semana 3-4:**\\n• 25-30 min actividad cardiovascular\\n• 3 días ejercicios de fuerza\\n• Aumenta repeticiones 20%\\n\\n**Importante:** Progresión gradual y descanso adecuado.";
  }
  
  if (message.includes('casa') || message.includes('sin gimnasio')) {
    return "🏠 **Rutina completa en casa (sin equipo):**\\n\\n**Calentamiento (5 min):**\\n• Marcha en el lugar\\n• Círculos con brazos\\n• Estiramientos dinámicos\\n\\n**Circuito principal (20 min):**\\n• Sentadillas: 3x12\\n• Flexiones: 3x8-10\\n• Plancha: 3x30-45 seg\\n• Burpees: 3x5\\n• Mountain climbers: 3x20\\n• Desplantes: 3x10 c/pierna\\n\\n**Enfriamiento:** 5 min estiramiento\\n\\n¿Cuántos días por semana podrías entrenar?";
  }
  
  return "💪 **Plan de ejercicio balanceado:**\\n\\n**Estructura semanal ideal:**\\n• **Lunes:** Cardio moderado (30 min)\\n• **Martes:** Fuerza tren superior\\n• **Miércoles:** Descanso activo (yoga/caminar)\\n• **Jueves:** Fuerza tren inferior\\n• **Viernes:** HIIT (20 min)\\n• **Sábado:** Actividad recreativa\\n• **Domingo:** Descanso completo\\n\\n**Beneficios:**\\n✅ Quema de calorías\\n✅ Fortalecimiento muscular\\n✅ Mejora cardiovascular\\n✅ Flexibilidad y movilidad\\n\\n¿Tienes experiencia previa con ejercicio?";
}

function generateWeightLossResponse(message) {
  return "⚖️ **Estrategia integral para pérdida de peso:**\\n\\n**1. Déficit calórico controlado:**\\n• Reduce 300-500 calorías/día\\n• No bajes de 1200 cal/día (mujeres) o 1500 (hombres)\\n\\n**2. Macronutrientes:**\\n• Proteína: 1.6-2g por kg de peso\\n• Grasas: 20-30% del total calórico\\n• Carbohidratos: El resto, enfócate en complejos\\n\\n**3. Ejercicio:**\\n• Cardio: 150-300 min/semana intensidad moderada\\n• Fuerza: 2-3 días/semana (preserva músculo)\\n\\n**4. Hábitos clave:**\\n📝 Registro alimentario\\n⏰ Horarios regulares\\n💧 Hidratación adecuada\\n😴 7-9 horas de sueño\\n\\n**Meta realista:** 0.5-1 kg por semana\\n\\n¿Cuál es tu peso objetivo y en qué tiempo frame?";
}

function generateWeightGainResponse(message) {
  return "📈 **Plan para aumento de peso saludable:**\\n\\n**1. Superávit calórico:**\\n• Añade 300-500 calorías/día\\n• Enfócate en alimentos densos en nutrientes\\n\\n**2. Alimentos recomendados:**\\n🥑 Aguacates, nueces, aceite oliva\\n🥩 Carnes magras, pescado, huevos\\n🍠 Batatas, quinoa, avena\\n🥛 Lácteos enteros (si toleras)\\n\\n**3. Estrategias:**\\n• 5-6 comidas pequeñas/día\\n• Smoothies altos en calorías\\n• Snacks nutritivos entre comidas\\n• Bebe calorías (no solo agua)\\n\\n**4. Ejercicio:**\\n• Fuerza 3-4 días/semana\\n• Cardio mínimo (solo salud cardiovascular)\\n• Compuestos: sentadillas, peso muerto, press\\n\\n**Meta:** 0.25-0.5 kg por semana\\n\\n¿Tienes dificultades para comer suficiente o prefieres ganar masa muscular específicamente?";
}

function generateWellnessResponse(message) {
  if (message.includes('estrés')) {
    return "🧘‍♀️ **Manejo efectivo del estrés:**\\n\\n**Técnicas inmediatas:**\\n• Respiración 4-7-8: inhala 4, mantén 7, exhala 8\\n• Técnica 5-4-3-2-1: nombra 5 cosas que ves, 4 que tocas, etc.\\n• Caminata de 5-10 minutos\\n\\n**Estrategias a largo plazo:**\\n🧘 Meditación diaria (apps: Headspace, Calm)\\n📝 Journaling antes de dormir\\n🎵 Música relajante o sonidos de naturaleza\\n🌱 Tiempo en la naturaleza\\n👥 Conexiones sociales de calidad\\n\\n**Señales de alerta:**\\n• Insomnio persistente\\n• Cambios en apetito\\n• Irritabilidad constante\\n• Síntomas físicos (dolores de cabeza, tensión)\\n\\n¿Hay situaciones específicas que te generan más estrés?";
  }
  
  if (message.includes('sueño') || message.includes('dormir')) {
    return "😴 **Optimización del sueño:**\\n\\n**Rutina nocturna ideal:**\\n🕘 2h antes: última comida pesada\\n🕘 1h antes: sin pantallas (luz azul)\\n🕘 30min antes: actividades relajantes\\n\\n**Ambiente óptimo:**\\n• Temperatura: 18-22°C\\n• Oscuridad completa (cortinas blackout)\\n• Silencio o ruido blanco\\n• Colchón y almohada cómodos\\n\\n**Hábitos diurnos:**\\n☀️ Exposición a luz natural temprano\\n☕ Cafeína solo antes de 2pm\\n🏃‍♀️ Ejercicio regular (no cerca de dormir)\\n⏰ Horarios consistentes\\n\\n**Si tienes insomnio:**\\n• Regla 20 minutos: si no duermes, levántate\\n• Actividad relajante hasta tener sueño\\n• Evita ver la hora\\n\\n¿Cuántas horas duermes normalmente y cómo te sientes al despertar?";
  }
  
  return "🌟 **Bienestar integral:**\\n\\nEl bienestar incluye múltiples dimensiones:\\n\\n🧠 **Mental:** Manejo del estrés, mindfulness\\n💪 **Físico:** Ejercicio regular, nutrición\\n😴 **Descanso:** Sueño de calidad\\n❤️ **Social:** Relaciones saludables\\n🎯 **Propósito:** Metas y significado\\n🌱 **Crecimiento:** Aprendizaje continuo\\n\\n**Evaluación personal:**\\n¿En cuál de estas áreas sientes que necesitas más apoyo?";
}

function generateHydrationResponse() {
  return "💧 **Hidratación inteligente:**\\n\\n**Cálculo personal:**\\n• Peso x 35ml = necesidad diaria básica\\n• +500-750ml por hora de ejercicio\\n• +250-500ml en clima caluroso\\n\\n**Señales de hidratación:**\\n✅ Orina amarillo claro\\n✅ Sin sed constante\\n✅ Energía estable\\n✅ Piel elástica\\n\\n**Estrategias prácticas:**\\n🚰 Botella siempre visible\\n⏰ Apps recordatorio o alarmas\\n🍋 Saborizantes naturales (limón, menta)\\n🥤 Incluye: infusiones, caldos, frutas\\n\\n**Timing óptimo:**\\n• Al despertar: 500ml\\n• Antes de comidas: 250ml\\n• Durante ejercicio: cada 15-20min\\n\\n¿Tienes dificultades para recordar beber agua o no te gusta el sabor?";
}

function generateSupplementsResponse() {
  return "🧬 **Guía de suplementación:**\\n\\n**Básicos recomendados:**\\n• **Vitamina D3:** 1000-2000 UI (especialmente invierno)\\n• **Omega-3:** 1-2g EPA/DHA si no comes pescado\\n• **Magnesio:** 200-400mg (mejor absorción nocturna)\\n• **Probióticos:** Si has tomado antibióticos\\n\\n**Solo si hay deficiencia:**\\n• **B12:** Vegetarianos/veganos\\n• **Hierro:** Solo con análisis que lo confirme\\n• **Zinc:** Durante resfriados o estrés alto\\n\\n**Para deportistas:**\\n• **Proteína en polvo:** Si no alcanzas requerimientos\\n• **Creatina:** 3-5g diarios para fuerza\\n• **BCAA:** Solo si entrenas en ayunas\\n\\n**⚠️ IMPORTANTE:**\\n• Consulta médica antes de cualquier suplemento\\n• Prefiere siempre fuentes naturales\\n• Calidad sobre cantidad\\n• Revisa interacciones con medicamentos\\n\\n¿Tienes alguna deficiencia diagnosticada o objetivo específico?";
}

function generateGreetingResponse() {
  const greetings = [
    "¡Hola! 👋 Soy Alissa, tu asistente de salud personalizada. Estoy aquí para ayudarte a alcanzar tus objetivos de bienestar.",
    "¡Qué gusto saludarte! 😊 Soy Alissa y me especializo en nutrición, ejercicio y hábitos saludables.",
    "¡Hola! ✨ Soy Alissa, tu compañera en el viaje hacia una vida más saludable."
  ];
  
  const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
  
  return `${randomGreeting}\\n\\n**Puedo ayudarte con:**\\n🥗 Planes de alimentación personalizados\\n💪 Rutinas de ejercicio adaptadas\\n⚖️ Manejo de peso saludable\\n😴 Optimización del sueño\\n🧘‍♀️ Técnicas de relajación\\n🩺 Información sobre condiciones de salud\\n\\n¿En qué aspecto de tu salud te gustaría enfocarte hoy?`;
}

function generateThanksResponse() {
  return "¡Me encanta saber que te fue útil! 😊\\n\\nRecuerda que los cambios saludables son un proceso gradual. La consistencia es más importante que la perfección.\\n\\n**Consejos para mantener el progreso:**\\n✅ Celebra los pequeños logros\\n✅ Sé paciente contigo mismo\\n✅ Ajusta el plan según sea necesario\\n✅ Busca apoyo cuando lo necesites\\n\\n¿Hay algo más en lo que pueda ayudarte para complementar tu plan de salud?";
}

function generateGoodbyeResponse() {
  return "¡Hasta pronto! 👋\\n\\nRecuerda: **tu salud es tu mayor inversión**. Los pequeños pasos diarios te llevarán a grandes resultados.\\n\\n**Para esta semana:**\\n🎯 Elige 1-2 hábitos para implementar\\n📝 Haz un seguimiento simple\\n💪 Mantente consistente\\n🌟 Disfruta del proceso\\n\\n¡Nos vemos pronto y espero saber de tus progresos! 💚";
}

function generateIntelligentDefault(message) {
  // Análisis más sofisticado del mensaje
  const words = message.toLowerCase().split(/\s+/);
  const healthKeywords = ['salud', 'saludable', 'bienestar', 'fitness', 'nutrición', 'ejercicio', 'dieta', 'peso'];
  const hasHealthContext = words.some(word => healthKeywords.includes(word));
  
  if (hasHealthContext) {
    return `Entiendo que te interesa el tema de salud relacionado con: **"${message}"**\\n\\nComo tu asistente especializada, puedo ofrecerte información detallada y personalizada. Para darte la mejor respuesta posible, ¿podrías especificar:\\n\\n🎯 **Tu objetivo principal** (perder peso, ganar músculo, mejorar energía, etc.)\\n📊 **Tu situación actual** (edad, nivel de actividad, restricciones)\\n⏰ **Tu disponibilidad** (tiempo para cocinar, ejercitarse)\\n🎯 **Resultado esperado** (corto o largo plazo)\\n\\nCon esta información podré crear un plan completamente personalizado para ti.`;
  }
  
  return `Veo que mencionas: **"${message}"**\\n\\nAunque mi especialidad es la salud y el bienestar, me encantaría ayudarte. ¿Podrías reformular tu pregunta enfocándote en algún aspecto relacionado con:\\n\\n🍎 **Nutrición y alimentación**\\n🏃‍♀️ **Ejercicio y actividad física**  \\n😴 **Descanso y recuperación**\\n🧘‍♀️ **Manejo del estrés y bienestar mental**\\n⚖️ **Control de peso saludable**\\n🩺 **Prevención y salud general**\\n\\nEstoy aquí para brindarte información precisa y personalizada en estos temas.`;
}