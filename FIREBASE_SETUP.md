# Guía de Configuración Firebase para TipFit (Simplificado)

Esta guía te ayudará a configurar Firebase para tu aplicación TipFit de manera **súper rápida y simple** sin Cloud Functions.

## 🔥 **Ventajas de Firebase Simplificado**

✅ **Configuración súper rápida** (10 minutos vs 3 horas con MongoDB)
✅ **Autenticación con OTP** por email
✅ **Firestore automático** (base de datos NoSQL)
✅ **Gemini API directo** desde React Native
✅ **100% gratis** para desarrollo
✅ **Sin servidor** que mantener

## 🔐 **Flujo de Autenticación con OTP**

### **1. Registro (Primera vez)**
1. Usuario ingresa email
2. Se envía OTP por email
3. Usuario verifica OTP
4. Se crea la cuenta
5. Se configura el perfil

### **2. Inicio de Sesión (Usuarios existentes)**
1. Usuario ingresa email
2. Se envía OTP por email
3. Usuario verifica OTP
4. Se genera token de sesión

## 1. Crear Proyecto en Firebase

### 1.1 Acceder a Firebase Console
1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Haz clic en "Crear un proyecto"
3. Nombre: `TipFit-MVP`
4. Habilita Google Analytics (opcional)
5. Crea el proyecto

### 1.2 Configurar Autenticación
1. En el menú lateral, ve a "Authentication"
2. Haz clic en "Comenzar"
3. Ve a la pestaña "Sign-in method"
4. Habilita "Correo electrónico/contraseña"
5. **IMPORTANTE**: También habilita "Correo electrónico/enlace"
6. Guarda los cambios

### 1.3 Configurar Firestore
1. En el menú lateral, ve a "Firestore Database"
2. Haz clic en "Crear base de datos"
3. Selecciona "Comenzar en modo de prueba" (para desarrollo)
4. Elige la región más cercana
5. Crea la base de datos

## 2. Configurar la Aplicación React Native

### 2.1 Obtener Configuración de Firebase
1. En Firebase Console, ve a "Configuración del proyecto" (ícono de engranaje)
2. Ve a "Tus aplicaciones"
3. Haz clic en "Agregar aplicación"
4. Selecciona "Web" (ícono `</>`)
5. Nombre: `TipFit-Web`
6. Copia la configuración de Firebase

### 2.2 Actualizar Configuración
En `src/config/firebase.js`, reemplaza la configuración con tus datos:

```javascript
const firebaseConfig = {
  apiKey: "tu-api-key-real",
  authDomain: "tipfit-mvp.firebaseapp.com",
  projectId: "tipfit-mvp",
  storageBucket: "tipfit-mvp.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
```

## 3. Configurar Gemini API

### 3.1 Obtener API Key
1. Ve a [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Crea una nueva API key
3. Copia la key generada

### 3.2 Configurar en la App
Crea un archivo `.env` en la raíz del proyecto:

```env
GEMINI_API_KEY=tu-api-key-de-gemini
```

## 4. Configurar Reglas de Firestore

### 4.1 Reglas de Seguridad
En Firebase Console → Firestore Database → Reglas:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Usuarios pueden leer y escribir solo sus propios datos
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Consejos pueden ser leídos y escritos solo por el usuario propietario
    match /tips/{tipId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
    
    // Códigos OTP pueden ser leídos y escritos por cualquier usuario autenticado
    match /otpCodes/{otpId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 5. Probar la Aplicación

### 5.1 Ejecutar la App
```bash
npm start
```

### 5.2 Flujo de Prueba
1. **Registro**: Email → OTP → Configurar perfil
2. **Login**: Email → OTP → Acceder a la app
3. **Consejos**: Generar consejo personalizado con Gemini
4. **Historial**: Ver consejos anteriores

## 6. Estructura de Datos en Firestore

### 6.1 Colección `users`
```javascript
{
  email: "usuario@email.com",
  name: "Nombre Usuario",
  createdAt: timestamp,
  profile: {
    age: 25,
    screenTime: 8,
    activityLevel: "Moderado",
    sleepHours: 8,
    completed: true
  }
}
```

### 6.2 Colección `tips`
```javascript
{
  userId: "user-id",
  title: "Título del consejo",
  content: "Contenido del consejo...",
  createdAt: timestamp,
  profile: {
    age: 25,
    screenTime: 8,
    activityLevel: "Moderado",
    sleepHours: 8
  }
}
```

### 6.3 Colección `otpCodes`
```javascript
{
  email: "usuario@email.com",
  code: "123456",
  type: "registration", // o "login"
  createdAt: timestamp,
  expiresAt: timestamp,
  used: false
}
```

## 7. Servicios Implementados

### 7.1 Firebase Service (`src/services/firebase.js`)
- ✅ **Registro con OTP**: `registerWithOTP(email)`
- ✅ **Login con OTP**: `loginWithOTP(email)`
- ✅ **Verificar OTP**: `verifyOTP(email, code, type)`
- ✅ **Guardar perfil**: `updateUserProfile(userId, profileData)`
- ✅ **Generar consejo**: `generateTip(userId, profileData)`
- ✅ **Obtener historial**: `getTipsHistory(userId)`

### 7.2 Gemini Service (`src/services/gemini.js`)
- ✅ **Generar consejo**: `generateTip(profileData)`
- ✅ **Prompt personalizado** basado en perfil del usuario

## 8. Solución de Problemas

### 8.1 Errores Comunes
- **Error de autenticación**: Verifica que Authentication esté habilitado
- **Error de Firestore**: Verifica las reglas de seguridad
- **Error de Gemini**: Verifica que la API key sea válida

### 8.2 Logs
- **Firebase Console**: Ve a "Authentication" → "Users"
- **Firestore**: Ve a "Firestore Database" → "Datos"

## 9. Costos

### 9.1 Plan Gratuito
- **Authentication**: 10,000 usuarios/mes
- **Firestore**: 50,000 documentos/mes
- **Storage**: 1GB/mes

### 9.2 Servicios Externos
- **Gemini API**: Gratis hasta cierto límite
- **Gmail**: Gratis para envío de emails

## 10. Archivos Importantes

- `firebase.json`: Configuración de Firebase
- `firestore.rules`: Reglas de seguridad
- `src/config/firebase.js`: Configuración de la app
- `src/services/firebase.js`: Servicio de Firebase
- `src/services/gemini.js`: Servicio de Gemini
- `.env`: Variables de entorno

## 11. Comandos Útiles

```bash
# Instalar dependencias
npm install

# Ejecutar la app
npm start

# Limpiar cache
npx expo start --clear
```

## 12. Próximos Pasos

1. **Configurar Analytics**: Para métricas de uso
2. **Implementar Push Notifications**: Para recordatorios
3. **Agregar Storage**: Para imágenes de perfil
4. **Configurar CI/CD**: Para despliegue automático

¡Con Firebase simplificado tendrás tu MVP funcionando en menos de 15 minutos! 🚀
