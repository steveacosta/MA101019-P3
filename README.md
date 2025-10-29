# TipFit - MVP React Native

Aplicación móvil (Expo/React Native) para consejos de bienestar con autenticación segura (email + contraseña + OTP), generación de consejos con Gemini y pantalla de historial.

## 🚀 Características
- Autenticación: email + contraseña (Firebase Auth) y verificación OTP por email
- Envío de OTP: Google Apps Script (Web App HTTPS) – sin Blaze y gratis
- Perfil del usuario y consejo del día (Firestore + Gemini)
- Historial de consejos con pull‑to‑refresh y “leer más”

## 🛠️ Tecnologías
- Frontend: Expo / React Native, React Navigation, AsyncStorage
- Backend: Firebase Auth + Firestore (Web SDK)
- Email OTP: Google Apps Script (GmailApp) vía endpoint HTTPS
- IA: Google Gemini API (modelo configurable)

## 📦 Requisitos
- Node.js 18+ y npm
- Expo CLI (npx expo)
- Proyecto Firebase (Spark)
- Web App de Google Apps Script (Deploy → Web app, Execute as: Me, Access: Anyone)
- Cuenta Gmail con 2FA (para Apps Script) y API key de Gemini (opcional)

## 🔐 Variables de entorno (.env)
```
# Firebase
FIREBASE_API_KEY=...
FIREBASE_AUTH_DOMAIN=...
FIREBASE_PROJECT_ID=...
FIREBASE_STORAGE_BUCKET=...
FIREBASE_MESSAGING_SENDER_ID=...
FIREBASE_APP_ID=...

# Gemini
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-2.0-flash

# Envío de OTP (Apps Script)
EMAIL_FUNCTION_URL=https://script.google.com/macros/s/XXXXX/exec
```
Reinicia Metro cuando edites el .env.

## ▶️ Levantar el proyecto
```
npm install
npm start
```
- Android: presiona "a" en la consola de Expo
- iOS (macOS): presiona "i"

## 🔁 Flujo de autenticación
1) Registro/Login con Firebase Auth (email+password)
2) Generación de OTP y envío por Apps Script (EMAIL_FUNCTION_URL)
3) Verificación de OTP en la app → acceso

## 💡 Consejo del día e historial
- `src/services/firebase.js` genera consejos con Gemini (prompt corto) y guarda en Firestore
- Se registra además en `dailyTips/{uid_YYYYMMDD}` y en `users/{uid}/tips`
- Historial lee todos los tips del usuario y los ordena por fecha

## 🗂️ Estructura (resumen)
```
TipFit/
  App.js
  src/
    navigation/
    screens/
    components/
    services/
      firebase.js     # Auth, Firestore, OTP/Consejos
      emailService.js # POST a EMAIL_FUNCTION_URL (Apps Script)
      storage.js
  assets/
```
(No hay Functions en el repo; el envío de OTP es externo por Apps Script.)

## ✅ Notas
- Si el correo cae a SPAM, ajusta asunto/contenido o configura un remitente confiable
- Apps Script con Gmail tiene límites diarios (~100/día cuentas personales)
- Para migrar a otro backend de email, basta cambiar `EMAIL_FUNCTION_URL`

## 🧭 Desarrollo
- Se eliminaron funciones de MongoDB Atlas y Firebase Functions del repo
- Se añadió “leer más / ver menos” en `TipCard` y pull‑to‑refresh en listas

## 📄 Licencia
MIT
