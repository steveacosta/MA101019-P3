// Configuración de variables de entorno para TipFit
import {
  FIREBASE_API_KEY,
  FIREBASE_AUTH_DOMAIN,
  FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET,
  FIREBASE_MESSAGING_SENDER_ID,
  FIREBASE_APP_ID,
  GMAIL_USER,
  GMAIL_APP_PASSWORD,
  GEMINI_API_KEY,
  RESEND_API_KEY,
  NODE_ENV,
  MONGODB_API_URL,
  EMAIL_FUNCTION_URL
} from '@env';

// Logging detallado para debug
console.log('🔍 DEBUG CONFIG - Variables de entorno cargadas:');
console.log('🔑 RESEND_API_KEY raw:', RESEND_API_KEY);
console.log('🔑 RESEND_API_KEY type:', typeof RESEND_API_KEY);
console.log('🔑 RESEND_API_KEY length:', RESEND_API_KEY ? RESEND_API_KEY.length : 'undefined');
console.log('🔑 RESEND_API_KEY starts with re_:', RESEND_API_KEY ? RESEND_API_KEY.startsWith('re_') : 'undefined');

const config = {
  // Configuración de Firebase
  FIREBASE_API_KEY: FIREBASE_API_KEY,
  FIREBASE_AUTH_DOMAIN: FIREBASE_AUTH_DOMAIN,
  FIREBASE_PROJECT_ID: FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET: FIREBASE_STORAGE_BUCKET,
  FIREBASE_MESSAGING_SENDER_ID: FIREBASE_MESSAGING_SENDER_ID,
  FIREBASE_APP_ID: FIREBASE_APP_ID,
  
  // Configuración de Gmail
  GMAIL_USER: GMAIL_USER,
  GMAIL_APP_PASSWORD: GMAIL_APP_PASSWORD,
  
  // Configuración de Gemini API
  GEMINI_API_KEY: GEMINI_API_KEY,
  
  // Configuración de Resend API
  RESEND_API_KEY: RESEND_API_KEY,

  // URL HTTPS de Cloud Function para envío de OTP (Spark)
  EMAIL_FUNCTION_URL: EMAIL_FUNCTION_URL,
  
  // Configuración de desarrollo
  NODE_ENV: NODE_ENV,
  
  // URLs de API
  MONGODB_API_URL: MONGODB_API_URL,
};

console.log('🔍 DEBUG CONFIG - Config final:');
console.log('🔑 config.RESEND_API_KEY:', config.RESEND_API_KEY);
console.log('🔑 config.RESEND_API_KEY type:', typeof config.RESEND_API_KEY);
console.log('🔑 config.RESEND_API_KEY length:', config.RESEND_API_KEY ? config.RESEND_API_KEY.length : 'undefined');

export default config;
