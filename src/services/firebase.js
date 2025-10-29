import { auth, firestore } from '../config/firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  sendSignInLinkToEmail,
  onAuthStateChanged as firebaseOnAuthStateChanged
} from 'firebase/auth';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  limit as limitFn, 
  getDocs,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { Alert } from 'react-native';
import emailService from './emailService';
import config from '../config/config';

class FirebaseService {
  constructor() {
    this.auth = auth;
    this.db = firestore;
  }

  // ===== AUTENTICACIÓN CON EMAIL/CONTRASEÑA =====

  // Registrar nuevo usuario
  async registerUser(email, password, name) {
    try {
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      
      // Crear documento de usuario en Firestore
      await setDoc(doc(this.db, 'users', userCredential.user.uid), {
        email: email,
        name: name,
        createdAt: serverTimestamp(),
        emailVerified: false, // Marcar como no verificado
        profile: {
          age: null,
          screenTime: 8,
          activityLevel: 'Moderado',
          sleepHours: 8,
          completed: false
        }
      });

      // Enviar OTP después del registro
      await this.sendOTPForRegistration(email);

      return {
        success: true,
        user: {
          uid: userCredential.user.uid,
          email: email,
          name: name,
          profile: { completed: false }
        }
      };
    } catch (error) {
      console.error('Error registrando usuario:', error);
      throw new Error(this._getAuthErrorMessage(error.code));
    }
  }

