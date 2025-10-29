const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');

// Inicializar Firebase Admin
admin.initializeApp();

// Obtener Firestore
const db = admin.firestore();

// Cloud Function para generar consejos con Gemini
exports.generateTip = functions.https.onCall(async (data, context) => {
  try {
    // Verificar autenticación
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Usuario no autenticado');
    }

    const { userId, profile } = data;

    // Validar datos
    if (!userId || !profile) {
      throw new functions.https.HttpsError('invalid-argument', 'Datos requeridos faltantes');
    }

    // Construir prompt personalizado para Gemini
    const prompt = `Eres un experto en bienestar y salud. Genera un consejo personalizado y motivacional basado en el perfil del usuario:

Perfil del usuario:
- Edad: ${profile.age || 'No especificada'}
- Horas frente a pantalla: ${profile.screenTime || 8} horas
- Nivel de actividad: ${profile.activityLevel || 'Moderado'}
- Horas de sueño: ${profile.sleepHours || 8} horas

Genera un consejo:
1. Personalizado según el perfil
2. Motivacional y positivo
3. Práctico y accionable
4. Máximo 150 palabras
5. En español
6. Formato: Título + Consejo + Acción específica

Ejemplo de formato:
**Título del Consejo**
Consejo personalizado aquí...

**Acción del día:**
Acción específica que puede hacer hoy.

Responde solo con el consejo formateado, sin explicaciones adicionales.`;

    // Llamar a Gemini API
    const geminiResponse = await axios.post(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
      {
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        params: {
          key: functions.config().gemini.api_key
        }
      }
    );

    // Extraer el consejo de la respuesta
    const generatedText = geminiResponse.data.candidates[0].content.parts[0].text;
    
    // Separar título y contenido
    const lines = generatedText.split('\n').filter(line => line.trim());
    const title = lines.find(line => line.startsWith('**'))?.replace(/\*\*/g, '') || 'Consejo del día';
    const content = lines.filter(line => !line.startsWith('**')).join('\n').trim();

    // Crear objeto del consejo
    const tip = {
      userId: userId,
      title: title,
      content: content,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      profile: profile
    };

    // Guardar en Firestore
    const tipRef = await db.collection('tips').add(tip);

    return {
      success: true,
      tip: {
        id: tipRef.id,
        ...tip
      }
    };

  } catch (error) {
    console.error('Error en generateTip:', error);
    
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    throw new functions.https.HttpsError('internal', 'Error interno del servidor');
  }
});

// Cloud Function para obtener consejo del día
exports.getDailyTip = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Usuario no autenticado');
    }

    const { userId } = data;

    if (!userId) {
      throw new functions.https.HttpsError('invalid-argument', 'userId requerido');
    }

    // Obtener fecha de hoy
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Buscar consejo del día
    const dailyTipSnapshot = await db
      .collection('tips')
      .where('userId', '==', userId)
      .where('createdAt', '>=', today)
      .where('createdAt', '<', tomorrow)
      .limit(1)
      .get();

    if (dailyTipSnapshot.empty) {
      return {
        success: true,
        tip: null,
        message: 'No hay consejo para hoy'
      };
    }

    const tip = dailyTipSnapshot.docs[0].data();
    return {
      success: true,
      tip: {
        id: dailyTipSnapshot.docs[0].id,
        ...tip
      }
    };

  } catch (error) {
    console.error('Error en getDailyTip:', error);
    
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    throw new functions.https.HttpsError('internal', 'Error interno del servidor');
  }
});

// Cloud Function para obtener historial de consejos
exports.getTipsHistory = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Usuario no autenticado');
    }

    const { userId, limit = 10 } = data;

    if (!userId) {
      throw new functions.https.HttpsError('invalid-argument', 'userId requerido');
    }

    // Obtener historial de consejos
    const tipsSnapshot = await db
      .collection('tips')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    const tips = tipsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return {
      success: true,
      tips: tips
    };

  } catch (error) {
    console.error('Error en getTipsHistory:', error);
    
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    throw new functions.https.HttpsError('internal', 'Error interno del servidor');
  }
});
