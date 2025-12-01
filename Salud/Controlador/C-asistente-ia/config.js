// Configuración de APIs - REEMPLAZA CON TUS TOKENS REALES

const API_TOKENS = {
  // OpenAI API Key
  // Obtén tu token en: https://platform.openai.com/api-keys
  OPENAI_TOKEN: 'sk-tu_token_openai_aqui',
  
  // Google Gemini API Key  
  // Obtén tu token en: https://aistudio.google.com/app/apikey
  GEMINI_TOKEN: 'AIzaSyBH4ddPa0yb7oh7YQSqPB-rBdlpGEBHoEU',
  
  // Hugging Face Token
  // Obtén tu token en: https://huggingface.co/settings/tokens
  HUGGINGFACE_TOKEN: 'hf_tu_token_huggingface_aqui'
};

// Configuración de APIs
const API_CONFIG = {
  openai: {
    url: 'https://api.openai.com/v1/chat/completions',
    token: API_TOKENS.OPENAI_TOKEN,
    model: 'gpt-3.5-turbo'
  },
  gemini: {
    url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
    token: API_TOKENS.GEMINI_TOKEN
  },
  huggingface: {
    url: 'https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium',
    token: API_TOKENS.HUGGINGFACE_TOKEN
  }
};

// Instrucciones para obtener tokens:

/* 
🔑 CÓMO OBTENER TUS TOKENS:

1. OpenAI (GPT):
   - Ve a https://platform.openai.com/api-keys
   - Inicia sesión o crea una cuenta
   - Haz clic en "Create new secret key"
   - Copia el token que empieza con "sk-..."

2. Google Gemini:
   - Ve a https://makersuite.google.com/app/apikey
   - Inicia sesión con tu cuenta Google
   - Haz clic en "Create API key"
   - Copia el token generado

3. Hugging Face:
   - Ve a https://huggingface.co/settings/tokens
   - Inicia sesión o crea una cuenta
   - Haz clic en "New token"
   - Selecciona "Read" como tipo
   - Copia el token que empieza con "hf_..."

💡 IMPORTANTE:
- Reemplaza los valores de ejemplo con tus tokens reales
- No compartas estos tokens públicamente
- Algunos servicios requieren configurar facturación
*/