  // Iniciar sesión
  async loginUser(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      
      // Obtener datos del usuario desde Firestore
      const userDoc = await getDoc(doc(this.db, 'users', userCredential.user.uid));
      const userData = userDoc.data();

      return {
        success: true,
        user: {
          uid: userCredential.user.uid,
          email: email,
          name: userData.name,
          profile: userData.profile
        }
      };
    } catch (error) {
      console.error('Error en login:', error);
      throw new Error(this._getAuthErrorMessage(error.code));
    }
  }

  // ===== AUTENTICACIÓN CON OTP (DEPRECADO) =====

  // Enviar OTP para registro (simplificado para desarrollo)
  async sendOTPForRegistration(email) {
    try {
      // Generar código OTP de 6 dígitos
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Para desarrollo, solo mostrar el código en consola
      console.log(`OTP para ${email}: ${otpCode}`);
      
      // Guardar código OTP en Firestore (si está configurado)
      try {
        await addDoc(collection(this.db, 'otpCodes'), {
          email: email.toLowerCase(),
          code: otpCode,
          type: 'registration',
          createdAt: serverTimestamp(),
          expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutos
          used: false
        });
      } catch (firestoreError) {
        console.log('Firestore no configurado aún:', firestoreError.message);
      }

      return {
        success: true,
        message: `Código de verificación: ${otpCode}`,
        otpCode: otpCode // Solo para desarrollo
      };
    } catch (error) {
      console.error('Error en sendOTPForRegistration:', error);
      throw new Error('Error enviando código de verificación');
    }
  }

  // Enviar OTP para login (simplificado para desarrollo)
  async sendOTPForLogin(email) {
    try {
      // Generar código OTP de 6 dígitos
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Para desarrollo, solo mostrar el código en consola
      console.log(`OTP para login ${email}: ${otpCode}`);
      
      // Guardar código OTP en Firestore (si está configurado)
      try {
        await addDoc(collection(this.db, 'otpCodes'), {
          email: email.toLowerCase(),
          code: otpCode,
          type: 'login',
          createdAt: serverTimestamp(),
          expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutos
          used: false
        });
      } catch (firestoreError) {
        console.log('Firestore no configurado aún:', firestoreError.message);
      }

      return {
        success: true,
        message: `Código de verificación: ${otpCode}`,
        otpCode: otpCode // Solo para desarrollo
      };
    } catch (error) {
      console.error('Error en sendOTPForLogin:', error);
      throw new Error(error.message || 'Error enviando código de verificación');
    }
  }

  // Verificar OTP (Firestore v9, sin índices compuestos)
  async verifyOTP(email, code, type) {
    try {
      const now = new Date();
      // Buscar por email y code únicamente (para evitar índices). Luego filtramos en memoria
      const q = query(
        collection(this.db, 'otpCodes'),
        where('email', '==', email.toLowerCase()),
        where('code', '==', code),
        limitFn(5)
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        throw new Error('Código inválido o expirado');
      }

      // Elegir el primer OTP válido que no esté usado, no esté expirado y coincida el tipo
      let validDoc = null;
      snapshot.docs.forEach(d => {
        const data = d.data();
        const expires = data.expiresAt?.toDate ? data.expiresAt.toDate() : data.expiresAt;
        const notExpired = expires && now <= expires;
        const notUsed = data.used === false;
        const typeOk = !type || data.type === type;
        if (!validDoc && notExpired && notUsed && typeOk) {
          validDoc = { id: d.id, data };
        }
      });

      if (!validDoc) {
        throw new Error('Código inválido o expirado');
      }

      // Marcar OTP como usado
      await updateDoc(doc(this.db, 'otpCodes', validDoc.id), { used: true, usedAt: serverTimestamp() });

      if (type === 'registration') {
        // Solo marcamos verificado el email si ya existe usuario (registro via email/contraseña se maneja aparte)
        const uq = query(collection(this.db, 'users'), where('email', '==', email.toLowerCase()), limitFn(1));
        const us = await getDocs(uq);
        if (!us.empty) {
          await updateDoc(doc(this.db, 'users', us.docs[0].id), { emailVerified: true, verifiedAt: serverTimestamp() });
        }
        return {
          success: true,
          message: 'Email verificado exitosamente',
          user: { email, profile: { completed: false } }
        };
      }

      // Login: obtener datos del usuario y autenticar
      const uq = query(collection(this.db, 'users'), where('email', '==', email.toLowerCase()), limitFn(1));
      const us = await getDocs(uq);
      if (us.empty) {
        throw new Error('Usuario no encontrado');
      }
      const udata = us.docs[0].data();
      return {
        success: true,
        message: 'Inicio de sesión exitoso',
        user: {
          uid: us.docs[0].id,
          email,
          name: udata.name,
          profile: udata.profile
        }
      };
    } catch (error) {
      console.error('verifyOTP error:', error);
      throw new Error(error.message || 'Error verificando código');
    }
  }

  // ===== OTP VERIFICATION =====

  // Enviar OTP para registro
  async sendOTPForRegistration(email) {
    try {
      // Generar código OTP de 6 dígitos
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Guardar OTP en Firestore con expiración de 5 minutos
      const otpDoc = {
        email: email.toLowerCase(),
        code: otpCode,
        type: 'registration',
        createdAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutos
        used: false
      };

      await addDoc(collection(this.db, 'otpCodes'), otpDoc);

      // Enviar email con OTP
      try {
        const emailResult = await emailService.sendOTPEmail(email, otpCode, 'registration');
        
        if (emailResult.isDevelopment) {
          Alert.alert(
            'Código generado',
            `Código OTP: ${otpCode}\n\n(Modo desarrollo - revisa la consola)`
          );
        } else {
          Alert.alert(
            'Código enviado',
            'Hemos enviado un código de verificación a tu email. Revisa tu bandeja de entrada.'
          );
        }
      } catch (emailError) {
        console.error('Error enviando email:', emailError);
        // Fallback: mostrar código en consola para desarrollo
        console.log(`OTP para ${email}: ${otpCode}`);
        Alert.alert(
          'Código generado',
          `Código OTP: ${otpCode}\n\n(Error enviando email - revisa configuración)`
        );
      }

      return { success: true, message: 'Código enviado exitosamente' };
    } catch (error) {
      console.error('Error enviando OTP:', error);
      throw new Error('Error enviando código de verificación');
    }
  }

  // Enviar OTP para login
  async sendOTPForLogin(email) {
    try {
      // Verificar que el usuario existe
      const userQuery = query(
        collection(this.db, 'users'),
        where('email', '==', email.toLowerCase()),
        limitFn(1)
      );
      const userSnapshot = await getDocs(userQuery);
      
      if (userSnapshot.empty) {
        throw new Error('Usuario no encontrado');
      }

      // Generar código OTP de 6 dígitos
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Guardar OTP en Firestore
      const otpDoc = {
        email: email.toLowerCase(),
        code: otpCode,
        type: 'login',
        createdAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        used: false
      };

      await addDoc(collection(this.db, 'otpCodes'), otpDoc);

      // Enviar email con OTP
      try {
        const emailResult = await emailService.sendOTPEmail(email, otpCode, 'login');
        
        if (emailResult.isDevelopment) {
          Alert.alert(
            'Código generado',
            `Código OTP: ${otpCode}\n\n(Modo desarrollo - revisa la consola)`
          );
        } else {
          Alert.alert(
            'Código enviado',
            'Hemos enviado un código de acceso a tu email. Revisa tu bandeja de entrada.'
          );
        }
      } catch (emailError) {
        console.error('Error enviando email:', emailError);
        // Fallback: mostrar código en consola para desarrollo
        console.log(`OTP para login ${email}: ${otpCode}`);
        Alert.alert(
          'Código generado',
          `Código OTP: ${otpCode}\n\n(Error enviando email - revisa configuración)`
        );
      }

      return { success: true, message: 'Código enviado exitosamente' };
    } catch (error) {
      console.error('Error enviando OTP:', error);
      throw new Error('Error enviando código de verificación');
    }
  }

  // Verificar OTP
  async verifyOTP(email, otpCode, type) {
    try {
      // Buscar OTP válido con consulta simplificada
      const otpQuery = query(
        collection(this.db, 'otpCodes'),
        where('email', '==', email.toLowerCase()),
        where('code', '==', otpCode),
        where('type', '==', type),
        where('used', '==', false)
      );
      
      const otpSnapshot = await getDocs(otpQuery);
      
      if (otpSnapshot.empty) {
        throw new Error('Código inválido o expirado');
      }

      // Encontrar el OTP más reciente que no haya expirado
      let validOtp = null;
      const now = new Date();
      
      otpSnapshot.docs.forEach(doc => {
        const otpData = doc.data();
        const expiresAt = otpData.expiresAt.toDate();
        
        if (now <= expiresAt) {
          validOtp = { id: doc.id, ...otpData };
        }
      });

      if (!validOtp) {
        throw new Error('Código expirado');
      }

      // Marcar OTP como usado
      await updateDoc(doc(this.db, 'otpCodes', validOtp.id), {
        used: true,
        usedAt: serverTimestamp()
      });

      if (type === 'registration') {
        // Marcar email como verificado en el usuario
        const userQuery = query(
          collection(this.db, 'users'),
          where('email', '==', email.toLowerCase()),
          limitFn(1)
        );
        const userSnapshot = await getDocs(userQuery);
        
        if (!userSnapshot.empty) {
          const userDoc = userSnapshot.docs[0];
          await updateDoc(doc(this.db, 'users', userDoc.id), {
            emailVerified: true,
            verifiedAt: serverTimestamp()
          });
        }

        return {
          success: true,
          message: 'Email verificado exitosamente',
          user: {
            email: email,
            profile: { completed: false }
          }
        };
      } else {
        // Login: obtener datos del usuario y autenticar
        const userQuery = query(
          collection(this.db, 'users'),
          where('email', '==', email.toLowerCase()),
          limitFn(1)
        );
        const userSnapshot = await getDocs(userQuery);
        
        if (userSnapshot.empty) {
          throw new Error('Usuario no encontrado');
        }

        const userData = userSnapshot.docs[0].data();
        
        // IMPORTANTE: No navegamos manualmente, solo retornamos el resultado
        // El AppNavigator manejará la navegación basándose en el estado de auth
        return {
          success: true,
          message: 'Inicio de sesión exitoso',
          user: {
            uid: userSnapshot.docs[0].id,
            email: email,
            name: userData.name,
            profile: userData.profile
          }
        };
      }
    } catch (error) {
      console.error('Error verificando OTP:', error);
      throw new Error(error.message || 'Error verificando código');
    }
  }

  // ===== PERFIL DE USUARIO =====

  // Obtener perfil del usuario
  async getUserProfile(userId) {
    try {
      const userDoc = await getDoc(doc(this.db, 'users', userId));
      
      if (!userDoc.exists()) {
        throw new Error('Usuario no encontrado');
      }

      const userData = userDoc.data();
      return {
        success: true,
        profile: {
          name: userData.name,
          email: userData.email,
          age: userData.profile?.age,
          screenTime: userData.profile?.screenTime,
          activityLevel: userData.profile?.activityLevel,
          sleepHours: userData.profile?.sleepHours,
          completed: userData.profile?.completed
        }
      };
    } catch (error) {
      console.error('Error obteniendo perfil:', error);
      throw new Error('Error al obtener perfil');
    }
  }

  // Actualizar perfil del usuario
  async updateUserProfile(userId, profileData) {
    try {
      await updateDoc(doc(this.db, 'users', userId), {
        profile: profileData,
        updatedAt: serverTimestamp()
      });

      return {
        success: true,
        profile: profileData
      };
    } catch (error) {
      console.error('Error actualizando perfil:', error);
      throw new Error('Error al actualizar perfil');
    }
  }

  // ===== CONSEJOS =====

  // Generar nuevo consejo usando Gemini API
  async generateTip(userId, userProfile) {
    try {
      // Validaciones previas
      if (!config?.GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY no configurada');
      }

      // Construir prompt personalizado
      const prompt = `Eres un experto en bienestar y salud. Genera un consejo personalizado y motivacional basado en el perfil del usuario. Debe ser CORTO y caber en un contenedor móvil:

Perfil del usuario:
- Edad: ${userProfile.age || 'No especificada'}
- Horas frente a pantalla: ${userProfile.screenTime || 8} horas
- Nivel de actividad: ${userProfile.activityLevel || 'Moderado'}
- Horas de sueño: ${userProfile.sleepHours || 8} horas

Genera un consejo:
1. Personalizado según el perfil
2. Motivacional y positivo
3. Práctico y accionable
4. Máximo 240 caracteres en el cuerpo (no más de 3 líneas)
5. En español
6. Formato: Título + Consejo + Acción específica

Ejemplo de formato:
**Título del Consejo**
Consejo personalizado aquí...

**Acción del día:**
Acción específica que puede hacer hoy.

Responde solo con el consejo formateado, sin explicaciones adicionales.`;

      // Llamar a Gemini API (modelo configurable y header API key)
      const geminiModel = (config.GEMINI_MODEL && typeof config.GEMINI_MODEL === 'string')
        ? config.GEMINI_MODEL
        : 'gemini-2.0-flash';
      const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent`;

      const response = await fetch(geminiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': String(config.GEMINI_API_KEY || ''),
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }]
        })
      });

      const responseText = await response.text();
      if (!response.ok) {
        console.error('Gemini API error:', response.status, response.statusText, responseText);
        throw new Error(`Error llamando a Gemini API (${response.status})`);
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('Error parseando respuesta de Gemini:', responseText);
        throw new Error('Respuesta inválida de Gemini');
      }

      const candidates = data?.candidates;
      if (!Array.isArray(candidates) || candidates.length === 0) {
        console.error('Gemini sin candidatos:', JSON.stringify(data));
        throw new Error('Gemini no generó contenido');
      }

      const parts = candidates[0]?.content?.parts;
      const generatedText = Array.isArray(parts) && parts[0]?.text ? parts[0].text : '';
      if (!generatedText) {
        console.error('Gemini sin texto:', JSON.stringify(candidates[0]));
        throw new Error('Gemini no devolvió texto');
      }
      
      // Separar título y contenido
      const lines = generatedText.split('\n').filter(line => line.trim());
      const title = lines.find(line => line.startsWith('**'))?.replace(/\*\*/g, '') || 'Consejo del día';
      let content = lines.filter(line => !line.startsWith('**')).join('\n').trim();

      // Recorte de seguridad para caber en el contenedor (≈ 240 caracteres)
      const MAX_BODY_CHARS = 240;
      if (content.length > MAX_BODY_CHARS) {
        content = content.slice(0, MAX_BODY_CHARS).trim();
      }

      // Crear objeto del consejo
      const tip = {
        userId: userId,
        title: title,
        content: content,
        category: this._determineCategory(content), // Agregar categoría
        createdAt: serverTimestamp(),
        profile: userProfile
      };

      // Guardar en Firestore y leer snapshot para obtener createdAt real
      const tipRef = await addDoc(collection(this.db, 'tips'), tip);
      const savedSnap = await getDoc(tipRef);
      const savedData = savedSnap.data() || {};

      // Guardar también como "consejo del día" en una colección dedicada para acceso por fecha sin índices
      const todayKey = (() => {
        const d = new Date();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}${m}${day}`;
      })();

      const dailyDocId = `${userId}_${todayKey}`;
      const dailyTipData = {
        userId: userId,
        title: savedData.title || tip.title,
        content: savedData.content || tip.content,
        category: savedData.category || tip.category,
        createdAt: savedData.createdAt || serverTimestamp(),
        profile: savedData.profile || userProfile,
        tipId: tipRef.id,
        dateKey: todayKey,
      };

      try {
        await setDoc(doc(this.db, 'dailyTips', dailyDocId), dailyTipData);
      } catch (e) {
        console.warn('No se pudo guardar dailyTip (no bloqueante):', e?.message || e);
      }

      // Guardar en subcolección por usuario para historial sin índices compuestos
      try {
        await addDoc(collection(this.db, 'users', userId, 'tips'), {
          userId: userId,
          title: savedData.title || tip.title,
          content: savedData.content || tip.content,
          category: savedData.category || tip.category,
          createdAt: savedData.createdAt || serverTimestamp(),
          profile: savedData.profile || userProfile,
          tipId: tipRef.id,
        });
      } catch (e) {
        console.warn('No se pudo guardar tip en users/{uid}/tips (no bloqueante):', e?.message || e);
      }

      // Guardar puntero al último tip en el documento del usuario para fácil acceso sin índices
      try {
        await updateDoc(doc(this.db, 'users', userId), {
          lastTip: {
            tipId: tipRef.id,
            title: dailyTipData.title,
            content: dailyTipData.content,
            category: dailyTipData.category,
            createdAt: serverTimestamp(),
            dateKey: todayKey,
          },
          updatedAt: serverTimestamp(),
        });
      } catch (e) {
        console.warn('No se pudo actualizar lastTip del usuario (no bloqueante):', e?.message || e);
      }

      return {
        success: true,
        tip: {
          id: tipRef.id,
          userId: userId,
          title: savedData.title || tip.title,
          content: savedData.content || tip.content,
          category: savedData.category || tip.category,
          createdAt: savedData.createdAt?.toDate ? savedData.createdAt.toDate().toISOString() : new Date().toISOString(),
          profile: savedData.profile || userProfile
        }
      };
    } catch (error) {
      console.error('Error al generar consejo (detalle):', error?.message || error);
      throw new Error('Error al generar consejo');
    }
  }

  // Método helper para determinar categoría del consejo
  _determineCategory(content) {
    const contentLower = content.toLowerCase();
    
    if (contentLower.includes('ejercicio') || contentLower.includes('correr') || 
        contentLower.includes('caminar') || contentLower.includes('gimnasio') ||
        contentLower.includes('actividad física') || contentLower.includes('entrenar')) {
      return 'ejercicio';
    }
    
    if (contentLower.includes('comida') || contentLower.includes('aliment') || 
        contentLower.includes('nutrición') || contentLower.includes('dieta') ||
        contentLower.includes('frutas') || contentLower.includes('verduras')) {
      return 'alimentación';
    }
    
    if (contentLower.includes('dormir') || contentLower.includes('sueño') || 
        contentLower.includes('descansar') || contentLower.includes('cama') ||
        contentLower.includes('insomnio') || contentLower.includes('reposo')) {
      return 'sueño';
    }
    
    if (contentLower.includes('pantalla') || contentLower.includes('teléfono') || 
        contentLower.includes('computadora') || contentLower.includes('digital') ||
        contentLower.includes('tecnología') || contentLower.includes('dispositivo')) {
      return 'pantalla';
    }
    
    return 'bienestar';
  }

  // Obtener historial de consejos
  async getTipsHistory(userId, maxItems) {
    try {
      // Leer toda la subcolección por usuario (sin índices ni orderBy)
      const subcolRef = collection(this.db, 'users', userId, 'tips');
      const snapshot = await getDocs(subcolRef);

      let tips = snapshot.docs.map(d => {
        const data = d.data();
        return {
          id: data.tipId || d.id,
          userId: data.userId,
          title: data.title,
          content: data.content,
          category: data.category,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : undefined,
          profile: data.profile,
        };
      });

      // Además, complementar con raíz 'tips' (sin índices) y fusionar resultados
      const rootQ = query(
        collection(this.db, 'tips'),
        where('userId', '==', userId)
      );
      const rootSnap = await getDocs(rootQ);
      const rootTips = rootSnap.docs.map(d => {
        const data = d.data();
        const created = data.createdAt?.toDate
          ? data.createdAt.toDate()
          : (data.createdAt ? new Date(data.createdAt) : null);
        return {
          id: d.id,
          userId: data.userId,
          title: data.title,
          content: data.content,
          category: data.category,
          createdAt: created ? created.toISOString() : undefined,
          profile: data.profile,
        };
      });

      // Fusionar por id evitando duplicados (preferir subcolección si existe)
      const byId = new Map();
      tips.forEach(t => byId.set(t.id, t));
      rootTips.forEach(t => { if (!byId.has(t.id)) byId.set(t.id, t); });

      tips = Array.from(byId.values()).sort((a, b) => {
        const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return tb - ta;
      });

      return {
        success: true,
        tips: tips
      };
    } catch (error) {
      console.error('Error obteniendo historial:', error);
      throw new Error('Error al obtener historial');
    }
  }

  // Obtener consejo del día
  async getDailyTip(userId) {
    try {
      // Primero intentamos lectura directa desde dailyTips/{userId_YYYYMMDD}
      const today = new Date();
      const todayKey = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
      const dailyDocId = `${userId}_${todayKey}`;

      const dailySnap = await getDoc(doc(this.db, 'dailyTips', dailyDocId));
      if (dailySnap.exists()) {
        const data = dailySnap.data();
        return {
          success: true,
          tip: {
            id: data.tipId || dailyDocId,
            userId: data.userId,
            title: data.title,
            content: data.content,
            category: data.category,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : undefined,
            profile: data.profile,
          }
        };
      }

      // Sin dailyTip de hoy: tomar el último tip guardado en el documento del usuario
      const userSnap = await getDoc(doc(this.db, 'users', userId));
      const userData = userSnap.exists() ? userSnap.data() : null;
      const lastTip = userData?.lastTip;

      // Si hay lastTip pero no es de hoy, generamos uno nuevo automáticamente
      if (!lastTip || lastTip?.dateKey !== todayKey) {
        // Necesitamos el perfil para generar
        const profile = userData?.profile || {
          age: null,
          screenTime: 8,
          activityLevel: 'Moderado',
          sleepHours: 8,
          completed: false,
        };
        // Generar nuevo consejo con Gemini
        const generated = await this.generateTip(userId, profile);
        return generated;
      }

      // Si el lastTip es de hoy, regresarlo como dailyTip
      return {
        success: true,
        tip: {
          id: lastTip.tipId || `${userId}_${todayKey}`,
          userId,
          title: lastTip.title,
          content: lastTip.content,
          category: lastTip.category,
          createdAt: undefined,
          profile: userData?.profile,
        }
      };
    } catch (error) {
      console.error('getDailyTip error:', error);
      throw new Error('Error al obtener consejo del día');
    }
  }

  // ===== UTILIDADES =====

  // Cerrar sesión
  async logout() {
    try {
      await this.auth.signOut();
      return { success: true };
    } catch (error) {
      throw new Error('Error al cerrar sesión');
    }
  }

  // Obtener usuario actual
  getCurrentUser() {
    return this.auth.currentUser;
  }

  // Escuchar cambios en el estado de autenticación
  onAuthStateChanged(callback) {
    return this.auth.onAuthStateChanged(callback);
  }

  // Verificar si el usuario está autenticado
  isAuthenticated() {
    return this.auth.currentUser !== null;
  }

  // Obtener ID del usuario actual
  getCurrentUserId() {
    return this.auth.currentUser?.uid;
  }

  // Obtener mensaje de error de autenticación
  _getAuthErrorMessage(errorCode) {
    switch (errorCode) {
      case 'auth/email-already-in-use':
        return 'Este email ya está registrado';
      case 'auth/invalid-email':
        return 'Email inválido';
      case 'auth/weak-password':
        return 'La contraseña debe tener al menos 6 caracteres';
      case 'auth/user-not-found':
        return 'Usuario no encontrado';
      case 'auth/wrong-password':
        return 'Contraseña incorrecta';
      case 'auth/too-many-requests':
        return 'Demasiados intentos. Inténtalo más tarde';
      default:
        return 'Error de autenticación';
    }
  }
}

// Crear instancia única del servicio
const firebaseService = new FirebaseService();

export default firebaseService;