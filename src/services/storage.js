import AsyncStorage from '@react-native-async-storage/async-storage';

// Claves para almacenamiento local
const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_EMAIL: 'user_email',
  USER_PROFILE: 'user_profile',
  IS_LOGGED_IN: 'is_logged_in',
};

class StorageService {
  // Guardar token de autenticación
  static async setAuthToken(token) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
      await AsyncStorage.setItem(STORAGE_KEYS.IS_LOGGED_IN, 'true');
    } catch (error) {
      console.error('Error guardando token:', error);
      throw error;
    }
  }

  // Obtener token de autenticación
  static async getAuthToken() {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    } catch (error) {
      console.error('Error obteniendo token:', error);
      return null;
    }
  }

  // Guardar email del usuario
  static async setUserEmail(email) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_EMAIL, email);
    } catch (error) {
      console.error('Error guardando email:', error);
      throw error;
    }
  }

  // Obtener email del usuario
  static async getUserEmail() {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.USER_EMAIL);
    } catch (error) {
      console.error('Error obteniendo email:', error);
      return null;
    }
  }

  // Guardar perfil del usuario
  static async setUserProfile(profile) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
    } catch (error) {
      console.error('Error guardando perfil:', error);
      throw error;
    }
  }

  // Obtener perfil del usuario
  static async getUserProfile() {
    try {
      const profile = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      return profile ? JSON.parse(profile) : null;
    } catch (error) {
      console.error('Error obteniendo perfil:', error);
      return null;
    }
  }

  // Verificar si el usuario está logueado
  static async isLoggedIn() {
    try {
      const isLoggedIn = await AsyncStorage.getItem(STORAGE_KEYS.IS_LOGGED_IN);
      const token = await this.getAuthToken();
      return isLoggedIn === 'true' && token !== null;
    } catch (error) {
      console.error('Error verificando login:', error);
      return false;
    }
  }

  // Cerrar sesión - limpiar todos los datos
  static async logout() {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.AUTH_TOKEN,
        STORAGE_KEYS.USER_EMAIL,
        STORAGE_KEYS.USER_PROFILE,
        STORAGE_KEYS.IS_LOGGED_IN,
      ]);
    } catch (error) {
      console.error('Error cerrando sesión:', error);
      throw error;
    }
  }

  // Limpiar datos específicos
  static async clearItem(key) {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`Error limpiando ${key}:`, error);
      throw error;
    }
  }

  // Obtener todos los datos almacenados (para debugging)
  static async getAllData() {
    try {
      const keys = Object.values(STORAGE_KEYS);
      const values = await AsyncStorage.multiGet(keys);
      const data = {};
      values.forEach(([key, value]) => {
        data[key] = value;
      });
      return data;
    } catch (error) {
      console.error('Error obteniendo todos los datos:', error);
      return {};
    }
  }
}

export default StorageService;
