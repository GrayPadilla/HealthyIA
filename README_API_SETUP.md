# 🤖 Configuración de API para Alissa - Asistente IA

## 📋 Descripción
Alissa ahora puede usar APIs reales de IA para respuestas más inteligentes y naturales. Compatible con:
- 🔥 **OpenAI GPT-3.5/4** (Recomendado)  
- 🧠 **Google Gemini** (Gratuito)
- 🤗 **Hugging Face** (Modelos open source)

## 🚀 Configuración Rápida

### 1. Editar archivo de configuración
Abre: `Salud/Controlador/C-asistente-ia/config.js`

Reemplaza los tokens de ejemplo con tus tokens reales:

```javascript
const API_TOKENS = {
  OPENAI_TOKEN: 'sk-tu_token_real_aqui',        // ← Pega tu token de OpenAI
  GEMINI_TOKEN: 'tu_token_gemini_real_aqui',     // ← Pega tu token de Gemini  
  HUGGINGFACE_TOKEN: 'hf_tu_token_real_aqui'     // ← Pega tu token de HF
};
```

### 2. Obtener tokens (GRATIS/PAGADO)

#### 🔥 OpenAI (GPT) - MÁS INTELIGENTE
1. Ve a: https://platform.openai.com/api-keys
2. Crea cuenta / Inicia sesión
3. Clic en "Create new secret key"
4. Copia el token: `sk-proj-xxx...`
5. **💳 Nota**: Requiere configurar método de pago (~$0.002 por mensaje)

#### 🧠 Google Gemini - GRATUITO 
1. Ve a: https://aistudio.google.com/app/apikey
2. Inicia sesión con Google
3. Clic en "Create API key"
4. Copia el token generado
5. **✅ Completamente gratuito**

#### 🤗 Hugging Face - GRATUITO
1. Ve a: https://huggingface.co/settings/tokens
2. Crea cuenta / Inicia sesión
3. Clic en "New token"
4. Selecciona "Read"
5. Copia el token: `hf_xxx...`
6. **✅ Completamente gratuito**

## 🎯 Recomendaciones

### Para uso personal/testing:
```
✅ Gemini (Google) - Gratuito y muy bueno
✅ Hugging Face - Gratuito, menos inteligente
```

### Para uso profesional:
```
🔥 OpenAI GPT - Más inteligente, costo mínimo
✅ Gemini como respaldo
```

## 🔧 Cómo funciona

1. **Prioridad de APIs**: OpenAI → Gemini → Hugging Face
2. **Sistema de fallback**: Si una API falla, usa la siguiente
3. **Respuestas inteligentes**: Si todas las APIs fallan, usa el sistema local inteligente
4. **Especialización**: Todas las APIs reciben prompts especializados en salud

## 📝 Ejemplos de uso mejorado

Con APIs reales, Alissa puede:
- Entender contexto más complejo
- Dar respuestas más naturales y variadas  
- Adaptarse mejor a cada usuario específico
- Mantener conversaciones más fluidas

## 🔒 Seguridad

⚠️ **IMPORTANTE**:
- Nunca compartas tus tokens públicamente
- No los subas a GitHub o repositorios públicos
- Los tokens son como contraseñas

## 🐛 Resolución de problemas

### "No funciona la API"
1. Verifica que el token esté bien copiado
2. Revisa la consola del navegador (F12)
3. Confirma que tienes créditos/cuota disponible

### "Respuestas en inglés"
- Los prompts ya están configurados en español
- Gemini puede responder mejor en español que Hugging Face

### "Mensajes de error"
- El sistema automáticamente vuelve al modo inteligente local
- Revisa la configuración de tokens

## 📊 Comparación de APIs

| API | Costo | Calidad | Velocidad | Idioma ES |
|-----|-------|---------|-----------|-----------|
| OpenAI | 💳 Pago | 🔥🔥🔥🔥🔥 | ⚡⚡⚡ | ✅ Excelente |
| Gemini | ✅ Gratis | 🔥🔥🔥🔥 | ⚡⚡⚡⚡ | ✅ Muy bueno |
| Hugging Face | ✅ Gratis | 🔥🔥 | ⚡⚡ | ⚠️ Regular |
| Sistema Local | ✅ Gratis | 🔥🔥🔥 | ⚡⚡⚡⚡⚡ | ✅ Bueno |

---

## 🎉 ¡Listo!

Una vez configurados los tokens, Alissa usará IA real para respuestas más inteligentes y naturales. ¡El sistema funciona automáticamente con fallbacks para máxima confiabilidad!