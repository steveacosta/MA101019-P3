// Servicio de autenticación simple para TipFit
import AsyncStorage from '@react-native-async-storage/async-storage';

class AuthService {
  constructor() {
    this.currentUser = null;
    this.listeners = [];
  }

  // Agregar listener para cambios de autenticación
  onAuthStateChanged(callback) {
    this.listeners.push(callback);
    
    // Ejecutar callback inmediatamente con el estado actual
    callback(this.currentUser);
    
    // Retornar función para remover listener
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  // Obtener usuario actual
  getCurrentUser() {
    return this.currentUser;
  }

  // Obtener ID del usuario actual
  getCurrentUserId() {
    return this.currentUser ? this.currentUser.uid : null;
  }

  // Establecer usuario autenticado
  setAuthenticatedUser(user) {
    this.currentUser = user;
    this.notifyListeners();
    this.saveUserToStorage(user);
  }

  // Cerrar sesión
  async logout() {
    this.currentUser = null;
    this.notifyListeners();
    await AsyncStorage.removeItem('tipfit_user');
    return { success: true };
  }

  // Notificar a todos los listeners
  notifyListeners() {
    this.listeners.forEach(callback => {
      callback(this.currentUser);
    });
  }

  // Guardar usuario en storage
  async saveUserToStorage(user) {
    try {
      await AsyncStorage.setItem('tipfit_user', JSON.stringify(user));
    } catch (error) {
      console.error('Error guardando usuario:', error);
    }
  }

  // Cargar usuario desde storage
  async loadUserFromStorage() {
    try {
      const userData = await AsyncStorage.getItem('tipfit_user');
      if (userData) {
        this.currentUser = JSON.parse(userData);
        this.notifyListeners();
        return this.currentUser;
      }
    } catch (error) {
      console.error('Error cargando usuario:', error);
    }
    return null;
  }

  // Verificar si el usuario está autenticado
  isAuthenticated() {
    return this.currentUser !== null;
  }

  // Obtener perfil del usuario
  getUserProfile() {
    return this.currentUser ? this.currentUser.profile : null;
  }
}

const authService = new AuthService();
export default authService;
