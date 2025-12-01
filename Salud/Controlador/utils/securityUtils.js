/**
 * 🔐 Utilidades de Seguridad
 * Funciones para validación, sanitización y seguridad del código
 * @version 1.0.0
 */

/**
 * Sanitiza un string para prevenir XSS
 * @param {string} str - String a sanitizar
 * @returns {string} - String sanitizado
 */
export function sanitizeInput(str) {
  if (typeof str !== 'string') return '';
  
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Valida un email
 * @param {string} email - Email a validar
 * @returns {boolean} - True si es válido
 */
export function validateEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Valida un password
 * @param {string} password - Password a validar
 * @returns {object} - {valid: boolean, errors: string[]}
 */
export function validatePassword(password) {
  const errors = [];
  
  if (!password || typeof password !== 'string') {
    errors.push('La contraseña es requerida');
    return { valid: false, errors };
  }
  
  if (password.length < 8) {
    errors.push('La contraseña debe tener al menos 8 caracteres');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('La contraseña debe contener al menos una mayúscula');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('La contraseña debe contener al menos una minúscula');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('La contraseña debe contener al menos un número');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Valida un número positivo
 * @param {number} num - Número a validar
 * @param {number} min - Valor mínimo (opcional)
 * @param {number} max - Valor máximo (opcional)
 * @returns {boolean} - True si es válido
 */
export function validateNumber(num, min = null, max = null) {
  if (typeof num !== 'number' || isNaN(num)) return false;
  if (min !== null && num < min) return false;
  if (max !== null && num > max) return false;
  return true;
}

/**
 * Valida que un campo no esté vacío
 * @param {any} value - Valor a validar
 * @returns {boolean} - True si no está vacío
 */
export function validateRequired(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string' && value.trim() === '') return false;
  if (Array.isArray(value) && value.length === 0) return false;
  return true;
}

/**
 * Limpia y valida datos de un objeto
 * @param {object} data - Objeto con datos
 * @param {object} schema - Esquema de validación
 * @returns {object} - {valid: boolean, data: object, errors: object}
 */
export function validateData(data, schema) {
  const cleaned = {};
  const errors = {};
  
  for (const [key, rules] of Object.entries(schema)) {
    const value = data[key];
    
    // Validar requerido
    if (rules.required && !validateRequired(value)) {
      errors[key] = `${key} es requerido`;
      continue;
    }
    
    // Si no es requerido y está vacío, saltar
    if (!rules.required && !validateRequired(value)) {
      continue;
    }
    
    // Sanitizar si es string
    if (rules.type === 'string' && typeof value === 'string') {
      cleaned[key] = sanitizeInput(value.trim());
    } else if (rules.type === 'number') {
      const num = parseFloat(value);
      if (!validateNumber(num, rules.min, rules.max)) {
        errors[key] = `${key} debe ser un número válido`;
        continue;
      }
      cleaned[key] = num;
    } else if (rules.type === 'email') {
      if (!validateEmail(value)) {
        errors[key] = `${key} debe ser un email válido`;
        continue;
      }
      cleaned[key] = value.trim().toLowerCase();
    } else {
      cleaned[key] = value;
    }
    
    // Validar formato personalizado
    if (rules.pattern && typeof cleaned[key] === 'string') {
      const regex = new RegExp(rules.pattern);
      if (!regex.test(cleaned[key])) {
        errors[key] = rules.patternError || `${key} tiene un formato inválido`;
      }
    }
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    data: cleaned,
    errors
  };
}

/**
 * Hash simple para contraseñas (en producción usar bcrypt)
 * @param {string} password - Password a hashear
 * @returns {string} - Hash del password
 */
export function hashPassword(password) {
  // NOTA: En producción usar bcrypt o similar
  // Esto es solo para demostración
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
}

/**
 * Genera un token seguro
 * @param {number} length - Longitud del token
 * @returns {string} - Token generado
 */
export function generateToken(length = 32) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  
  for (let i = 0; i < length; i++) {
    token += chars[array[i] % chars.length];
  }
  
  return token;
}

/**
 * Previene ataques de rate limiting básico
 */
export class RateLimiter {
  constructor(maxRequests = 10, windowMs = 60000) {
    this.requests = new Map();
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }
  
  isAllowed(identifier) {
    const now = Date.now();
    const userRequests = this.requests.get(identifier) || [];
    
    // Limpiar requests antiguos
    const validRequests = userRequests.filter(time => now - time < this.windowMs);
    
    if (validRequests.length >= this.maxRequests) {
      return false;
    }
    
    validRequests.push(now);
    this.requests.set(identifier, validRequests);
    return true;
  }
  
  reset(identifier) {
    this.requests.delete(identifier);
  }
}

/**
 * Escapa HTML para prevenir XSS
 * @param {string} text - Texto a escapar
 * @returns {string} - Texto escapado
 */
export function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * Valida una URL
 * @param {string} url - URL a validar
 * @returns {boolean} - True si es válida
 */
export function validateUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Limita la longitud de un string
 * @param {string} str - String a limitar
 * @param {number} maxLength - Longitud máxima
 * @returns {string} - String limitado
 */
export function truncate(str, maxLength = 100) {
  if (typeof str !== 'string') return '';
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + '...';
}

